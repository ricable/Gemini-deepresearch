/**
 * Claude Agent SDK Integration for Gemini Deep Research
 *
 * This module provides a bridge between the Gemini Deep Research Agent
 * and the Claude Agent SDK, enabling multi-model orchestration for
 * enhanced research and PRD generation capabilities.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { DeepResearchAgent } from '../src/research-agent.js';
import { getConfig } from '../src/config.js';

/**
 * Claude-Gemini Hybrid Agent
 *
 * Orchestrates research using Gemini for web-grounded research
 * and provides Claude-compatible interfaces for agent workflows.
 */
export class ClaudeGeminiAgent {
  constructor(config = {}) {
    this.config = {
      gemini: {
        apiKey: config.geminiApiKey || process.env.GEMINI_API_KEY,
        model: config.geminiModel || 'gemini-2.5-flash',
        ...config.gemini
      },
      research: {
        depth: config.depth || 5,
        breadth: config.breadth || 6,
        maxIterations: config.maxIterations || 5,
        ...config.research
      },
      ...config
    };

    // Initialize Gemini client
    const geminiConfig = getConfig();
    this.geminiAI = new GoogleGenerativeAI(this.config.gemini.apiKey);

    // Initialize research agent
    this.researchAgent = new DeepResearchAgent(this.config.research);

    // Agent state
    this.state = {
      initialized: false,
      currentTask: null,
      history: []
    };
  }

  /**
   * Initialize the agent
   */
  async initialize() {
    if (this.state.initialized) return;

    // Verify API keys
    if (!this.config.gemini.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    this.state.initialized = true;
    return {
      status: 'initialized',
      capabilities: [
        'deep-research',
        'web-grounded-search',
        'prd-generation',
        'sparc-methodology',
        'multi-iteration-refinement'
      ]
    };
  }

  /**
   * Execute a research task
   *
   * @param {string} topic - Research topic
   * @param {Object} options - Research options
   * @returns {Promise<Object>} Research results
   */
  async executeResearch(topic, options = {}) {
    await this.initialize();

    const taskId = `research-${Date.now()}`;
    this.state.currentTask = {
      id: taskId,
      type: 'research',
      topic,
      startTime: Date.now()
    };

    try {
      // Configure research agent with options
      if (options.depth) this.researchAgent.config.depth = options.depth;
      if (options.breadth) this.researchAgent.config.breadth = options.breadth;
      if (options.maxIterations) this.researchAgent.config.maxIterations = options.maxIterations;

      // Set up progress tracking
      const progress = [];
      if (options.onProgress) {
        this.researchAgent.config.onProgress = (status) => {
          progress.push(status);
          options.onProgress(status);
        };
      }

      // Execute research
      const result = await this.researchAgent.research(topic);

      // Add to history
      this.state.history.push({
        taskId,
        topic,
        timestamp: Date.now(),
        iterations: result.metadata.iterations,
        sources: result.sources.length
      });

      return {
        taskId,
        success: true,
        ...result,
        progress
      };

    } catch (error) {
      return {
        taskId,
        success: false,
        error: error.message
      };
    } finally {
      this.state.currentTask = null;
    }
  }

  /**
   * Generate content using Gemini
   *
   * @param {string} prompt - Generation prompt
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated content
   */
  async generateContent(prompt, options = {}) {
    await this.initialize();

    const model = this.geminiAI.getGenerativeModel({
      model: options.model || this.config.gemini.model,
      generationConfig: {
        maxOutputTokens: options.maxTokens || 8192,
        temperature: options.temperature || 0.7,
        topP: options.topP || 0.95,
        topK: options.topK || 40
      }
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Generate content with web search grounding
   *
   * @param {string} prompt - Generation prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated content with sources
   */
  async generateWithSearch(prompt, options = {}) {
    await this.initialize();

    const model = this.geminiAI.getGenerativeModel({
      model: options.model || this.config.gemini.model,
      generationConfig: {
        maxOutputTokens: options.maxTokens || 8192,
        temperature: options.temperature || 0.7
      },
      tools: [{
        googleSearch: {}
      }]
    });

    const result = await model.generateContent(prompt);
    const response = result.response;

    // Extract sources from grounding metadata
    const sources = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      for (const chunk of response.candidates[0].groundingMetadata.groundingChunks) {
        if (chunk.web) {
          sources.push({
            url: chunk.web.uri,
            title: chunk.web.title || 'Untitled'
          });
        }
      }
    }

    return {
      content: response.text(),
      sources: [...new Map(sources.map(s => [s.url, s])).values()]
    };
  }

  /**
   * Execute a multi-step agent workflow
   *
   * @param {Array<Object>} steps - Workflow steps
   * @param {Object} context - Workflow context
   * @returns {Promise<Object>} Workflow results
   */
  async executeWorkflow(steps, context = {}) {
    await this.initialize();

    const results = [];
    let currentContext = { ...context };

    for (const [index, step] of steps.entries()) {
      const stepResult = await this.executeStep(step, currentContext);

      results.push({
        stepIndex: index,
        stepName: step.name,
        ...stepResult
      });

      // Update context with step results
      currentContext = {
        ...currentContext,
        previousSteps: results,
        [step.outputKey || `step${index}`]: stepResult.output
      };

      // Early exit on failure if required
      if (!stepResult.success && step.required) {
        break;
      }
    }

    return {
      success: results.every(r => r.success),
      steps: results,
      finalContext: currentContext
    };
  }

  /**
   * Execute a single workflow step
   *
   * @private
   */
  async executeStep(step, context) {
    try {
      let output;

      switch (step.type) {
        case 'research':
          output = await this.executeResearch(
            this.interpolateTemplate(step.topic, context),
            step.options || {}
          );
          break;

        case 'generate':
          output = await this.generateContent(
            this.interpolateTemplate(step.prompt, context),
            step.options || {}
          );
          break;

        case 'generate-with-search':
          output = await this.generateWithSearch(
            this.interpolateTemplate(step.prompt, context),
            step.options || {}
          );
          break;

        case 'custom':
          output = await step.execute(context);
          break;

        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      return {
        success: true,
        output
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Interpolate template strings with context
   *
   * @private
   */
  interpolateTemplate(template, context) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] !== undefined ? context[key] : match;
    });
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      initialized: this.state.initialized,
      currentTask: this.state.currentTask,
      historyCount: this.state.history.length,
      capabilities: this.state.initialized ? [
        'deep-research',
        'web-grounded-search',
        'prd-generation',
        'workflow-execution'
      ] : []
    };
  }

  /**
   * Get agent history
   */
  getHistory(limit = 10) {
    return this.state.history.slice(-limit);
  }

  /**
   * Reset agent state
   */
  reset() {
    this.state = {
      initialized: this.state.initialized,
      currentTask: null,
      history: []
    };
  }
}

/**
 * Create a pre-configured Claude-Gemini agent for PRD generation
 */
export function createPRDAgent(config = {}) {
  return new ClaudeGeminiAgent({
    ...config,
    research: {
      depth: 5,
      breadth: 7,
      maxIterations: 6,
      ...config.research
    }
  });
}

/**
 * Create a pre-configured Claude-Gemini agent for quick research
 */
export function createQuickResearchAgent(config = {}) {
  return new ClaudeGeminiAgent({
    ...config,
    research: {
      depth: 3,
      breadth: 4,
      maxIterations: 3,
      ...config.research
    }
  });
}

/**
 * Export default agent instance
 */
export default ClaudeGeminiAgent;
