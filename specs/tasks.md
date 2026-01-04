# Implementation Tasks - CLI Tools & VS Code Extension

**Created**: January 3, 2026
**Target Completion**: February 2026
**Priority**: High

## Phase 1: Project Setup & Infrastructure (Week 1)

### Setup & Configuration
- [ ] Convert project to pnpm workspaces
  - [ ] Update root package.json with workspaces
  - [ ] Create packages/cli-tools directory
  - [ ] Create packages/vscode-extension directory
  - [ ] Create packages/shared directory

- [ ] Set up CLI Tools package
  - [ ] Create packages/cli-tools/package.json
  - [ ] Create packages/cli-tools/tsconfig.json
  - [ ] Set up src/ directory structure
  - [ ] Create bin/ directory for CLI entry points
  - [ ] Add dependencies (commander, zod, ts-morph, tsx)

- [ ] Set up VS Code Extension package
  - [ ] Create packages/vscode-extension/package.json
  - [ ] Create packages/vscode-extension/tsconfig.json
  - [ ] Set up src/ directory structure
  - [ ] Add vscode dependency

- [ ] Set up Shared package
  - [ ] Create packages/shared/package.json
  - [ ] Add shared types and utilities

### Build & Test Infrastructure
- [ ] Configure TypeScript compilation for all packages
- [ ] Set up vitest for CLI tools testing
- [ ] Create GitHub Actions workflow for building all packages
- [ ] Configure ESLint and Prettier for new packages
- [ ] Add pre-commit hooks

---

## Phase 2: env-generate-from CLI Tool (Week 2-3)

### Input Format Parsers

#### Zod Schema Parser
- [ ] Create `packages/cli-tools/src/commands/env-generate-from/parsers/zodParser.ts`
- [ ] Implement schema extraction from .ts files using ts-morph
- [ ] Handle z.object() parsing
- [ ] Support .default() method
- [ ] Support .describe() method
- [ ] Support .enum() method
- [ ] Support .array() method
- [ ] Support .optional() method
- [ ] Support nested z.object() schemas
- [ ] Write unit tests for zodParser
- [ ] Test with real Zod schemas from examples

#### JSON Schema Parser
- [ ] Create `packages/cli-tools/src/commands/env-generate-from/parsers/jsonSchemaParser.ts`
- [ ] Implement JSON Schema file loading
- [ ] Parse "type" field
- [ ] Handle "properties" and nested objects
- [ ] Support "default" values
- [ ] Support "description" field
- [ ] Handle "enum" validation
- [ ] Handle "items" for arrays
- [ ] Write unit tests
- [ ] Test with JSON Schema Draft 7 examples

#### JSON Object Parser
- [ ] Create `packages/cli-tools/src/commands/env-generate-from/parsers/jsonParser.ts`
- [ ] Load JSON files
- [ ] Infer types from values
- [ ] Handle nested objects
- [ ] Handle arrays
- [ ] Write unit tests
- [ ] Test with sample configuration JSON files

#### TypeScript Type Parser
- [ ] Create `packages/cli-tools/src/commands/env-generate-from/parsers/tsParser.ts`
- [ ] Use ts-morph to analyze TypeScript files
- [ ] Extract interface/type definitions
- [ ] Identify field types (string, number, boolean, etc.)
- [ ] Extract JSDoc comments as descriptions
- [ ] Handle union types (enums)
- [ ] Support optional fields
- [ ] Write unit tests
- [ ] Test with TypeScript interface examples

### Sample Value Generator
- [ ] Create `packages/cli-tools/src/commands/env-generate-from/generators/sampleValueGenerator.ts`
- [ ] Generate sample values for string fields
- [ ] Generate sample values for number fields
- [ ] Generate sample values for boolean fields
- [ ] Generate sample values for enum fields (use first value or default)
- [ ] Generate sample values for array fields (comma-separated)
- [ ] Respect field descriptions when generating values
- [ ] Respect default values from schema
- [ ] Write unit tests for all field types

