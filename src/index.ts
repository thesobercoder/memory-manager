import { FetchHttpClient } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";
import { ConsensusService } from "./services/ConsensusService";
import { MemoryClassification } from "./services/MemoryClassification";
import { OpenMemory } from "./services/OpenMemory";
import {
  ClassificationAttempt,
  ModelEnum,
  OpenMemoryDeleteRequest,
  OpenMemoryFilterRequest,
  OpenMemoryFilterResponse
} from "./types";

// Helper function to fetch all pages of memories
const fetchAllMemories = (
  openMemoryService: typeof OpenMemory.Instance
) => {
  return Effect.gen(function*() {
    const allMemories: Array<OpenMemoryFilterResponse["items"][number]> = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const request = new OpenMemoryFilterRequest({
        page: currentPage,
        size: 25,
        sort_column: "created_at",
        sort_direction: "desc"
      });

      const result = yield* openMemoryService.getMemories(request).pipe(
        Effect.catchAll((error) =>
          Effect.gen(function*() {
            yield* Effect.logError(`OpenMemory API Error on page ${currentPage}: ${String(error)}`);
            return OpenMemoryFilterResponse.empty();
          })
        )
      );

      allMemories.push(...result.items);
      totalPages = result.pages;

      yield* Effect.log(`Fetched page ${currentPage}/${totalPages} with ${result.items.length} memories`);

      currentPage++;
    } while (currentPage <= totalPages);

    return allMemories;
  });
};

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

  // Fetch all memories from all pages
  const allMemories = yield* fetchAllMemories(openMemoryService);
  yield* Effect.log(`Retrieved ${allMemories.length} total memories from all pages`);

  // Classify each memory using the new separated architecture
  for (const memory of allMemories) {
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

      // Calculate consensus
      const consensus = yield* consensusService.calculateConsensus(classificationAttempts);

      // Log final consensus result
      yield* Effect.log(
        `🧠 "${truncatedContent}" → ${consensus.finalClassification.toUpperCase()} (${
          (consensus.confidence * 100).toFixed(1)
        }% consensus, ${consensus.successfulModels}/${consensus.successfulModels + consensus.failedModels} models)`
      );

      // Delete immediately if classified as transient with high confidence
      if (consensus.finalClassification === "transient" && consensus.confidence >= 0.7) {
        yield* Effect.log(
          `🗑️  Deleting transient memory: "${truncatedContent}" (${
            (consensus.confidence * 100).toFixed(1)
          }% confidence)`
        );

        const deleteRequest = new OpenMemoryDeleteRequest({
          memory_ids: [memory.id]
        });

        const deleteResult = yield* openMemoryService.deleteMemories(deleteRequest).pipe(
          Effect.catchAll((error) =>
            Effect.gen(function*() {
              yield* Effect.logError(`❌ Failed to delete memory "${truncatedContent}": ${String(error)}`);
              return null;
            })
          )
        );

        if (deleteResult) {
          yield* Effect.log(`✅ Successfully deleted "${truncatedContent}"`);
        }
      } else if (consensus.finalClassification === "transient" && consensus.confidence < 0.7) {
        yield* Effect.log(
          `⚠️  Skipping deletion of "${truncatedContent}" - low confidence (${
            (consensus.confidence * 100).toFixed(1)
          }%)`
        );
      }
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
