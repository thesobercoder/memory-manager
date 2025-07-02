import { Data, Schema } from "effect";

export class OpenMemoryFilterResponse extends Schema.Class<OpenMemoryFilterResponse>("OpenMemoryFilterResponse")({
  items: Schema.Array(Schema.Struct({
    id: Schema.String,
    content: Schema.String,
    created_at: Schema.Number,
    state: Schema.String,
    app_id: Schema.String,
    app_name: Schema.String,
    categories: Schema.Array(Schema.String),
    metadata_: Schema.Record({
      key: Schema.String,
      value: Schema.Unknown
    })
  })),
  total: Schema.Number,
  page: Schema.Number,
  size: Schema.Number,
  pages: Schema.Number
}) {}

export class OpenMemoryFilterRequest extends Schema.Class<OpenMemoryFilterRequest>("OpenMemoryFilterRequest")({
  page: Schema.Number,
  size: Schema.Number,
  sort_column: Schema.String,
  sort_direction: Schema.Union(Schema.Literal("asc"), Schema.Literal("desc"))
}) {}

export class OpenMemoryServiceError extends Data.TaggedError("OpenMemoryServiceError")<{
  readonly cause?: unknown;
  readonly message?: string;
}> {}
