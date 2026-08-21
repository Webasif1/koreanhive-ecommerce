/**
 * A small RFC 4180 CSV reader.
 *
 * Hand-written rather than a dependency because the awkward parts of CSV are
 * few and well defined — quoted fields containing commas or newlines, doubled
 * quotes as an escape — and a 60-line state machine covers them with tests we
 * control. The rest of this repo hand-rolls its parsing too.
 *
 * Excel is the assumed producer, so two of its habits are handled explicitly:
 * a UTF-8 BOM on the first byte (which otherwise corrupts the first header
 * into "﻿slug" and silently drops the column) and CRLF line endings.
 */

export type CsvTable = {
  /** Header row, trimmed. */
  header: string[];
  /** One entry per data row, with the 1-based line number it came from. */
  rows: { line: number; values: string[] }[];
};

function splitRecords(input: string): { line: number; values: string[] }[] {
  const records: { line: number; values: string[] }[] = [];

  let values: string[] = [];
  let field = "";
  let quoted = false;
  let line = 1;
  let recordLine = 1;
  // a trailing newline must not produce a final empty record, but a genuinely
  // empty field before one must survive
  let started = false;

  const endField = () => {
    values.push(field);
    field = "";
    started = true;
  };

  const endRecord = () => {
    endField();
    // a line of nothing but separators is padding Excel adds; a line with any
    // content is a real record
    if (values.some((value) => value.length > 0)) {
      records.push({ line: recordLine, values });
    }
    values = [];
    started = false;
    recordLine = line + 1;
  };

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          // "" inside a quoted field is a literal quote
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        if (char === "\n") line += 1;
        field += char;
      }
      continue;
    }

    if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ",") {
      endField();
    } else if (char === "\r") {
      // CRLF: the \n does the work, a lone \r still ends the record
      if (input[i + 1] === "\n") i += 1;
      line += 1;
      endRecord();
    } else if (char === "\n") {
      line += 1;
      endRecord();
    } else {
      field += char;
    }
  }

  if (field.length > 0 || started || values.length > 0) endRecord();

  return records;
}

/**
 * Returns null when there is no header row to work with — an empty file, or
 * one holding only blank lines.
 */
export function parseCsv(input: string): CsvTable | null {
  // strip the BOM before anything else looks at the text
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  const records = splitRecords(text);
  if (records.length === 0) return null;

  const [headerRecord, ...rest] = records;

  return {
    header: headerRecord.values.map((value) => value.trim()),
    rows: rest,
  };
}

/** Pairs each row with the header, so callers work in names not indices. */
export function toObjects(table: CsvTable): { line: number; values: Record<string, string> }[] {
  return table.rows.map((row) => {
    const values: Record<string, string> = {};

    table.header.forEach((key, index) => {
      if (key.length === 0) return;
      values[key] = (row.values[index] ?? "").trim();
    });

    return { line: row.line, values };
  });
}
