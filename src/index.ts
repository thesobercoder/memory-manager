import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Config, Effect } from "effect";

// Define a program that loads HOST and PORT configuration
const program = Effect.gen(function* () {
  const host = yield* Config.string("HOST"); // Read as a string
  const port = yield* Config.number("PORT"); // Read as a number

  yield* Effect.log(`Application started: ${host}:${port}`);
});

BunRuntime.runMain(program.pipe(Effect.provide(BunContext.layer)));
