import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

/**
 * Guards the bug that made every "Buy Now" button on the site dead.
 *
 * React 19 attaches its submit interceptor per <form>, and only to a form that
 * was given an `action`. A form written as plain `<form className="…">` with a
 * server function on the submit button's `formAction` renders with an empty
 * `formaction=""` attribute: the browser then performs its own native submit
 * and the server function is never called. The page reloads, nothing happens,
 * and — because nothing throws — no error appears anywhere.
 *
 * Nothing in TypeScript or ESLint catches it: `formAction` is a perfectly valid
 * button prop and the types are satisfied. Only the browser knows, which is why
 * it shipped. So the rule is checked here instead, against the source text.
 */

const SRC = new URL("../src", import.meta.url).pathname;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith(".tsx") ? [path] : [];
  });
}

/** Comments discuss `<form>` and `formAction` by name — including the ones
 *  explaining this very rule — so they are stripped before anything is read as
 *  code, or the guard reports itself. */
function stripComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const files = walk(SRC).map((path) => ({
  path: path.slice(SRC.length + 1),
  source: stripComments(readFileSync(path, "utf8")),
}));

test("no submit button carries a server action on formAction", () => {
  const offenders = files
    .filter(({ source }) => /formAction=\{/.test(source))
    .map(({ path }) => path);

  assert.deepEqual(
    offenders,
    [],
    `formAction={…} does not fire unless the enclosing <form> also has an ` +
      `action. Move the server function onto the <form> instead. Files: ` +
      offenders.join(", "),
  );
});

test("every form holding a submit button has its own action", () => {
  const offenders: string[] = [];

  for (const { path, source } of files) {
    // Only the forms that actually rely on being submitted. A form whose
    // buttons are all type="button" is a layout wrapper and needs no action.
    if (!/type="submit"/.test(source)) continue;

    for (const tag of source.match(/<form[\s>][^>]*>/g) ?? []) {
      // Three ways a submit can be handled, all legitimate: `action={fn}` is a
      // React action, `action="/path"` a deliberate native submit (the header's
      // GET search form), and `onSubmit={…}` a client handler that calls
      // preventDefault. What is never fine is none of them — that is the case
      // where the browser reloads the page and the click does nothing.
      if (!/\s(action=[{"]|onSubmit=\{)/.test(tag)) {
        offenders.push(`${path}: ${tag.trim()}`);
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `A <form> containing a submit button must be given an action, or React ` +
      `will not intercept the submit and the browser will reload the page ` +
      `instead. Offenders:\n  ${offenders.join("\n  ")}`,
  );
});
