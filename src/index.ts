import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";
import { OpenMemoryService, OpenMemoryServiceLive } from "./services/OpenMemoryService.js";

const program = Effect.gen(function*() {
  yield* Effect.log("Fetching Data from OpenMemory:");

  const openMemoryService = yield* OpenMemoryService;

  const data = yield* openMemoryService.filterMemories({
    page: 1,
    size: 25,
    sort_column: "created_at",
    sort_direction: "desc"
  });

  yield* Effect.log(`Retrieved ${data.total} total memories (page ${data.page}/${data.pages})`);
});

const AppLayer = Layer.mergeAll(
  BunContext.layer,
  OpenMemoryServiceLive
);

BunRuntime.runMain(
  program.pipe(Effect.provide(AppLayer))
);
