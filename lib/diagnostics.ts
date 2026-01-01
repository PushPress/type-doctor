import { Span } from "./types";
import * as core from "@actions/core";
import ts from "typescript";
import { formatDiagnostic } from "./format";

type BuildRule<Name extends string> = {
  name: Name;
  errorMessage: (span: Span) => string;
  warnMessage: (span: Span) => string;
  apply: (expr: Span) => "warn" | "error" | undefined; // true if rule is violated
};

type MaxDurationRule = BuildRule<"typeCheckTime">;

export type Rule = MaxDurationRule;

export interface Diagnostic {
  span: Span; // AST node for the relavent source code
  rule: Rule; // will be a union of rules
  level: "warn" | "error";
}

export const maxDurationRule = ({
  warn,
  error,
}: {
  warn?: number;
  error?: number;
}): MaxDurationRule => {
  return {
    name: "typeCheckTime",
    errorMessage: (span) =>
      `Expression check time ${Math.floor(span.dur / 1000)} exceeds max duration of ${error}ms`,
    warnMessage: (span) =>
      `Expression check time ${Math.floor(span.dur / 1000)} exceeds warn duration of ${warn}ms`,
    apply: function (span: Span) {
      const spanDuration = span.dur / 1000;
      if (error && spanDuration > error) {
        return "error";
      }
      if (warn && spanDuration > warn) {
        return "warn";
      }
      return;
    },
  };
};

/** extends to other rules */
export function report(spans: Span[], rules: Rule[]): Diagnostic[] {
  return spans
    .flatMap((span) => {
      return rules.map((rule) => {
        const level = rule.apply(span);
        if (!level) {
          return;
        }
        return {
          span,
          rule,
          level,
        };
      });
    })
    .filter((d) => d !== undefined);
}

/**
 * @param github style annotations to stdout/stderr
 */
export function annotate(
  diagnostics: Diagnostic[],
  program: ts.Program,
): [string, core.AnnotationProperties][] {
  return diagnostics.map((d) => {
    const { path, pos } = d.span.args;
    const file = program.getSourceFile(path)!;
    const { line, character } = file.getLineAndCharacterOfPosition(pos);
    const message =
      d.level === "error"
        ? d.rule.errorMessage(d.span)
        : d.rule.warnMessage(d.span);
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
          d.level === "warn"
            ? d.rule.warnMessage(d.span)
            : d.rule.errorMessage(d.span),
        ),
      ] as [typeof d.level, string];
    })
    .filter((d) => d !== undefined);
}

/**
 * Creates a summary message quantifying errors and warnings per rule
 * @param diagnostics Array of diagnostics to summarize
 * @returns Summary message string
 */
export function createSummaryMessage(diagnostics: Diagnostic[]): string {
  // Filter out diagnostics with level "none" and group by rule name
  const ruleStats = new Map<string, { errors: number; warnings: number }>();

  for (const diagnostic of diagnostics) {
    const ruleName = diagnostic.rule.name;
    const stats = ruleStats.get(ruleName) || { errors: 0, warnings: 0 };

    if (diagnostic.level === "error") {
      stats.errors++;
    } else if (diagnostic.level === "warn") {
      stats.warnings++;
    }

    ruleStats.set(ruleName, stats);
  }

  if (ruleStats.size === 0) {
    return "No errors or warnings found.";
  }

  const summaryParts: string[] = [];
  for (const [ruleName, stats] of ruleStats.entries()) {
    const parts: string[] = [];
    if (stats.errors > 0) {
      parts.push(`${stats.errors} error${stats.errors !== 1 ? "s" : ""}`);
    }
    if (stats.warnings > 0) {
      parts.push(`${stats.warnings} warning${stats.warnings !== 1 ? "s" : ""}`);
    }
    if (parts.length > 0) {
      summaryParts.push(`${ruleName}: ${parts.join(", ")}`);
    }
  }

  return summaryParts.join("; ");
}
