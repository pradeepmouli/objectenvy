# Changelog

## 1.1.0 - 2026-01-11

### Added

- Smart array merging options in `objectenvy`:
	- `arrayMergeStrategy: 'replace' | 'concat' | 'concat-unique'`
	- Default remains `'replace'` for backward compatibility
- Non-nesting prefixes in smart nesting (no schema):
	- Keys starting with `max`, `min`, `is`, `enable`, `disable` remain flat even when multiple env vars share the prefix
	- Example: `MAX_CONNECTIONS`, `MAX_TIMEOUT` → `{ maxConnections, maxTimeout }`

### Notes

- Schema-guided nesting remains unchanged and always follows the provided schema structure.

## 0.2.0

### Minor Changes

- array support

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project setup with TypeScript
- Changesets for version management
- GitHub Actions CI/CD workflows
- Pre-commit hooks with Husky
- Dependabot configuration
- Code quality tools (oxlint, oxfmt)
- Testing setup with Vitest
- AI agent instructions (AGENTS.md)
- MCP server configuration

### Changed

- None

### Deprecated

- None

### Removed

- None

### Fixed

- None

### Security

- None

## [0.1.0] - 2025-12-19

### Added

- Initial release
- TypeScript project template
- Basic project structure
