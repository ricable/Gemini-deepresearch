/**
 * Query Generator Module
 * Generates optimized search queries for research topics
 */

import { GeminiClient } from './gemini-client.js';
import { config } from './config.js';
import {
  RESEARCH_STRATEGIST_PROMPT,
  QUERY_REFINER_PROMPT,
  getQueryGenerationPrompt,
} from './prompts.js';

/**
 * Query Generator Class
 * Handles generation of initial and follow-up search queries
 */
export class QueryGenerator {
  constructor(geminiClient = null) {
    this.client = geminiClient || new GeminiClient();
    this.breadth = config.research.breadth;
  }

  /**
   * Generate initial search queries for a research topic
   * @param {string} topic - The research topic
   * @param {number} numQueries - Number of queries to generate
   * @returns {Promise<Array<string>>} Array of search queries
   */
  async generateInitialQueries(topic, numQueries = null) {
    const count = numQueries || this.breadth;

    const prompt = getQueryGenerationPrompt(topic, count, []);

    try {
      const response = await this.client.generate(prompt, {
        systemInstruction: RESEARCH_STRATEGIST_PROMPT,
        useCache: false, // Don't cache query generation
      });

      const queries = this.parseQueriesFromResponse(response.text);

      // Ensure we have the requested number of queries
      if (queries.length < count) {
        // Add the topic itself as a fallback query
        queries.push(topic);
      }

      return queries.slice(0, count);
    } catch (error) {
      console.error('Error generating queries:', error.message);
      // Return fallback queries based on the topic
      return this.generateFallbackQueries(topic, count);
    }
  }

  /**
   * Generate follow-up queries based on existing learnings
   * @param {string} topic - The research topic
   * @param {Array<string>} existingLearnings - Previous findings
   * @param {Array<string>} gaps - Identified knowledge gaps
   * @param {number} numQueries - Number of queries to generate
   * @returns {Promise<Array<string>>} Array of follow-up queries
   */
  async generateFollowUpQueries(topic, existingLearnings, gaps, numQueries = null) {
    const count = numQueries || Math.ceil(this.breadth / 2);

    const prompt = `Based on the following research topic and identified gaps, generate ${count} targeted follow-up search queries.

TOPIC: ${topic}

EXISTING LEARNINGS:
${existingLearnings.slice(-10).map((l, i) => `${i + 1}. ${l}`).join('\n')}

IDENTIFIED GAPS:
${gaps.map((g, i) => `${i + 1}. ${g}`).join('\n')}

Generate ${count} follow-up queries as a JSON array of strings that will:
1. Fill the identified knowledge gaps
2. Find more authoritative sources
3. Verify uncertain information
4. Explore new angles suggested by current findings

Output format: ["query 1", "query 2", ...]`;

    try {
      const response = await this.client.generate(prompt, {
        systemInstruction: QUERY_REFINER_PROMPT,
        useCache: false,
      });

      const queries = this.parseQueriesFromResponse(response.text);
      return queries.slice(0, count);
    } catch (error) {
      console.error('Error generating follow-up queries:', error.message);
      // Generate queries from gaps
      return gaps.slice(0, count).map((gap) => `${topic} ${gap}`);
    }
  }

  /**
   * Parse queries from LLM response
   * @param {string} response - Raw response text
   * @returns {Array<string>} Parsed queries
   */
  parseQueriesFromResponse(response) {
    try {
      // Try to find JSON array in the response
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.filter((q) => typeof q === 'string' && q.trim().length > 0);
        }
      }

      // Fallback: split by newlines and clean up
      const lines = response.split('\n');
      const queries = [];

      for (const line of lines) {
        // Remove numbering, quotes, and clean up
        const cleaned = line
          .replace(/^\d+[\.\)]\s*/, '')
          .replace(/^["'\-\*]\s*/, '')
          .replace(/["']$/g, '')
          .trim();

        if (cleaned.length > 10 && cleaned.length < 200) {
          queries.push(cleaned);
        }
      }

      return queries;
    } catch (error) {
      console.error('Error parsing queries:', error.message);
      return [];
    }
  }

  /**
   * Generate fallback queries when LLM fails
   * @param {string} topic - The research topic
   * @param {number} count - Number of queries to generate
   * @returns {Array<string>} Fallback queries
   */
  generateFallbackQueries(topic, count) {
    const templates = [
      `${topic}`,
      `${topic} overview introduction`,
      `${topic} latest research 2024 2025`,
      `${topic} expert analysis`,
      `${topic} benefits advantages`,
      `${topic} challenges problems`,
      `${topic} future trends predictions`,
      `${topic} case studies examples`,
      `${topic} statistics data`,
      `${topic} best practices recommendations`,
    ];

    return templates.slice(0, count);
  }

  /**
   * Validate and clean a query
   * @param {string} query - Query to validate
   * @returns {string|null} Cleaned query or null if invalid
   */
  validateQuery(query) {
    if (!query || typeof query !== 'string') return null;

    const cleaned = query.trim();

    // Check length constraints
    if (cleaned.length < 3 || cleaned.length > 500) return null;

    // Check for minimum word count
    const words = cleaned.split(/\s+/);
    if (words.length < 1) return null;

    return cleaned;
  }

  /**
   * Deduplicate queries, keeping most specific versions
   * @param {Array<string>} queries - Array of queries
   * @returns {Array<string>} Deduplicated queries
   */
  deduplicateQueries(queries) {
    const seen = new Set();
    const result = [];

    for (const query of queries) {
      const normalized = query.toLowerCase().trim();
      // Simple deduplication - could be enhanced with semantic similarity
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(query);
      }
    }

    return result;
  }
}

// Export singleton instance
export const queryGenerator = new QueryGenerator();

export default QueryGenerator;
