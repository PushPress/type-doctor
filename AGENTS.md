# Agent Instructions for Type Doctor

## Keeping Documentation and Help Command Synchronized

When modifying command-line flags, arguments, or options in Type Doctor, you **MUST** ensure that both the help command output and the README documentation are updated to reflect these changes.

### Where to Update

1. **CLI Flag Definitions**: `cmd/cli.ts`
   - Flags are defined in the `parseArgs` options object (lines 43-64)
   - This is the source of truth for available flags

2. **Help Command Output**: `cmd/print.ts`
   - The `printHelp()` function (lines 10-42) displays the help text shown when users run `--help` or `-h`
   - Must match all flags, descriptions, defaults, and examples from `cmd/cli.ts`

3. **README Documentation**: `README.md`
   - The "Options" section (lines 45-51) documents all available flags
   - The "Examples" section (lines 53-77) should demonstrate flag usage
   - Must match the help command output

### Checklist When Adding or Modifying Flags

When you add, remove, or modify any command-line flag or argument:

- [ ] Update the `parseArgs` options object in `cmd/cli.ts`
- [ ] Update the `printHelp()` function in `cmd/print.ts` to include:
  - [ ] Flag name (long form and short form if applicable)
  - [ ] Description of what the flag does
  - [ ] Default value (if applicable)
  - [ ] Any constraints or requirements
- [ ] Update the README.md "Options" section with:
  - [ ] Flag name and short form (if applicable)
  - [ ] Description
  - [ ] Default value
- [ ] Add or update examples in README.md "Examples" section if the flag usage should be demonstrated
- [ ] Verify consistency between help output and README by:
  - [ ] Running `bun cmd/cli.ts --help` and comparing output
  - [ ] Checking that all flags appear in both places
  - [ ] Ensuring descriptions match

### Flag Definition Format

Flags are defined in `cmd/cli.ts` using this structure:

```typescript
options: {
  flagName: {
    type: "string" | "boolean",
    short: "x", // optional short form
    default: "value", // optional default
  },
}
```

Help text in `cmd/print.ts` should follow this format:

```
  --flagName <arg>   Description of the flag (default: value)
  -x, --flagName     Description of boolean flag
```

README.md should document flags in a similar format:

```markdown
- `-x, --flagName`: Description of the flag (default: `value`)
```

### Important Notes

- **Default values**: If a flag has a default value in `cmd/cli.ts`, it must be documented in both the help command and README
- **Short forms**: If a flag has a short form (e.g., `-a` for `--annotate`), it must appear in both places
- **Constraints**: Any validation rules or constraints (e.g., "Must be greater than X") should be documented
- **Examples**: Consider adding examples to the README when flags have non-obvious usage patterns

### Verification

Before completing any changes to flags:

1. Run `bun cmd/cli.ts --help` and verify the output is correct
2. Review the README.md Options section for accuracy
3. Ensure all three locations (CLI definition, help output, README) are synchronized
