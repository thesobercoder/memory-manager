import { FetchHttpClient } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";
import { OpenMemory } from "./services/OpenMemory.js";
import { OpenMemoryFilterResponse } from "./types.js";

const program = Effect.gen(function*() {
  yield* Effect.log("Fetching Data from OpenMemory...");

  const openMemoryService = yield* OpenMemory;

  const result = yield* openMemoryService.filterMemories({
    page: 1,
    size: 25,
    sort_column: "created_at",
    sort_direction: "desc"
  }).pipe(
    Effect.catchTags({
      RequestError: (error) =>
        Effect.gen(function*() {
          yield* Effect.logError(`Request Error: ${error.reason}`);
          yield* Effect.logError(`Failed to make request to OpenMemory API`);

          return new OpenMemoryFilterResponse({
            items: [],
            total: 0,
            page: 1,
            size: 25,
            pages: 0
          });
        }),
      ResponseError: (error) =>
        Effect.gen(function*() {
          yield* Effect.logError(`Response Error: ${error.reason}`);
          yield* Effect.logError(`OpenMemory API returned an error response`);

          return new OpenMemoryFilterResponse({
            items: [],
            total: 0,
            page: 1,
            size: 25,
            pages: 0
          });
        }),
      ParseError: (error) =>
        Effect.gen(function*() {
          yield* Effect.logError(`Parse Error: ${error.message}`);
          yield* Effect.logError(`Failed to parse response from OpenMemory API`);

          return new OpenMemoryFilterResponse({
            items: [],
            total: 0,
            page: 1,
            size: 25,
            pages: 0
          });
        }),
      ConfigError: (error) =>
        Effect.gen(function*() {
          yield* Effect.logError(`Config Error: ${error.message}`);
          yield* Effect.logError(`Missing or invalid configuration for OpenMemory service`);

          return new OpenMemoryFilterResponse({
            items: [],
            total: 0,
            page: 1,
            size: 25,
            pages: 0
          });
        })
    })
  );

  yield* Effect.log(`Retrieved ${result.total} total memories (page ${result.page}/${result.pages})`);
});

const AppLayer = Layer.mergeAll(
  BunContext.layer,
  OpenMemory.Default.pipe(Layer.provide(FetchHttpClient.layer))
);

program.pipe(Effect.provide(AppLayer), BunRuntime.runMain);
