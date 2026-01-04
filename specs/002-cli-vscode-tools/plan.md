# Implementation Plan: CLI Tools & VS Code Extension

**Branch**: `002-cli-vscode-tools` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-cli-vscode-tools/spec.md`

**Note**: This plan documents the design and implementation approach for bidirectional CLI tools and VS Code extension to convert between schemas, .env files, and TypeScript types.

## Summary

Develop two command-line tools (`env-y-config` and `config-y-env`) and a VS Code extension to provide bidirectional conversion between environment variable definitions and TypeScript types/schemas. The `env-y-config` tool converts schema definitions (Zod, JSON Schema, JSON, TypeScript) to sample `.env` files with realistic values. The `config-y-env` tool converts `.env` files to TypeScript types, JSON Schema, JavaScript objects, or Zod validators with smart type inference. The VS Code extension integrates both tools into the editor with WebView previews, command palette commands, and context menu integration for seamless developer workflow.

## Technical Context

**Language/Version**: TypeScript 5.9+ with strict mode, Node.js 20.0+ runtime
**Primary Dependencies**: 
  - Core library: envyconfig (existing codebase)
  - CLI framework: commander.js for argument parsing
  - Schema parsing: Zod 4.3.4+ (peer dependency), ts-morph for TypeScript AST manipulation
  - VS Code: vscode extension API 1.85.0+
**Storage**: File system I/O for reading/writing .env files and generated outputs
**Testing**: Vitest 4.0+ for unit tests, integration tests for CLI tools, VS Code extension testing framework
**Target Platform**: 
  - CLI tools: Cross-platform Node.js executables (Linux, macOS, Windows)
  - VS Code extension: VS Code 1.85.0+ on all supported platforms
**Project Type**: Multi-package project (2 CLI tools + 1 VS Code extension)
**Performance Goals**: 
  - CLI tool execution: <1 second for typical schemas/env files (<10KB)
  - Type inference: >95% accuracy for standard patterns
  - VS Code extension: Preview rendering <500ms, startup overhead <100ms
**Constraints**: 
  - CLI tools must work standalone (no VS Code dependency)
  - Zero runtime dependencies for core library (Zod peer dependency only)
  - VS Code extension bundle size <2MB
  - Must handle files up to 10,000 lines without performance degradation
**Scale/Scope**: Large feature with 3 deliverables:
  - env-y-config CLI (15 functional requirements)
  - config-y-env CLI (17 functional requirements)
  - VS Code extension (11 functional requirements)
  - Total: 43 functional requirements, 22 success criteria

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with envyconfig Constitution v1.1.0 principles:

- [x] **Type Safety First**: All new APIs designed with explicit types, no `any`
  - CLI tool modules will use strict TypeScript with explicit types
  - Schema parsers and type generators have full type safety
  - VS Code extension uses typed VS Code API
- [x] **Test-Driven Public APIs**: Test plan documented before implementation
  - Unit tests for all CLI command handlers, parsers, and generators
  - Integration tests for end-to-end CLI workflows
  - VS Code extension tests for commands and WebView interactions
  - Success criteria define >85% code coverage
- [x] **Code Quality Standards**: Linting/formatting rules identified for new code
  - Use existing oxlint and oxfmt configurations
  - Commander.js provides standardized CLI patterns
  - VS Code extension follows extension development best practices
- [x] **Semantic Versioning**: Breaking changes documented, version bump planned
  - **MINOR version bump** (0.2.0 → 0.3.0) - new features, no breaking changes to core library
  - CLI tools are new packages, start at 1.0.0
  - VS Code extension starts at 1.0.0
  - Core envyconfig API unchanged
- [x] **Documentation Discipline**: JSDoc requirements identified for new public APIs
  - CLI tools have comprehensive --help text and README
  - VS Code extension has marketplace description and usage guide
  - Public API functions have JSDoc comments
  - README updated with CLI tool installation and usage
- [x] **Modern TypeScript Patterns**: ES2022+ features used, no legacy patterns
  - async/await for file I/O operations
  - ES modules for all packages
  - Modern Node.js file system APIs
- [ ] **Zero-Runtime Dependencies**: No new runtime dependencies introduced (peer deps only if justified)
  - ⚠️ **DEVIATION**: CLI tools require commander.js (13KB) and ts-morph (~2MB) as dependencies
  - **JUSTIFICATION**: 
    - commander.js: Industry standard for CLI argument parsing, provides help generation, error handling
    - ts-morph: Required for TypeScript AST manipulation, no lightweight alternative for full type extraction
    - VS Code extension: Requires VS Code API (peer dependency)
  - **MITIGATION**: Dependencies scoped to CLI packages only, core envyconfig remains zero-dependency

## Project Structure

### Documentation (this feature)

```text
specs/002-cli-vscode-tools/
├── spec.md                    # Feature specification (existing)
├── SPECIFICATION_SUMMARY.md   # Spec summary (existing)
├── plan.md                    # This file (implementation plan)
├── research.md                # Phase 0 output - design decisions
├── data-model.md              # Phase 1 output - CLI/extension data structures
├── quickstart.md              # Phase 1 output - CLI and extension usage guide
├── contracts/                 # Phase 1 output - API contracts
│   ├── env-y-config-cli.md   # CLI tool interface contract
│   ├── config-y-env-cli.md   # CLI tool interface contract
│   └── vscode-extension.md   # Extension API contract
└── checklists/                # Existing directory
```

### Source Code (repository root)

```text
packages/
├── env-y-config/              # CLI tool: schema → .env
│   ├── src/
│   │   ├── cli.ts             # Command-line interface entry point
│   │   ├── parsers/           # Input format parsers (Zod, JSON Schema, etc.)
│   │   │   ├── zod.ts
│   │   │   ├── json-schema.ts
│   │   │   ├── typescript.ts
│   │   │   └── json.ts
│   │   ├── generators/        # .env file generators
│   │   │   ├── env-writer.ts
│   │   │   └── sample-values.ts
│   │   └── utils/             # Shared utilities
│   ├── tests/
│   │   ├── unit/              # Unit tests for parsers/generators
│   │   └── integration/       # End-to-end CLI tests
│   ├── package.json
│   └── README.md
│
├── config-y-env/              # CLI tool: .env → types
│   ├── src/
│   │   ├── cli.ts             # Command-line interface entry point
│   │   ├── parsers/           # .env file parser
│   │   │   └── env-parser.ts
│   │   ├── inference/         # Type inference engine
│   │   │   ├── type-detector.ts
│   │   │   └── nesting-analyzer.ts
│   │   ├── generators/        # Output format generators
│   │   │   ├── typescript.ts
│   │   │   ├── json-schema.ts
│   │   │   ├── javascript.ts
│   │   │   └── zod.ts
│   │   └── utils/             # Shared utilities
│   ├── tests/
│   │   ├── unit/              # Unit tests for inference/generators
│   │   └── integration/       # End-to-end CLI tests
│   ├── package.json
│   └── README.md
│
└── vscode-envyconfig/         # VS Code extension
    ├── src/
    │   ├── extension.ts       # Extension entry point
    │   ├── commands/          # Command handlers
    │   │   ├── generate-env.ts
    │   │   ├── generate-types.ts
    │   │   └── quick-convert.ts
    │   ├── webview/           # WebView UI components
    │   │   ├── preview-panel.ts
    │   │   └── webview-content.ts
    │   ├── utils/             # Extension utilities
    │   │   ├── cli-executor.ts
    │   │   └── file-manager.ts
    │   └── types/             # Extension type definitions
    ├── media/                 # WebView assets (CSS, icons)
    ├── tests/                 # Extension tests
    ├── package.json           # VS Code extension manifest
    └── README.md
