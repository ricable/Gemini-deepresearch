/**
 * Reflector Module
 * Handles reflection, gap analysis, and research quality evaluation
 */

import { GeminiClient } from './gemini-client.js';
import { REFLECTOR_PROMPT, getReflectionPrompt } from './prompts.js';
import { config } from './config.js';

/**
 * Reflector Class
 * Evaluates research progress and identifies gaps
 */
export class Reflector {
  constructor(geminiClient = null) {
    this.client = geminiClient || new GeminiClient();
    this.minCompletenessScore = 70;
    this.minQualityScore = 60;
  }

  /**
   * Evaluate current research progress
   * @param {string} topic - Original research topic
   * @param {Array<object>} learnings - All learnings gathered so far
   * @param {Array<object>} sources - All sources used
   * @param {number} iteration - Current iteration number
   * @returns {Promise<object>} Evaluation result
   */
  async evaluate(topic, learnings, sources, iteration) {
    // Quick check for minimum requirements
    if (learnings.length < 3) {
      return {
        isComplete: false,
        completenessScore: 20,
        qualityScore: 50,
        identifiedGaps: ['Insufficient information gathered'],
        shouldContinue: true,
        reason: 'Need more research findings',
      };
    }

    // Check against max iterations
    if (iteration >= config.research.maxIterations) {
      return {
        isComplete: true,
        completenessScore: this.estimateCompleteness(learnings),
        qualityScore: this.estimateQuality(sources),
        identifiedGaps: [],
        shouldContinue: false,
        reason: 'Maximum iterations reached',
      };
    }

    const prompt = getReflectionPrompt(topic, learnings, sources, iteration);

    try {
      const response = await this.client.generate(prompt, {
        systemInstruction: REFLECTOR_PROMPT,
      });

      return this.parseEvaluationResponse(response.text, learnings, sources);
    } catch (error) {
      console.error('Error in reflection:', error.message);
      // Fallback to heuristic evaluation
      return this.heuristicEvaluation(learnings, sources, iteration);
    }
  }

