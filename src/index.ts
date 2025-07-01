import { FetchHttpClient, HttpBody, HttpClient, HttpClientRequest } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Config, Effect, Layer } from "effect";

const program = Effect.gen(function*() {
  const bearerToken = yield* Config.string("OPENMEMORY_BEARER_TOKEN");

  yield* Effect.log(`Fetching Data from OpenMemory:`);

  const httpClient = yield* HttpClient.HttpClient;
  const url = "https://api.openmemory.dev/api/v1/memories/filter";

  const request = HttpClientRequest.post(url, {
    body: HttpBody.unsafeJson(
      {
        "page": 1,
        "size": 25,
        "sort_column": "created_at",
        "sort_direction": "desc"
      }
    )
  }).pipe(
    HttpClientRequest.setHeader("Authorization", `Bearer ${bearerToken}`),
    HttpClientRequest.setHeader("Content-Type", "application/json")
  );

  const response = yield* httpClient.execute(request);
  const data = yield* response.json;

  yield* Effect.log(`Retrieved memories: ${JSON.stringify(data)}`);

  return data;
});

const AppLayer = Layer.mergeAll(BunContext.layer, FetchHttpClient.layer);

BunRuntime.runMain(
  program.pipe(Effect.provide(AppLayer))
);
