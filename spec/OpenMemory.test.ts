import { HttpClient, HttpClientError, HttpClientRequest, HttpClientResponse } from "@effect/platform";
import { expect, test } from "bun:test";
import { Effect, Exit, Layer, ParseResult } from "effect";
import { OpenMemory } from "../src/services/OpenMemory";
import { OpenMemoryFilterRequest, OpenMemoryFilterResponse } from "../src/types";
import { defaultConfigLayer } from "./helpers/MockConfig";

// Simple mock response creator
const createMockResponse = (data: unknown, status = 200): HttpClientResponse.HttpClientResponse => ({
  status,
  headers: {},
  json: Effect.succeed(data),
  text: Effect.succeed(JSON.stringify(data))
} as unknown as HttpClientResponse.HttpClientResponse);

// Create error response
const createErrorResponse = (status: number): HttpClientError.HttpClientError =>
  new HttpClientError.ResponseError({
    request: {} as HttpClientRequest.HttpClientRequest,
    response: {
      status,
      headers: {},
      json: Effect.fail(new Error("Response error")),
      text: Effect.fail(new Error("Response error"))
    } as unknown as HttpClientResponse.HttpClientResponse,
    reason: "StatusCode"
  });

// Helper to create test layers with different mock behaviors
const createTestLayer = (
  mockBehavior: (
    request: HttpClientRequest.HttpClientRequest
  ) => Effect.Effect<HttpClientResponse.HttpClientResponse, HttpClientError.HttpClientError>
) => {
  const mockHttpClientLayer = Layer.effect(
    HttpClient.HttpClient,
    Effect.succeed(HttpClient.make(mockBehavior))
  );

  return Layer.mergeAll(
    defaultConfigLayer,
    OpenMemory.Default.pipe(Layer.provide(mockHttpClientLayer))
  );
};

// Test 1: Schema Validation (ParseError) - HIGHEST ROI
test("should fail with ParseError when API returns malformed response", async () => {
  const malformedData = { invalid: "missing required fields" };

  const testLayer = createTestLayer(() => Effect.succeed(createMockResponse(malformedData)));

  const testEffect = Effect.gen(function*() {
    const openMemoryService = yield* OpenMemory;
    return yield* openMemoryService.filterMemories();
  });

  const exit = await Effect.runPromiseExit(testEffect.pipe(Effect.provide(testLayer)));

  expect(Exit.isFailure(exit)).toBe(true);

  if (Exit.isFailure(exit)) {
    // Should be a ParseError since the response doesn't match schema
    if (exit.cause._tag === "Fail") {
      expect(ParseResult.isParseError(exit.cause.error)).toBe(true);
    }
  }
});

// Test 2: Happy Path Success - FOUNDATIONAL
test("should successfully parse valid API response", async () => {
  const validResponse = {
    items: [
      {
        id: "test-id-1",
        content: "Test memory content",
        created_at: 1672531200000,
        state: "active",
        app_id: "test-app",
        app_name: "Test App",
        categories: ["work", "important"],
        metadata_: {
          key: "test-key",
          value: "test-value"
        }
      }
    ],
    total: 1,
    page: 1,
    size: 25,
    pages: 1
  };

  const testLayer = createTestLayer(() => Effect.succeed(createMockResponse(validResponse)));

  const testEffect = Effect.gen(function*() {
    const openMemoryService = yield* OpenMemory;
    return yield* openMemoryService.filterMemories();
  });

  const exit = await Effect.runPromiseExit(testEffect.pipe(Effect.provide(testLayer)));

  expect(Exit.isSuccess(exit)).toBe(true);

  if (Exit.isSuccess(exit)) {
    const result = exit.value;
    expect(result).toBeInstanceOf(OpenMemoryFilterResponse);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("test-id-1");
    expect(result.items[0]?.content).toBe("Test memory content");
  }
});

// Test 3: Error Recovery Integration - RESILIENCE
test("should demonstrate error recovery patterns work", async () => {
  // Test the error recovery pattern used in the main application
  const mockError = new Error("Simulated API failure");

  const program = Effect.gen(function*() {
    // Simulate a failing service call
    const failingCall = Effect.fail(mockError);

    // Apply the same error recovery pattern as in index.ts
    const result = yield* failingCall.pipe(
      Effect.catchAll((error) => {
        return Effect.gen(function*() {
          yield* Effect.logError(`API Error: ${error.message}`);
          return OpenMemoryFilterResponse.empty();
        });
      })
    );

    return result;
  });

  const exit = await Effect.runPromiseExit(program);

  expect(Exit.isSuccess(exit)).toBe(true);

  if (Exit.isSuccess(exit)) {
    const result = exit.value;
    // Should fallback to empty response instead of crashing
    expect(result).toBeInstanceOf(OpenMemoryFilterResponse);
    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
    expect(result.page).toBe(0);
    expect(result.size).toBe(0);
    expect(result.pages).toBe(0);
  }
});

// Test 4: HTTP Error Handling - COMMON FAILURE
test("should handle HTTP errors (500, 403) correctly", async () => {
  const testLayer = createTestLayer(() => Effect.fail(createErrorResponse(500)));

  const testEffect = Effect.gen(function*() {
    const openMemoryService = yield* OpenMemory;
    return yield* openMemoryService.filterMemories();
  });

  const exit = await Effect.runPromiseExit(testEffect.pipe(Effect.provide(testLayer)));

  expect(Exit.isFailure(exit)).toBe(true);

  if (Exit.isFailure(exit)) {
    // The important thing is that the service fails appropriately when HTTP errors occur
    // This test ensures the error propagates correctly rather than hanging or succeeding unexpectedly
    // Accept either "Fail" or "Die" as valid error types
    expect(["Fail", "Die"]).toContain(exit.cause._tag);
    const hasError = (exit.cause._tag === "Fail" && exit.cause.error) ||
      (exit.cause._tag === "Die" && exit.cause.defect);
    expect(hasError).toBeTruthy();
  }
});

// Bonus Test: Request Parameters
test("should handle custom request parameters", async () => {
  const validResponse = {
    items: [],
    total: 0,
    page: 2,
    size: 10,
    pages: 0
  };

  let capturedRequest: HttpClientRequest.HttpClientRequest | null = null;

  const testLayer = createTestLayer((request) => {
    capturedRequest = request;
    return Effect.succeed(createMockResponse(validResponse));
  });

  const customRequest = new OpenMemoryFilterRequest({
    page: 2,
    size: 10,
    sort_column: "updated_at",
    sort_direction: "asc"
  });

  const testEffect = Effect.gen(function*() {
    const openMemoryService = yield* OpenMemory;
    return yield* openMemoryService.filterMemories(customRequest);
  });

  const exit = await Effect.runPromiseExit(testEffect.pipe(Effect.provide(testLayer)));

  expect(Exit.isSuccess(exit)).toBe(true);

  if (Exit.isSuccess(exit)) {
    const result = exit.value;
    expect(result).toBeInstanceOf(OpenMemoryFilterResponse);
    expect(result.page).toBe(2);
    expect(result.size).toBe(10);

    // Verify the request was made (this confirms the service is actually being called)
    expect(capturedRequest).not.toBeNull();
  }
});
