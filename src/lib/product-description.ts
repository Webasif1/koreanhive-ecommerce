/**
 * Product descriptions arrive from the catalogue sheet as light markdown:
 * `**Heading**` lines, `- ` bullets, `**bold**` runs and `*question?*` lines in
 * the FAQ. The product page used to print that text as-is, asterisks and all.
 *
 * This turns it into typed blocks the page renders as React, so no markup is
 * ever injected, and splits it at its headings so each one can be its own
 * accordion panel. Every one of the 279 published descriptions uses the same
 * headings, but nothing here depends on that: an unknown heading is just
 * another section, and a description without any is all intro.
 */

export type Inline = { text: string; bold: boolean };

export type DescriptionBlock =
  | { kind: "paragraph"; text: Inline[] }
  | { kind: "list"; items: Inline[][] }
  | { kind: "qa"; question: string; answer: Inline[] };

export type DescriptionSection = { title: string; blocks: DescriptionBlock[] };

export type ParsedDescription = {
  /** Everything before the first heading — the always-visible opener. */
  intro: DescriptionBlock[];
  sections: DescriptionSection[];
};

const HEADING = /^\*\*([^*]+)\*\*$/;
// a single-asterisk line: starts with "*" but not "**"
const QUESTION = /^\*([^*].*?)\*$/;
const BULLET = /^[-•]\s+/;

/** `**bold**` runs become separate pieces; anything else stays literal. */
export function parseInline(text: string): Inline[] {
  const runs: Inline[] = [];
  let last = 0;

  for (const match of text.matchAll(/\*\*([^*]+)\*\*/g)) {
    const index = match.index ?? 0;
    if (index > last) runs.push({ text: text.slice(last, index), bold: false });
    runs.push({ text: match[1], bold: true });
    last = index + match[0].length;
  }

  if (last < text.length) runs.push({ text: text.slice(last), bold: false });
  return runs;
}

function parseBlocks(lines: string[]): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let question: string | null = null;
  let answer: string[] = [];

  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: "paragraph", text: parseInline(paragraph.join(" ")) });
      paragraph = [];
    }
    if (list.length > 0) {
      blocks.push({ kind: "list", items: list.map(parseInline) });
      list = [];
    }
    if (question !== null) {
      blocks.push({ kind: "qa", question, answer: parseInline(answer.join(" ")) });
      question = null;
      answer = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flush();
      continue;
    }

    if (BULLET.test(line)) {
      if (paragraph.length > 0 || question !== null) flush();
      list.push(line.replace(BULLET, ""));
      continue;
    }

    const asked = line.match(QUESTION);
    if (asked) {
      flush();
      question = asked[1].trim();
      continue;
    }

    if (list.length > 0) flush();
    if (question !== null) answer.push(line);
    else paragraph.push(line);
  }

  flush();
  return blocks;
}

export function parseDescription(
  markdown: string | null | undefined,
): ParsedDescription {
  const intro: string[] = [];
  const sections: { title: string; lines: string[] }[] = [];

  for (const line of (markdown ?? "").replace(/\r\n?/g, "\n").split("\n")) {
    const heading = line.trim().match(HEADING);

    if (heading) {
      sections.push({ title: heading[1].trim(), lines: [] });
      continue;
    }

    (sections.at(-1)?.lines ?? intro).push(line);
  }

  return {
    intro: parseBlocks(intro),
    sections: sections
      .map((section) => ({
        title: section.title,
        blocks: parseBlocks(section.lines),
      }))
      .filter((section) => section.blocks.length > 0),
  };
}

/**
 * Removes and returns the first section whose title matches, so the page can
 * place the known sections in its own order and still render the rest.
 */
export function takeSection(
  sections: DescriptionSection[],
  pattern: RegExp,
): DescriptionSection | null {
  const index = sections.findIndex((section) => pattern.test(section.title));
  return index === -1 ? null : sections.splice(index, 1)[0];
}
