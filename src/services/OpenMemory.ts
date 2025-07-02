import { HttpBody, HttpClient, HttpClientError, HttpClientRequest, HttpClientResponse } from "@effect/platform";
import { Config, Context, Effect, Layer, ParseResult } from "effect";
import { OpenMemoryFilterRequest, OpenMemoryFilterResponse } from "../types";

export class OpenMemory extends Context.Tag("OpenMemoryService")<
  OpenMemory,
  {
    readonly filterMemories: (
      request?: OpenMemoryFilterRequest
    ) => Effect.Effect<
      OpenMemoryFilterResponse,
      ParseResult.ParseError | HttpClientError.HttpClientError | HttpBody.HttpBodyError,
      never
    >;
  }
>() {
  static Default = Layer.effect(
    OpenMemory,
    Effect.gen(function*() {
      const httpClient = yield* HttpClient.HttpClient;
      const bearerToken = yield* Config.redacted("OPENMEMORY_BEARER_TOKEN");
      const baseUrl = "https://api.openmemory.dev/api/v1";

      const filterMemories = (request?: OpenMemoryFilterRequest) =>
        Effect.gen(function*() {
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
        });

      return { filterMemories };
    })
  );
}
