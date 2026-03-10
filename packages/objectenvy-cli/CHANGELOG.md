# Changelog

## 1.1.1

### Patch Changes

- [#57](https://github.com/pradeepmouli/objectenvy/pull/57) [`d7a0cbc`](https://github.com/pradeepmouli/objectenvy/commit/d7a0cbccde5557f2bf0272ca507e3c63d7072106) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - test: validate full CI/CD automation pipeline

- Updated dependencies [[`d7a0cbc`](https://github.com/pradeepmouli/objectenvy/commit/d7a0cbccde5557f2bf0272ca507e3c63d7072106)]:
  - objectenvy@1.3.1

## 1.1.0

### Minor Changes

- cleanup

### Patch Changes

- Updated dependencies
  - objectenvy@1.3.0

All notable changes to the ObjectEnvy CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-12

### Added

- Initial release of objectenvy-cli
- Generate `.env` template files from TypeScript interfaces and types
- Generate `.env` template files from JSON schemas
- Smart sample value generation based on field names
- Support for nested objects
- JSDoc comment preservation
- Field filtering (include/exclude)
- Prefix support for environment variables
- List TypeScript exports command
- Required-only field generation option
- Atomic file writing for safe output
- Comprehensive error handling and validation

### Features

- TypeScript parser using ts-morph
- JSON parser with type inference
- Semantic sample value generation
- Contextual placeholders (URL, PASSWORD, TOKEN, etc.)
- Comment formatting from descriptions
- Output to file or stdout

### Supported Input Formats

- TypeScript interfaces
- TypeScript type aliases
- JSON objects

### Planned Features

- JSON Schema support
- Zod schema extraction
- YAML output format
- Environment variable validation
