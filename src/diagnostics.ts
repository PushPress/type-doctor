import { Node } from "./types";
import * as core from "@actions/core";
import ts from "typescript";
import { formatDiagnostic } from "./format";

type MaxDurationRule = {
  name: "maxDuration";
  kind: "error";
  duration: number;
  errorMessage: string;
  apply: (expr: Node) => boolean; // true if rule is violated
};

type Rule = MaxDurationRule;

export interface Diagnostic {
  node: Node; // will be a union of checked nodes
  rule: Rule; // will be a union of rules
}

export const maxDurationRule = (duration: number): MaxDurationRule => {
  return {
    name: "maxDuration",
    kind: "error",
    duration,
    errorMessage: `Expression exceeds max duration of ${duration}ms`,
    apply: function (expr: Node) {
      // convert duration in microseconds to milliseconds
      return expr.dur / 1000 > duration;
    },
  };
};

/** extends to other rules */
export function report(expressions: Node[], rules: Rule[]): Diagnostic[] {
  return expressions.flatMap((expr) => {
    return rules
      .filter((rule) => rule.apply(expr))
      .map((rule) => {
        return {
          node: expr,
          rule,
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
  return diagnostics.map((d) => {
    switch (d.rule.kind) {
      case "error": {
        const { path, pos } = d.node.args;
        const file = program.getSourceFile(path)!;
        const { line, character } = file.getLineAndCharacterOfPosition(pos);
        return [
          d.rule.errorMessage,
          {
            file: path,
            startLine: line,
            startColumn: character,
          },
        ];
      }
    }
  });
}

export function format(diagnostics: Diagnostic[], program: ts.Program) {
  return diagnostics.map((d) => {
    switch (d.rule.kind) {
      case "error": {
        const { path, pos, end } = d.node.args;
        return [
          "error",
          formatDiagnostic(
            program.getSourceFile(path)!,
            pos,
            end,
            d.rule.errorMessage,
          ),
        ] as ["error", string];
      }
    }
  });
}
