# Getting Started

> **⚠️ Pre-1.0 software** — APIs are subject to change between minor versions. Pin to exact versions in production.

objectenvy automatically maps `process.env` entries to strongly-typed config objects with camelCase fields and nested structures.

## Install

```bash
npm install objectenvy
```

## Quick example

```typescript
import { objectify } from 'objectenvy';

// Given:
// PORT_NUMBER=3000
// LOG_LEVEL=debug
// LOG_PATH=/var/log

const result = objectify({ env: process.env });
// {
//   portNumber: 3000,
//   log: { level: 'debug', path: '/var/log' }
// }
```

## Next steps

- [Installation](./installation.md)
- [Usage](./usage.md)
- [API Reference](../api/)
