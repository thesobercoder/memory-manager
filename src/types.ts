import { Schema } from "effect";

export class OpenMemoryFilterResponse extends Schema.Class<OpenMemoryFilterResponse>(
  "OpenMemoryFilterResponse",
)({
  items: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      content: Schema.String,
      created_at: Schema.Number,
      state: Schema.String,
      app_id: Schema.String,
      app_name: Schema.String,
      categories: Schema.Array(Schema.String),
      metadata_: Schema.Record({
        key: Schema.String,
        value: Schema.Unknown,
      }),
    }),
  ),
  total: Schema.Number,
  page: Schema.Number,
  size: Schema.Number,
  pages: Schema.Number,
}) {
  static empty() {
    return new OpenMemoryFilterResponse({
      items: [],
      total: 0,
      page: 0,
      size: 0,
      pages: 0,
    });
  }
}

export class OpenMemoryFilterRequest extends Schema.Class<OpenMemoryFilterRequest>(
  "OpenMemoryFilterRequest",
)({
  page: Schema.Number,
  size: Schema.Number,
  sort_column: Schema.Union(Schema.Literal("created_at")),
  sort_direction: Schema.Union(Schema.Literal("asc"), Schema.Literal("desc")),
}) {
  static default() {
    return new OpenMemoryFilterRequest({
      page: 1,
      size: 25,
      sort_column: "created_at",
      sort_direction: "desc",
    });
  }
}

export class OpenMemoryDeleteRequest extends Schema.Class<OpenMemoryDeleteRequest>(
  "OpenMemoryDeleteRequest",
)({
  memory_ids: Schema.Array(Schema.String),
}) {}

export class OpenMemoryDeleteResponse extends Schema.Class<OpenMemoryDeleteResponse>(
  "OpenMemoryDeleteResponse",
)({
  message: Schema.String,
  user_id: Schema.String,
}) {}

export class MemoryClassificationResponse extends Schema.Class<MemoryClassificationResponse>(
  "MemoryClassificationResponse",
)({
  classification: Schema.Union(
    Schema.Literal("transient"),
    Schema.Literal("long-term"),
  ),
  confidence: Schema.Number.pipe(Schema.clamp(0, 1)),
}) {}

// Model enumeration for the refactored architecture
export enum ModelEnum {
  MODEL1 = "google/gemini-2.5-flash",
  MODEL2 = "x-ai/grok-3",
  MODEL3 = "openai/gpt-4o",
}

// Schema for individual model output
export const ModelOutputSchema = Schema.Struct({
  classification: Schema.Union(
    Schema.Literal("transient"),
    Schema.Literal("long-term"),
    Schema.Literal("unclassified"),
  ),
  confidence: Schema.Number.pipe(Schema.clamp(0, 1)),
  reasoning: Schema.String,
});

// Result from a single model classification (success only - failures are errors)
export class ClassificationResult extends Schema.Class<ClassificationResult>(
  "ClassificationResult",
)({
  modelName: Schema.String,
  classification: Schema.Union(
    Schema.Literal("transient"),
    Schema.Literal("long-term"),
  ),
  confidence: Schema.Number.pipe(Schema.clamp(0, 1)),
  reasoning: Schema.String,
}) {}

// Attempt result represents either a successful classification or a failure
export class ClassificationAttempt extends Schema.Class<ClassificationAttempt>(
  "ClassificationAttempt",
)({
  modelName: Schema.String,
  status: Schema.Union(Schema.Literal("success"), Schema.Literal("failed")),
  result: Schema.optional(Schema.instanceOf(ClassificationResult)),
  error: Schema.optional(Schema.String),
}) {}

// Result from the consensus service
export class ConsensusResult extends Schema.Class<ConsensusResult>(
  "ConsensusResult",
)({
  finalClassification: Schema.Union(
    Schema.Literal("transient"),
    Schema.Literal("long-term"),
    Schema.Literal("uncertain"),
  ),
  confidence: Schema.Number.pipe(Schema.clamp(0, 1)),
  individualResults: Schema.Array(Schema.instanceOf(ClassificationAttempt)),
  successfulModels: Schema.Number,
  failedModels: Schema.Number,
}) {}
