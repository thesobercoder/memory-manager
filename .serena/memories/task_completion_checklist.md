# Task Completion Checklist - Current State

When completing any coding task, run these commands in order:

## 1. Testing

```bash
bun test
```

- **NEW**: Run unit tests to verify functionality
- 5 critical tests covering schema validation, happy path, error recovery, HTTP errors
- Tests use mocks for fast execution
- Must pass before proceeding to other quality checks

## 2. Formatting & Linting (Combined)

```bash
bun run format
```

**Updated command now includes:**

- `syncpack format` - Formats package.json dependencies
- `dprint fmt` - Formats TypeScript, JSON, and Markdown files
- `eslint . --fix` - Auto-fixes ESLint issues

## 3. Manual Linting Check

```bash
bun run lint
```

- Runs ESLint with Effect-TS specific rules
- Checks for code quality issues
- Use after format command to verify no remaining issues

## 4. Type Checking

```bash
bun run typecheck
```

**Available via dedicated script:**

- `tsc --noEmit --skipLibCheck --project .`
- IDE integration with @effect/language-service plugin
- Build process also validates types

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

- ✅ **Unit tests must pass** - All 5 critical tests validate core functionality
- ✅ Schema validation ensures runtime type safety
- ✅ Comprehensive error handling prevents crashes
- ✅ All code must pass format, lint, and typecheck
- ✅ Production builds must complete successfully
- ✅ Development runs must start without errors

## Test Coverage

Our **4+1 critical tests** provide maximum ROI:

1. **Schema Validation (ParseError)** - Catches API contract changes ⭐⭐⭐⭐⭐
2. **Happy Path Success** - Validates core functionality ⭐⭐⭐⭐
3. **Error Recovery** - Tests resilience patterns ⭐⭐⭐⭐
4. **HTTP Error Handling** - Common failure scenarios ⭐⭐⭐
5. **Request Parameters** - Custom parameter handling ⭐⭐
