import * as core from "@actions/core";
import { Diagnostic } from "./diagnostics";
import { getCurrentProgram } from "./compiler";

export function annotate(diagnostics: Diagnostic[]) {
  const program = getCurrentProgram();
  diagnostics.forEach((d) => {
    switch (d.rule.kind) {
      case "error": {
        const file = program.getSourceFile(d.span.args.path)!;
        const { line, character } = file.getLineAndCharacterOfPosition(
          d.span.args.pos,
        );
        core.error(d.rule.errorMessage, {
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
