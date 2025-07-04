import { FetchHttpClient } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";
import { ConsensusService } from "./services/ConsensusService";
import { MemoryClassification } from "./services/MemoryClassification";
import { OpenMemory } from "./services/OpenMemory";
import { ModelEnum, OpenMemoryFilterResponse } from "./types";

const program = Effect.gen(function*() {
  yield* Effect.log("Fetching Data from OpenMemory...");

  const openMemoryService = yield* OpenMemory.Contract;
  const memoryClassificationService = yield* MemoryClassification.Contract;
  const consensusService = yield* ConsensusService.Contract;

  const result = yield* openMemoryService.filterMemories().pipe(
    Effect.catchTags({
      HttpBodyError: (error) =>
        Effect.gen(function*() {
          yield* Effect.logError(`OpenMemory API Body Error: ${error.reason}`);
          return OpenMemoryFilterResponse.empty();
        }),
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
        })
    })
  );

  yield* Effect.log(`Retrieved ${result.total} total memories (page ${result.page}/${result.pages})`);

  // Classify each memory using the new separated architecture
  for (const memory of result.items) {
    yield* Effect.gen(function*() {
      const truncatedContent = memory.content.length > 100
        ? `${memory.content.substring(0, 100)}...`
        : memory.content;

      // Call all three models in parallel
      const [geminiResult, grokResult, o3Result] = yield* Effect.all([
        memoryClassificationService.classify(ModelEnum.MODEL1, memory.content),
        memoryClassificationService.classify(ModelEnum.MODEL2, memory.content),
        memoryClassificationService.classify(ModelEnum.MODEL3, memory.content)
      ]);

      // Log individual model results for debugging
      yield* Effect.log(`📊 Individual results for "${truncatedContent}":`);

      // Helper function to format model result with error details
      const formatModelResult = (result: typeof geminiResult) => {
        const baseInfo = `${result.classification} (${(result.confidence * 100).toFixed(1)}%) - ${result.status}`;
        if (result.status === "failed" && result.error) {
          return `${baseInfo} | Error: ${result.error}`;
        }
        return baseInfo;
      };

      yield* Effect.log(`  • ${geminiResult.modelName}: ${formatModelResult(geminiResult)}`);
      yield* Effect.log(`  • ${grokResult.modelName}: ${formatModelResult(grokResult)}`);
      yield* Effect.log(`  • ${o3Result.modelName}: ${formatModelResult(o3Result)}`);

      // Calculate consensus
      const consensus = yield* consensusService.calculateConsensus([geminiResult, grokResult, o3Result]);

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
