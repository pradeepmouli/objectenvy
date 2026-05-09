---
  "objectenvy": minor
---

- feat: `transform` option — post-parse hook; overloads now infer the widened return type (`TOut`) when transform adds fields not in the schema
- feat: `defaults` factory — context-aware fallback env values; empty strings (when `coerce: true`) now correctly fall through to defaults
- feat: `safeObjectify` — non-throwing variant returning a discriminated union; supports `TOut` widening overload
- feat: `defaultNonNestingPrefixes` — exported constant for the built-in prefix blocklist
- fix: empty strings treated as absent before the defaults merge when `coerce: true`
- fix: `objectEnvy` factory no longer caches results when `transform` or `defaults` are present (per-call function overrides previously collided)
- fix: vscode extension tsconfig updated to `module: node16` + `moduleResolution: node16` with `"type": "module"` (was invalid `module: commonjs` + `moduleResolution: bundler`)
- refactor: removed dead `parseEnvKeyToPath` export from utils
