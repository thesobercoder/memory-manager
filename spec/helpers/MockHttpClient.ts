import { HttpClient, HttpClientError, HttpClientRequest, HttpClientResponse } from "@effect/platform";
import { Context, Effect, Layer, Ref } from "effect";

export interface MockHttpClientConfig {
  response?: unknown;
  status?: number;
  error?: HttpClientError.HttpClientError;
}

export class MockHttpClient extends Context.Tag("MockHttpClient")<
  MockHttpClient,
  {
    readonly setResponse: (config: MockHttpClientConfig) => Effect.Effect<void>;
    readonly getExecutedRequests: () => Effect.Effect<HttpClientRequest.HttpClientRequest[]>;
    readonly reset: () => Effect.Effect<void>;
  }
>() {
  static layer = Layer.effect(
    MockHttpClient,
    Effect.gen(function*() {
      const configRef = yield* Ref.make<MockHttpClientConfig>({});
      const requestsRef = yield* Ref.make<HttpClientRequest.HttpClientRequest[]>([]);

      const setResponse = (config: MockHttpClientConfig) => Ref.set(configRef, config);

      const getExecutedRequests = () => Ref.get(requestsRef);

      const reset = () =>
        Effect.all([
          Ref.set(configRef, {}),
          Ref.set(requestsRef, [])
        ]).pipe(Effect.asVoid);

      return { setResponse, getExecutedRequests, reset };
    })
  );

  static httpClientLayer = Layer.effect(
    HttpClient.HttpClient,
    Effect.gen(function*() {
      const configRef = yield* Ref.make<MockHttpClientConfig>({});
      const requestsRef = yield* Ref.make<HttpClientRequest.HttpClientRequest[]>([]);

      const execute = (request: HttpClientRequest.HttpClientRequest) =>
        Effect.gen(function*() {
          // Track executed requests
          yield* Ref.update(requestsRef, (requests) => [...requests, request]);

          // Get current config
          const mockConfig = yield* Ref.get(configRef);

          // Return configured error if set
          if (mockConfig.error) {
            return yield* Effect.fail(mockConfig.error);
          }

          // Return mock response
          const status = mockConfig.status ?? 200;
          const responseBody = mockConfig.response ?? { message: "Default mock response" };

          // Create a mock response
          const response = {
            status,
            headers: {},
            json: Effect.succeed(responseBody),
            text: Effect.succeed(JSON.stringify(responseBody))
          } as unknown as HttpClientResponse.HttpClientResponse;

          return response;
        });

      return HttpClient.make(execute);
    })
  );

  // Simplified static methods for easier testing
  static setResponseForTesting = (config: MockHttpClientConfig) =>
    Effect.gen(function*() {
      const mock = yield* MockHttpClient;
      yield* mock.setResponse(config);
    });
}

// Helper functions for common mock scenarios
export const mockSuccessResponse = (data: unknown, status = 200): MockHttpClientConfig => ({
  response: data,
  status
});

export const mockErrorResponse = (status: number): MockHttpClientConfig => ({
  error: new HttpClientError.ResponseError({
    request: {} as HttpClientRequest.HttpClientRequest,
    response: {
      status,
      headers: {},
      json: Effect.fail(new Error("Response error")),
      text: Effect.fail(new Error("Response error"))
    } as unknown as HttpClientResponse.HttpClientResponse,
    reason: "StatusCode"
  })
});

export const mockParseErrorResponse = (): MockHttpClientConfig => ({
  response: { invalid: "malformed data without required fields" },
  status: 200
});
