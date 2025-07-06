import { FetchHttpClient } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";
import { ConsensusService } from "./services/ConsensusService";
import { MemoryClassification } from "./services/MemoryClassification";
import { OpenMemory } from "./services/OpenMemory";
import { ClassificationAttempt, ModelEnum, OpenMemoryFilterResponse } from "./types";

// Helper function to classify content with a specific model and create a ClassificationAttempt
const classifyAndCreateAttempt = (
  memoryClassificationService: typeof MemoryClassification.Instance,
  model: ModelEnum,
  content: string
) => {
  return memoryClassificationService.classify(model, content).pipe(
    Effect.map((result) =>
      new ClassificationAttempt({
        modelName: model,
        status: "success",
        result: result
      })
    ),
    Effect.catchAll((error) =>
      Effect.succeed(
        new ClassificationAttempt({
          modelName: model,
          status: "failed",
          error: error.message
        })
      )
    )
  );
};

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
        classifyAndCreateAttempt(memoryClassificationService, ModelEnum.MODEL1, memory.content),
        classifyAndCreateAttempt(memoryClassificationService, ModelEnum.MODEL2, memory.content),
        classifyAndCreateAttempt(memoryClassificationService, ModelEnum.MODEL3, memory.content)
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
    });
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
