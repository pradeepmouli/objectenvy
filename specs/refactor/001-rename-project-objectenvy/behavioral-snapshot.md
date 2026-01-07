# Behavioral Snapshot — Refactor 001: Rename Project to ObjectEnvy

**Purpose**: Document expected inputs and outputs to verify behavior preservation after refactoring.
**Captured**: January 7, 2026

## Core Library Behavior (`src/`)

### `configEnvy(env, options)`

**Test Inputs & Expected Outputs**:

```typescript
// Input: Simple environment variables
const env = { FOO_BAR: '42', BAZ_QUX: 'hello' };
const result = configEnvy(env);
// Expected Output: { foo: { bar: 42 }, baz: { qux: 'hello' } }

// Input: With prefix
const env2 = { APP_FOO_BAR: '42', APP_BAZ: 'test' };
const result2 = configEnvy(env2, { prefix: 'APP_' });
// Expected Output: { foo: { bar: 42 }, baz: 'test' }

// Input: Array coercion (new feature)
const env3 = { ITEMS: 'apple,banana,orange' };
const result3 = configEnvy(env3);
// Expected Output: { items: ['apple', 'banana', 'orange'] }
```

### `toCamelCase(str)`

```typescript
toCamelCase('FOO_BAR') // => 'fooBar'
toCamelCase('foo_bar_baz') // => 'fooBarBaz'
toCamelCase('SINGLE') // => 'single'
```

### `toSnakeCase(str)`

```typescript
toSnakeCase('fooBar') // => 'FOO_BAR'
toSnakeCase('fooBarBaz') // => 'FOO_BAR_BAZ'
toSnakeCase('single') // => 'SINGLE'
```

### `coerceValue(value)`

```typescript
coerceValue('42') // => 42
coerceValue('3.14') // => 3.14
coerceValue('true') // => true
coerceValue('false') // => false
coerceValue('hello') // => 'hello'
coerceValue('1,2,3') // => [1, 2, 3]
coerceValue('a,b,c') // => ['a', 'b', 'c']
```

## CLI Behavior

### env-y-config (`packages/env-y-config/`)

**Command**: `env-y-config --version`
**Expected Output**: Version number (e.g., `1.0.0`)

**Command**: `env-y-config --help`
**Expected Output**: Help text containing:
- `env-y-config`
- `Generate .env files from schema definitions`
- Usage instructions
- Available options

**Command**: `env-y-config <input-file> [options]`
**Expected Behavior**:
- Reads schema file (Zod, JSON Schema, TypeScript, JSON)
- Generates .env file with appropriate format
- Includes comments from descriptions (if --comments)
- Supports --prefix, --include, --exclude, --required-only flags
- Lists exports with --list-exports for TypeScript files

### config-y-env (`packages/config-y-env/`)

**Command**: `config-y-env --version`
**Expected Output**: Version number (e.g., `1.0.0`)

**Command**: `config-y-env --help`
**Expected Output**: Help text containing:
- `config-y-env`
- `Generate TypeScript types and schemas from .env files`
- Usage instructions
- Available options

**Command**: `config-y-env <input-file> [options]`
**Expected Behavior**:
- Reads .env file
- Infers types from values (strict or loose mode)
- Generates TypeScript interface
- Optionally generates Zod schema (--zod-schema)
- Supports --prefix, --exclude flags
- Includes JSDoc comments (if --with-comments)

## VS Code Extension Behavior (`packages/vscode-envyconfig/`)

### Activation

**Trigger**: Opening workspace with TypeScript, JSON, or .env files
**Expected Behavior**:
- Extension activates successfully
- Output channel "EnvyConfig Tools" created
- Activation message logged
- Version logged

### Registered Commands

1. **`envyconfig.generateEnv`**
   - Command ID registered
   - Shows info message when executed

2. **`envyconfig.generateTypes`**
   - Command ID registered
   - Shows info message when executed

3. **`envyconfig.quickConvert`**
   - Command ID registered
   - Shows info message when executed

### Deactivation

**Expected Behavior**: Clean deactivation without errors

## Cross-Package Integration

### Import Behavior

**From Core Library**:
```typescript
import { configEnvy, toCamelCase, toSnakeCase } from '../../src/index.js';
// All imports resolve successfully
// Functions work as expected
```

### CLI Dependencies

**Expected**: Both CLIs successfully import and use core library functions
**Verification**: CLI tests pass with full functionality

### Extension Dependencies

**Expected**: VS Code extension can optionally import core library
**Verification**: Extension activates and registers commands

## Test Suite Behavior

### Total Tests: 160
- All tests pass (100% pass rate)
- No flaky tests
- No timeout issues
- Consistent execution time (~3s)

### Coverage Maintained

- Overall: >= 87%
- Core library: >= 89%
- Parsers/generators: >= 89%

## Build Behavior

**Expected**:
- Root package builds successfully
- All workspace packages build successfully
- No TypeScript errors
- No lint errors
- Output directories created with correct structure

## Performance Characteristics

- Test execution: ~3s
- Build time: <5s per package
- CLI startup: <500ms
- Extension activation: <200ms

---

**Validation Method**: After each refactoring phase, run:
1. `pnpm test run` - All 160 tests must pass
2. `pnpm build` - All packages must build
3. Manual CLI testing - Verify outputs match snapshot
4. Extension testing - Verify activation and commands work

**Acceptance Criteria**: Refactoring is successful when all behaviors documented above remain identical.
