/**
 * Memory classification service using multiple AI models for content analysis.
 * Provides parallel classification across different models (Gemini, DeepSeek, GPT-4o-mini)
 * with structured output and error handling.
 */
import * as OpenAiClient from "@effect/ai-openai/OpenAiClient";
import * as OpenAiLanguageModel from "@effect/ai-openai/OpenAiLanguageModel";
import * as AiError from "@effect/ai/AiError";
import * as AiLanguageModel from "@effect/ai/AiLanguageModel";
import { HttpClient, HttpClientRequest } from "@effect/platform";
import { Config, ConfigError, Data, Effect, Layer } from "effect";
import { ClassificationResult, ModelEnum, ModelOutputSchema } from "../types";

// Custom errors for the service
class UnsupportedModelError extends Data.TaggedError("UnsupportedModelError")<{
  readonly model: string;
}> {}

class UnclassifiedMemoryError extends Data.TaggedError("UnclassifiedMemoryError")<{
  readonly model: string;
  readonly reasoning: string;
}> {}

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
): Effect.Effect<
  Layer.Layer<AiLanguageModel.AiLanguageModel, never, OpenAiClient.OpenAiClient>,
  UnsupportedModelError,
  never
> => {
  switch (model) {
    case ModelEnum.MODEL1:
      return Effect.succeed(LanguageModel1Layer);
    case ModelEnum.MODEL2:
      return Effect.succeed(LanguageModel2Layer);
    case ModelEnum.MODEL3:
      return Effect.succeed(LanguageModel3Layer);
    default:
      return Effect.fail(new UnsupportedModelError({ model }));
  }
};

// Create OpenAI client layer for OpenRouter using layerConfig
const ClientLayer = OpenAiClient.layerConfig({
  apiUrl: Config.string("OPENAI_BASE_URL"),
  apiKey: Config.redacted("OPENAI_API_KEY"),
  transformClient: Config.succeed((client: HttpClient.HttpClient) =>
    client.pipe(
      HttpClient.mapRequest((request: HttpClientRequest.HttpClientRequest) =>
        request.pipe(
          HttpClientRequest.setHeader("HTTP-Referer", "https://thesobercoder.in"),
          HttpClientRequest.setHeader("X-Title", "Memory Manager")
        )
      )
    )
  )
});

// Create language model layers for all three models
const LanguageModel1Layer = OpenAiLanguageModel.layer({
  model: ModelEnum.MODEL1,
  config: {
    max_tokens: 500,
    temperature: 0.1
  }
});

const LanguageModel2Layer = OpenAiLanguageModel.layer({
  model: ModelEnum.MODEL2,
  config: {
    max_tokens: 500,
    temperature: 0.1
  }
});

const LanguageModel3Layer = OpenAiLanguageModel.layer({
  model: ModelEnum.MODEL3,
  config: {
    max_tokens: 500,
    temperature: 0.1
  }
});

export class MemoryClassification extends Effect.Service<MemoryClassification>()("MemoryClassificationService", {
  effect: Effect.succeed({
    classify: (
      model: ModelEnum,
      content: string
    ): Effect.Effect<
      ClassificationResult,
      UnsupportedModelError | UnclassifiedMemoryError | AiError.AiError | ConfigError.ConfigError,
      HttpClient.HttpClient
    > =>
      Effect.gen(function*() {
        const prompt = getClassificationPrompt(content);
        const modelLayer = yield* getModelLayer(model);

        const result = yield* AiLanguageModel.generateObject({
          prompt,
          schema: ModelOutputSchema
        }).pipe(
          Effect.provide(modelLayer),
          Effect.provide(ClientLayer),
          Effect.flatMap((response) => {
            // Extract structured data from response.value
            const structuredData = response.value;

            // Handle unclassified results as specific errors
            if (structuredData.classification === "unclassified") {
              return Effect.fail(
                new UnclassifiedMemoryError({
                  model,
                  reasoning: structuredData.reasoning
                })
              );
            }

            return Effect.succeed(
              new ClassificationResult({
                modelName: model,
                classification: structuredData.classification,
                confidence: structuredData.confidence,
                reasoning: structuredData.reasoning
              })
            );
          })
        );

        return result;
      })
  })
}) {}
