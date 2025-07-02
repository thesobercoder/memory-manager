# Code Style & Conventions - Current Standards

## Formatting (dprint configuration)

- **Indent Width**: 2 spaces
- **Line Width**: 120 characters
- **Semicolons**: Always required (user preference override)
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
- Integrated dprint formatting rules with auto-fix
- **Enhanced format command**: `syncpack format && dprint fmt && eslint . --fix`

## Effect-TS Patterns (Current Standards)

### Schema Definitions
```typescript
export class ApiResponse extends Schema.Class<ApiResponse>("ApiResponse")({
  items: Schema.Array(Schema.Struct({ /* fields */ })),
  total: Schema.Number
}) {
  static empty() {
    return new ApiResponse({ items: [], total: 0 });
  }
}
```

### Service Pattern
```typescript
export class MyService extends Context.Tag("MyService")<
  MyService,
  { readonly method: () => Effect<Result, Error, never> }
>() {
  static Default = Layer.effect(MyService, Effect.gen(/* implementation */));
}
```

### Error Handling
```typescript
const result = yield* operation.pipe(
  Effect.catchTags({
    ParseError: (error) => Effect.gen(/* handle and log */),
    RequestError: (error) => Effect.gen(/* handle and log */)
  })
);
```

### Configuration
- Use `Config.redacted()` for sensitive data
- Use `Config.string()` / `Config.number()` for regular config
- Store credentials in environment variables

## File Organization

- **Main entry**: `src/index.ts`
- **Services**: `src/services/` directory
- **Types**: `src/types.ts` with Schema.Class definitions
- **Build output**: `dist/` (minified, Bun-targeted)
- **Configuration**: Project root

## Security Conventions

- Never log or expose `Config.redacted()` values
- Use bearer token authentication for APIs
- Comprehensive error handling to prevent information leakage
- Schema validation for all external data