import { HttpClient } from "@effect/platform";
import { test } from "bun:test";
import { ConfigError, Effect, Exit, Layer } from "effect";
import { OpenMemory } from "../../src/services/OpenMemory";
import { defaultConfigLayer } from "./mock-config";

// =============================================================================
// IDIOMATIC EFFECT TESTING WRAPPER FOR BUN
// =============================================================================

/**
 * Idiomatic Effect testing wrapper that provides @effect/vitest-style API for Bun
 */
export const it = {
  /**
   * Test an Effect that should succeed
   * @param name Test name
   * @param effectFn Effect function that should succeed
   * @param layers Optional additional layers to provide
   */
  effect: <A, E, R = never>(
    name: string,
    effectFn: () => Effect.Effect<A, E, R>,
    layers?: Layer.Layer<HttpClient.HttpClient>
  ) => {
    test(name, async () => {
      const testLayer = layers ?
        Layer.mergeAll(defaultConfigLayer, layers) :
        defaultConfigLayer;

      await Effect.runPromise(
        effectFn().pipe(
          Effect.provideService(OpenMemory.Contract, OpenMemory.Instance),
          Effect.provide(testLayer)
        ) as Effect.Effect<A, ConfigError.ConfigError | E, never>
      );
    });
  },

  /**
   * Test an Effect that should fail with a specific error
   * @param name Test name
   * @param effectFn Effect function that should fail
   * @param layers Layers to provide
   * @param assertion Function to assert on the error
   */
  effectFail: <A, E, R = never>(
    name: string,
    effectFn: () => Effect.Effect<A, E, R>,
    layers: Layer.Layer<HttpClient.HttpClient>,
    assertion: (error: E | ConfigError.ConfigError) => void
  ) => {
    test(name, async () => {
      const testLayer = Layer.mergeAll(defaultConfigLayer, layers);

      const result = await Effect.runPromiseExit(
        effectFn().pipe(
          Effect.provideService(OpenMemory.Contract, OpenMemory.Instance),
          Effect.provide(testLayer)
        ) as Effect.Effect<A, ConfigError.ConfigError | E, never>
      );

      if (Exit.isSuccess(result)) {
        throw new Error("Expected effect to fail but it succeeded");
      }

      if (result.cause._tag === "Fail") {
        assertion(result.cause.error);
      } else {
        throw new Error(`Expected Fail but got ${result.cause._tag}`);
      }
    });
  },

  /**
   * Test an Effect that should succeed, with custom layer setup
   * @param name Test name
   * @param effectFn Effect function
   * @param layerFn Function that creates the test layer setup
   */
  effectWith: <A, E, R>(
    name: string,
    effectFn: () => Effect.Effect<A, E, R>,
    layerFn: () => Layer.Layer<R>
  ) => {
    test(name, async () => {
      await Effect.runPromise(effectFn().pipe(Effect.provide(layerFn())));
    });
  }
};
