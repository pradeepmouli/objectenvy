# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Refactor 001: Major project rename from configenvy to objectenvy
  - Core library moved to `packages/objectenvy`
  - Unified CLI (`objectenvy-cli`) consolidates `env-y-config` and `config-y-env`
  - VS Code extension renamed to `objectenvy-vscode` (from `vscode-envyconfig`)
  - Full workspace integration with proper cross-package dependencies
  - All public APIs preserved with identical behavior
  - 253+ comprehensive tests ensuring behavior parity

### Changed

- **BREAKING**: Package name changed from `envyconfig` to `objectenvy`
- **BREAKING**: CLI commands unified under `objectenvy-cli` (previously separate CLIs)
- **BREAKING**: VS Code extension ID changed from `envyconfig-vscode` to `objectenvy-vscode`
  - Command IDs updated: `envyconfig.*` → `objectenvy.*`
  - Configuration properties renamed: `envyconfig.*` → `objectenvy.*`

### Deprecated

- Old package names `envyconfig`, `env-y-config`, `config-y-env`, `vscode-envyconfig` (migration guide provided)

### Removed

- None

### Fixed

- None

### Security

- None

## [0.2.0]

### Minor Changes

- array support

## [0.1.0] - 2025-12-19

### Added

- Initial release
- TypeScript project template
- Basic project structure
