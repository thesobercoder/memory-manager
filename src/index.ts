import { FetchHttpClient } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, Predicate } from "effect";
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
    Effect.catchTag("OpenMemoryServiceError", (error) =>
      Effect.gen(function*() {
        yield* Effect.logError(`Failed to fetch memories: ${error.message}`);
        if (Predicate.hasProperty(error, "cause")) {
          yield* Effect.logError(`Cause: ${JSON.stringify(error.cause, null, 2)}`);
        }

        return new OpenMemoryFilterResponse({
          items: [],
          total: 0,
          page: 1,
          size: 25,
          pages: 0
        });
      }))
  );

  yield* Effect.log(`Retrieved ${result.total} total memories (page ${result.page}/${result.pages})`);
});

const AppLayer = Layer.mergeAll(
  BunContext.layer,
  OpenMemory.Default.pipe(Layer.provide(FetchHttpClient.layer))
);

program.pipe(Effect.provide(AppLayer), BunRuntime.runMain);
