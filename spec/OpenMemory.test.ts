import { HttpClientError } from "@effect/platform";
import { expect } from "bun:test";
import { Effect, Layer, ParseResult } from "effect";
import { OpenMemory } from "../src/services/OpenMemory";
import { OpenMemoryFilterRequest, OpenMemoryFilterResponse } from "../src/types";

// Import our idiomatic Effect testing utilities
import { mockEncodingErrorLayer, mockErrorLayer, mockNetworkErrorLayer, mockSuccessLayer } from "./support/mock-http";
import { customPageResponse, malformedResponse, validSuccessResponse } from "./support/test-data";
import { it } from "./support/test-utils";

// =============================================================================
// IDIOMATIC EFFECT-TS TESTING WITH BUN
// =============================================================================

// Test 1: Schema Validation (ParseError) - HIGHEST ROI
it.effectFail(
  "should fail with ParseError when API returns malformed response",
  () =>
    Effect.gen(function*() {
      const openMemory = yield* OpenMemory;
      yield* openMemory.filterMemories();
    }),
  mockSuccessLayer(malformedResponse),
  (error) => {
    expect(ParseResult.isParseError(error)).toBe(true);
  }
);

// Test 2: Happy Path Success - FOUNDATIONAL
it.effect(
  "should successfully parse valid API response",
  () =>
    Effect.gen(function*() {
      const openMemory = yield* OpenMemory;
      const result = yield* openMemory.filterMemories();

      expect(result).toBeInstanceOf(OpenMemoryFilterResponse);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.id).toBe("test-id-1");
      expect(result.items[0]?.content).toBe("Test memory content");
    }),
  mockSuccessLayer(validSuccessResponse)
);

// Test 3: Error Recovery Integration - RESILIENCE
it.effectWith(
  "should demonstrate error recovery patterns work",
  () =>
    Effect.gen(function*() {
      const failingCall = Effect.fail(new Error("Simulated API failure"));

      const result = yield* failingCall.pipe(
        Effect.catchAll(() => Effect.succeed(OpenMemoryFilterResponse.empty()))
      );

      expect(result).toBeInstanceOf(OpenMemoryFilterResponse);
      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    }),
  () => Layer.empty // No services needed for this test
);

// Test 4: HTTP Error Handling - SERVER ERRORS
it.effectFail(
  "should handle HTTP errors (500) correctly",
  () =>
    Effect.gen(function*() {
      const openMemory = yield* OpenMemory;
      yield* openMemory.filterMemories();
    }),
  mockErrorLayer(500),
  (error) => {
    expect(HttpClientError.isHttpClientError(error)).toBe(true);
    const httpError = error as { _tag: string; response: { status: number; }; };
    expect(httpError._tag).toBe("ResponseError");
    expect(httpError.response.status).toBe(500);
  }
);

// Test 5: RequestError Handling - NETWORK FAILURES
it.effectFail(
  "should handle RequestError (network timeouts, DNS failures)",
  () =>
    Effect.gen(function*() {
      const openMemory = yield* OpenMemory;
      yield* openMemory.filterMemories();
    }),
  mockNetworkErrorLayer(),
  (error) => {
    expect(HttpClientError.isHttpClientError(error)).toBe(true);
    const networkError = error as { _tag: string; };
    expect(networkError._tag).toBe("RequestError");
  }
);

// Test 6: Encoding Error Handling - BODY PROCESSING FAILURES
it.effectFail(
  "should handle encoding errors (body processing failures)",
  () =>
    Effect.gen(function*() {
      const openMemory = yield* OpenMemory;
      yield* openMemory.filterMemories();
    }),
  mockEncodingErrorLayer(),
  (error) => {
    expect(HttpClientError.isHttpClientError(error)).toBe(true);
    const encodingError = error as { _tag: string; };
    expect(encodingError._tag).toBe("RequestError");
  }
);

// Test 7: Authentication Error - 401/403 RESPONSES
it.effectFail(
  "should handle authentication errors (401/403)",
  () =>
    Effect.gen(function*() {
      const openMemory = yield* OpenMemory;
      yield* openMemory.filterMemories();
    }),
  mockErrorLayer(401),
  (error) => {
    expect(HttpClientError.isHttpClientError(error)).toBe(true);
    const authError = error as { _tag: string; response: { status: number; }; };
    expect(authError._tag).toBe("ResponseError");
    expect(authError.response.status).toBe(401);
  }
);

// Test 8: Rate Limiting Error - 429 RESPONSES
it.effectFail(
  "should handle rate limiting errors (429)",
  () =>
    Effect.gen(function*() {
      const openMemory = yield* OpenMemory;
      yield* openMemory.filterMemories();
    }),
  mockErrorLayer(429),
  (error) => {
    expect(HttpClientError.isHttpClientError(error)).toBe(true);
    const rateLimitError = error as { _tag: string; response: { status: number; }; };
    expect(rateLimitError._tag).toBe("ResponseError");
    expect(rateLimitError.response.status).toBe(429);
  }
);

// Test 9: Request Parameters - CUSTOM PARAMETER HANDLING
it.effect(
  "should handle custom request parameters",
  () =>
    Effect.gen(function*() {
      const customRequest = new OpenMemoryFilterRequest({
        page: 2,
        size: 10,
        sort_column: "updated_at",
        sort_direction: "asc"
      });

      const openMemory = yield* OpenMemory;
      const result = yield* openMemory.filterMemories(customRequest);

      expect(result).toBeInstanceOf(OpenMemoryFilterResponse);
      expect(result.page).toBe(2);
      expect(result.size).toBe(10);
    }),
  mockSuccessLayer(customPageResponse)
);
