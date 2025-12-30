#!/usr/bin/env node
import { parseArgs } from "util";
import * as Trace from "../lib/trace-parser";
import { report, maxDurationRule, annotate, format } from "../lib/diagnostics";
import { getCurrentProgram } from "../lib/compiler";
import { printAnnotation, printHelp } from "./print";
import { z } from "zod";
import { logger } from "./log";

const Args = z
  .object({
    checkTimeMsError: z.coerce.number().positive(),
    checkTimeMsWarn: z.coerce.number().positive(),
    annotate: z.boolean().default(false),
    help: z.boolean().default(false),
    debug: z.boolean().default(false),
    positionals: z.array(z.string()),
  })
  .refine(({ help, positionals }) => {
    if (!positionals.length && !help) {
      return false;
    }
    return true;
  }, "Must provide at least one trace json positional arguement or --help flag")
  .refine(({ checkTimeMsWarn, checkTimeMsError }) => {
    if (checkTimeMsError && checkTimeMsWarn) {
      return checkTimeMsError > checkTimeMsWarn;
    }
    return true;
  }, "checkTimeMsError must be greater than checkTimeMsWarn");

function validateArgsOrExit(args: z.input<typeof Args>) {
  const result = Args.safeParse(args);
  if (!result.success) {
    return logger.errorAndFail(z.prettifyError(result.error));
  }
  return result.data;
}

const { values, positionals: _positionals } = parseArgs({
  args: Bun.argv,
  allowPositionals: true,
  strict: true,
  options: {
    checkTimeMsWarn: {
      type: "string",
      default: "500",
    },
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

const { help, debug, checkTimeMsError, checkTimeMsWarn, positionals } =
  validateArgsOrExit({
    positionals: _positionals.slice(2),
    ...values,
  });

if (help) {
  printHelp();
  process.exit(0);
}

if (debug) {
  process.env.NODE_DEBUG = "true";
}

// main function
for (const positional of positionals) {
  logger.debug("Reading file: " + positional);
  const file = await Bun.file(positional).json();
  const program = getCurrentProgram();

  const [spans, error] = Trace.parse(file);
  if (error) {
    throw error;
  }

  // apply rules to the the expression
  const diagnostics = report(spans, [
    maxDurationRule({ error: checkTimeMsError, warn: checkTimeMsWarn }),
  ]);

  logger.debug("Raw diagnostics: " + JSON.stringify(diagnostics));

  if (process.env.CI || annotate) {
    logger.debug("Annotating diagnostics");
    annotate(diagnostics, program).map(([message, props]) =>
      printAnnotation(message, props),
    );
  }

  format(diagnostics, program).map(([kind, formatted]) =>
    logger[kind](formatted),
  );
}
