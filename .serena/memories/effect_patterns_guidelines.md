# Effect-TS Patterns & Guidelines

## Core Patterns

### Program Structure

```typescript
const program = Effect.gen(function*() {
  // Use yield* for Effect operations
  const value = yield* SomeEffect;
  // Regular operations
  const result = processValue(value);
  // Return or yield final effect
  yield* Effect.log(result);
});
```

### Configuration Loading

```typescript
const host = yield * Config.string("HOST");
const port = yield * Config.number("PORT");
```

### Program Execution

```typescript
BunRuntime.runMain(program.pipe(Effect.provide(BunContext.layer)));
```

## Best Practices

### Error Handling

- Use Effect's built-in error handling
- Prefer type-safe errors over exceptions
- Use `Effect.tryPromise` for Promise integration

### Context Management

- Use `Effect.provide()` to supply context
- Layer composition for dependency injection
- BunContext.layer for Bun-specific services

### Imports

- Avoid barrel imports (enforced by ESLint)
- Import specific modules from Effect ecosystem
- Use @effect/platform-bun for Bun-specific APIs

### Side Effects

- Wrap all side effects in Effect
- Use appropriate Effect constructors (sync, async, promise)
- Defer execution until runtime

## Common Operations

- `Effect.log()` - Structured logging
- `Effect.gen()` - Generator-based composition
- `Config.*` - Configuration loading
- `BunRuntime.runMain()` - Main program execution
