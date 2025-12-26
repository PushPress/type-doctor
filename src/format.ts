import ts from "typescript";

/**
 * AI generated format function for pretty diagnostics
 * @example
 * Expression exceeds max duration of 10ms
  at /Users/iankaplan/projects/pushpress/slow-type-detector/test/exmple.ts:38:11
  37 | // Generic instantiation
  38 | const id = identity(123);
     |           ^^^^^^^^^^^^^^
  39 |
 */
export function formatDiagnostic(
  sf: ts.SourceFile,
  pos: number,
  end: number,
  message: string,
  opts: { contextLines?: number } = {},
) {
  const contextLines = opts.contextLines ?? 1;

  const startPos = pos;
  const endPos = Math.max(pos, end);

  const startLC = sf.getLineAndCharacterOfPosition(startPos);
  const endLC = sf.getLineAndCharacterOfPosition(endPos);

  const startLine = startLC.line; // 0-based
  const endLine = endLC.line;

  const lines = sf.text.split(/\r?\n/);

  const from = Math.max(0, startLine - contextLines);
  const to = Math.min(lines.length - 1, endLine + contextLines);

  const lineNoWidth = String(to + 1).length;

  const header =
    `${message}\n` +
    `  at ${sf.fileName}:${startLine + 1}:${startLC.character + 1}`;

  const frame: string[] = [];

  for (let line = from; line <= to; line++) {
    const lineNum = String(line + 1).padStart(lineNoWidth, " ");
    const text = lines[line] ?? "";

    frame.push(`  ${lineNum} | ${text}`);

    if (line >= startLine && line <= endLine) {
      const underlineStart = line === startLine ? startLC.character : 0;

      const underlineEnd = line === endLine ? endLC.character : text.length;

      const caretsLen = Math.max(1, underlineEnd - underlineStart);

      frame.push(
        `  ${" ".repeat(lineNoWidth)} | ` +
          " ".repeat(underlineStart) +
          "^".repeat(caretsLen),
      );
    }
  }

  return `\n${header}\n${frame.join("\n")}\n`;
}
