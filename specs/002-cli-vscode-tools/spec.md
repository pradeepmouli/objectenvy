# Feature Specification: CLI Tools & VS Code Extension for envyconfig

**Feature Branch**: `002-cli-vscode-tools`  
**Created**: January 3, 2026  
**Status**: Draft  
**Input**: CLI tools (env-y-config and config-y-env) and VS Code extension for envyconfig

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Generates .env Files from Schema (Priority: P1)

A developer has a TypeScript application with a Zod schema defining required environment variables. They need to quickly generate sample `.env` files for different environments (development, testing, production) with realistic default values. Currently they manually create these files, which is error-prone and doesn't evolve with the schema.

**Why this priority**: Generating `.env` files from schemas is the foundational capability that enables developers to maintain schema-driven configuration. This is a frequent task in development workflows and provides immediate value by reducing manual work.

**Independent Test**: Can be fully tested by providing a Zod schema file, running the `env-y-config` command, and verifying the generated `.env` file contains all schema fields with valid sample values. Delivers value by eliminating manual `.env` creation.

**Acceptance Scenarios**:

1. **Given** a valid Zod schema file with database and API configuration fields, **When** running `env-y-config schema.ts -o .env.sample`, **Then** the output file contains all fields as environment variables with appropriate sample values
2. **Given** a JSON Schema input file, **When** specifying `--from json-schema`, **Then** the tool correctly parses the schema and generates matching output
3. **Given** multiple input formats (Zod, JSON Schema, JSON, TypeScript), **When** running the tool with each format, **Then** the output is consistent regardless of input format
4. **Given** optional command flags like `--prefix`, `--include`, or `--exclude`, **When** using these flags, **Then** the output respects the specified constraints
5. **Given** a schema with nested objects, **When** generating an `.env` file, **Then** nested fields are flattened to environment variable naming conventions (e.g., `DATABASE_HOST`, `DATABASE_PORT`)

---

### User Story 2 - Developer Generates TypeScript Types from .env Files (Priority: P1)

A developer has existing `.env` files and wants to generate TypeScript type definitions that match the actual environment variables in use. They also want the generated types to be compatible with envyconfig's type validation. Currently they manually maintain these types, which causes mismatches between `.env` and code.

**Why this priority**: Type-safe environment configuration is equally important as schema-to-env generation. This enables developers to use TypeScript's type system to prevent configuration errors, which is a core value proposition of envyconfig.

**Independent Test**: Can be fully tested by providing an `.env` file, running the `config-y-env` command, and verifying generated TypeScript interfaces match the structure and values in the `.env` file with correct type inference. Delivers value by making environment configuration type-safe.

**Acceptance Scenarios**:

1. **Given** a `.env` file with various value types (strings, numbers, booleans, comma-separated lists), **When** running `config-y-env .env -o types.ts`, **Then** the generated TypeScript interface correctly infers types (boolean, number, string, string[])
2. **Given** empty environment variables in the `.env` file, **When** generating types, **Then** fields are typed as `string | undefined` to reflect optionality
3. **Given** comma-separated values in a `.env` file, **When** generating types in strict mode, **Then** these are typed as `string[]`
4. **Given** multiple output format options (TypeScript, JSON Schema, JavaScript object, Zod), **When** specifying different `--to` formats, **Then** the tool generates appropriate output for each format
5. **Given** the `--zod-schema` flag, **When** generating types, **Then** both TypeScript types and a Zod validation schema are generated

---

### User Story 3 - Developer Integrates CLI Tools via VS Code Extension (Priority: P2)

A developer wants to use the CLI tools without leaving their editor. They need convenient access to conversion commands, real-time preview of results, and ability to generate/update files directly from VS Code. They find command-line usage tedious when working in the editor.

**Why this priority**: The VS Code extension dramatically improves developer experience by integrating tools into the editor workflow. While the CLI tools are fully functional (P1), the extension is a UX enhancement for the primary user base of editor-based developers.

**Independent Test**: Can be fully tested by installing the extension, using command palette to access conversion commands, previewing conversions in a WebView panel, and generating files into the workspace. Delivers value by improving workflow efficiency and discoverability.

**Acceptance Scenarios**:

1. **Given** a TypeScript schema file is open in the editor, **When** right-clicking and selecting "Generate .env from Schema", **Then** a quick-pick dialog appears for format selection and a preview panel shows the generated `.env` content
2. **Given** a `.env` file is open, **When** using the command palette to run "Generate Types from .env", **Then** output format options are presented and selected format is generated
3. **Given** a conversion preview is displayed in a WebView panel, **When** user clicks "Create File", **Then** a new file is created in the workspace with the converted content
4. **Given** the extension is installed, **When** opening any supported file type, **Then** relevant context menu options appear for available conversions
5. **Given** a conversion is previewed, **When** clicking "Copy to Clipboard", **Then** the generated content is copied and user can paste into editor or external tools

