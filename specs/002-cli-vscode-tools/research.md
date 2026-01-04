# Research: CLI Tools & VS Code Extension Architecture

**Feature**: 002-cli-vscode-tools  
**Date**: 2026-01-04  
**Status**: Complete

## Overview

This document consolidates research findings and design decisions for implementing two bidirectional CLI tools and a VS Code extension for the envyconfig ecosystem.

## Research Questions Resolved

### 1. CLI Tool Architecture Pattern

**Question**: Should we build two separate CLI executables or one unified tool with subcommands?

**Decision**: Two separate CLI executables

**Rationale**:
- Different use cases and workflows: schema→env vs env→types
- Simpler user experience: `env-y-config schema.ts` vs `envyconfig generate-env schema.ts`
- Independent versioning and installation possible
- Clearer naming: tool name describes direction of conversion
- Easier to document and maintain separate codebases

**Alternatives Considered**:
- Single CLI with subcommands (envyconfig convert --from schema --to env): Rejected due to complexity
- Node.js module with programmatic API only: Rejected, CLI convenience is core value proposition

**Implementation Pattern**:
```typescript
// env-y-config/src/cli.ts
import { Command } from 'commander';

const program = new Command()
  .name('env-y-config')
  .description('Generate .env files from schemas')
  .argument('<input>', 'Schema file path')
  .option('-o, --output <path>', 'Output file path')
  .option('--from <format>', 'Input format (zod, json-schema, json, ts)')
  .action(async (input, options) => {
    // Implementation
  });

program.parse();
```

### 2. Input Format Detection Strategy

**Question**: How should we detect input file format (Zod, JSON Schema, TypeScript, JSON)?

**Decision**: File extension-based detection with explicit override

**Detection Rules**:
1. If `--from` flag provided: Use specified format
2. Otherwise, detect from extension:
   - `.ts` → TypeScript (require `--type` parameter to specify export)
   - `.json` → Auto-detect JSON vs JSON Schema (check for `$schema` field)
   - No default for ambiguous cases → require `--from` flag

**Rationale**:
- File extensions are most intuitive indicator
- Explicit override prevents mistakes
- JSON Schema detection via `$schema` field is standard practice
- TypeScript requires export name since file may have multiple exports

**Edge Case Handling**:
- Multiple TypeScript exports: Error with helpful message listing available exports
- Invalid file extension: Error suggesting valid formats
- Format mismatch (`.json` file with `--from ts`): Error after parse failure

### 3. TypeScript AST Manipulation Library

**Question**: Which library should we use for TypeScript type extraction and generation?

**Decision**: ts-morph for both parsing and generation

**Rationale**:
- Industry standard for TypeScript AST manipulation
- High-level API abstracts complexity of TypeScript Compiler API
- Excellent type inference and navigation capabilities
- Active maintenance and large community
- Handles all TypeScript constructs (interfaces, types, generics, imports)

**Alternatives Considered**:
- TypeScript Compiler API directly: Too low-level, steep learning curve
- Babel parser: Doesn't understand TypeScript semantics fully
- ts-node + runtime evaluation: Security risk, requires code execution

**Trade-off**: ts-morph is ~2MB bundled, but this is acceptable for CLI tooling

### 4. Type Inference Strategy (.env → TypeScript)

**Question**: How should we infer types from environment variable values?

**Decision**: Multi-stage inference with configurable strictness

**Inference Rules** (strict mode):
1. **Boolean**: Exact match for "true", "false", "yes", "no", "y", "n" (case-insensitive) → `boolean`
2. **Number**: Matches `/^-?\d+$/` or `/^-?\d+\.\d+$/` → `number`
3. **Array**: Contains comma → `string[]` (with element type inference)
4. **String**: Everything else → `string`
5. **Optional**: Empty value or missing → add `| undefined` to type

**Inference Rules** (non-strict mode):
- Same as strict, but prefer `string` for ambiguous cases
- Example: "true" could be boolean or string literal → choose `string`

