/**
 * OpenMemory API integration service for retrieving and filtering memory data.
 * Handles authentication, API communication, and response parsing.
 */
import { HttpBody, HttpClient, HttpClientError, HttpClientRequest, HttpClientResponse } from "@effect/platform";
import { Config, ConfigError, Context, Effect, ParseResult } from "effect";
import {
  OpenMemoryDeleteRequest,
  OpenMemoryDeleteResponse,
  OpenMemoryFilterRequest,
  OpenMemoryFilterResponse
} from "../types";

// Service Contract
class OpenMemoryContract extends Context.Tag("OpenMemoryService")<
  OpenMemoryContract,
  {
    readonly getMemories: (
      request?: OpenMemoryFilterRequest
    ) => Effect.Effect<
      OpenMemoryFilterResponse,
      ParseResult.ParseError | HttpClientError.HttpClientError | HttpBody.HttpBodyError | ConfigError.ConfigError,
      HttpClient.HttpClient
    >;
    readonly deleteMemories: (
      request: OpenMemoryDeleteRequest
    ) => Effect.Effect<
      OpenMemoryDeleteResponse,
      ParseResult.ParseError | HttpClientError.HttpClientError | HttpBody.HttpBodyError | ConfigError.ConfigError,
      HttpClient.HttpClient
    >;
  }
>() {}

// Service Implementation
const openMemoryLive = {
  getMemories: (request?: OpenMemoryFilterRequest) =>
    Effect.gen(function*() {
      const httpClient = yield* HttpClient.HttpClient;
      const bearerToken = yield* Config.redacted("OPENMEMORY_BEARER_TOKEN");
      const baseUrl = yield* Config.string("OPENMEMORY_BASE_URL");

      const defaultRequest = OpenMemoryFilterRequest.default();

      const data = yield* HttpClientRequest.post(`${baseUrl}/memories/filter`).pipe(
        HttpClientRequest.bearerToken(bearerToken),
        HttpClientRequest.acceptJson,
        HttpClientRequest.setHeader("Content-Type", "application/json"),
        HttpClientRequest.bodyJson(request ?? defaultRequest),
        Effect.flatMap(httpClient.execute),
        Effect.flatMap(HttpClientResponse.schemaBodyJson(OpenMemoryFilterResponse))
      );

      return data;
    }),

  deleteMemories: (request: OpenMemoryDeleteRequest) =>
    Effect.gen(function*() {
      const httpClient = yield* HttpClient.HttpClient;
      const bearerToken = yield* Config.redacted("OPENMEMORY_BEARER_TOKEN");
      const baseUrl = yield* Config.string("OPENMEMORY_BASE_URL");

      const data = yield* HttpClientRequest.del(`${baseUrl}/api/v1/memories`).pipe(
        HttpClientRequest.bearerToken(bearerToken),
        HttpClientRequest.setHeader("Content-Type", "application/json"),
        HttpClientRequest.bodyJson(request),
        Effect.flatMap(httpClient.execute),
        Effect.flatMap(HttpClientResponse.schemaBodyJson(OpenMemoryDeleteResponse))
      );

      return data;
    })
};

// Export Contract/Instance pattern
export const OpenMemory = {
  Contract: OpenMemoryContract,
  Instance: openMemoryLive
};
