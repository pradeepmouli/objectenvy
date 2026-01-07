# Quickstart — Verify Refactor Locally

## Prerequisites

- Node.js ≥20 (verified: v24.12.0), pnpm ≥9 (verified: v9.15.0) installed

### npm Registry Name Availability

- `objectenvy`: [check npm registry](https://www.npmjs.com/package/objectenvy) - 🔵 AVAILABLE
- `objectenvy-cli`: [check npm registry](https://www.npmjs.com/package/objectenvy-cli) - 🔵 AVAILABLE
- `objectenvy-vscode`: [check npm registry](https://www.npmjs.com/package/objectenvy-vscode) - 🔵 AVAILABLE

### VS Code Marketplace Availability

- `objectenvy-vscode`: [check VS Code marketplace](https://marketplace.visualstudio.com/search?term=objectenvy-vscode) - 🔵 AVAILABLE

## Install

```sh
pnpm install
```

## Run Tests with Coverage (pre-baseline checks)

```sh
pnpm -w test -- --coverage
```

## Validate Packages Build

```sh
pnpm -w build
```

## Manual Checks

- CLI: Run existing commands from `packages/env-y-config` and `packages/config-y-env` and capture outputs for later parity checks
- Extension: Launch VS Code extension development host from `packages/vscode-envyconfig` and verify activation/commands

Post-refactor, repeat the same checks under `packages/objectenvy*` names to ensure behavior parity.
