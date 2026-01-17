# ObjectEnvy Tools for VS Code

Convert between schemas, .env files, and TypeScript types with real-time preview.

## Features

- **Generate .env from Schema**: Convert TypeScript types, JSON, or JSON Schema into .env template files
- **Generate Types from .env**: Infer TypeScript types from your .env files with smart type detection
- **Quick Convert**: Fast conversion with keyboard shortcuts
- **Real-time Preview**: See generated output before saving
- **Context Menu Integration**: Right-click on files in the explorer for quick access

## Usage

### Generate .env from Object (envy)

1. Right-click on a TypeScript or JSON file in the Explorer
2. Select "ObjectEnvy: Generate .env from Object (envy)"
3. Choose output location and options
4. Preview and save

### Generate Types from .env (objectify)

1. Right-click on a .env file in the Explorer
2. Select "ObjectEnvy: Generate Types from .env (objectify)"
3. Choose output format (TypeScript, Zod, JSON Schema)
4. Preview and save

### Commands

- `ObjectEnvy: Generate .env from Object (envy)` - Convert objects/types to .env template
- `ObjectEnvy: Generate Types from .env (objectify)` - Generate TypeScript types from .env
- `ObjectEnvy: Quick Convert` - Quick conversion with smart defaults

## Configuration

Configure ObjectEnvy in VS Code settings:

```json
{
  "objectenvy.prefix": "",
  "objectenvy.strict": true,
  "objectenvy.includeComments": true,
  "objectenvy.interfaceName": "Config"
}
```

## Requirements

- VS Code 1.85.0 or higher
- TypeScript files require TypeScript workspace

## License

MIT

## More Information

- [GitHub Repository](https://github.com/pradeepmouli/objectenvy)
- [Documentation](https://github.com/pradeepmouli/objectenvy#readme)
- [Report Issues](https://github.com/pradeepmouli/objectenvy/issues)
