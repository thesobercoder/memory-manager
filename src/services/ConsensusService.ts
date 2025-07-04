import { Context, Effect } from "effect";
import { ClassificationResult, ConsensusResult } from "../types";

// Service Contract
class ConsensusServiceContract extends Context.Tag("ConsensusService")<
  ConsensusServiceContract,
  {
    readonly calculateConsensus: (
      results: ClassificationResult[]
    ) => Effect.Effect<ConsensusResult, never, never>;
  }
>() {}

/**
 * Calculate confidence based on consensus strength
 * Simple formula: unanimous = 100%, majority = 67%, minimal consensus = 50%
 */
const calculateConfidence = (totalSuccessful: number, majorityVotes: number): number => {
  if (totalSuccessful === 0) return 0.1;

  const ratio = majorityVotes / totalSuccessful;

  if (ratio === 1.0) {
    // Unanimous decision (100%)
    return 1.0;
  } else if (ratio >= 0.67) {
    // Strong majority (67-99%)
    return 0.85;
  } else if (ratio > 0.5) {
    // Simple majority (51-66%)
    return 0.67;
  } else {
    // Tie or minority (≤50%)
    return 0.5;
  }
};

// Service Implementation
const consensusServiceLive = {
  calculateConsensus: (results: ClassificationResult[]) =>
    Effect.gen(function*() {
      // Satisfy ESLint require-yield rule
      yield* Effect.void;

      // Filter successful results only
      const successfulResults = results.filter((result) => result.status === "success");
      const failedResults = results.filter((result) => result.status === "failed");

      // Require at least 2 successful results for consensus
      if (successfulResults.length < 2) {
        return new ConsensusResult({
          finalClassification: "uncertain",
          confidence: 0.1,
          individualResults: results,
          successfulModels: successfulResults.length,
          failedModels: failedResults.length
        });
      }

      // Count votes for each classification
      const transientVotes = successfulResults.filter(
        (result) => result.classification === "transient"
      );
      const longTermVotes = successfulResults.filter(
        (result) => result.classification === "long-term"
      );

      // Determine final classification based on majority vote
      let finalClassification: "transient" | "long-term" | "uncertain";
      let confidence: number;

      if (transientVotes.length > longTermVotes.length) {
        // Transient wins
        finalClassification = "transient";
        confidence = calculateConfidence(successfulResults.length, transientVotes.length);
      } else if (longTermVotes.length > transientVotes.length) {
        // Long-term wins
        finalClassification = "long-term";
        confidence = calculateConfidence(successfulResults.length, longTermVotes.length);
      } else {
        // Tie - uncertain result
        finalClassification = "uncertain";
        confidence = 0.5; // 50% confidence for ties
      }

      return new ConsensusResult({
        finalClassification,
        confidence,
        individualResults: results,
        successfulModels: successfulResults.length,
        failedModels: failedResults.length
      });
    })
};

// Export Contract/Instance pattern
export const ConsensusService = {
  Contract: ConsensusServiceContract,
  Instance: consensusServiceLive
};
