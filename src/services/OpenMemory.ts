import { HttpBody, HttpClient, HttpClientError, HttpClientRequest, HttpClientResponse } from "@effect/platform";
import { Config, ConfigError, Context, Effect, ParseResult } from "effect";
import { OpenMemoryFilterRequest, OpenMemoryFilterResponse } from "../types";

// Service Contract
class OpenMemoryContract extends Context.Tag("OpenMemoryService")<
  OpenMemoryContract,
  {
    readonly filterMemories: (
      request?: OpenMemoryFilterRequest
    ) => Effect.Effect<
      OpenMemoryFilterResponse,
      ParseResult.ParseError | HttpClientError.HttpClientError | HttpBody.HttpBodyError | ConfigError.ConfigError,
      HttpClient.HttpClient
    >;
  }
>() {}

// Service Implementation
const openMemoryLive = {
  filterMemories: (request?: OpenMemoryFilterRequest) =>
    Effect.gen(function*() {
      const httpClient = yield* HttpClient.HttpClient;
      const bearerToken = yield* Config.redacted("OPENMEMORY_BEARER_TOKEN");
      const baseUrl = "https://api.openmemory.dev/api/v1";

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
    })
};

// Export Contract/Instance pattern
export const OpenMemory = {
  Contract: OpenMemoryContract,
  Instance: openMemoryLive
};
