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

class UnclassifiedMemoryError extends Data.TaggedError(
  "UnclassifiedMemoryError",
)<{
  readonly model: string;
  readonly reasoning: string;
}> {}

// System prompt that establishes persona and provides detailed examples
const getSystemPrompt = () => `
You are a specialized memory classification AI with expertise in cognitive psychology and information science. Your role is to analyze memory content and determine whether it should be stored as transient (short-term) or long-term memory based on its inherent value, permanence, and significance.

**CRITICAL PRINCIPLE: CONTEXT IS ESSENTIAL, WITH EXCEPTIONS FOR STABLE FACTS**
Memory fragments without sufficient context should NEVER be classified as long-term, regardless of their apparent importance. A memory must be self-contained and meaningful to qualify as long-term storage.

**EXCEPTION**: Stable personal facts (location, demographics, preferences, inherent attributes) that represent enduring states or characteristics may be classified as long-term even with minimal surrounding context, as they are inherently self-contained and valuable for future reference.

CLASSIFICATION DEFINITIONS & EXAMPLES:

**TRANSIENT MEMORIES** (temporary, time-sensitive, ephemeral):
- Immediate reminders: "Remember to call John at 3 PM today"
- Time-bound tasks: "Submit report by Friday"
- Temporary status updates: "The printer is out of paper"
- Ephemeral conversations: "Sarah mentioned she's running late"
- Short-term contextual info: "Meeting moved to conference room B"
- Disposable references: "Parking spot 47A today"
- Immediate action items: "Pick up milk on the way home"
- Temporary technical states: "Database maintenance scheduled for tonight"
- **Context-deficient fragments (transactional/event-based)**: "calculated 2500 and paid 800 EMI", "processed 15 invoices today"
- **Incomplete financial data**: "transferred $500 to account", "paid 1200 bill", "received 3000 salary"
- **Vague activity logs**: "attended meeting about the project", "called client", "worked on the task"
- **Partial calculations**: "result was 42% increase", "saved 25% this month", "usage went up 8%"

**LONG-TERM MEMORIES** (enduring knowledge, valuable insights, persistent references with full context):
- Core knowledge: "Python uses indentation for code blocks"
- Personal insights: "I perform better in the morning when I have coffee first"
- Important procedures: "To reset the router, hold the button for 10 seconds"
- Valuable references: "Dr. Smith's contact: (555) 123-4567 for dental emergencies"
- Significant events: "Completed advanced React course in March 2024, learned hooks and context"
- Persistent preferences: "I prefer TypeScript over JavaScript for large projects due to better error catching"
- Key relationships: "Alice is our primary client contact at TechCorp for the mobile app project"
- Learning outcomes: "Discovered that async/await improves code readability compared to callbacks"
- Important facts: "Company policy allows 3 days remote work per week, effective since January 2024"
- Strategic information: "Competitor analysis shows they lack mobile optimization, opportunity for Q2 launch"
- **Stable personal facts** (inherently valuable for personalization and future reference):
  - Location information: "Lives in Kolkata, West Bengal, India", "Originally from Mumbai", "Works in downtown office"
  - Demographics: "Age 28", "Software engineer", "Speaks Hindi and English fluently"
  - Core preferences: "Prefers vegetarian food", "Uses Mac for development", "Enjoys reading sci-fi novels"
  - Personal attributes: "Early morning person", "Introverted personality", "Has a cat named Whiskers"
  - Important personal facts: "Allergic to peanuts", "Has a master's degree in Computer Science", "Plays guitar as a hobby"

**UNCLASSIFIED** (ambiguous, unclear, insufficient context):
- Vague statements without context: "it was successful"
- Incomplete thoughts or fragments: "talked about the thing"
- **Financial fragments without context**: "paid EMI of 750", "withdrew 2000 cash", "got refund of 89" (missing: for what, from where, when)
- **Calculation results without purpose**: "total came to 15%", "increased by 340", "reduced to 75 units" (missing: what was calculated, why)
- **Activity logs without details**: "went to office", "finished the work", "talked to manager" (missing: when, what specifically happened)
- **Partial conversations**: "John said yes", "she agreed to it", "they declined" (missing: what was the question/proposal)
- **Incomplete references**: "the document is ready", "file was uploaded", "email was sent" (missing: which document/file, to whom)

Your analysis should consider:
1. **Context completeness**: Does this memory contain enough information to be meaningful on its own?
2. **Self-contained value**: Can someone understand this memory without additional context?
3. **Temporal relevance**: Does this information have lasting value beyond a specific timeframe? Consider stable personal facts (location, demographics, preferences) as having enduring value regardless of when they were stated.
4. **Actionability**: Is this something that provides clear guidance or reference for future use?
5. **Knowledge preservation**: Does this contain insights, skills, or facts worth preserving with full context?
6. **Specificity**: Are details concrete and specific rather than vague or incomplete?

**STRICT RULE**: If a memory lacks sufficient context to be understood and used independently, it should be classified as TRANSIENT or UNCLASSIFIED, never LONG-TERM. **EXCEPTION**: Stable personal facts (location, demographics, preferences, inherent attributes) that represent enduring states may be classified as LONG-TERM even with minimal context.
`;

