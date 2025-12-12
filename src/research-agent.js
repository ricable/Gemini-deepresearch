/**
 * Deep Research Agent - Main Orchestrator
 * Coordinates the iterative research process using Gemini AI
 */

import { GeminiClient } from './gemini-client.js';
import { QueryGenerator } from './query-generator.js';
import { ContentProcessor } from './content-processor.js';
import { Reflector } from './reflector.js';
import { ReportGenerator } from './report-generator.js';
import { config } from './config.js';

/**
 * Research State - tracks the current state of research
 */
class ResearchState {
  constructor(topic) {
    this.topic = topic;
    this.learnings = [];
    this.sources = [];
    this.queries = [];
    this.iteration = 0;
    this.startTime = Date.now();
    this.status = 'initialized';
    this.evaluation = null;
  }

  addLearning(insight, sourceUrl = null) {
    this.learnings.push({
      insight,
      sourceUrl,
      iteration: this.iteration,
      timestamp: Date.now(),
    });
  }

  addSource(url, title = null) {
    if (url && !this.sources.find((s) => s.url === url)) {
      this.sources.push({ url, title, iteration: this.iteration });
    }
  }

  addQuery(query) {
    this.queries.push({ query, iteration: this.iteration });
  }

  getElapsedTime() {
    return Date.now() - this.startTime;
  }

  getLearningTexts() {
    return this.learnings.map((l) => l.insight);
  }

  toJSON() {
    return {
      topic: this.topic,
      learningsCount: this.learnings.length,
      sourcesCount: this.sources.length,
      iterations: this.iteration,
      elapsedMs: this.getElapsedTime(),
      status: this.status,
    };
  }
}

/**
 * Deep Research Agent Class
 * Main orchestrator for iterative research
 */
export class DeepResearchAgent {
  constructor(options = {}) {
    this.client = options.geminiClient || new GeminiClient();
    this.queryGenerator = new QueryGenerator(this.client);
    this.contentProcessor = new ContentProcessor(this.client);
    this.reflector = new Reflector(this.client);
    this.reportGenerator = new ReportGenerator(this.client);

    this.depth = options.depth || config.research.depth;
    this.breadth = options.breadth || config.research.breadth;
    this.maxIterations = options.maxIterations || config.research.maxIterations;

    this.onProgress = options.onProgress || (() => {});
    this.onIteration = options.onIteration || (() => {});
  }

  /**
   * Execute deep research on a topic
   * @param {string} topic - The research topic
   * @param {object} options - Research options
   * @returns {Promise<object>} Research report
   */
  async research(topic, options = {}) {
    const state = new ResearchState(topic);
    state.status = 'researching';

    this.onProgress({ type: 'start', topic, state: state.toJSON() });

    try {
      // Phase 1: Initial query generation
      await this.executeQueryGeneration(state, options);

      // Phase 2: Iterative research loop
      await this.executeResearchLoop(state, options);

      // Phase 3: Report generation
      state.status = 'generating_report';
      this.onProgress({ type: 'phase', phase: 'report_generation', state: state.toJSON() });

      const report = await this.generateFinalReport(state);

      state.status = 'complete';
      this.onProgress({ type: 'complete', state: state.toJSON(), report });

      return report;
    } catch (error) {
      state.status = 'error';
      this.onProgress({ type: 'error', error: error.message, state: state.toJSON() });
      throw error;
    }
  }

  /**
   * Execute initial query generation phase
   * @param {ResearchState} state - Current research state
   * @param {object} options - Options
   */
  async executeQueryGeneration(state, options) {
    this.onProgress({ type: 'phase', phase: 'query_generation', state: state.toJSON() });

    const queries = await this.queryGenerator.generateInitialQueries(
      state.topic,
      this.breadth
    );

    for (const query of queries) {
      state.addQuery(query);
    }

    this.onProgress({
      type: 'queries_generated',
      count: queries.length,
      queries,
      state: state.toJSON(),
    });
  }

