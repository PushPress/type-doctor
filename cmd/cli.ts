import { parseArgs, debuglog } from "util";
import * as Trace from "../src/trace-parser";
import { report, maxDurationRule, annotate, format } from "../src/diagnostics";
import { pipe } from "../src/pipe";
import { getCurrentProgram } from "../src/compiler";
import { printAnnotation, printHelp } from "./print";
const log = debuglog("type-doctor");

const {
  values: { checkTimeMsError: maxDuration, annotate: _annotate, debug, help },
  positionals: _positionals,
} = parseArgs({
  args: Bun.argv,
  allowPositionals: true,
  strict: true,
  options: {
    checkTimeMsError: {
      type: "string",
      default: "1000",
    },
    annotate: {
      type: "boolean",
      short: "a",
    },
    debug: {
      type: "boolean",
      short: "d",
    },
    help: {
      type: "boolean",
      short: "h",
    },
  },
});

if (help) {
  printHelp();
  process.exit(0);
}

if (debug) {
  process.env.NODE_DEBUG = "true";
}

const positionals = _positionals.slice(2);
if (!positionals.length) {
  console.error(
    "At least one trace json file is required as a positional arguement",
  );
}

// parse flags
function parseMaxDurationFlag(str: string): number {
  const val = parseInt(str);
  if (Number.isNaN(val)) {
    throw Error("invalid max duration");
  }

  if (val < 1) {
    throw Error("max duration must be greater than 0");
  }
  return val;
}

// main function
for (const positional of positionals) {
  log("Reading file: " + positional);
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

  log("Raw diagnostics: " + JSON.stringify(diagnostics));
  // print diagnostics
  if (process.env.CI || _annotate) {
    debuglog("Annotating diagnostics");
    annotate(diagnostics, program).map(([message, props]) =>
      printAnnotation(message, props),
    );
  }

  format(diagnostics, program).map(([kind, formatted]) =>
    console[kind](formatted),
  );
}
