import * as OpenAiClient from "@effect/ai-openai/OpenAiClient";
import * as OpenAiLanguageModel from "@effect/ai-openai/OpenAiLanguageModel";
import * as AiError from "@effect/ai/AiError";
import * as AiLanguageModel from "@effect/ai/AiLanguageModel";
import { FetchHttpClient } from "@effect/platform";
import { Config, Context, Effect, Layer } from "effect";
import { ClassificationResult, ModelEnum, ModelOutputSchema } from "../types";

// Service Contract
class MemoryClassificationContract extends Context.Tag("MemoryClassificationService")<
  MemoryClassificationContract,
  {
    readonly classify: (
      model: ModelEnum,
      content: string
    ) => Effect.Effect<ClassificationResult, AiError.AiError, never>;
  }
>() {}

// Configuration for OpenRouter integration
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Classification prompt template for structured output
const getClassificationPrompt = (content: string) => `
You are a memory classification expert. Analyze the following memory content and classify it as "transient", "long-term", or "unclassified".

CLASSIFICATION CRITERIA:
- TRANSIENT: Temporary information, short-term reminders, time-sensitive data, ephemeral conversations, immediate tasks
- LONG-TERM: Important facts, core knowledge, significant events, personal insights, persistent references, valuable information
- UNCLASSIFIED: Content that is unclear, ambiguous, or cannot be confidently categorized into transient or long-term

MEMORY CONTENT:
"${content}"

Classify this memory and provide your confidence level and reasoning.
`;

// Helper function to get the appropriate model layer
const getModelLayer = (
  model: ModelEnum
): Layer.Layer<AiLanguageModel.AiLanguageModel, never, OpenAiClient.OpenAiClient> => {
  switch (model) {
    case ModelEnum.MODEL1:
      return GeminiLanguageModelLayer;
    case ModelEnum.MODEL2:
      return GrokLanguageModelLayer;
    case ModelEnum.MODEL3:
      return O3MiniLanguageModelLayer;
    default:
      throw new Error(`Unsupported model: ${model}`);
  }
};

// Create OpenAI client layer for OpenRouter using layerConfig
const ClientLayer = OpenAiClient.layerConfig({
  apiUrl: Config.succeed(OPENROUTER_BASE_URL),
  apiKey: Config.redacted("OPENAI_API_KEY")
});

// Create language model layers for all three models
const GeminiLanguageModelLayer = OpenAiLanguageModel.layer({
  model: ModelEnum.MODEL1,
  config: {
    max_tokens: 500,
    temperature: 0.1
  }
});

const GrokLanguageModelLayer = OpenAiLanguageModel.layer({
  model: ModelEnum.MODEL2,
  config: {
    max_tokens: 150,
    temperature: 0.1
  }
});

const O3MiniLanguageModelLayer = OpenAiLanguageModel.layer({
  model: ModelEnum.MODEL3,
  config: {
    max_tokens: 150,
    temperature: 0.1
  }
});

// Service Implementation
const memoryClassificationLive = {
  classify: (model: ModelEnum, content: string): Effect.Effect<ClassificationResult, AiError.AiError, never> =>
    Effect.gen(function*() {
      const prompt = getClassificationPrompt(content);
      const modelLayer = getModelLayer(model);

      const result = yield* AiLanguageModel.generateObject({
        prompt,
        schema: ModelOutputSchema
      }).pipe(
        Effect.provide(modelLayer),
        Effect.provide(ClientLayer),
        Effect.provide(FetchHttpClient.layer),
        Effect.map((response) => {
          // Extract structured data from response.value
          const structuredData = response.value;

          return new ClassificationResult({
            modelName: model,
            classification: structuredData.classification,
            confidence: structuredData.confidence,
            reasoning: structuredData.reasoning,
            status: "success"
          });
        }),
        Effect.catchAll((error) =>
          Effect.succeed(
            new ClassificationResult({
              modelName: model,
              classification: "unclassified",
              confidence: 0.1,
              reasoning: "Model call failed",
              status: "failed",
              error: String(error)
            })
          )
        )
      );

      return result;
    })
};

// Export Contract/Instance pattern
export const MemoryClassification = {
  Contract: MemoryClassificationContract,
  Instance: memoryClassificationLive
};