---

### User Story 4 - Team Maintains Consistent Environment Configuration (Priority: P2)

A team manages multiple microservices with environment configuration for different deployment environments. They need a way to ensure `.env` files and type definitions are always in sync with the source schema, preventing configuration drift. When schemas change, they want automatic propagation to all generated artifacts.

**Why this priority**: Configuration consistency across teams and services is important for operational reliability, but it depends on P1 stories being fully functional first. This scenario addresses the workflow optimization beyond basic functionality.

**Independent Test**: Can be tested by setting up a schema, generating all output formats, modifying the schema, regenerating outputs, and verifying all artifacts are updated. Demonstrates value through configuration drift prevention.

**Acceptance Scenarios**:

1. **Given** a shared schema definition in a monorepo, **When** developers run the generation tools, **Then** all generated files across services are consistent with the schema
2. **Given** schema changes are committed, **When** CI/CD pipeline regenerates `.env` and type files, **Then** git diff shows expected changes and no manual updates are needed
3. **Given** team guidelines specify which environments need which fields, **When** using `--include` and `--exclude` flags, **Then** environment-specific `.env` files can be generated from a single schema

---

### Edge Cases

- What happens when a `.env` file has environment variables that don't match any naming convention?
- How does the system handle cyclic references in nested schema definitions?
- What occurs when a schema field lacks type information or description?
- How are array values with special characters (commas, quotes) handled in `.env` files?
- What happens when TypeScript types use complex generics that can't be represented as environment variables?
- How does the tool behave when output file path already exists?
- What error handling occurs for invalid schema files or malformed `.env` syntax?
- How are very large `.env` files handled (1000+ variables)?


## Requirements *(mandatory)*

### Functional Requirements

#### env-y-config CLI Tool

- **FR-001**: Tool MUST accept input file path as the first positional argument
- **FR-002**: Tool MUST support four input formats: Zod schemas, JSON Schema, JSON objects, and TypeScript types
- **FR-003**: Tool MUST auto-detect input format from file extension when `--from` flag is not specified
- **FR-004**: Tool MUST require `--type` parameter when input format is TypeScript to specify which export to use
- **FR-005**: Tool MUST generate realistic sample values for each field type (e.g., "localhost" for host strings, "5432" for database ports)
- **FR-006**: Tool MUST flatten nested object structures into environment variable naming conventions (e.g., `database.host` becomes `DATABASE_HOST`)
- **FR-007**: Tool MUST support `--prefix` flag to add a consistent prefix to all generated environment variables
- **FR-008**: Tool MUST support `--include` flag to specify which fields to include (comma-separated)
- **FR-009**: Tool MUST support `--exclude` flag to specify which fields to skip
- **FR-010**: Tool MUST support `--output` or `-o` flag to specify the output file path
- **FR-011**: Tool MUST include field descriptions as comments in the generated `.env` file when `--comments` flag is true (default)
- **FR-012**: Tool MUST support `--required-only` flag to generate only required fields when applicable
- **FR-013**: Tool MUST write output as `.env` format with one variable per line as `KEY=value`
- **FR-014**: Tool MUST validate that output path is writable before attempting file generation
- **FR-015**: Tool MUST provide helpful error messages for invalid input files or unsupported formats

#### config-y-env CLI Tool

- **FR-016**: Tool MUST accept a `.env` file path as the first positional argument
- **FR-017**: Tool MUST parse `.env` files following the standard format (key=value, one per line, with comment support)
- **FR-018**: Tool MUST infer TypeScript types from environment variable values with configurable strictness
- **FR-019**: Tool MUST support four output formats: TypeScript types, JSON Schema, JavaScript objects, and Zod validators
- **FR-020**: Tool MUST default to TypeScript type generation when `--to` flag is not specified
- **FR-021**: Tool MUST detect boolean values (true/false) and type them as `boolean`
- **FR-022**: Tool MUST detect numeric values and type them as `number`
- **FR-023**: Tool MUST detect comma-separated values and type them as `string[]`
- **FR-024**: Tool MUST detect nested field patterns (e.g., `DATABASE_HOST`, `DATABASE_PORT`) and create nested object structures
- **FR-025**: Tool MUST support `--to` flag to specify output format (ts, json-schema, object, zod)
- **FR-026**: Tool MUST support `--interface-name` flag to customize the exported interface name (default: "Config")
- **FR-027**: Tool MUST support `--prefix` flag to filter variables by prefix
- **FR-028**: Tool MUST support `--exclude` flag to exclude specific fields from output
- **FR-029**: Tool MUST support `--strict` flag to control type inference mode (default: true)
- **FR-030**: Tool MUST support `--zod-schema` flag to also generate a Zod validation schema alongside TypeScript types
- **FR-031**: Tool MUST include JSDoc comments for generated TypeScript types when `--with-comments` flag is true (default)
- **FR-032**: Tool MUST generate valid, properly formatted output for all supported formats

