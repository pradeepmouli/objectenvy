# Installation

## Prerequisites

- Node.js **20 or later**
- TypeScript **5.0+** (recommended)
- Zod **4.x** (optional, only if using schema validation)

## Install

```bash
npm install objectenvy
```

```bash
pnpm add objectenvy
```

```bash
yarn add objectenvy
```

## Verify

```typescript
import { objectify } from 'objectenvy';

process.env.APP_PORT = '3000';
process.env.APP_DEBUG = 'true';

const config = objectify({ env: process.env, prefix: 'APP' });
console.log(config); // { port: 3000, debug: true }
```