  /**
   * Parse evaluation response from LLM
   * @param {string} response - Raw response text
   * @param {Array<object>} learnings - Learnings for fallback calculation
   * @param {Array<object>} sources - Sources for fallback calculation
   * @returns {object} Parsed evaluation
   */
  parseEvaluationResponse(response, learnings, sources) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isComplete: parsed.isComplete || false,
          completenessScore: parsed.completenessScore || 50,
          qualityScore: parsed.qualityScore || 50,
          identifiedGaps: parsed.identifiedGaps || [],
          shouldContinue: parsed.shouldContinue !== false,
          reason: parsed.reason || 'Evaluation complete',
        };
      }
    } catch (error) {
      // Fall through to heuristic
    }

    return this.heuristicEvaluation(learnings, sources, 1);
  }

  /**
   * Heuristic evaluation when LLM fails
   * @param {Array<object>} learnings - Learnings gathered
   * @param {Array<object>} sources - Sources used
   * @param {number} iteration - Current iteration
   * @returns {object} Heuristic evaluation result
   */
  heuristicEvaluation(learnings, sources, iteration) {
    const completenessScore = this.estimateCompleteness(learnings);
    const qualityScore = this.estimateQuality(sources);

    const isComplete =
      completenessScore >= this.minCompletenessScore &&
      qualityScore >= this.minQualityScore;

    const shouldContinue =
      !isComplete &&
      iteration < config.research.maxIterations &&
      learnings.length < 50;

    return {
      isComplete,
      completenessScore,
      qualityScore,
      identifiedGaps: this.identifyGapsHeuristically(learnings),
      shouldContinue,
      reason: isComplete
        ? 'Sufficient research gathered'
        : 'More research recommended',
    };
  }

  /**
   * Estimate completeness score based on learnings
   * @param {Array<object>} learnings - Research learnings
   * @returns {number} Completeness score 0-100
   */
  estimateCompleteness(learnings) {
    if (!learnings || learnings.length === 0) return 0;

    let score = 0;

    // Base score from number of learnings
    score += Math.min(learnings.length * 5, 40);

    // Diversity bonus (different categories/themes)
    const themes = new Set();
    for (const learning of learnings) {
      const words = (learning.insight || learning).toLowerCase().split(/\s+/);
      words.slice(0, 3).forEach((w) => themes.add(w));
    }
    score += Math.min(themes.size, 30);

    // Data points bonus
    const hasData = learnings.some((l) => {
      const text = l.insight || l;
      return /\d+%|\$\d+|\d{4}/.test(text);
    });
    if (hasData) score += 15;

    // Expert opinions bonus
    const hasExperts = learnings.some((l) => {
      const text = (l.insight || l).toLowerCase();
      return (
        text.includes('expert') ||
        text.includes('according to') ||
        text.includes('research')
      );
    });
    if (hasExperts) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Estimate quality score based on sources
   * @param {Array<object>} sources - Research sources
   * @returns {number} Quality score 0-100
   */
  estimateQuality(sources) {
    if (!sources || sources.length === 0) return 30;

    let score = 40; // Base score for having sources

    // Number of sources bonus
    score += Math.min(sources.length * 5, 25);

    // Domain diversity
    const domains = new Set();
    for (const source of sources) {
      try {
        const url = new URL(source.url);
        domains.add(url.hostname);
      } catch {
        // Invalid URL
      }
    }
    score += Math.min(domains.size * 3, 15);

    // Authority indicators
    const authoritative = sources.filter((s) => {
      const url = (s.url || '').toLowerCase();
      return (
        url.includes('.gov') ||
        url.includes('.edu') ||
        url.includes('wikipedia') ||
        url.includes('arxiv') ||
        url.includes('nature.com') ||
        url.includes('sciencedirect')
      );
    });
    score += Math.min(authoritative.length * 5, 20);

    return Math.min(score, 100);
  }

  /**
   * Identify gaps heuristically based on learnings
   * @param {Array<object>} learnings - Current learnings
   * @returns {Array<string>} Identified gaps
   */
  identifyGapsHeuristically(learnings) {
    const gaps = [];
    const content = learnings
      .map((l) => l.insight || l)
      .join(' ')
      .toLowerCase();

    // Check for common research aspects
    const aspects = [
      { check: 'history', gap: 'Historical context and background' },
      { check: 'future', gap: 'Future trends and predictions' },
      { check: 'statistic', gap: 'Statistical data and metrics' },
      { check: 'expert', gap: 'Expert opinions and analysis' },
      { check: 'case study', gap: 'Real-world examples and case studies' },
      { check: 'challenge', gap: 'Challenges and limitations' },
      { check: 'benefit', gap: 'Benefits and advantages' },
      { check: 'comparison', gap: 'Comparative analysis' },
    ];

    for (const { check, gap } of aspects) {
      if (!content.includes(check)) {
        gaps.push(gap);
      }
    }

    return gaps.slice(0, 5);
  }

  /**
   * Determine if research should continue
   * @param {object} evaluation - Current evaluation result
   * @param {number} iteration - Current iteration number
   * @returns {boolean} Whether to continue research
   */
  shouldContinueResearch(evaluation, iteration) {
    // Always stop at max iterations
    if (iteration >= config.research.maxIterations) {
      return false;
    }

    // Stop if marked complete with good scores
    if (
      evaluation.isComplete &&
      evaluation.completenessScore >= 80 &&
      evaluation.qualityScore >= 70
    ) {
      return false;
    }

    // Continue if explicitly requested
    if (evaluation.shouldContinue) {
      return true;
    }

    // Continue if scores are too low
    return (
      evaluation.completenessScore < this.minCompletenessScore ||
      evaluation.qualityScore < this.minQualityScore
    );
  }

  /**
   * Get recommendations for improving research
   * @param {object} evaluation - Current evaluation
   * @returns {Array<string>} Recommendations
   */
  getRecommendations(evaluation) {
    const recommendations = [];

    if (evaluation.completenessScore < 50) {
      recommendations.push('Gather more diverse information on the topic');
    }

    if (evaluation.qualityScore < 50) {
      recommendations.push('Find more authoritative sources');
    }

    if (evaluation.identifiedGaps && evaluation.identifiedGaps.length > 0) {
      recommendations.push(
        `Address gaps: ${evaluation.identifiedGaps.slice(0, 3).join(', ')}`
      );
    }

    return recommendations;
  }
}

// Export singleton instance
export const reflector = new Reflector();

export default Reflector;
