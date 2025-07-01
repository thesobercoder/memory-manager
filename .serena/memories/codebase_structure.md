# Codebase Structure

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

Currently contains only:

- `index.ts` - Main program with Effect-TS setup

## Configuration Files

- **TypeScript**: Modern ESNext target with strict mode
- **ESLint**: Effect-TS plugin with custom rules
- **dprint**: Code formatter with 2-space indentation
- **Bun**: Runtime and package manager configuration

## Dependencies

### Runtime Dependencies

- `effect` - Core Effect-TS library
- `@effect/platform` - Platform abstractions
- `@effect/platform-bun` - Bun-specific platform implementation

### Development Dependencies

- `@effect/eslint-plugin` - Effect-TS linting rules
- `@effect/language-service` - TypeScript language service plugin
- `dprint` - Code formatter
- `syncpack` - Package.json dependency management

## Architecture Pattern

- Functional programming with Effect-TS
- Configuration via environment variables
- Platform-agnostic design with Bun-specific runtime layer
