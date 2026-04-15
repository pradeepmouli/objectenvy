---
layout: home
hero:
  name: objectenvy
  text: Strongly-typed environment config for TypeScript
  tagline: Automatically map process.env entries to strongly-typed config objects with camelCase fields and nested structures.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/pradeepmouli/objectenvy
features:
  - title: Schema-Guided Nesting
    details: When a Zod schema is provided, the output structure follows the schema exactly.
  - title: Smart Nesting
    details: Without a schema, automatically nests when multiple entries share a prefix — single entries stay flat.
  - title: Type Coercion
    details: Automatically converts strings to numbers and booleans.
  - title: Prefix Filtering
    details: Only load variables with a specific prefix (e.g., `APP_`).
  - title: Zod Validation
    details: Optional schema validation with full TypeScript type inference.
  - title: Type Utilities
    details: ToEnv, FromEnv, WithPrefix for type-level transformations.
---
