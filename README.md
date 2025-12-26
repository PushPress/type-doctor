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

- `-d, --maxDuration <ms>`: Set the maximum duration threshold in milliseconds for a single expression check (default: `1000`)
- `-a, --annotate`: Enable GitHub Actions annotations (also enabled automatically in CI)

### Examples

Analyze with a custom threshold:

```bash
bun cmd/cli.ts -d 50 trace.json
```

Enable GitHub Actions annotations:

```bash
bun cmd/cli.ts -a trace.json
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
