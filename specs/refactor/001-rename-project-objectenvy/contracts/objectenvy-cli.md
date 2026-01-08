# Contract — objectenvy-cli

The unified CLI preserves behavior from `env-y-config` and `config-y-env` while offering a single executable: `objectenvy-cli`.

## Commands (Behavior-Parity Targets)

- Generate artifacts (from schema/config) — parity with `env-y-config generate`
- Convert config⇄env representations — parity with `config-y-env` functionality

Command names/flags MUST remain backward-compatible; outputs MUST match prior tools for identical inputs.

For detailed prior command surfaces, see:
- specs/002-cli-vscode-tools/contracts/env-y-config-cli.md
- specs/002-cli-vscode-tools/contracts/config-y-env-cli.md

## I/O Contracts

- Inputs: Paths to TypeScript/JSON sources; `.env` files; options/flags identical to prior CLIs
- Outputs: Generated files (e.g., `.env` variants), stdout logs; exit codes preserved

## Error Semantics

- Validation errors and exit codes remain unchanged
- Error messages may update names, but not semantics or codes
