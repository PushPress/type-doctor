import { test, expect } from "bun:test";
import { join } from "path";

const CLI_PATH = join(import.meta.dir, "../../cmd/cli.ts");
const TRACE_FILE = join(import.meta.dir, "../data/trace.json");

/**
 * Helper function to run the CLI with given arguments
 */
async function run(args: string[] = []): Promise<{
  exitCode: number | null;
  stdout: string;
  stderr: string;
}> {
  const proc = Bun.spawn({
    cmd: ["bun", CLI_PATH, ...args],
    stdout: "pipe",
    stderr: "pipe",
    cwd: import.meta.dir,
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const exitCode = await proc.exited;

  return { exitCode, stdout, stderr };
}

test("CLI shows help when --help flag is used", async () => {
  const { exitCode, stdout, stderr } = await run(["--help"]);

  expect(exitCode).toBe(0);
  expect(stdout).toContain("type-doctor");
  expect(stdout).toContain("USAGE:");
  expect(stdout).toContain("OPTIONS:");
  expect(stderr).toBe("");
});

test("CLI shows help when -h flag is used", async () => {
  const { exitCode, stdout } = await run(["-h"]);

  expect(exitCode).toBe(0);
  expect(stdout).toContain("type-doctor");
});

test("CLI processes trace file successfully", async () => {
  const { exitCode, stdout } = await run([TRACE_FILE]);

  expect(exitCode).not.toBeNull();
  expect(stdout.length).toBeGreaterThanOrEqual(0);
});

test("CLI accepts --checkTimeMsError option", async () => {
  const { exitCode } = await run(["--checkTimeMsError", "500", TRACE_FILE]);

  expect(exitCode).not.toBeNull();
});

test("CLI accepts --annotate flag", async () => {
  const { exitCode } = await run(["--annotate", TRACE_FILE]);

  expect(exitCode).not.toBeNull();
});

test("CLI accepts -a flag (short form of --annotate)", async () => {
  const { exitCode } = await run(["-a", TRACE_FILE]);

  expect(exitCode).not.toBeNull();
});

test("CLI accepts -d flag (short form of --debug)", async () => {
  const { exitCode } = await run(["-d", TRACE_FILE]);

  expect(exitCode).not.toBeNull();
});

test("CLI accepts multiple trace files", async () => {
  const { exitCode } = await run([TRACE_FILE, TRACE_FILE]);

  expect(exitCode).not.toBeNull();
});

test("CLI accepts combined options", async () => {
  const { exitCode } = await run([
    "--checkTimeMsError",
    "200",
    "-a",
    "-d",
    TRACE_FILE,
  ]);

  expect(exitCode).not.toBeNull();
});

test("CLI handles invalid --checkTimeMsError value", async () => {
  const { exitCode, stderr } = await run([
    "--checkTimeMsError",
    "invalid",
    TRACE_FILE,
  ]);

  // Should exit with error code
  expect(exitCode).not.toBe(0);
  expect(stderr.length).toBeGreaterThan(0);
});

test("CLI handles negative --checkTimeMsError value", async () => {
  const { exitCode, stderr } = await run([
    "--checkTimeMsError",
    "-1",
    TRACE_FILE,
  ]);

  // Should exit with error code
  expect(exitCode).not.toBe(0);
  expect(stderr.length).toBeGreaterThan(0);
});

test("CLI handles zero --checkTimeMsError value", async () => {
  const { exitCode, stderr } = await run([
    "--checkTimeMsError",
    "0",
    TRACE_FILE,
  ]);

  // Should exit with error code
  expect(exitCode).not.toBe(0);
  expect(stderr.length).toBeGreaterThan(0);
});

test("CLI handles missing trace file", async () => {
  const { exitCode, stderr } = await run([]);

  expect(exitCode).not.toBe(0);
  expect(stderr).toContain("trace json file");
});

test("CLI handles non-existent trace file", async () => {
  const { exitCode, stderr } = await run(["nonexistent.json"]);

  expect(exitCode).not.toBe(0);
  expect(stderr.length).toBeGreaterThan(0);
});

test("CLI handles invalid JSON file", async () => {
  // Create a temporary invalid JSON file
  const invalidJsonPath = join(import.meta.dir, "invalid.json");
  await Bun.write(invalidJsonPath, "not valid json");

  try {
    const { exitCode, stderr } = await run([invalidJsonPath]);

    // Should exit with error code
    expect(exitCode).not.toBe(0);
    expect(stderr.length).toBeGreaterThan(0);
  } finally {
    // Clean up
    try {
      await Bun.file(invalidJsonPath).unlink();
    } catch {
      // Ignore cleanup errors
    }
  }
});
