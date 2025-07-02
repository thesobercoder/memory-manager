# Effect-TS Patterns & Guidelines - Current Standards

## Core Patterns

### Program Structure

```typescript
const program = Effect.gen(function*() {
  // Use yield* for Effect operations
  const service = yield* ServiceTag;
  // Call service methods
  const result = yield* service.method();
  // Handle with catchTags for comprehensive error handling
  const safeResult = yield* result.pipe(
    Effect.catchTags({
      ParseError: (error) => Effect.gen(function*() {
        yield* Effect.logError(`Parse Error: ${error.message}`);
        return EmptyResponse.empty();
      })
    })
  );
});
```

### Schema-Based Types (Current Standard)

```typescript
export class ApiResponse extends Schema.Class<ApiResponse>("ApiResponse")({
  items: Schema.Array(Schema.Struct({ /* fields */ })),
  total: Schema.Number,
  page: Schema.Number
}) {
  static empty() {
    return new ApiResponse({ items: [], total: 0, page: 0 });
  }
}
```

### Service Pattern (Context.Tag)

```typescript
export class MyService extends Context.Tag("MyService")<
  MyService,
  { readonly method: () => Effect<Result, Error, never> }
>() {
  static Default = Layer.effect(
    MyService,
    Effect.gen(function*() {
      const httpClient = yield* HttpClient.HttpClient;
      const config = yield* Config.redacted("TOKEN");
      
      const method = () => Effect.gen(function*() {
        // Implementation
      });
      
      return { method };
    })
  );
}
```

### Configuration Loading

```typescript
// For sensitive data
const token = yield* Config.redacted("BEARER_TOKEN");
// For regular config  
const host = yield* Config.string("HOST");
const port = yield* Config.number("PORT");
```

### Layer Composition (Current Pattern)

```typescript
const AppLayer = Layer.mergeAll(
  BunContext.layer,
  MyService.Default.pipe(Layer.provide(FetchHttpClient.layer))
);

program.pipe(Effect.provide(AppLayer), BunRuntime.runMain);
```

## Error Handling Patterns

### Comprehensive Error Handling

```typescript
const result = yield* apiCall.pipe(
  Effect.catchTags({
    HttpBodyError: (error) => Effect.gen(function*() {
      yield* Effect.logError(`Body Error: ${error.reason}`);
      return DefaultResponse.empty();
    }),
    RequestError: (error) => Effect.gen(function*() {
      yield* Effect.logError(`Request Error: ${error.reason}`);
      return DefaultResponse.empty();
    }),
    ResponseError: (error) => Effect.gen(function*() {
      yield* Effect.logError(`Response Error: ${error.reason}`);
      return DefaultResponse.empty();
    }),
    ParseError: (error) => Effect.gen(function*() {
      yield* Effect.logError(`Parse Error: ${error.message}`);
      return DefaultResponse.empty();
    })
  })
);
```

## Security Best Practices

### Token Management
- Use `Config.redacted()` for sensitive credentials
- Store tokens in environment variables
- Never log or expose redacted values

### HTTP Requests
```typescript
const request = HttpClientRequest.post(url).pipe(
  HttpClientRequest.bearerToken(bearerToken), // Secure token handling
  HttpClientRequest.acceptJson,
  HttpClientRequest.setHeader("Content-Type", "application/json"),
  HttpClientRequest.bodyJson(data)
);
```

## Import Best Practices

- Avoid barrel imports (enforced by ESLint)
- Import specific modules from Effect ecosystem
- Use @effect/platform-bun for Bun-specific APIs

## Common Operations

- `Effect.log()` / `Effect.logError()` - Structured logging
- `Effect.gen()` - Generator-based composition  
- `Config.redacted()` / `Config.string()` - Secure configuration
- `BunRuntime.runMain()` - Main program execution
- `Schema.Class` - Runtime type validation
- `Effect.catchTags()` - Typed error handling