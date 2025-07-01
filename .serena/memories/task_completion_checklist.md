# Task Completion Checklist

When completing any coding task, run these commands in order:

## 1. Formatting

```bash
bun run format
```

This runs:

- `syncpack format` - Formats package.json dependencies
- `dprint fmt` - Formats TypeScript, JSON, and Markdown files

## 2. Linting

```bash
bun run lint
```

- Runs ESLint with Effect-TS specific rules
- Check for code quality issues
- Use `bun run lint:fix` for auto-fixable issues

## 3. Type Checking

TypeScript type checking is built into the development workflow via:

- IDE integration with @effect/language-service plugin
- Build process validates types

## 4. Testing

- Currently no test framework configured
- Use `bun test` when tests are added

## 5. Build Verification (Optional)

```bash
bun run build
```

- Verifies the application builds successfully
- Creates minified bundle in `dist/`

## Notes

- No explicit test runner currently configured
- Effect-TS provides runtime type safety
- Always ensure environment variables (HOST, PORT) are properly configured
