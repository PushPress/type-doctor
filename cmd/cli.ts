import { parseArgs } from "util";
import * as Trace from "../src/trace-parser";
import { report, maxDurationRule, annotate, format } from "../src/diagnostics";
import { pipe } from "../src/pipe";
import { getCurrentProgram } from "../src/compiler";
import { printAnnotation } from "./print";

const {
  values: { maxDuration, annotate: _annotate },
  positionals: _positionals,
} = parseArgs({
  args: Bun.argv,
  allowPositionals: true,
  strict: true,
  options: {
    maxDuration: {
      type: "string",
      default: "1000",
      short: "d",
    },
    annotate: {
      type: "string",
      short: "a",
    },
  },
});

const positionals = _positionals.slice(2);

// parse flags
function parseMaxDurationFlag(str: string): number {
  const val = parseInt(str);
  if (Number.isNaN(val)) {
    throw Error("invalid max duration");
  }
  return val;
}

if (!positionals.length) {
  console.log(
    "At least one trace json file is required as a positional arguement",
  );
}

// main function
for (const positional of positionals.slice(2)) {
  const file = await Bun.file(positional).json();
  const program = getCurrentProgram();

  // parse trace.json
  const [expressions, error] = Trace.parse(file);
  if (error) {
    throw error;
  }

  const diagnostics = report(expressions, [
    pipe(maxDuration).to(parseMaxDurationFlag, maxDurationRule),
  ]);

  // print diagnostics
  if (process.env.CI || _annotate) {
    annotate(diagnostics, program).map(([message, props]) =>
      printAnnotation(message, props),
    );
  }

  format(diagnostics, program).map(([kind, formatted]) =>
    console[kind](formatted),
  );
}
