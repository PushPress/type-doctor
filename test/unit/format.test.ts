import { test, expect } from "bun:test";
import ts from "typescript";
import { formatDiagnostic } from "../../lib/format";

/**
 * Helper to create a SourceFile from source string
 */
function createSourceFile(
  code: string,
  fileName: string = "test.ts",
): ts.SourceFile {
  return ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

// Standard diagnostic message
test("formatDiagnostic - standard message", () => {
  const code = `const x = 42;
const y = x + 1;`;
  const sf = createSourceFile(code);
  const pos = code.indexOf("x");
  const end = pos + 1;

  const result = formatDiagnostic(
    sf,
    pos,
    end,
    "Expression exceeds max duration of 10ms",
  );

  expect(result).toMatchSnapshot();
});

// Fake long message
test("formatDiagnostic - long message", () => {
  const code = `const x = 42;
const y = x + 1;`;
  const sf = createSourceFile(code);
  const pos = code.indexOf("x");
  const end = pos + 1;

  const longMessage =
    "This is a very long error message that describes a complex type error that occurred during type checking and includes many details about what went wrong and why it happened and what you should do about it";

  const result = formatDiagnostic(sf, pos, end, longMessage);

  expect(result).toMatchSnapshot();
});

// Beginning of file without context
test("formatDiagnostic - beginning of file without context", () => {
  const code = `const x = 42;
const y = x + 1;
const z = y + 1;`;
  const sf = createSourceFile(code);
  const pos = 0;
  const end = 5; // "const"

  const result = formatDiagnostic(
    sf,
    pos,
    end,
    "Expression exceeds max duration of 10ms",
  );

  expect(result).toMatchSnapshot();
});

// Beginning of file with context
test("formatDiagnostic - beginning of file with context", () => {
  const code = `const x = 42;
const y = x + 1;
const z = y + 1;`;
  const sf = createSourceFile(code);
  const pos = 0;
  const end = 5; // "const"

  const result = formatDiagnostic(
    sf,
    pos,
    end,
    "Expression exceeds max duration of 10ms",
    {
      contextLines: 2,
    },
  );

  expect(result).toMatchSnapshot();
});

// End of file without context
test("formatDiagnostic - end of file without context", () => {
  const code = `const x = 42;
const y = x + 1;
const z = y + 1;`;
  const sf = createSourceFile(code);
  const pos = code.length - 1;
  const end = code.length;

  const result = formatDiagnostic(
    sf,
    pos,
    end,
    "Expression exceeds max duration of 10ms",
  );

  expect(result).toMatchSnapshot();
});

// End of file with context
test("formatDiagnostic - end of file with context", () => {
  const code = `const x = 42;
const y = x + 1;
const z = y + 1;`;
  const sf = createSourceFile(code);
  const pos = code.length - 1;
  const end = code.length;

  const result = formatDiagnostic(
    sf,
    pos,
    end,
    "Expression exceeds max duration of 10ms",
    {
      contextLines: 2,
    },
  );

  expect(result).toMatchSnapshot();
});

// Single character position
test("formatDiagnostic - single character position", () => {
  const code = `const x = 42;`;
  const sf = createSourceFile(code);
  const pos = code.indexOf("x");
  const end = pos + 1;

  const result = formatDiagnostic(
    sf,
    pos,
    end,
    "Expression exceeds max duration of 10ms",
  );

  expect(result).toMatchSnapshot();
});

// Multiple character span (single line)
test("formatDiagnostic - multiple character span", () => {
  const code = `const x = 42;
const y = x + 1;`;
  const sf = createSourceFile(code);
  const pos = code.indexOf("const x");
  const end = pos + "const x".length;

  const result = formatDiagnostic(
    sf,
    pos,
    end,
    "Expression exceeds max duration of 10ms",
  );

  expect(result).toMatchSnapshot();
});

// Multiple line span
test("formatDiagnostic - multiple line span", () => {
  const code = `function test() {
  const x = 42;
  const y = x + 1;
  return y;
}`;
  const sf = createSourceFile(code);
  const pos = code.indexOf("const x");
  const end = code.indexOf("return y") + "return y".length;

  const result = formatDiagnostic(
    sf,
    pos,
    end,
    "Expression exceeds max duration of 10ms",
  );

  expect(result).toMatchSnapshot();
});