#### VS Code Extension

- **FR-033**: Extension MUST register three commands: "Generate .env from Schema", "Generate Types from .env", and "Quick Convert"
- **FR-034**: Extension MUST provide context menu options on `.env` files for type generation commands
- **FR-035**: Extension MUST provide context menu options on schema files (TypeScript, JSON) for `.env` generation commands
- **FR-036**: Extension MUST display a WebView panel with real-time preview of conversion results
- **FR-037**: Extension MUST provide quick-pick UI for selecting input/output formats
- **FR-038**: Extension MUST include a "Create File" button in the preview panel to generate output files in the workspace
- **FR-039**: Extension MUST include a "Copy to Clipboard" button to copy converted content without file generation
- **FR-040**: Extension MUST include a "Settings" panel for configuring prefix, field inclusion/exclusion, and inference strictness
- **FR-041**: Extension MUST validate that both CLI tools are installed and functional before attempting conversions
- **FR-042**: Extension MUST display helpful error messages when conversions fail, with suggestions for resolution
- **FR-043**: Extension MUST log all operations to "EnvyConfig Tools" output channel

### Key Entities

- **Schema**: A definition of environment configuration structure, can be Zod, JSON Schema, TypeScript type, or JSON object
- **Environment Variable**: A key-value pair with string key and string value, representing configuration in `.env` format
- **Type Definition**: A TypeScript interface, JSON Schema object, JavaScript object literal, or Zod schema representing environment structure
- **Conversion**: The process of transforming between schemas, environment variables, and type definitions
- **Inference**: The process of determining types from environment variable values based on naming patterns and value analysis


## Success Criteria *(mandatory)*

### Measurable Outcomes

#### CLI Tool Success

- **SC-001**: Both CLI tools can be installed via npm and invoked from command line without errors
- **SC-002**: env-y-config generates valid `.env` files from all four input formats (Zod, JSON Schema, JSON, TypeScript) within 1 second
- **SC-003**: config-y-env generates TypeScript types that successfully validate when imported in TypeScript projects with >90% type inference accuracy
- **SC-004**: Type inference distinguishes between string, number, boolean, and array types correctly in >95% of test cases
- **SC-005**: Generated output files are properly formatted and readable (correct line breaks, no encoding issues)
- **SC-006**: Command help text (`--help`) is clear and describes all available options with usage examples
- **SC-007**: Error messages clearly explain what went wrong and suggest corrective actions (not technical stack traces)
- **SC-008**: Both tools work with files up to 10,000 lines without performance degradation or memory issues
- **SC-009**: Unit tests cover all major code paths with >85% code coverage

#### VS Code Extension Success

- **SC-010**: Extension loads successfully on VS Code startup without errors or warnings
- **SC-011**: Command palette commands ("Generate .env from Schema", etc.) are discoverable and appear in search results
- **SC-012**: Context menu options appear on correct file types (`.env` for env commands, schema files for generation commands)
- **SC-013**: WebView preview panel displays conversion results within 500ms of user selection
- **SC-014**: "Create File" button generates new workspace files without data loss or corruption
- **SC-015**: "Copy to Clipboard" button copies complete, unmodified conversion output
- **SC-016**: Extension handles missing or invalid files gracefully with informative error messages
- **SC-017**: Settings panel allows configuration changes that persist across extension reloads

#### User Experience Success

- **SC-018**: Developers can generate their first `.env` file from a schema within 3 minutes of tool installation
- **SC-019**: Developers can generate TypeScript types from an existing `.env` file without consulting documentation
- **SC-020**: The complete workflow from schema definition to type-safe code takes <5 minutes for typical use cases
- **SC-021**: Error messages are understandable to developers without deep knowledge of the tools
- **SC-022**: Documentation with examples is available for all commands and options

---

## Assumptions

- All input files are valid and well-formed (Zod schemas execute without errors, JSON/JSON Schema are parseable, TypeScript compiles)
- Environment variable naming follows standard conventions (uppercase, underscores for nesting)
- `.env` files follow standard dotenv format (one variable per line, `KEY=value`)
- Users have Node.js 16+ and appropriate permissions to read input files and write output files
- VS Code extension runs on VS Code 1.85.0 or later
- Sample values generated for string types are safe (no sensitive data like credentials)
- Type inference defaults to conservative behavior (preferring string type when ambiguous)
- Circular references in schema definitions are not expected but should be handled gracefully
- File I/O operations have proper error handling and don't leave partial files on failure

---

## Next Steps

This specification is ready for:

1. **Quality Review**: Validate against the specification quality checklist
2. **Clarification**: Address any clarification needs with stakeholders
3. **Planning**: Create detailed task breakdown and implementation timeline
4. **Implementation**: Follow established implementation guide to begin development

