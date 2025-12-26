import * as core from "@actions/core";

export function printAnnotation(
  message: string,
  props: core.AnnotationProperties,
) {
  core.error(message, props);
}

export function printHelp() {
  console.log(
    `
type-doctor — diagnoses potential TypeScript performance issues

USAGE:
  type-doctor [options] <trace.json...>
  td [options] <trace.json...>

DESCRIPTION:
  Analyzes TypeScript trace files to identify expressions that take too long
  to type-check. Helps find performance bottlenecks in your TypeScript codebase.

OPTIONS:
  --checkTimeMsError <ms>  Set the maximum duration threshold in milliseconds
                           for a single expression check (default: 1000)
  -a, --annotate           Enable GitHub Actions annotations (also enabled
                           automatically in CI)
  -d, --debug              Enable debug logging
  -h, --help               Show this help message

EXAMPLES:
  type-doctor trace.json
  type-doctor --checkTimeMsError 50 trace.json
  type-doctor -a trace.json
  type-doctor -d trace.json trace2.json
`.trim(),
  );
}