### ENV File Generator
- [ ] Create `packages/cli-tools/src/commands/env-generate-from/generators/envGenerator.ts`
- [ ] Format field names to SNAKE_CASE
- [ ] Apply prefix if specified
- [ ] Include descriptions as comments
- [ ] Support includeFields option
- [ ] Support excludeFields option
- [ ] Support requiredOnly option
- [ ] Handle nested fields (PARENT_CHILD_FIELD)
- [ ] Write unit tests

### Command Handler & CLI Integration
- [ ] Create `packages/cli-tools/src/commands/env-generate-from/handler.ts`
- [ ] Implement argument parsing
- [ ] Auto-detect input format if not specified
- [ ] Load and parse input file
- [ ] Generate .env content
- [ ] Write output file or return content
- [ ] Handle errors gracefully
- [ ] Add logging for debugging

- [ ] Create `packages/cli-tools/bin/env-generate-from.js` entry point
- [ ] Make CLI executable

### Testing & Documentation
- [ ] Create comprehensive test suite
  - [ ] Test each parser with valid inputs
  - [ ] Test error handling with invalid inputs
  - [ ] Test sample generation for all types
  - [ ] Test env generation with various options
  - [ ] Test integration end-to-end

- [ ] Create example files for testing
  - [ ] Example Zod schema
  - [ ] Example JSON Schema
  - [ ] Example JSON object
  - [ ] Example TypeScript type

---

## Phase 3: type-generate-from CLI Tool (Week 3-4)

### ENV File Parser
- [ ] Create `packages/cli-tools/src/utils/envParser.ts`
- [ ] Parse .env file format
- [ ] Extract key-value pairs
- [ ] Handle comments
- [ ] Handle empty lines
- [ ] Handle quoted values
- [ ] Support multiline values (if needed)
- [ ] Write unit tests

### Type Inference Engine
- [ ] Create `packages/cli-tools/src/utils/typeInference.ts`
- [ ] Implement type detection for values
  - [ ] Detect string type
  - [ ] Detect number type
  - [ ] Detect boolean type
  - [ ] Detect array type (comma-separated)
  - [ ] Handle empty values
  - [ ] Support strict and loose inference modes

- [ ] Implement nesting detection
  - [ ] Parse PARENT_CHILD_FIELD pattern
  - [ ] Build nested object structure
  - [ ] Handle multiple nesting levels

- [ ] Build inferred schema
  - [ ] Create ParsedSchema from env vars
  - [ ] Track required vs optional fields
  - [ ] Handle prefix filtering

- [ ] Write comprehensive tests

### Generators

#### TypeScript Type Generator
- [ ] Create `packages/cli-tools/src/commands/type-generate-from/generators/tsGenerator.ts`
- [ ] Generate TypeScript interface
- [ ] Include JSDoc comments
- [ ] Handle nested interfaces
- [ ] Support custom interface names
- [ ] Generate type-safe exports
- [ ] Write unit tests

#### JSON Schema Generator
- [ ] Create `packages/cli-tools/src/commands/type-generate-from/generators/jsonSchemaGenerator.ts`
- [ ] Generate valid JSON Schema
- [ ] Include type information
- [ ] Mark required fields
- [ ] Handle nested objects
- [ ] Write unit tests

#### JavaScript Object Generator
- [ ] Create `packages/cli-tools/src/commands/type-generate-from/generators/objectGenerator.ts`
- [ ] Generate JavaScript object with type annotations
- [ ] Format for runtime use
- [ ] Write unit tests

#### Zod Schema Generator
- [ ] Create `packages/cli-tools/src/commands/type-generate-from/generators/zodGenerator.ts`
- [ ] Generate Zod schema from env vars
- [ ] Include validation rules
- [ ] Support z.object() nesting
- [ ] Compatible with envyconfig
- [ ] Write unit tests