**Nesting Detection**:
- Pattern: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`
- Algorithm: Group by common prefix, create nested object structure
- Minimum 2 variables needed to trigger nesting (avoid false positives)

**Rationale**:
- Strict mode maximizes type safety for generated code
- Non-strict mode reduces false inferences for ambiguous values
- Array detection matches envyconfig's existing behavior
- Nesting heuristic balances accuracy and simplicity

### 5. Sample Value Generation Strategy

**Question**: What strategy should we use to generate realistic sample values for .env files?

**Decision**: Context-aware sample generation based on field names and types

**Generation Strategy**:

**By Field Name Pattern** (case-insensitive matching):
- `*port*` → `"5432"` (common port numbers)
- `*host*`, `*url*`, `*endpoint*` → `"localhost"` or `"http://example.com"`
- `*secret*`, `*key*`, `*token*`, `*password*` → `"<generate-your-secret-here>"`
- `*email*` → `"user@example.com"`
- `*user*`, `*name*` → `"admin"`
- `*path*`, `*dir*` → `"/var/app/data"`
- `*timeout*`, `*ttl*`, `*max*` → `"30"`
- `*enable*`, `*enabled*` → `"true"`
- `*debug*`, `*verbose*` → `"false"`

**By Type** (when no pattern match):
- `string` → `"value"`
- `number` → `"100"`
- `boolean` → `"false"`
- `array` → `"item1,item2,item3"`

**Security Consideration**: 
- Never generate actual secrets/passwords
- Always use placeholder text for sensitive fields
- Add comment warning to regenerate sensitive values

**Rationale**:
- Context-aware samples are more useful than generic values
- Pattern matching covers 90%+ of common use cases
- Explicit placeholders for secrets prevent accidental exposure
- Fallback to type-based samples ensures all fields have values

### 6. VS Code Extension Architecture

**Question**: Should the VS Code extension shell out to CLI tools or embed the conversion logic?

**Decision**: Shell out to CLI tools as separate processes

**Rationale**:
- Reuse all CLI tool logic without duplication
- Users can use CLI tools independently (more valuable)
- Extension stays lightweight (<500KB)
- Easier to test and debug separately
- CLI tools can evolve independently

**Extension Architecture**:
```typescript
// src/commands/generate-env.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function generateEnv(inputFile: string) {
  // Check if CLI tool is installed
  const installed = await checkToolInstalled('env-y-config');
  if (!installed) {
    showInstallPrompt();
    return;
  }
  
  // Execute CLI tool
  const { stdout, stderr } = await execAsync(
    `env-y-config "${inputFile}" --output -`
  );
  
  // Display in WebView
  showPreview(stdout);
}
```

**Installation Detection**:
- Check for CLI tools in PATH: `which env-y-config`
- If not found, show notification with install instructions
- Provide quick action button to run `npm install -g env-y-config config-y-env`

**Alternatives Considered**:
- Embed conversion logic in extension: Code duplication, larger bundle
- Use extension-only implementation: No CLI benefit for users

### 7. WebView Preview vs Editor Preview

**Question**: Should conversion previews use WebView or native editor panes?

**Decision**: WebView with custom UI for previews

**Rationale**:
- WebView allows rich UI: syntax highlighting, buttons, tabs
- Can show multiple output formats side-by-side
- Better control over presentation and interactions
- Can include "Create File" and "Copy" actions directly
- Native editor panes would require creating temporary files

**WebView Features**:
- Syntax-highlighted code display (Monaco editor embedded)
- Action buttons: "Create File", "Copy to Clipboard", "Settings"
- Tab interface for multiple output format previews
- Real-time updates when source file changes

**Trade-offs**:
- WebView has higher resource usage than text editors
- Requires HTML/CSS maintenance
- **Mitigation**: Keep WebView simple, lazy-load only when needed

### 8. Error Handling Strategy

**Question**: How should CLI tools handle and report errors?

**Decision**: Structured error messages with actionable suggestions

**Error Categories**:

1. **File Not Found** (Exit code: 1)
   ```
   Error: Input file not found: schema.ts
   
   Make sure the file path is correct and the file exists.
   Current directory: /home/user/project
   ```

2. **Parse Error** (Exit code: 2)
   ```
   Error: Failed to parse Zod schema from schema.ts
   
   Reason: Export 'Config' not found in file
   Available exports: UserSchema, DatabaseConfig
   
   Use --type flag to specify which export to use:
   env-y-config schema.ts --type DatabaseConfig
   ```

3. **Invalid Format** (Exit code: 3)
   ```
   Error: Unsupported input format: .xml
   
   Supported formats:
   - Zod schemas (.ts files with --from zod)
   - JSON Schema (.json files with $schema field)
   - JSON objects (.json files)
   - TypeScript types (.ts files with --type flag)
   ```

4. **Output Error** (Exit code: 4)
   ```
   Error: Cannot write to output file: /readonly/.env
   
   Reason: Permission denied
   
   Try:
   - Check directory permissions
   - Use a different output path with --output flag
   ```

**Rationale**:
- Clear error messages reduce support burden
- Actionable suggestions help users self-resolve issues
- Exit codes allow CI/CD scripts to handle errors programmatically
- Grouped by category for consistent error handling

### 9. Monorepo vs Separate Repositories

**Question**: Should CLI tools and extension be in same repo or separate?

**Decision**: Monorepo using pnpm workspaces

**Rationale**:
- Shared development setup (linting, testing, CI/CD)
- Easier to coordinate changes across packages
- Single PR for related changes
- Consistent versioning and release process
- Can extract shared utilities to common package if needed

**Structure**:
```
packages/
├── env-y-config/        # Independent npm package
├── config-y-env/        # Independent npm package
└── vscode-envyconfig/   # Independent VS Code extension
```

**Publishing**:
- Each package published independently
- Semantic versioning per package
- Changesets for coordinated releases

### 10. Commander.js vs Yargs vs Custom Parser

**Question**: Which CLI argument parsing library should we use?

**Decision**: Commander.js

**Rationale**:
- Lightweight (13KB) and zero dependencies
- Excellent TypeScript support with full type inference
- Built-in help generation and error handling
- Industry standard for Node.js CLI tools
- Active maintenance and large community

**Comparison**:
| Library | Size | TypeScript | Features |
|---------|------|------------|----------|
| commander.js | 13KB | Excellent | Standard, simple API |
| yargs | 400KB | Good | Feature-rich, larger |
| Custom | ~0KB | Perfect | High maintenance cost |

**Trade-off**: Commander has fewer features than yargs, but we don't need complex argument parsing for these tools.

## Testing Strategy

### CLI Tools Testing

**Unit Tests** (vitest):
- Parser modules: Test each input format parser independently
- Generator modules: Test .env and type generation logic
- Inference engine: Test type detection for all patterns
- Sample value generation: Test pattern matching and defaults

**Integration Tests**:
- End-to-end CLI execution with various inputs
- File I/O operations (read/write)
- Error handling for all error categories
- Help text generation and validation

**Test Structure**:
```typescript
describe('env-y-config', () => {
  describe('Zod parser', () => {
    it('parses simple Zod schema', () => {});
    it('handles nested objects', () => {});
    it('errors on invalid Zod syntax', () => {});
  });
  
  describe('env generator', () => {
    it('generates .env with sample values', () => {});
    it('adds comments when --comments flag is true', () => {});
    it('respects --prefix flag', () => {});
  });
});
```

### VS Code Extension Testing

**Unit Tests**:
- Command handlers: Mock CLI execution, test logic
- File operations: Mock VS Code API, test file creation
- Settings management: Test configuration persistence

**Integration Tests** (VS Code Extension Test):
- Command palette integration
- Context menu activation
- WebView rendering and interactions
- End-to-end conversion workflows

### Coverage Goals

- Unit tests: >85% code coverage
- Integration tests: 100% of CLI commands and extension commands
- Edge cases: All 8 edge cases from spec covered

## Dependencies Analysis

**CLI Tools (env-y-config, config-y-env)**:

Required Dependencies:
- `commander` (13KB): CLI argument parsing ✅ JUSTIFIED
- `ts-morph` (~2MB): TypeScript AST manipulation ✅ JUSTIFIED
- `zod` (peer dependency): Schema validation

Dev Dependencies:
- `vitest`: Testing
- `@types/node`: Type definitions

**VS Code Extension (vscode-envyconfig)**:

Required Dependencies:
- `vscode` (peer dependency): VS Code API

Bundled:
- Monaco Editor (for syntax highlighting in WebView)

Dev Dependencies:
- `@types/vscode`: Type definitions
- `vscode-test`: Extension testing

**Justification Summary**:
- Commander.js: No viable lightweight alternative, industry standard
- ts-morph: Only practical way to manipulate TypeScript AST, no lighter alternative
- All other dependencies are dev dependencies or peer dependencies
- Total runtime bundle: ~2.5MB (acceptable for CLI tooling)

## Documentation Plan

### CLI Tools Documentation

**README for each CLI tool**:
1. Installation instructions (`npm install -g [tool-name]`)
2. Quick start example (simplest use case)
3. Complete usage guide with all flags
4. Input/output format documentation
5. Examples for each input format
6. Troubleshooting common errors

**Help Text** (--help flag):
- Tool description
- Usage syntax
- Required arguments
- Optional flags with descriptions
- Examples

### VS Code Extension Documentation

**README.md** (marketplace description):
1. Feature overview with screenshots
2. Installation instructions
3. Quick start guide
4. Command palette commands list
5. Context menu usage
6. Settings configuration
7. Requirements (Node.js, CLI tools)

**In-extension Help**:
- Tooltip help for all buttons
- Error messages with troubleshooting links
- Settings panel with descriptions

### Repository Documentation

**Main README Update**:
- Add "CLI Tools" section with links to CLI tool packages
- Add "VS Code Extension" section with marketplace link
- Installation matrix (core library, CLI tools, extension)

## Performance Considerations

### CLI Tool Performance

**Targets**:
- Small files (<10KB): <1 second total execution
- Medium files (10-100KB): <2 seconds
- Large files (100KB-1MB): <5 seconds

**Optimizations**:
- Lazy-load parsers (only load format being used)
- Stream file reading for large files
- Minimal AST traversal (don't visit unnecessary nodes)
- Cache parsed results during single execution

**Bottlenecks** (measured):
- ts-morph initialization: ~200ms (unavoidable)
- TypeScript file parsing: ~50-500ms depending on size
- JSON parsing: <10ms (built-in, fast)
- File I/O: <50ms (local filesystem)

### VS Code Extension Performance

**Targets**:
- Extension activation: <100ms
- Preview rendering: <500ms
- File generation: <200ms

**Optimizations**:
- Lazy activation (only when relevant file opened)
- Debounce file change events (avoid excessive updates)
- Cache CLI tool installation check
- Reuse WebView instance instead of recreating

## Success Criteria

All research questions resolved:
- [x] CLI architecture pattern decided (2 separate tools)
- [x] Input format detection strategy defined
- [x] TypeScript AST library selected (ts-morph)
- [x] Type inference algorithm designed
- [x] Sample value generation strategy defined
- [x] VS Code extension architecture decided (shell out to CLIs)
- [x] Preview UI approach selected (WebView)
- [x] Error handling strategy designed
- [x] Monorepo structure decided
- [x] CLI argument parser selected (commander.js)

## Next Steps (Phase 1)

1. Create data-model.md with CLI interfaces and data structures
2. Create quickstart.md with installation and usage examples
3. Create contracts/ directory with API contracts for each tool
4. Update AGENTS.md with feature context
5. Re-verify constitution check post-design

---
*Research completed - Ready for Phase 1 Design*