```

**Structure Decision**: Multi-package monorepo using pnpm workspaces. Three separate packages:
1. **env-y-config** - Standalone CLI tool for schema → .env conversion
2. **config-y-env** - Standalone CLI tool for .env → types conversion
3. **vscode-envyconfig** - VS Code extension that wraps both CLI tools

Each package has independent versioning and can be published separately to npm/VS Code marketplace. Shared utilities may be extracted to a common package if needed during implementation.

## Complexity Tracking

> **Constitution principle deviation justified below**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Zero-Runtime Dependencies (commander.js, ts-morph) | CLI tools require robust argument parsing and TypeScript AST manipulation | Building custom CLI parser would be 500+ lines, error-prone, and miss edge cases. ts-morph is the de-facto standard for TypeScript AST work with no lightweight alternative |
| Multiple new packages (3 packages vs 1) | CLI tools and VS Code extension are distinct deliverables with different lifecycles and distribution channels | Bundling all into core library would bloat package size, couple unrelated concerns, and make independent versioning impossible |

**Risk Mitigation**:
- Dependencies are dev dependencies for bundled CLI executables
- VS Code extension bundles dependencies (not runtime deps for users)
- Core envyconfig library remains zero-dependency
- Total added bundle size: ~2.5MB (acceptable for CLI/extension tooling)

## Phase 0: Research & Design Decisions

**Status**: ✅ Complete

**Duration**: 1 day

**Output**: [research.md](./research.md)

### Research Questions Resolved

1. **CLI Architecture**: Two separate executables vs unified tool with subcommands
2. **Input Format Detection**: File extension-based with explicit override
3. **TypeScript AST Library**: ts-morph selected (industry standard)
4. **Type Inference Strategy**: Multi-stage with strict/loose modes
5. **Sample Value Generation**: Context-aware based on field name patterns
6. **VS Code Extension Architecture**: Shell out to CLI tools (reuse logic)
7. **WebView vs Editor Preview**: WebView with custom UI for rich interactions
8. **Error Handling**: Structured messages with actionable suggestions
9. **Monorepo vs Separate Repos**: Monorepo using pnpm workspaces
10. **CLI Argument Parser**: Commander.js (lightweight, TypeScript-friendly)

### Key Decisions

- **Two CLI executables** for clarity: `env-y-config` and `config-y-env`
- **ts-morph library** (~2MB) justified for TypeScript AST manipulation
- **Context-aware sample values** based on field name patterns (e.g., `*port*` → `"5432"`)
- **VS Code extension shells out** to CLI tools (avoid code duplication)
- **WebView preview** with Monaco editor for syntax highlighting
- **Structured error messages** with exit codes and suggestions
- **Commander.js** for CLI parsing (13KB, industry standard)

### Alternatives Considered

- Single CLI with subcommands: Rejected due to complexity
- Custom CLI parser: Rejected (500+ lines, error-prone)
- TypeScript Compiler API directly: Rejected (too low-level)
- Embed conversion logic in extension: Rejected (code duplication)
- Native editor panes for preview: Rejected (less flexible than WebView)

## Phase 1: Design & Contracts

**Status**: ✅ Complete

**Duration**: 1 day

**Outputs**:
- [data-model.md](./data-model.md) - TypeScript type definitions and data structures (530 lines)
- [quickstart.md](./quickstart.md) - Installation and usage guide (565 lines)
- [contracts/](./contracts/) - API contracts for 3 tools (28.8 KB total)
- [AGENTS.md](../../AGENTS.md) - Updated with feature context

### Deliverables

#### 1. Data Model (data-model.md)

Comprehensive type definitions including:
- **20+ TypeScript interfaces**: SchemaField, ParsedSchema, EnvVariable, NestedStructure, ConversionRequest, etc.
- **Type inference rules**: Boolean, number, array, nesting detection with patterns
- **Sample value generation rules**: 8 priority-based pattern matchers
- **Data flow diagrams**: env-y-config, config-y-env, VS Code extension flows
- **Error handling structures**: ErrorCategory, DetailedError, ConversionError
- **Performance metrics**: ConversionMetrics with target times

#### 2. Quick Start Guide (quickstart.md)

User-facing documentation covering:
- Installation for CLI tools and VS Code extension
- Basic usage examples for both CLI tools
- Advanced options (prefix, include/exclude, inference modes)
- VS Code extension usage (commands, context menu, WebView)
- 5 common workflows (new project, migration, team collaboration, evolution, VS Code)
- Type inference examples with all detection patterns
- Troubleshooting guide (8 common issues)
- Best practices (version control, secret management, CI/CD)

#### 3. API Contracts (contracts/)

Three comprehensive contract specifications:

**env-y-config-cli.md** (7.9 KB):
- Complete command line interface
- All flags and options documented
- 5 exit codes defined
- 4 input formats specified (Zod, JSON Schema, TypeScript, JSON)
- .env output format with naming conventions
- Sample value generation rules
- Error messages with examples
- Performance targets

**config-y-env-cli.md** (9.9 KB):
- Complete command line interface
- Type inference rules (boolean, number, array, nesting)
- 4 output formats (TypeScript, JSON Schema, JavaScript, Zod)
- Inference mode comparison (strict vs loose)
- .env parsing rules
- Error messages with examples
- Programmatic API interface

**vscode-extension.md** (10.9 KB):
- 3 commands specification
- WebView panel layout and features
- Context menu integration
- Extension settings with defaults
- Output channel logging
- Notifications and keyboard shortcuts
- CLI tool detection and installation prompts
- Performance targets

#### 4. Agent Context Update

Updated `AGENTS.md` with:
- Commander.js added to Active Technologies
- ts-morph added to Active Technologies
- VS Code Extension API 1.85.0+ added
- Feature 002 documented in Recent Changes

### Constitution Re-Check (Post-Design)

All constitution principles verified and confirmed:

- ✅ **Type Safety First**: All types explicit, comprehensive interfaces defined
- ✅ **Test-Driven Public APIs**: Testing strategy documented in research.md
- ✅ **Code Quality Standards**: Follows existing linting/formatting rules
- ✅ **Semantic Versioning**: MINOR bump for CLI tools (1.0.0), extension (1.0.0)
- ✅ **Documentation Discipline**: JSDoc in contracts, comprehensive quick start guide
- ✅ **Modern TypeScript Patterns**: ES2022+ features, async/await, modern patterns
- ⚠️ **Zero-Runtime Dependencies**: Justified deviation (commander.js + ts-morph for CLI tooling)

**Gate Status**: ✅ PASSED - 6/7 principles satisfied, 1 justified deviation, ready for task breakdown

## Phase 2: Task Breakdown

**Status**: 📋 Ready for `/speckit.tasks` command

**Note**: Phase 2 is not part of the `/speckit.plan` command. Run `/speckit.tasks` to generate detailed implementation tasks.

### Expected Task Categories

Based on the design, tasks will include:

**Package: env-y-config**
1. **CLI Setup** (5-10 tasks)
   - Initialize package structure
   - Set up commander.js CLI
   - Implement help text generation
   - Add version flag
   - Create main entry point

2. **Input Parsers** (20-30 tasks)
   - Zod schema parser
   - JSON Schema parser
   - TypeScript interface parser (ts-morph)
   - JSON object parser
   - Format detection logic
   - Export listing for TypeScript files

3. **Sample Value Generators** (10-15 tasks)
   - Pattern matching rules
   - Context-aware value generation
   - Type-based fallback values
   - Secret field detection
   - Custom value rules

4. **.env Generator** (10-15 tasks)
   - Env entry formatter
   - Comment generation
   - Flattening logic for nested objects
   - Naming convention converter
   - File writer with error handling

5. **Testing** (30-40 tasks)
   - Unit tests for each parser
   - Unit tests for generators
   - Integration tests for CLI
   - Edge case tests
   - Error handling tests

**Package: config-y-env**
1. **CLI Setup** (5-10 tasks)
   - Similar to env-y-config

2. **.env Parser** (10-15 tasks)
   - Dotenv format parser
   - Comment handling
   - Quote handling
   - Empty value detection
   - Error reporting

3. **Type Inference Engine** (20-30 tasks)
   - Boolean detection rules
   - Number detection rules
   - Array detection rules
   - Nesting detection algorithm
   - Strict vs loose mode implementation
   - Optional field detection

4. **Output Generators** (25-35 tasks)
   - TypeScript interface generator
   - JSON Schema generator
   - JavaScript object generator
   - Zod schema generator
   - JSDoc comment generation
   - Format-specific formatting

5. **Testing** (30-40 tasks)
   - Similar structure to env-y-config

**Package: vscode-envyconfig**
1. **Extension Setup** (10-15 tasks)
   - Extension initialization
   - Activation events
   - Extension manifest
   - Package.json configuration
   - Icon and branding assets

2. **Commands** (15-20 tasks)
   - Generate .env command
   - Generate types command
   - Quick convert command
   - Open settings command
   - Command registration and handlers

3. **WebView Panel** (20-30 tasks)
   - WebView HTML/CSS
   - Monaco editor integration
   - Format tabs implementation
   - Action buttons (create, copy, settings)
   - Loading and error states
   - Real-time preview updates

4. **CLI Integration** (10-15 tasks)
   - CLI executor service
   - Tool detection logic
   - Installation prompts
   - Version checking
   - Output parsing

5. **Context Menu** (5-10 tasks)
   - Schema file context menu
   - .env file context menu
   - Menu item registration
   - File type detection

6. **Settings** (5-10 tasks)
   - Settings definition
   - Settings UI
   - Default values
   - Persistence logic

7. **Testing** (20-30 tasks)
   - Command tests
   - WebView tests
   - Integration tests
   - Extension activation tests

**Total Estimated Tasks**: 250-350 tasks across 3 packages

## Summary

### What Was Accomplished

This implementation plan provides a complete blueprint for building CLI tools and VS Code extension:

1. **Technical Foundation**: Documented project context, technology stack, constraints, and multi-package structure
2. **Constitution Compliance**: Verified alignment with 6/7 principles, justified 1 deviation for CLI dependencies
3. **Research Phase**: Resolved 10 key research questions with documented decisions and alternatives
4. **Design Phase**: Created comprehensive data model (530 lines), quick start guide (565 lines), and 3 API contracts (28.8 KB)
5. **Agent Context**: Updated AGENTS.md with feature information

### Key Artifacts

| Artifact | Purpose | Status | Size |
|----------|---------|--------|------|
| [plan.md](./plan.md) | Implementation plan (this file) | ✅ Complete | 500+ lines |
| [research.md](./research.md) | Design decisions and rationale | ✅ Complete | 513 lines |
| [data-model.md](./data-model.md) | Type definitions and structures | ✅ Complete | 530 lines |
| [quickstart.md](./quickstart.md) | User guide and examples | ✅ Complete | 565 lines |
| [contracts/env-y-config-cli.md](./contracts/env-y-config-cli.md) | CLI tool API contract | ✅ Complete | 7.9 KB |
| [contracts/config-y-env-cli.md](./contracts/config-y-env-cli.md) | CLI tool API contract | ✅ Complete | 9.9 KB |
| [contracts/vscode-extension.md](./contracts/vscode-extension.md) | Extension API contract | ✅ Complete | 10.9 KB |
| [AGENTS.md](../../AGENTS.md) | AI agent context | ✅ Updated | - |
| tasks.md | Implementation task breakdown | 📋 Pending `/speckit.tasks` | - |

### Design Highlights

1. **Multi-Package Monorepo**: 3 independent packages with clear separation of concerns
2. **Bidirectional Conversion**: Schema ⇄ .env ⇄ TypeScript types
3. **Smart Type Inference**: Multi-stage inference with configurable strictness
4. **Context-Aware Samples**: Field name pattern matching for realistic values
5. **Rich VS Code Integration**: WebView previews, command palette, context menus
6. **Comprehensive Error Handling**: Structured errors with exit codes and suggestions
7. **Performance Optimized**: <1s CLI execution, <500ms preview rendering
8. **Zero Breaking Changes**: Core envyconfig library unchanged

### Implementation Readiness

✅ **Ready for Task Breakdown** - All prerequisites satisfied:
- Technical context documented
- Constitution compliance verified (6/7 principles)
- Research questions resolved (10 decisions)
- Design complete with data models, contracts, and user guide
- No unknowns or blockers remaining
- Performance targets defined
- Error handling strategy documented

### Next Steps

1. Run `/speckit.tasks` to generate detailed task breakdown
2. Begin implementation following task order
3. Start with package setup and CLI infrastructure
4. Implement parsers and generators incrementally
5. Add comprehensive tests alongside implementation
6. Build VS Code extension after CLI tools are functional
7. Conduct final review before release

### Estimated Implementation Effort

Based on the scope defined in this plan:

**Package: env-y-config**
- CLI setup: 1-2 days
- Input parsers: 5-7 days
- Generators: 3-4 days
- Testing: 3-5 days
- **Subtotal**: 12-18 days

**Package: config-y-env**
- CLI setup: 1-2 days
- Parser: 2-3 days
- Type inference: 5-7 days
- Generators: 4-6 days
- Testing: 3-5 days
- **Subtotal**: 15-23 days

**Package: vscode-envyconfig**
- Extension setup: 2-3 days
- Commands: 3-4 days
- WebView panel: 5-7 days
- CLI integration: 2-3 days
- Testing: 3-4 days
- **Subtotal**: 15-21 days

**Total**: 42-62 days of focused development time (roughly 2-3 months with one developer)

### Success Criteria

The implementation will be considered successful when:

- [x] All research questions resolved with documented decisions
- [x] Complete data model with 20+ type definitions
- [x] User documentation (quick start guide) complete
- [x] API contracts for all 3 tools documented
- [x] Constitution principles verified (6/7 passing, 1 justified)
- [ ] All tasks from Phase 2 completed
- [ ] CLI tools functional with all flags working
- [ ] VS Code extension published to marketplace
- [ ] All tests passing (>85% coverage)
- [ ] Documentation complete (README, API reference)
- [ ] Performance targets met (<1s CLI, <500ms preview)

---

**Plan Status**: ✅ Complete (Phases 0-1)  
**Branch**: `002-cli-vscode-tools`  
**Date**: 2026-01-04  
**Next Command**: `/speckit.tasks` to generate implementation tasks
