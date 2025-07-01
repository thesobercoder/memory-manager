# Code Style & Conventions

## Formatting (dprint configuration)

- **Indent Width**: 2 spaces
- **Line Width**: 120 characters
- **Semicolons**: Always required
- **Quotes**: Always use double quotes
- **Trailing Commas**: Never
- **Operator Position**: Maintain current position
- **Arrow Functions**: Always use parentheses around parameters

## TypeScript Configuration

- **Target**: ESNext
- **Module**: Preserve (modern bundler mode)
- **Strict Mode**: Enabled
- **No Unchecked Indexed Access**: Enabled
- **No Fallthrough Cases**: Enabled
- **Skip Lib Check**: Enabled

## ESLint Rules

- Uses @effect/eslint-plugin for Effect-TS specific rules
- No imports from barrel packages (`@effect/no-import-from-barrel-package`)
- Integrated dprint formatting rules

## Effect-TS Patterns

- Use `Effect.gen` for sequential operations
- Use `yield*` for Effect operations
- Provide context layers with `Effect.provide()`
- Use BunRuntime.runMain() for main program execution

## File Organization

- Main entry point: `src/index.ts`
- Build output: `dist/`
- Configuration files in project root
