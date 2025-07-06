/**
 * Consensus calculation service for aggregating multiple AI model classification results.
 * Implements majority voting with confidence scoring based on agreement levels.
 */
import { Context, Effect } from "effect";
import { ClassificationAttempt, ConsensusResult } from "../types";

// Service Contract
class ConsensusServiceContract extends Context.Tag("ConsensusService")<
  ConsensusServiceContract,
  {
    readonly calculateConsensus: (
      attempts: ClassificationAttempt[]
    ) => Effect.Effect<ConsensusResult, never, never>;
  }
>() {}

/**
 * Calculate confidence based on consensus strength
 * Formula: unanimous = 100%, strong majority (≥70%) = 85%, simple majority (>50%) = 67%, ties = 50%
 */
const calculateConfidence = (totalSuccessful: number, majorityVotes: number): number => {
  if (totalSuccessful === 0) return 0.1;

  const ratio = majorityVotes / totalSuccessful;

  if (ratio === 1.0) {
    // Unanimous decision (100%)
    return 1.0;
  } else if (ratio >= 0.7) {
    // Strong majority (≥70%, e.g., 7/10 = 70%, 3/4 = 75%)
    return 0.85;
  } else if (ratio > 0.5) {
    // Simple majority (>50% but <70%, e.g., 2/3 = 66.67%)
    return 0.67;
  } else {
    // Tie or minority (≤50%)
    return 0.5;
  }
};

// Service Implementation
const consensusServiceLive = {
  calculateConsensus: (attempts: ClassificationAttempt[]) =>
    Effect.sync(() => {
      // Filter successful attempts and extract their results
      const successfulAttempts = attempts.filter((attempt) => attempt.status === "success");
      const failedAttempts = attempts.filter((attempt) => attempt.status === "failed");

      // Require at least 2 successful results for consensus
      if (successfulAttempts.length < 2) {
        return new ConsensusResult({
          finalClassification: "uncertain",
          confidence: 0.1,
          individualResults: attempts,
          successfulModels: successfulAttempts.length,
          failedModels: failedAttempts.length
        });
      }

      // Count votes for each classification from successful results
      const transientVotes = successfulAttempts.filter(
        (attempt) => attempt.result?.classification === "transient"
      );
      const longTermVotes = successfulAttempts.filter(
        (attempt) => attempt.result?.classification === "long-term"
      );

      // Determine final classification based on majority vote
      let finalClassification: "transient" | "long-term" | "uncertain";
      let confidence: number;

      if (transientVotes.length > longTermVotes.length) {
        // Transient wins
        finalClassification = "transient";
        confidence = calculateConfidence(successfulAttempts.length, transientVotes.length);
      } else if (longTermVotes.length > transientVotes.length) {
        // Long-term wins
        finalClassification = "long-term";
        confidence = calculateConfidence(successfulAttempts.length, longTermVotes.length);
      } else {
        // Tie - uncertain result
        finalClassification = "uncertain";
        confidence = 0.5; // 50% confidence for ties
      }

      return new ConsensusResult({
        finalClassification,
        confidence,
        individualResults: attempts,
        successfulModels: successfulAttempts.length,
        failedModels: failedAttempts.length
      });
    })
};

// Export Contract/Instance pattern
export const ConsensusService = {
  Contract: ConsensusServiceContract,
  Instance: consensusServiceLive
};