### Command Handler & CLI Integration
- [ ] Create `packages/cli-tools/src/commands/type-generate-from/handler.ts`
- [ ] Implement .env file reading
- [ ] Implement type inference
- [ ] Route to appropriate generator
- [ ] Handle output options
- [ ] Error handling and logging

- [ ] Create `packages/cli-tools/bin/type-generate-from.js` entry point
- [ ] Integrate into main CLI

### Testing & Documentation
- [ ] Create test suite for type-generate-from
  - [ ] Test .env parsing
  - [ ] Test type inference accuracy
  - [ ] Test all generator outputs
  - [ ] Test prefix filtering
  - [ ] Test end-to-end workflows

- [ ] Create example .env files for testing

---

## Phase 4: VS Code Extension (Week 4-5)

### Project Setup
- [ ] Create Extension manifest (package.json)
- [ ] Set up TypeScript configuration
- [ ] Configure VS Code extension build
- [ ] Add vscode dependency

### Core Extension
- [ ] Create `packages/vscode-extension/src/extension.ts`
- [ ] Implement extension activation
- [ ] Register command handlers
- [ ] Set up subscriptions

### Commands

#### Generate .env from Schema Command
- [ ] Create `packages/vscode-extension/src/commands/generateEnvFromSchema.ts`
- [ ] Show quick-pick for input format
- [ ] File picker for input file
- [ ] Support text input from editor
- [ ] Call CLI tool or use library
- [ ] Display preview
- [ ] Option to create file
- [ ] Option to insert into editor
- [ ] Status updates and notifications

#### Generate Types from .env Command
- [ ] Create `packages/vscode-extension/src/commands/generateTypesFromEnv.ts`
- [ ] Auto-detect or show quick-pick for output format
- [ ] File picker for .env file
- [ ] Call CLI tool or use library
- [ ] Display preview
- [ ] Option to create file
- [ ] Option to insert into editor
- [ ] Status updates and notifications

#### Quick Convert Command
- [ ] Create `packages/vscode-extension/src/commands/quickConvert.ts`
- [ ] Detect file type from current editor
- [ ] Auto-select appropriate conversion
- [ ] Run conversion with defaults
- [ ] Open result in new tab
- [ ] Handle errors gracefully

### WebView & UI

#### Preview Provider
- [ ] Create `packages/vscode-extension/src/providers/previewProvider.ts`
- [ ] Implement WebView panel creation
- [ ] Build side-by-side source/result view
- [ ] Add copy to clipboard functionality
- [ ] Handle webview messaging
- [ ] Add styling (CSS)
- [ ] Add interactivity (JavaScript)

#### Settings Provider
- [ ] Create `packages/vscode-extension/src/providers/settingsProvider.ts`
- [ ] Configuration panel for:
  - [ ] Env var prefix
  - [ ] Field inclusion/exclusion
  - [ ] Type inference strictness
  - [ ] Default output format

#### File Handler Utilities
- [ ] Create `packages/vscode-extension/src/utils/fileHandler.ts`
- [ ] File creation helper
- [ ] File insertion into editor helper
- [ ] Clipboard writing helper
- [ ] Temporary file handling

#### UI Helper Utilities
- [ ] Create `packages/vscode-extension/src/utils/uiHelpers.ts`
- [ ] Quick-pick helper for format selection
- [ ] File picker helper
- [ ] Progress notification helper
- [ ] Error notification helper

### Context Menus
- [ ] Register context menu on .env files
  - [ ] "Generate TypeScript Types"
  - [ ] "Generate JSON Schema"
  - [ ] "Preview Types"

- [ ] Register context menu on schema files
  - [ ] "Generate .env Sample"
  - [ ] "Preview .env"

### Extension Manifest
- [ ] Update package.json with all commands
- [ ] Configure activation events
- [ ] Add icons and display name
- [ ] Configure menu contributions
- [ ] Add extension metadata

