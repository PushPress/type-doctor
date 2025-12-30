# Type Doctor

Type Doctor diagnoses potential TypeScript performance issues by analyzing type checking traces.

## Overview

Type Doctor analyzes TypeScript trace files to identify expressions that take too long to type-check. It helps you find performance bottlenecks in your TypeScript codebase by pinpointing slow type checking operations.

## Installation

```bash
bun install
```

Build the CLI:

```bash
bun run build
```

## Usage

### Generating a Trace File

First, generate a trace file from your TypeScript project:

```bash
tsc --generateTrace trace.json
```

### Running Type Doctor

Analyze a trace file:

```bash
bun cmd/cli.ts trace.json
```

Or use the compiled binary:

```bash
./bin/td trace.json
```

### Options

- `--checkTimeMsWarn <ms>`: Set the warning threshold in milliseconds for a single expression check (default: `500`)
- `--checkTimeMsError <ms>`: Set the error threshold in milliseconds for a single expression check (default: `1000`). Must be greater than `checkTimeMsWarn`
- `-a, --annotate`: Enable GitHub Actions annotations (also enabled automatically in CI)
- `-d, --debug`: Enable debug logging
- `-h, --help`: Show help message

### Examples

Analyze with a custom error threshold:

```bash
bun cmd/cli.ts --checkTimeMsError 50 trace.json
```

Analyze with custom warning and error thresholds:

```bash
bun cmd/cli.ts --checkTimeMsWarn 200 --checkTimeMsError 500 trace.json
```

Enable GitHub Actions annotations:

```bash
bun cmd/cli.ts -a trace.json
```

Enable debug logging:

```bash
bun cmd/cli.ts -d trace.json
```

## Requirements

- Bun runtime
- TypeScript 5.x (peer dependency)
- A `tsconfig.json` file in your project root

## Development

```bash
# Install dependencies
bun install

# Build the CLI
bun run build

# Run tests (if available)
bun test
```
