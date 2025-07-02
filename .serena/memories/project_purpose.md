# Project Purpose - Current State

This is a production-ready Effect-TS application built with Bun runtime that integrates with the OpenMemory API. The project demonstrates advanced Effect-TS patterns including:

## Core Functionality

- **OpenMemory API Integration**: Full service for filtering and retrieving memories
- **Schema Validation**: Runtime type checking with Effect Schema.Class patterns
- **Comprehensive Error Handling**: Resilient error recovery for all API failure modes
- **Secure Configuration**: Uses redacted config for sensitive API tokens

## Architecture Features

- **Service Layer**: Context.Tag pattern with dependency injection
- **Type Safety**: Schema.Class definitions with static factory methods
- **Error Resilience**: Effect.catchTags for typed error handling
- **Structured Logging**: Comprehensive logging throughout request lifecycle
- **Production Builds**: Minified bundles with Bun optimization

## API Integration

- **Endpoint**: `https://api.openmemory.dev/api/v1/memories/filter`
- **Authentication**: Bearer token via `OPENMEMORY_BEARER_TOKEN` environment variable
- **Request/Response**: JSON with schema validation
- **Error Recovery**: Graceful fallbacks to empty responses

**Tech Stack:**

- **Runtime**: Bun (latest)
- **Framework**: Effect-TS (v3.16.10) with Schema validation
- **HTTP Client**: @effect/platform FetchHttpClient
- **Language**: TypeScript with strict mode
- **Platform**: @effect/platform-bun for Bun integration
- **Build**: Minified production bundles targeting Bun runtime

## Environment Requirements

```bash
OPENMEMORY_BEARER_TOKEN=your-api-token
```

The application represents a complete, enterprise-ready Effect-TS implementation with modern patterns, comprehensive error handling, and production-grade security.
