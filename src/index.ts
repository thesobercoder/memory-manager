import { FetchHttpClient } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";
import { OpenMemory } from "./services/OpenMemory";
import { OpenMemoryFilterResponse } from "./types";

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
          yield* Effect.logError(`OpenMemory API Request Error: ${error.reason}`);
          return OpenMemoryFilterResponse.empty();
        }),
      ResponseError: (error) =>
        Effect.gen(function*() {
          yield* Effect.logError(`OpenMemory API Response Error: ${error.reason}`);
          return OpenMemoryFilterResponse.empty();
        }),
      ParseError: (error) =>
        Effect.gen(function*() {
          yield* Effect.logError(`OpenMemory API Parse Error: ${error.message}`);
          return OpenMemoryFilterResponse.empty();
        }),
      ConfigError: (error) =>
        Effect.gen(function*() {
          yield* Effect.logError(`OpenMemory API Config Error: ${error.message}`);
          return OpenMemoryFilterResponse.empty();
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
