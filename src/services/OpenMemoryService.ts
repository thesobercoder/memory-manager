import { FetchHttpClient, HttpBody, HttpClient, HttpClientRequest } from "@effect/platform";
import { Config, Context, Effect, Layer } from "effect";
import type { OpenMemoryFilterRequest, OpenMemoryResponse } from "../types.js";

export interface OpenMemoryService {
  readonly filterMemories: (request?: OpenMemoryFilterRequest) => Effect.Effect<OpenMemoryResponse, Error>;
}

export const OpenMemoryService = Context.GenericTag<OpenMemoryService>("@services/OpenMemoryService");

const make = Effect.gen(function*() {
  const httpClient = yield* HttpClient.HttpClient;
  const bearerToken = yield* Config.string("OPENMEMORY_BEARER_TOKEN");
  const baseUrl = "https://api.openmemory.dev/api/v1";

  const filterMemories = (request: OpenMemoryFilterRequest = {}): Effect.Effect<OpenMemoryResponse, Error> =>
    Effect.gen(function*() {
      const defaultRequest: OpenMemoryFilterRequest = {
        page: 1,
        size: 25,
        sort_column: "created_at",
        sort_direction: "desc",
        ...request
      };

      const httpRequest = HttpClientRequest.post(`${baseUrl}/memories/filter`, {
        body: HttpBody.unsafeJson(defaultRequest)
      }).pipe(
        HttpClientRequest.setHeader("Authorization", `Bearer ${bearerToken}`),
        HttpClientRequest.setHeader("Content-Type", "application/json")
      );

      const response = yield* httpClient.execute(httpRequest);
      const data = yield* response.json;

      return data as OpenMemoryResponse;
    });

  return OpenMemoryService.of({
    filterMemories
  });
});

export const OpenMemoryServiceLive = Layer.effect(OpenMemoryService, make).pipe(
  Layer.provide(FetchHttpClient.layer)
);
