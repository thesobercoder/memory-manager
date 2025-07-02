import { Schema } from "effect";

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
}) {
  static empty() {
    return new OpenMemoryFilterResponse({
      items: [],
      total: 0,
      page: 0,
      size: 0,
      pages: 0
    });
  }
}

export class OpenMemoryFilterRequest extends Schema.Class<OpenMemoryFilterRequest>("OpenMemoryFilterRequest")({
  page: Schema.Number,
  size: Schema.Number,
  sort_column: Schema.String,
  sort_direction: Schema.Union(Schema.Literal("asc"), Schema.Literal("desc"))
}) {
  static default() {
    return new OpenMemoryFilterRequest({
      page: 1,
      size: 25,
      sort_column: "created_at",
      sort_direction: "desc"
    });
  }
}
