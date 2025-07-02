import { HttpBody, HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform";
import { Config, Context, Effect, Layer } from "effect";
import { OpenMemoryFilterRequest, OpenMemoryFilterResponse, OpenMemoryServiceError } from "../types.js";

export class OpenMemory extends Context.Tag("OpenMemoryService")<
  OpenMemory,
  {
    readonly filterMemories: (
      request?: OpenMemoryFilterRequest
    ) => Effect.Effect<OpenMemoryFilterResponse, OpenMemoryServiceError>;
  }
>() {
  static Default = Layer.effect(
    OpenMemory,
    Effect.gen(function*() {
      const httpClient = yield* HttpClient.HttpClient;
      const bearerToken = yield* Config.string("OPENMEMORY_BEARER_TOKEN");
      const baseUrl = "https://api.openmemory.dev/api/v1";

      const filterMemories = (request?: OpenMemoryFilterRequest) =>
        Effect.gen(function*() {
          const defaultRequest = new OpenMemoryFilterRequest({
            page: 1,
            size: 25,
            sort_column: "created_at",
            sort_direction: "desc"
          });

          const httpRequest = HttpClientRequest.post(`${baseUrl}/memories/filter`, {
            body: HttpBody.unsafeJson(request || defaultRequest)
          }).pipe(
            HttpClientRequest.setHeader("Authorization", `Bearer ${bearerToken}`),
            HttpClientRequest.setHeader("Content-Type", "application/json")
          );

          const data = yield* httpClient.execute(httpRequest).pipe(
            Effect.flatMap(HttpClientResponse.schemaBodyJson(OpenMemoryFilterResponse)),
            Effect.mapError((error) =>
              new OpenMemoryServiceError({
                cause: error,
                message: "Failed to filter memories"
              })
            )
          );

          return data;
        });

      return { filterMemories };
    })
  );
}