  /**
   * Execute the main research loop
   * @param {ResearchState} state - Current research state
   * @param {object} options - Options
   */
  async executeResearchLoop(state, options) {
    while (state.iteration < this.maxIterations) {
      state.iteration++;
      this.onProgress({
        type: 'iteration_start',
        iteration: state.iteration,
        state: state.toJSON(),
      });

      // Get queries for this iteration
      const iterationQueries = state.queries
        .filter((q) => q.iteration === state.iteration - 1 || state.iteration === 1)
        .map((q) => q.query)
        .slice(0, this.breadth);

      if (iterationQueries.length === 0) {
        // Generate new queries based on gaps
        const evaluation = state.evaluation || { identifiedGaps: [] };
        const newQueries = await this.queryGenerator.generateFollowUpQueries(
          state.topic,
          state.getLearningTexts(),
          evaluation.identifiedGaps,
          Math.ceil(this.breadth / 2)
        );

        for (const query of newQueries) {
          state.addQuery(query);
          iterationQueries.push(query);
        }
      }

      // Execute searches and process results
      await this.executeSearches(state, iterationQueries);

      this.onIteration({
        iteration: state.iteration,
        learnings: state.learnings.length,
        sources: state.sources.length,
      });

      // Reflect on progress
      state.evaluation = await this.reflector.evaluate(
        state.topic,
        state.learnings,
        state.sources,
        state.iteration
      );

      this.onProgress({
        type: 'reflection',
        evaluation: state.evaluation,
        state: state.toJSON(),
      });

      // Check if we should continue
      if (!this.reflector.shouldContinueResearch(state.evaluation, state.iteration)) {
        this.onProgress({
          type: 'research_complete',
          reason: state.evaluation.reason,
          state: state.toJSON(),
        });
        break;
      }

      // Generate follow-up queries for next iteration
      if (state.evaluation.identifiedGaps.length > 0) {
        const followUpQueries = await this.queryGenerator.generateFollowUpQueries(
          state.topic,
          state.getLearningTexts(),
          state.evaluation.identifiedGaps,
          Math.ceil(this.breadth / 2)
        );

        for (const query of followUpQueries) {
          state.addQuery(query);
        }
      }
    }
  }

  /**
   * Execute searches for a set of queries
   * @param {ResearchState} state - Current research state
   * @param {Array<string>} queries - Queries to execute
   */
  async executeSearches(state, queries) {
    const searchPromises = queries.map(async (query) => {
      try {
        this.onProgress({ type: 'searching', query, state: state.toJSON() });

        // Use Gemini with search grounding
        const result = await this.client.searchAndGenerate(
          `Research and provide detailed information about: ${query}

Provide comprehensive, factual information including:
- Key facts and definitions
- Recent developments (2024-2025)
- Expert opinions and analysis
- Statistics and data points
- Different perspectives on the topic

Be thorough and cite your sources.`
        );

        // Process the result
        const processed = await this.contentProcessor.processSearchResult(
          result,
          query
        );

        // Add learnings to state
        for (const insight of processed.insights) {
          if (insight && insight.length > 20) {
            state.addLearning(
              insight,
              processed.sources[0]?.url || null
            );
          }
        }

        for (const dataPoint of processed.dataPoints) {
          if (dataPoint && dataPoint.length > 10) {
            state.addLearning(
              dataPoint,
              processed.sources[0]?.url || null
            );
          }
        }

        // Add sources to state
        for (const source of processed.sources) {
          state.addSource(source.url, source.title);
        }

        // Also add sources from Gemini grounding
        for (const source of result.sources) {
          state.addSource(source.url, source.title);
        }

        this.onProgress({
          type: 'search_complete',
          query,
          insightsFound: processed.insights.length,
          state: state.toJSON(),
        });

        return { success: true, query, processed };
      } catch (error) {
        this.onProgress({
          type: 'search_error',
          query,
          error: error.message,
          state: state.toJSON(),
        });
        return { success: false, query, error: error.message };
      }
    });

    await Promise.all(searchPromises);
  }

  /**
   * Generate the final research report
   * @param {ResearchState} state - Final research state
   * @returns {Promise<object>} Generated report
   */
  async generateFinalReport(state) {
    const metadata = {
      iterations: state.iteration,
      sourceCount: state.sources.length,
      learningsCount: state.learnings.length,
      elapsedTime: state.getElapsedTime(),
      depth: this.depth,
      breadth: this.breadth,
    };

    const report = await this.reportGenerator.generateReport(
      state.topic,
      state.learnings,
      state.sources,
      metadata
    );

    return report;
  }

  /**
   * Get a quick summary without full research
   * @param {string} topic - Topic to summarize
   * @returns {Promise<string>} Quick summary
   */
  async quickSummary(topic) {
    const result = await this.client.searchAndGenerate(
      `Provide a brief, factual overview of: ${topic}

Include:
- Definition and key concepts
- Current state/status
- Main considerations
- Recent developments

Keep it concise (2-3 paragraphs).`
    );

    return {
      summary: result.text,
      sources: result.sources,
    };
  }
}

/**
 * Factory function to create a configured research agent
 * @param {object} options - Configuration options
 * @returns {DeepResearchAgent} Configured agent
 */
export function createResearchAgent(options = {}) {
  return new DeepResearchAgent(options);
}

// Export singleton with default configuration
export const researchAgent = new DeepResearchAgent();

export default DeepResearchAgent;
