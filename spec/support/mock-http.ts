import { HttpClient, HttpClientError, HttpClientRequest, HttpClientResponse } from "@effect/platform";
import { Effect, Layer } from "effect";

// Create mock response with proper typing
const createMockResponse = (data: unknown, status = 200): HttpClientResponse.HttpClientResponse => ({
  status,
  headers: {},
  json: Effect.succeed(data),
  text: Effect.succeed(JSON.stringify(data))
} as unknown as HttpClientResponse.HttpClientResponse);

// Create HTTP error responses with specific status codes
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

// Create request errors (network failures, timeouts, DNS issues)
const createRequestError = (): HttpClientError.HttpClientError =>
  new HttpClientError.RequestError({
    request: {} as HttpClientRequest.HttpClientRequest,
    reason: "Transport",
    cause: new Error("Network timeout")
  });

// Create encoding/body processing errors
const createEncodingError = (): HttpClientError.HttpClientError =>
  new HttpClientError.RequestError({
    request: {} as HttpClientRequest.HttpClientRequest,
    reason: "Encode",
    cause: new Error("Body parsing failed")
  });

// Factory function to create test layers with different mock behaviors
const createMockHttpClientLayer = (
  mockBehavior: (
    request: HttpClientRequest.HttpClientRequest
  ) => Effect.Effect<HttpClientResponse.HttpClientResponse, HttpClientError.HttpClientError>
) => {
  return Layer.effect(
    HttpClient.HttpClient,
    Effect.succeed(HttpClient.make(mockBehavior))
  );
};

// Common mock scenarios as convenience functions
export const mockSuccessLayer = (data: unknown, status = 200) =>
  createMockHttpClientLayer(() => Effect.succeed(createMockResponse(data, status)));

export const mockErrorLayer = (status: number) =>
  createMockHttpClientLayer(() => Effect.fail(createErrorResponse(status)));

export const mockNetworkErrorLayer = () => createMockHttpClientLayer(() => Effect.fail(createRequestError()));

export const mockEncodingErrorLayer = () => createMockHttpClientLayer(() => Effect.fail(createEncodingError()));
