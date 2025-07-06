import { FetchHttpClient } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";
import { ConsensusService } from "./services/ConsensusService";
import { MemoryClassification } from "./services/MemoryClassification";
import { OpenMemory } from "./services/OpenMemory";
import { ClassificationAttempt, ModelEnum, OpenMemoryFilterResponse } from "./types";

const program = Effect.gen(function*() {
  yield* Effect.log("Fetching Data from OpenMemory...");

  const openMemoryService = yield* OpenMemory.Contract;
  const memoryClassificationService = yield* MemoryClassification.Contract;
  const consensusService = yield* ConsensusService.Contract;

  const result = yield* openMemoryService.filterMemories().pipe(
    Effect.catchAll((error) =>
      Effect.gen(function*() {
        yield* Effect.logError(`OpenMemory API Error: ${String(error)}`);
        return OpenMemoryFilterResponse.empty();
      })
    )
  );

  yield* Effect.log(`Retrieved ${result.total} total memories (page ${result.page}/${result.pages})`);

  // Classify each memory using the new separated architecture
  for (const memory of result.items) {
    yield* Effect.gen(function*() {
      const truncatedContent = memory.content.length > 50
        ? `${memory.content.substring(0, 50)}...`
        : memory.content;

      // Call all three models in parallel and convert to ClassificationAttempt objects
      const classificationAttempts = yield* Effect.all([
        memoryClassificationService.classify(ModelEnum.MODEL1, memory.content).pipe(
          Effect.map((result) =>
            new ClassificationAttempt({
              modelName: ModelEnum.MODEL1,
              status: "success",
              result: result
            })
          ),
          Effect.catchAll((error) =>
            Effect.succeed(
              new ClassificationAttempt({
                modelName: ModelEnum.MODEL1,
                status: "failed",
                error: String(error)
              })
            )
          )
        ),
        memoryClassificationService.classify(ModelEnum.MODEL2, memory.content).pipe(
          Effect.map((result) =>
            new ClassificationAttempt({
              modelName: ModelEnum.MODEL2,
              status: "success",
              result: result
            })
          ),
          Effect.catchAll((error) =>
            Effect.succeed(
              new ClassificationAttempt({
                modelName: ModelEnum.MODEL2,
                status: "failed",
                error: String(error)
              })
            )
          )
        ),
        memoryClassificationService.classify(ModelEnum.MODEL3, memory.content).pipe(
          Effect.map((result) =>
            new ClassificationAttempt({
              modelName: ModelEnum.MODEL3,
              status: "success",
              result: result
            })
          ),
          Effect.catchAll((error) =>
            Effect.succeed(
              new ClassificationAttempt({
                modelName: ModelEnum.MODEL3,
                status: "failed",
                error: String(error)
              })
            )
          )
        )
      ]);

      // Log individual model results for debugging
      yield* Effect.log(`📊 Individual results for "${truncatedContent}":`);

      // Helper function to format classification attempt
      const formatAttempt = (attempt: ClassificationAttempt) => {
        if (attempt.status === "success" && attempt.result) {
          return `${attempt.result.classification} (${(attempt.result.confidence * 100).toFixed(1)}%) - success`;
        } else {
          return `failed - ${attempt.error}`;
        }
      };

      // Log each model result
      for (const attempt of classificationAttempts) {
        yield* Effect.log(`  • ${attempt.modelName}: ${formatAttempt(attempt)}`);
      }

      // Calculate consensus
      const consensus = yield* consensusService.calculateConsensus(classificationAttempts);

      // Log final consensus result
      yield* Effect.log(
        `🧠 "${truncatedContent}" → ${consensus.finalClassification.toUpperCase()} (${
          (consensus.confidence * 100).toFixed(1)
        }% consensus, ${consensus.successfulModels}/${consensus.successfulModels + consensus.failedModels} models)`
      );
    }).pipe(
      Effect.catchAll((error) =>
        Effect.gen(function*() {
          const truncatedContent = memory.content.length > 100
            ? `${memory.content.substring(0, 100)}...`
            : memory.content;
          yield* Effect.logError(`❌ Failed to classify "${truncatedContent}": ${String(error)}`);
        })
      )
    );
  }
});

program.pipe(
  Effect.provideService(OpenMemory.Contract, OpenMemory.Instance),
  Effect.provideService(MemoryClassification.Contract, MemoryClassification.Instance),
  Effect.provideService(ConsensusService.Contract, ConsensusService.Instance),
  Effect.provide(BunContext.layer),
  Effect.provide(FetchHttpClient.layer),
  BunRuntime.runMain
);
