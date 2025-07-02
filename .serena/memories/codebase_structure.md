# Codebase Structure - Updated

## Root Directory

- `src/` - Source code directory  
- `dist/` - Build output (generated)
- `node_modules/` - Dependencies (generated)

## Key Files

- `src/index.ts` - Main application entry point
- `package.json` - Project configuration and dependencies
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration
- `dprint.json` - Code formatting configuration
- `CLAUDE.md` - Project-specific AI assistant instructions
- `README.md` - Basic project documentation

## Source Code (`src/`)

Current structure:
- `index.ts` - Main program with Effect-TS setup and OpenMemory integration
- `types.ts` - Schema.Class definitions for OpenMemory API types
- `services/` - Service layer directory
  - `OpenMemory.ts` - OpenMemory API service implementation

## Configuration Files

- **TypeScript**: Modern ESNext target with strict mode
- **ESLint**: Effect-TS plugin with custom rules  
- **dprint**: Code formatter with 2-space indentation
- **Bun**: Runtime and package manager configuration

## Dependencies

### Runtime Dependencies

- `effect` - Core Effect-TS library (v3.16.10)
- `@effect/platform` - Platform abstractions (v0.87.1)
- `@effect/platform-bun` - Bun-specific platform implementation (v0.72.3)

### Development Dependencies

- `@effect/eslint-plugin` - Effect-TS linting rules (v0.3.2)
- `@effect/language-service` - TypeScript language service plugin (v0.23.3)
- `dprint` - Code formatter (v0.50.1)
- `syncpack` - Package.json dependency management (v13.0.4)
- `eslint` + `typescript-eslint` - Modern ESLint setup
- `@types/bun` - Bun type definitions

## Architecture Pattern

- Functional programming with Effect-TS
- Schema-based type definitions using `Schema.Class`
- Service layer with Context.Tag pattern
- Configuration via environment variables
- Platform-agnostic design with Bun-specific runtime layer
- Comprehensive error handling with Effect catchTags