# Canonical Effect-TS Service Pattern

## File Organization Rules

### 1. Schema Classes - Central types.ts
All schema classes (data structures) must be declared in `src/types.ts`:
```typescript
// src/types.ts
export class ClassificationResult extends Schema.Class<ClassificationResult>("ClassificationResult")({
  modelName: Schema.String,
  classification: Schema.Union(Schema.Literal("transient"), Schema.Literal("long-term")),
  confidence: Schema.Number.pipe(Schema.clamp(0, 1))
}) {}

export enum ModelEnum {
  MODEL1 = "google/gemini-2.5-flash",
  MODEL2 = "deepseek/deepseek-chat-v3-0324"
}
```

### 2. Service Files - Contract + Live Co-location
Each service file contains Contract followed by Live implementation together:

```typescript
// src/services/MemoryClassification.ts
import { ClassificationResult, ModelEnum } from "../types";

// Service Contract
class MemoryClassificationContract extends Context.Tag("MemoryClassificationService")<
  MemoryClassificationContract,
  {
    readonly classify: (model: ModelEnum, content: string) => Effect.Effect<ClassificationResult, AiError.AiError, never>;
  }
>() {}

// Private implementation details (not exported)
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const ModelOutputSchema = Schema.Struct({...});
const getClassificationPrompt = (content: string) => `...`;

// Service Live Implementation  
const memoryClassificationLive = {
  classify: (model: ModelEnum, content: string) =>
    Effect.gen(function*() {
      // implementation
    })
};

// ONLY Export Contract/Instance - Everything else stays private
export const MemoryClassification = {
  Contract: MemoryClassificationContract,
  Instance: memoryClassificationLive
};
```

## Export Rules (CRITICAL)

**Service files are ONLY allowed to export:**
- `Contract` - The service interface
- `Instance` - The live implementation

**Everything else MUST stay private:**
- Helper functions
- Configuration constants  
- Internal schemas
- Layer definitions
- Utility functions

**Example of what NOT to export:**
```typescript
// ❌ WRONG - Do not export these
export const getModelLayer = ...;
export const ClientLayer = ...;
export const OPENROUTER_BASE_URL = ...;

// ✅ CORRECT - Only export Contract/Instance
export const MemoryClassification = {
  Contract: MemoryClassificationContract,
  Instance: memoryClassificationLive
};
```

## Canonical Effect-TS Service Pattern

### 1. Service Interface (Contract)
```typescript
class UserService extends Context.Tag("UserService")<
  UserService,
  {
    getUser: (id: string) => Effect.Effect<User, UserNotFoundError>;
    getFollowing: (id: string) => Effect.Effect<User[], UserNotFoundError>;
  }
>() {}
```

### 2. Implementation as Plain Object
```typescript
const fakeUserService = {
  getUser: (id: string) =>
    Effect.gen(function*() {
      // implementation directly here
    }),
  getFollowing: (id: string) =>
    Effect.gen(function*() {
      // implementation directly here
    })
};
```

### 3. Service Provision
```typescript
Effect.provideService(UserService, fakeUserService);
```

## Benefits Over Layer.effect Pattern

- **More testable** - Implementation is plain object
- **Easier to swap** - Just pass different objects
- **Clear separation** - Interface vs implementation distinct
- **No Layer complexity** - Simpler dependency injection
- **Better organization** - Contract and Instance grouped together
- **Encapsulation** - Internal details stay private to service file

## Usage Pattern

```typescript
// In application code
const service = yield * MemoryClassification.Contract;

// In dependency injection
Effect.provideService(MemoryClassification.Contract, MemoryClassification.Instance);

// In tests
Effect.provideService(MemoryClassification.Contract, mockInstance);
```

This is the canonical Effect-TS pattern based on official examples with proper encapsulation.