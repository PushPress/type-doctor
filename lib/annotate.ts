import * as core from "@actions/core";
import { Diagnostic } from "./diagnostics";
import { getCurrentProgram } from "./compiler";

export function annotate(diagnostics: Diagnostic[]) {
  const program = getCurrentProgram();
  diagnostics.forEach((d) => {
    const file = program.getSourceFile(d.span.args.path)!;
    const { line, character } = file.getLineAndCharacterOfPosition(
      d.span.args.pos,
    );
    switch (d.level) {
      case "error": {
        core.error(d.rule.errorMessage, {
          file: d.span.args.path,
          startLine: line,
          startColumn: character,
        });
      }
      case "warn": {
        core.error(d.rule.warnMessage, {
          file: d.span.args.path,
          startLine: line,
          startColumn: character,
        });
      }
      default:
        break;
    }
  });
}
