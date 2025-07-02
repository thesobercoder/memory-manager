# Available Commands - Updated

## Development Commands

- `bun run dev` - Run development server (src/index.ts)
- `bun run src/index.ts` - Alternative way to run the app
- `bun install` - Install dependencies

## Build & Production

- `bun run build` - Build for production (outputs to dist/, minified)
- `bun run start` - Build and run production version (dist/index.js)

## Code Quality

- `bun run lint` - Run ESLint
- `bun run format` - **UPDATED**: `syncpack format && dprint fmt && eslint . --fix`
  - Formats package.json dependencies
  - Formats TypeScript, JSON, and Markdown files
  - Auto-fixes ESLint issues
- `bun run typecheck` - TypeScript type checking with --noEmit

## Testing

- `bun test` - Run tests (when test files are added)

## Environment Requirements

Create `.env` file with:

```bash
OPENMEMORY_BEARER_TOKEN=your-token-here
```

## System Commands (macOS)

- `git` - Version control
- `ls` - List files
- `cd` - Change directory
- `grep` - Search text
- `find` - Find files
- `pbcopy/pbpaste` - Clipboard operations (macOS specific)

## Build Output

- Development: Runs directly with Bun
- Production: Minified bundle in `dist/index.js` (target: bun)