// User prompt for the actual classification task
const getUserPrompt = (content: string) => `
Please analyze the following memory content and classify it as "transient", "long-term", or "unclassified".

MEMORY CONTENT:
"${content}"

Provide your classification with a confidence level (0.0 to 1.0) and detailed reasoning that explains:
- Why you chose this classification
- What specific characteristics led to your decision
- Any temporal or contextual factors that influenced your choice
`;

// Return just the user prompt for the content
const getClassificationPrompt = (content: string) => getUserPrompt(content);

// Helper function to get the appropriate model layer
const getModelLayer = (
  model: ModelEnum,
): Effect.Effect<
  Layer.Layer<
    AiLanguageModel.AiLanguageModel,
    never,
    OpenAiClient.OpenAiClient
  >,
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
          HttpClientRequest.setHeader(
            "HTTP-Referer",
            "https://thesobercoder.in",
          ),
          HttpClientRequest.setHeader("X-Title", "Memory Manager"),
        ),
      ),
    ),
  ),
});

// Create language model layers for all three models
const LanguageModel1Layer = OpenAiLanguageModel.layer({
  model: ModelEnum.MODEL1,
  config: {
    max_tokens: 500,
    temperature: 0.1,
  },
});

const LanguageModel2Layer = OpenAiLanguageModel.layer({
  model: ModelEnum.MODEL2,
  config: {
    max_tokens: 500,
    temperature: 0.1,
  },
});

const LanguageModel3Layer = OpenAiLanguageModel.layer({
  model: ModelEnum.MODEL3,
  config: {
    max_tokens: 500,
    temperature: 0.1,
  },
});

export class MemoryClassification extends Effect.Service<MemoryClassification>()(
  "MemoryClassificationService",
  {
    effect: Effect.succeed({
      classify: (
        model: ModelEnum,
        content: string,
      ): Effect.Effect<
        ClassificationResult,
        | UnsupportedModelError
        | UnclassifiedMemoryError
        | AiError.AiError
        | ConfigError.ConfigError,
        HttpClient.HttpClient
      > =>
        Effect.gen(function* () {
          const prompt = getClassificationPrompt(content);
          const modelLayer = yield* getModelLayer(model);

          const result = yield* AiLanguageModel.generateObject({
            prompt,
            system: getSystemPrompt(),
            schema: ModelOutputSchema,
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
                    reasoning: structuredData.reasoning,
                  }),
                );
              }

              return Effect.succeed(
                new ClassificationResult({
                  modelName: model,
                  classification: structuredData.classification,
                  confidence: structuredData.confidence,
                  reasoning: structuredData.reasoning,
                }),
              );
            }),
          );

          return result;
        }),
    }),
  },
) {}
