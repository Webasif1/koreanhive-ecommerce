/**
 * One-off: re-encode public/**\/*.png to WebP.
 *
 * The design shipped full-size PNGs — the hero alone was 469 KB. WebP at
 * quality 82 and a 1600px cap keeps them visually identical while cutting the
 * payload by roughly 70%, which matters most on a Bangladeshi mobile
 * connection. Originals are deleted once converted; they live in the design
 * zip if they are ever needed again.
 */
import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const MAX_WIDTH = 1600;
const QUALITY = 82;

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && entry.name.endsWith(".png")) {
      yield full;
    }
  }
}

async function main() {
  let before = 0;
  let after = 0;
  let count = 0;

  for await (const file of walk(PUBLIC_DIR)) {
    const original = (await stat(file)).size;
    const target = file.replace(/\.png$/, ".webp");

    await sharp(file)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(target);

    const converted = (await stat(target)).size;
    await unlink(file);

    before += original;
    after += converted;
    count += 1;

    console.log(
      `  ${path.relative(PUBLIC_DIR, file)} → ${Math.round(original / 1024)}KB to ${Math.round(converted / 1024)}KB`,
    );
  }

  const saved = before === 0 ? 0 : Math.round((1 - after / before) * 100);
  console.log(
    `\n${count} images · ${(before / 1024 / 1024).toFixed(2)}MB → ${(after / 1024 / 1024).toFixed(2)}MB (${saved}% smaller)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
