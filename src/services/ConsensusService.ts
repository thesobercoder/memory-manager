/**
 * Consensus calculation service for aggregating multiple AI model classification results.
 * Implements majority voting with confidence scoring based on average individual model confidence.
 */
import { Effect } from "effect";
import { ClassificationAttempt, ConsensusResult } from "../types";

type FinalClassification = ConsensusResult["finalClassification"];

// Helper function to calculate average confidence from votes
const averageConfidence = (votes: ClassificationAttempt[]): number => {
  const confidences = votes.map((vote) => vote.result?.confidence || 0);
  return confidences.length > 0
    ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
    : 0;
};

// Functional consensus calculation
const calculateConsensusResult = (
  transientVotes: ClassificationAttempt[],
  longTermVotes: ClassificationAttempt[],
  allSuccessful: ClassificationAttempt[],
): { classification: FinalClassification; confidence: number } => {
  if (transientVotes.length > longTermVotes.length) {
    return {
      classification: "transient",
      confidence: averageConfidence(transientVotes),
    };
  }

  if (longTermVotes.length > transientVotes.length) {
    return {
      classification: "long-term",
      confidence: averageConfidence(longTermVotes),
    };
  }

  // Tie case
  return {
    classification: "uncertain",
    confidence: averageConfidence(allSuccessful) || 0.5,
  };
};

export class ConsensusService extends Effect.Service<ConsensusService>()(
  "ConsensusService",
  {
    effect: Effect.succeed({
      calculateConsensus: (attempts: ClassificationAttempt[]) =>
        Effect.sync(() => {
          // Filter successful attempts and extract their results
          const successfulAttempts = attempts.filter(
            (attempt) => attempt.status === "success",
          );
          const failedAttempts = attempts.filter(
            (attempt) => attempt.status === "failed",
          );

          // Require at least 2 successful results for consensus
          if (successfulAttempts.length < 2) {
            return new ConsensusResult({
              finalClassification: "uncertain",
              confidence: 0.1,
              individualResults: attempts,
              successfulModels: successfulAttempts.length,
              failedModels: failedAttempts.length,
            });
          }

          // Count votes for each classification from successful results
          const transientVotes = successfulAttempts.filter(
            (attempt) => attempt.result?.classification === "transient",
          );
          const longTermVotes = successfulAttempts.filter(
            (attempt) => attempt.result?.classification === "long-term",
          );

          // Calculate consensus using functional approach
          const result = calculateConsensusResult(
            transientVotes,
            longTermVotes,
            successfulAttempts,
          );

          return new ConsensusResult({
            finalClassification: result.classification,
            confidence: result.confidence,
            individualResults: attempts,
            successfulModels: successfulAttempts.length,
            failedModels: failedAttempts.length,
          });
        }),
    }),
  },
) {}
