import { Span } from "./types";
import * as core from "@actions/core";
import ts from "typescript";
import { formatDiagnostic } from "./format";

type BuildRule<Name extends string> = {
  name: Name;
  errorMessage: string;
  warnMessage: string;
  apply: (expr: Span) => "warn" | "error" | "none"; // true if rule is violated
};

type MaxDurationRule = BuildRule<"maxDuration">;

type Rule = MaxDurationRule;

export interface Diagnostic {
  span: Span; // AST node for the relavent source code
  rule: Rule; // will be a union of rules
  level: "warn" | "error" | "none";
}

export const maxDurationRule = ({
  warn,
  error,
}: {
  warn: number;
  error: number;
}): MaxDurationRule => {
  return {
    name: "maxDuration",
    errorMessage: `Expression exceeds max duration of ${error}ms`,
    warnMessage: `Expression exceeds warn duration of ${warn}ms`,
    apply: function (span: Span) {
      const spanDuration = span.dur / 1000;
      if (spanDuration > error) {
        return "error";
      }
      if (spanDuration > warn) {
        return "warn";
      }
      return "none";
    },
  };
};

/** extends to other rules */
export function report(spans: Span[], rules: Rule[]): Diagnostic[] {
  return spans.flatMap((span) => {
    return rules.map((rule) => {
      return {
        span,
        rule,
        level: rule.apply(span),
      };
    });
  });
}

/**
 * @param github style annotations to stdout/stderr
 */
export function annotate(
  diagnostics: Diagnostic[],
  program: ts.Program,
): [string, core.AnnotationProperties][] {
  return diagnostics
    .filter((d) => d.level !== "none")
    .map((d) => {
      const { path, pos } = d.span.args;
      const file = program.getSourceFile(path)!;
      const { line, character } = file.getLineAndCharacterOfPosition(pos);
      const message =
        d.level === "error" ? d.rule.errorMessage : d.rule.warnMessage;
      return [
        message,
        {
          file: path,
          startLine: line,
          startColumn: character,
        },
      ];
    });
}

export function format(diagnostics: Diagnostic[], program: ts.Program) {
  return diagnostics
    .map((d) => {
      const { path, pos, end } = d.span.args;

      return [
        d.level,
        formatDiagnostic(
          program.getSourceFile(path)!,
          pos,
          end,
          d.level === "warn" ? d.rule.warnMessage : d.rule.errorMessage,
        ),
      ] as [typeof d.level, string];
    })
    .filter((d) => d !== undefined);
}
