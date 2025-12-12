/**
 * Deep Research Agent - Main Orchestrator
 * Coordinates the iterative research process using Gemini AI
 * Enhanced with RuVector for vector memory, knowledge graphs, and self-learning
 */

import { GeminiClient } from './gemini-client.js';
import { QueryGenerator } from './query-generator.js';
import { ContentProcessor } from './content-processor.js';
import { Reflector } from './reflector.js';
import { ReportGenerator } from './report-generator.js';
import { config } from './config.js';
import { RuVectorIntegration } from './ruvector-integration.js';

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
 * Enhanced with RuVector for persistent memory and self-learning
 */
export class DeepResearchAgent {
  constructor(options = {}) {
    this.client = options.geminiClient || new GeminiClient();
    this.queryGenerator = new QueryGenerator(this.client);
    this.contentProcessor = new ContentProcessor(this.client);
    this.reflector = new Reflector(this.client);
    this.reportGenerator = new ReportGenerator(this.client);

    // RuVector integration for enhanced capabilities
    this.ruvector = new RuVectorIntegration();
    this.useRuvector = options.useRuvector !== false;

    this.depth = options.depth || config.research.depth;
    this.breadth = options.breadth || config.research.breadth;
    this.maxIterations = options.maxIterations || config.research.maxIterations;

    this.onProgress = options.onProgress || (() => {});
    this.onIteration = options.onIteration || (() => {});
  }

  /**
   * Initialize RuVector components
   * @returns {Promise<void>}
   */
  async initializeRuvector() {
    if (this.useRuvector && !this.ruvector.isInitialized) {
      await this.ruvector.initialize();
    }
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
      // Initialize RuVector for memory and learning
      await this.initializeRuvector();

      // Use smart routing to determine optimal parameters
      if (this.useRuvector) {
        const routing = this.ruvector.router.route(topic);
        this.onProgress({ type: 'routing', routing, state: state.toJSON() });

        // Apply routing recommendations if not overridden
        if (!options.depth) this.depth = routing.recommendedDepth;
        if (!options.breadth) this.breadth = routing.recommendedBreadth;

        // Add topic to knowledge graph
        state.topicNodeId = this.ruvector.graph.addTopic(topic, {
          depth: this.depth,
          breadth: this.breadth,
        });

        // Check for prior research on similar topics
        const priorKnowledge = await this.ruvector.memory.search(topic, 5);
        if (priorKnowledge.length > 0) {
          this.onProgress({
            type: 'prior_knowledge',
            count: priorKnowledge.length,
            state: state.toJSON(),
          });

          // Add prior knowledge as initial learnings
          for (const knowledge of priorKnowledge) {
            if (knowledge.score > 0.7) {
              state.addLearning(`[Prior Research] ${knowledge.content}`, null);
            }
          }
        }
      }

      // Phase 1: Initial query generation
      await this.executeQueryGeneration(state, options);

      // Phase 2: Iterative research loop
      await this.executeResearchLoop(state, options);

      // Phase 3: Report generation
      state.status = 'generating_report';
      this.onProgress({ type: 'phase', phase: 'report_generation', state: state.toJSON() });

      const report = await this.generateFinalReport(state);

      // Store learnings in RuVector memory for future research
      if (this.useRuvector) {
        await this.storeLearningsInMemory(state);
      }

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
   * Store research learnings in RuVector memory
   * @param {ResearchState} state - Final research state
   */
  async storeLearningsInMemory(state) {
    const findings = state.learnings.map((learning) => ({
      content: learning.insight,
      metadata: {
        topic: state.topic,
        sourceUrl: learning.sourceUrl,
        iteration: learning.iteration,
        type: 'research_finding',
      },
    }));

    await this.ruvector.memory.storeBatch(findings);

    // Update knowledge graph
    for (const learning of state.learnings) {
      const sourceId = learning.sourceUrl
        ? this.ruvector.graph.addSource(learning.sourceUrl)
        : null;

      this.ruvector.graph.addFinding(
        learning.insight,
        state.topicNodeId,
        sourceId
      );
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

  /**
   * Provide feedback on research results for self-learning
   * @param {string} topic - Research topic
   * @param {object} result - Research result
   * @param {number} rating - User rating (1-5)
   * @param {string} correction - Optional correction or feedback
   */
  provideFeedback(topic, result, rating, correction = null) {
    if (this.useRuvector) {
      this.ruvector.learner.recordFeedback(topic, result, rating, correction);
    }
  }

  /**
   * Find related research topics from the knowledge graph
   * @param {string} topic - Topic to find relations for
   * @returns {Promise<Array<object>>} Related topics
   */
  async findRelatedTopics(topic) {
    if (!this.useRuvector) return [];

    await this.initializeRuvector();
    const topicId = `topic:${topic.toLowerCase().replace(/\s+/g, '_')}`;
    return this.ruvector.graph.findRelatedTopics(topicId, 2);
  }

  /**
   * Search prior research from memory
   * @param {string} query - Search query
   * @param {number} k - Number of results
   * @returns {Promise<Array<object>>} Prior research findings
   */
  async searchPriorResearch(query, k = 10) {
    if (!this.useRuvector) return [];

    await this.initializeRuvector();
    return this.ruvector.memory.search(query, k);
  }

  /**
   * Get statistics about research history and learning
   * @returns {object} Statistics
   */
  getStats() {
    if (!this.useRuvector || !this.ruvector.isInitialized) {
      return { ruvector: 'not initialized' };
    }
    return this.ruvector.getStats();
  }

  /**
   * Export knowledge graph data
   * @returns {object} Graph data
   */
  exportKnowledgeGraph() {
    if (!this.useRuvector) return { nodes: [], edges: [] };
    return this.ruvector.graph.export();
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
