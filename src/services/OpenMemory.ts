/**
 * OpenMemory API integration service for retrieving and filtering memory data.
 * Handles authentication, API communication, and response parsing.
 */
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { Config, Effect } from "effect";
import {
  OpenMemoryDeleteRequest,
  OpenMemoryDeleteResponse,
  OpenMemoryFilterRequest,
  OpenMemoryFilterResponse,
} from "../types";

export class OpenMemory extends Effect.Service<OpenMemory>()(
  "OpenMemoryService",
  {
    effect: Effect.succeed({
      getMemories: (request?: OpenMemoryFilterRequest) =>
        Effect.gen(function* () {
          const httpClient = yield* HttpClient.HttpClient;
          const bearerToken = yield* Config.redacted("OPENMEMORY_BEARER_TOKEN");
          const baseUrl = yield* Config.string("OPENMEMORY_BASE_URL");

          const defaultRequest = OpenMemoryFilterRequest.default();

          const data = yield* HttpClientRequest.post(
            `${baseUrl}/memories/filter`,
          ).pipe(
            HttpClientRequest.bearerToken(bearerToken),
            HttpClientRequest.acceptJson,
            HttpClientRequest.setHeader("Content-Type", "application/json"),
            HttpClientRequest.bodyJson(request ?? defaultRequest),
            Effect.flatMap(httpClient.execute),
            Effect.flatMap(
              HttpClientResponse.schemaBodyJson(OpenMemoryFilterResponse),
            ),
          );

          return data;
        }),
      deleteMemories: (request: OpenMemoryDeleteRequest) =>
        Effect.gen(function* () {
          const httpClient = yield* HttpClient.HttpClient;
          const bearerToken = yield* Config.redacted("OPENMEMORY_BEARER_TOKEN");
          const baseUrl = yield* Config.string("OPENMEMORY_BASE_URL");

          const data = yield* HttpClientRequest.del(
            `${baseUrl}/memories/`,
          ).pipe(
            HttpClientRequest.bearerToken(bearerToken),
            HttpClientRequest.acceptJson,
            HttpClientRequest.setHeader("Content-Type", "application/json"),
            HttpClientRequest.bodyJson(request),
            Effect.flatMap(httpClient.execute),
            Effect.flatMap(
              HttpClientResponse.schemaBodyJson(OpenMemoryDeleteResponse),
            ),
          );

          return data;
        }),
    }),
  },
) {}
