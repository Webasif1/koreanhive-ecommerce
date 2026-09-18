/**
 * Copy an entire database from one MongoDB cluster to another.
 *
 *   npm run db:migrate -- --dry-run     # report only, writes nothing
 *   npm run db:migrate                  # do it
 *
 * Reads MONGODB_URI_OLD (source) and MONGODB_URI (target) from .env, so the
 * direction always matches whatever the app is currently pointed at: you move
 * the URI first, then run this to make the new one true.
 *
 * Why this exists rather than `mongodump | mongorestore`: those ship with the
 * MongoDB Database Tools, which are a separate download from the server and
 * are not installed on this machine. Everything here runs on the driver the
 * project already depends on.
 *
 * Safety rules, in order of how much they matter:
 *   - the source is opened and never written to;
 *   - a target collection that already holds documents is skipped, not
 *     overwritten, unless --force is passed;
 *   - both URIs must name a database, because a `mongodb+srv://host/` with no
 *     database silently means `test` and that mistake is invisible until the
 *     shop renders empty;
 *   - source and target must not be the same cluster + database.
 *
 * Indexes are recreated after the documents land — restoring into an indexed
 * collection pays the index cost on every insert instead of once at the end.
 */
import "dotenv/config";

import { MongoClient, type Document } from "mongodb";

/** Documents per insertMany. Large enough to be fast, small enough to stay
 *  under the 16MB BSON limit with product documents that embed images. */
const BATCH = 500;

type Args = { dryRun: boolean; force: boolean };

function parseArgs(argv: string[]): Args {
  const unknown = argv.filter(
    (arg) => arg.startsWith("--") && !["--dry-run", "--force"].includes(arg),
  );
  if (unknown.length > 0) {
    throw new Error(
      `Unknown option(s): ${unknown.join(", ")}. Supported: --dry-run, --force.`,
    );
  }
  return { dryRun: argv.includes("--dry-run"), force: argv.includes("--force") };
}

/**
 * The database a URI actually selects.
 *
 * Everything after the host and before the query string. An empty value here
 * is the single most common way this migration goes wrong, so it is an error
 * rather than a default.
 */
function databaseFromUri(uri: string, label: string): string {
  const withoutScheme = uri.replace(/^mongodb(\+srv)?:\/\//, "");
  const path = withoutScheme.split("/").slice(1).join("/");
  const name = path.split("?")[0];

  if (!name) {
    throw new Error(
      `${label} does not name a database. It ends at the host, which means ` +
        `MongoDB would use "test" and the site would come up empty. Add the ` +
        `database name after the final slash, e.g. ` +
        `mongodb+srv://user:pass@cluster.mongodb.net/koreanhives`,
    );
  }
  return decodeURIComponent(name);
}

/** The cluster, with credentials stripped. Safe to print, and enough to tell
 *  two Atlas clusters apart in the log. */
function hostOf(uri: string): string {
  return uri.replace(/^mongodb(\+srv)?:\/\//, "").split("@").pop()!.split("/")[0];
}

async function main() {
  const { dryRun, force } = parseArgs(process.argv.slice(2));

  const from = process.env.MONGODB_URI_OLD;
  const to = process.env.MONGODB_URI;

  if (!from) {
    throw new Error(
      "Set MONGODB_URI_OLD in .env to the cluster you are copying FROM.",
    );
  }
  if (!to) throw new Error("Set MONGODB_URI in .env to the cluster you are copying TO.");

  const fromDb = databaseFromUri(from, "MONGODB_URI_OLD");
  const toDb = databaseFromUri(to, "MONGODB_URI");

  if (hostOf(from) === hostOf(to) && fromDb === toDb) {
    throw new Error(
      "Source and target are the same database. Nothing to do — and copying a " +
        "collection onto itself would duplicate every document.",
    );
  }

  console.log(`\n  from  ${hostOf(from)}/${fromDb}`);
  console.log(`  to    ${hostOf(to)}/${toDb}`);
  console.log(dryRun ? "  mode  dry run — nothing will be written\n" : "\n");

  const source = new MongoClient(from, { serverSelectionTimeoutMS: 15000 });
  const target = new MongoClient(to, { serverSelectionTimeoutMS: 15000 });

  try {
    await Promise.all([source.connect(), target.connect()]);

    const src = source.db(fromDb);
    const dst = target.db(toDb);

    // Mongoose creates collections lazily, so the source is the only honest
    // list of what exists. Views have no documents of their own to copy.
    const collections = (await src.listCollections().toArray())
      .filter((info) => info.type !== "view")
      .map((info) => info.name)
      .sort();

    if (collections.length === 0) {
      console.log("  The source database has no collections. Nothing to copy.\n");
      return;
    }

    let copied = 0;
    let skipped = 0;

    for (const name of collections) {
      const total = await src.collection(name).countDocuments();
      const existing = await dst.collection(name).countDocuments();

      if (existing > 0 && !force) {
        console.log(
          `  skip  ${name.padEnd(20)} target already has ${existing} document(s) — ` +
            `pass --force to replace`,
        );
        skipped += 1;
        continue;
      }

      if (dryRun) {
        console.log(`  would copy  ${name.padEnd(20)} ${total} document(s)`);
        copied += 1;
        continue;
      }

      if (existing > 0) await dst.collection(name).deleteMany({});

      let moved = 0;
      let batch: Document[] = [];

      const cursor = src.collection(name).find({});
      for await (const doc of cursor) {
        batch.push(doc);
        if (batch.length >= BATCH) {
          // ordered:false so one bad document cannot abandon the rest
          await dst.collection(name).insertMany(batch, { ordered: false });
          moved += batch.length;
          batch = [];
        }
      }
      if (batch.length > 0) {
        await dst.collection(name).insertMany(batch, { ordered: false });
        moved += batch.length;
      }

      // Indexes last: building them once beats maintaining them per insert.
      // _id is created by the server, and the text-index limit of one per
      // collection means a re-run must not try to add a second.
      const indexes = (await src.collection(name).indexes()).filter(
        (index) => index.name !== "_id_",
      );

      for (const index of indexes) {
        // Copy the options that describe the index, not the ones the server
        // owns. `v` in particular is the internal index format version, and
        // createIndex rejects it as an unknown option.
        const { key, name: indexName, ...rest } = index;
        const options = Object.fromEntries(
          Object.entries(rest).filter(([option]) => option !== "v"),
        );

        try {
          await dst.collection(name).createIndex(key, { ...options, name: indexName });
        } catch (error) {
          console.log(
            `        index ${indexName} not created: ${(error as Error).message.slice(0, 90)}`,
          );
        }
      }

      console.log(
        `  copy  ${name.padEnd(20)} ${moved} document(s), ${indexes.length} index(es)`,
      );
      copied += 1;
    }

    console.log(
      `\n  ${dryRun ? "would copy" : "copied"} ${copied} collection(s)` +
        (skipped > 0 ? `, skipped ${skipped}` : "") +
        ".\n",
    );

    if (!dryRun) {
      console.log("  Next: npm run catalogue:verify\n");
    }
  } finally {
    await source.close().catch(() => {});
    await target.close().catch(() => {});
  }
}

main().catch((error: unknown) => {
  console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