### Testing
- [ ] Create test suite for extension
  - [ ] Test command registration
  - [ ] Test file operations
  - [ ] Test UI interactions
  - [ ] Test error handling

---

## Phase 5: Polish & Publishing (Week 5-6)

### Documentation
- [ ] Create README for cli-tools package
  - [ ] Installation instructions
  - [ ] Usage examples
  - [ ] All command options
  - [ ] Supported input/output formats
  - [ ] Examples for each format

- [ ] Create README for vscode-extension
  - [ ] Installation from marketplace
  - [ ] Feature overview
  - [ ] Command descriptions
  - [ ] Screenshots/GIFs
  - [ ] Keyboard shortcuts
  - [ ] Settings configuration

- [ ] Create main README integrating all tools
- [ ] Create CONTRIBUTING guide
- [ ] Create CHANGELOG

### Examples & Demos
- [ ] Create example schemas
  - [ ] Example Zod schema
  - [ ] Example JSON Schema
  - [ ] Example TypeScript interface
  - [ ] Example .env file

- [ ] Create demo .env files
- [ ] Create tutorial/guide document

### CI/CD
- [ ] Create GitHub Actions workflow for testing
- [ ] Create workflow for building packages
- [ ] Create workflow for publishing to npm
- [ ] Create workflow for publishing VS Code extension
- [ ] Add build status badges to README

### Code Quality
- [ ] Run full test suite
- [ ] Verify test coverage >85%
- [ ] Run linting on all packages
- [ ] Fix any linting issues
- [ ] Run TypeScript type checking
- [ ] Review code for edge cases

### Publishing
- [ ] Create changeset entries
- [ ] Version all packages (v1.0.0)
- [ ] Build all packages
- [ ] Publish to npm
- [ ] Publish VS Code extension to marketplace
- [ ] Create GitHub releases
- [ ] Announce on social media

### Post-Launch
- [ ] Monitor for bug reports
- [ ] Gather user feedback
- [ ] Plan v1.1 features
- [ ] Consider additional input/output formats

---

## Success Metrics

### Code Quality
- [ ] Test coverage >85% for both packages
- [ ] Zero TypeScript errors
- [ ] No linting violations
- [ ] All type annotations explicit

### Functionality
- [ ] All input formats parse correctly
- [ ] All output formats generate valid code
- [ ] Type inference accuracy >90%
- [ ] CLI commands work from terminal
- [ ] VS Code commands available in command palette
- [ ] Context menus appear on correct files

### User Experience
- [ ] CLI help text is clear
- [ ] Extension loads without errors
- [ ] Commands complete in <2 seconds
- [ ] Error messages are helpful
- [ ] Preview UI is intuitive

### Documentation
- [ ] README covers all features
- [ ] Examples show common use cases
- [ ] Installation instructions are clear
- [ ] API docs are complete

---

## Dependencies to Install

```json
{
  "cli-tools": {
    "commander": "^11.0.0",
    "zod": "^4.3.4",
    "ts-morph": "^21.0.0",
    "typescript": "^5.9.3"
  },
  "vscode-extension": {
    "vscode": "^1.85.0"
  }
}
```

---

## Estimated Timeline

| Phase | Duration | Dates |
|-------|----------|-------|
| 1: Setup | 1 week | Jan 6-12 |
| 2: env-generate-from | 2 weeks | Jan 13-26 |
| 3: type-generate-from | 1-2 weeks | Jan 27-Feb 9 |
| 4: VS Code Extension | 1-2 weeks | Feb 10-23 |
| 5: Polish & Publishing | 1-2 weeks | Feb 24-Mar 9 |
| **Total** | **6-7 weeks** | **Jan 6 - Mar 9** |

---

## Notes

- Tasks can be parallelized where dependencies allow
- Regular testing throughout to catch issues early
- Get user feedback on CLI tool before building extension
- Consider early release of CLI tools separately from extension
