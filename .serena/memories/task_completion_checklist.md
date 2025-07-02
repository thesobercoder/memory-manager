# Task Completion Checklist - Current State

When completing any coding task, run these commands in order:

## 1. Formatting & Linting (Combined)

```bash
bun run format
```

**Updated command now includes:**
- `syncpack format` - Formats package.json dependencies
- `dprint fmt` - Formats TypeScript, JSON, and Markdown files  
- `eslint . --fix` - Auto-fixes ESLint issues

## 2. Manual Linting Check

```bash
bun run lint
```

- Runs ESLint with Effect-TS specific rules
- Checks for code quality issues
- Use after format command to verify no remaining issues

## 3. Type Checking

```bash
bun run typecheck
```

**Available via dedicated script:**
- `tsc --noEmit --skipLibCheck --project .`
- IDE integration with @effect/language-service plugin
- Build process also validates types

## 4. Testing

```bash
bun test
```

- Use when test files are added (*.test.ts, *.spec.ts)
- Bun has built-in test runner

## 5. Build Verification

```bash
bun run build
```

- Creates minified bundle in `dist/index.js`
- Targets Bun runtime with optimizations
- Verifies production build works

## 6. Development Testing

```bash
bun run dev
```

- Runs application directly from source
- Quick verification that app starts and works

## Environment Requirements

**Current application requires:**
```bash
OPENMEMORY_BEARER_TOKEN=your-api-token
```

## Quality Standards

- ✅ Schema validation ensures runtime type safety
- ✅ Comprehensive error handling prevents crashes  
- ✅ All code must pass format, lint, and typecheck
- ✅ Production builds must complete successfully
- ✅ Development runs must start without errors