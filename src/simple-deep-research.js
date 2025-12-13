/**
 * Simple Deep Research using Gemini Interactions API
 * Enhanced with DSPy.ts-inspired prompt optimization
 */

import fetch from 'node-fetch';
import { config } from './config.js';

/**
 * DSPy-inspired Query Optimizer
 * Uses structured prompts to optimize research queries
 */
class QueryOptimizer {
  /**
   * Optimize a research query using structured prompting
   * @param {string} topic - Research topic
   * @param {string} context - Additional context
   * @returns {object} Optimized query and strategy
   */
  optimize(topic, context = '') {
    // Analyze query complexity
    const words = topic.split(/\s+/).length;
    const hasQuestions = /\?/.test(topic);
    const hasTemporalContext = /\b(latest|recent|current|2024|2025|future|history)\b/i.test(topic);
    const hasComparison = /\b(vs|versus|compare|difference|better)\b/i.test(topic);

    let strategy = 'comprehensive';
    let optimizedQuery = topic;

    // Apply optimization rules (DSPy-inspired heuristics)
    if (words < 3) {
      // Expand short queries
      strategy = 'broad-exploration';
      optimizedQuery = `Provide comprehensive information about ${topic}, including definitions, applications, recent developments, and key considerations`;
    } else if (hasQuestions) {
      strategy = 'targeted-qa';
      optimizedQuery = topic; // Keep questions as-is
    } else if (hasComparison) {
      strategy = 'comparative-analysis';
      optimizedQuery = `${topic} - provide detailed comparison with pros, cons, use cases, and expert opinions`;
    } else if (hasTemporalContext) {
      strategy = 'temporal-focused';
      optimizedQuery = topic; // Temporal queries are already specific
    } else {
      strategy = 'comprehensive';
      optimizedQuery = `${topic} - include current state, key developments, applications, and expert perspectives`;
    }

    return {
      optimized_query: optimizedQuery,
      search_strategy: strategy,
      reasoning: `Applied ${strategy} strategy based on query characteristics`,
    };
  }
}

/**
 * DSPy-inspired Output Formatter
 * Structures and formats research output
 */
class OutputFormatter {
  /**
   * Format research output based on style preferences
   * @param {string} rawContent - Raw research content
   * @param {string} topic - Research topic
   * @param {string} style - Output style
   * @returns {object} Formatted output
   */
  format(rawContent, topic, style = 'comprehensive') {
    if (!rawContent) {
      return {
        formatted_output: '',
        key_insights: [],
        citations: [],
      };
    }

    // Extract key insights using pattern matching
    const insights = this.extractInsights(rawContent);

    // Extract citations/sources
    const citations = this.extractCitationPatterns(rawContent);

    // Format based on style
    let formattedOutput = rawContent;

    switch (style) {
      case 'concise':
        formattedOutput = this.createConciseSummary(rawContent, insights);
        break;
      case 'detailed':
        formattedOutput = this.createDetailedReport(rawContent, topic, insights);
        break;
      case 'summary':
        formattedOutput = this.createExecutiveSummary(rawContent, insights);
        break;
      default:
        formattedOutput = rawContent;
    }

    return {
      formatted_output: formattedOutput,
      key_insights: insights,
      citations,
    };
  }

  extractInsights(content) {
    const insights = [];

    // Look for bullet points, numbered lists, key statements
    const bulletPoints = content.match(/[•\-\*]\s+([^\n]+)/g) || [];
    const numberedPoints = content.match(/\d+\.\s+([^\n]+)/g) || [];
    const keyStatements = content.match(/(?:Key|Important|Notable|Significant)[^.!?]*[.!?]/gi) || [];

    insights.push(...bulletPoints.map(s => s.replace(/^[•\-\*]\s+/, '').trim()).slice(0, 5));
    insights.push(...numberedPoints.map(s => s.replace(/^\d+\.\s+/, '').trim()).slice(0, 5));
    insights.push(...keyStatements.slice(0, 3));

    return [...new Set(insights)].slice(0, 10); // Deduplicate and limit
  }

  extractCitationPatterns(content) {
    const citations = [];

    // Look for URLs
    const urls = content.match(/https?:\/\/[^\s]+/g) || [];
    citations.push(...urls.map(url => ({ type: 'url', value: url })));

    // Look for citation markers [1], [2], etc.
    const markers = content.match(/\[\d+\]/g) || [];
    citations.push(...markers.map(m => ({ type: 'marker', value: m })));

    return [...new Set(citations.map(c => JSON.stringify(c)))].map(c => JSON.parse(c));
  }

  createConciseSummary(content, insights) {
    const preview = content.substring(0, 500) + '...';
    const insightsList = insights.slice(0, 5).map((i, idx) => `${idx + 1}. ${i}`).join('\n');

    return `## Summary\n\n${preview}\n\n## Key Points\n\n${insightsList}`;
  }

  createDetailedReport(content, topic, insights) {
    const insightsList = insights.map((i, idx) => `${idx + 1}. ${i}`).join('\n');

    return `# Research Report: ${topic}\n\n## Executive Summary\n\n${content.substring(0, 300)}...\n\n## Key Insights\n\n${insightsList}\n\n## Full Content\n\n${content}`;
  }

  createExecutiveSummary(content, insights) {
    const topInsights = insights.slice(0, 3).map(i => `• ${i}`).join('\n');

    return `${content.substring(0, 200)}...\n\n**Key Takeaways:**\n\n${topInsights}`;
  }
}

/**
 * Simple Deep Research Client
 * Uses Gemini Interactions API for deep research with DSPy optimization
 */
export class SimpleDeepResearch {
  constructor(apiKey = config.gemini.apiKey) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/interactions';
    this.agent = 'deep-research-pro-preview-12-2025';

    // Initialize DSPy-inspired modules for optimization
    this.queryOptimizer = new QueryOptimizer();
    this.outputFormatter = new OutputFormatter();
    this.dspyInitialized = true;
  }

  /**
   * Initialize DSPy-inspired modules for prompt optimization
   */
  async initializeDSPy() {
    // Already initialized in constructor
    if (this.dspyInitialized) {
      console.log('✓ DSPy-inspired optimization modules ready');
      return;
    }

    this.queryOptimizer = new QueryOptimizer();
    this.outputFormatter = new OutputFormatter();
    this.dspyInitialized = true;
    console.log('✓ DSPy-inspired optimization modules initialized');
  }

  /**
   * Optimize a research query using DSPy-inspired optimization
   * @param {string} topic - Research topic
   * @param {string} context - Additional context
   * @returns {Promise<object>} Optimized query and strategy
   */
  async optimizeQuery(topic, context = '') {
    await this.initializeDSPy();

    try {
      const result = this.queryOptimizer.optimize(topic, context);
      return result;
    } catch (error) {
      console.warn('Query optimization failed, using original:', error.message);
      return {
        optimized_query: topic,
        search_strategy: 'comprehensive',
      };
    }
  }

  /**
   * Format research output using DSPy-inspired formatting
   * @param {string} rawContent - Raw research content
   * @param {string} topic - Research topic
   * @param {string} style - Output style preference
   * @returns {Promise<object>} Formatted output
   */
  async formatOutput(rawContent, topic, style = 'comprehensive') {
    await this.initializeDSPy();

    try {
      const result = this.outputFormatter.format(rawContent, topic, style);
      return result;
    } catch (error) {
      console.warn('Output formatting failed, using raw content:', error.message);
      return {
        formatted_output: rawContent,
        key_insights: [],
        citations: [],
      };
    }
  }

  /**
   * Create a new deep research interaction
   * @param {string} query - Research query
   * @param {object} options - Research options
   * @returns {Promise<object>} Interaction response
   */
  async createResearch(query, options = {}) {
    const {
      stream = false,
      background = true,
      useOptimization = true,
    } = options;

    // Optimize query with DSPy if enabled
    let finalQuery = query;
    let strategy = 'comprehensive';

    if (useOptimization) {
      const optimized = await this.optimizeQuery(query, options.context);
      finalQuery = optimized.optimized_query || query;
      strategy = optimized.search_strategy || 'comprehensive';

      console.log(`\n🔍 Query optimization:`);
      console.log(`  Original: ${query}`);
      console.log(`  Optimized: ${finalQuery}`);
      console.log(`  Strategy: ${strategy}\n`);
    }

    const url = stream
      ? `${this.baseUrl}?alt=sse`
      : this.baseUrl;

    const requestBody = {
      input: finalQuery,
      agent: this.agent,
      background,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    if (stream) {
      return this.handleStreamingResponse(response, query, options);
    }

    const data = await response.json();
    return { ...data, strategy };
  }

  /**
   * Handle streaming response from the API
   * @param {Response} response - Fetch response
   * @param {string} query - Original query
   * @param {object} options - Options
   * @returns {Promise<object>} Final result
   */
  async handleStreamingResponse(response, query, options) {
    const reader = response.body;
    let interactionId = null;
    let lastUpdate = null;

    for await (const chunk of reader) {
      const lines = chunk.toString().split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));

          if (data.id) interactionId = data.id;
          lastUpdate = data;

          // Emit progress event
          if (options.onProgress) {
            options.onProgress(data);
          }

          console.log(`Status: ${data.status || 'processing'}...`);
        }
      }
    }

    return lastUpdate || { id: interactionId };
  }

  /**
   * Get the status of a research interaction
   * @param {string} interactionId - Interaction ID
   * @returns {Promise<object>} Interaction status
   */
  async getStatus(interactionId) {
    const url = `${this.baseUrl}/${interactionId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-goog-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Poll for research completion
   * @param {string} interactionId - Interaction ID
   * @param {object} options - Polling options
   * @returns {Promise<object>} Final research result
   */
  async pollUntilComplete(interactionId, options = {}) {
    const {
      interval = 2000,
      maxAttempts = 150,
      onProgress = null,
    } = options;

    let attempts = 0;

    while (attempts < maxAttempts) {
      const status = await this.getStatus(interactionId);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed') {
        return status;
      }

      if (status.status === 'failed') {
        throw new Error('Research failed: ' + (status.error || 'Unknown error'));
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, interval));
      attempts++;
    }

    throw new Error('Research timed out after ' + maxAttempts + ' attempts');
  }

  /**
   * Execute a complete deep research workflow
   * @param {string} query - Research query
   * @param {object} options - Research options
   * @returns {Promise<object>} Complete research result
   */
  async research(query, options = {}) {
    const {
      outputStyle = 'comprehensive',
      useOptimization = true,
      onProgress = null,
    } = options;

    console.log(`\n🔬 Starting deep research: "${query}"\n`);

    // Step 1: Create research interaction
    const interaction = await this.createResearch(query, {
      ...options,
      background: true,
      useOptimization,
    });

    const interactionId = interaction.id;
    console.log(`✓ Research initiated (ID: ${interactionId})\n`);

    // Step 2: Poll for completion
    console.log('⏳ Waiting for research to complete...\n');

    const result = await this.pollUntilComplete(interactionId, {
      interval: options.pollInterval || 3000,
      maxAttempts: options.maxAttempts || 100,
      onProgress: (status) => {
        if (status.status === 'in_progress') {
          process.stdout.write('.');
        }
        if (onProgress) onProgress(status);
      },
    });

    console.log('\n\n✓ Research completed!\n');

    // Step 3: Extract and format results
    const rawContent = this.extractContent(result);
    const citations = this.extractCitations(result);

    // Step 4: Format output with DSPy if enabled
    let formattedResult = {
      topic: query,
      content: rawContent,
      citations,
      interactionId,
      status: result.status,
    };

    if (useOptimization && rawContent) {
      console.log('📝 Formatting output with DSPy...\n');
      const formatted = await this.formatOutput(rawContent, query, outputStyle);

      formattedResult = {
        ...formattedResult,
        formatted_content: formatted.formatted_output || rawContent,
        key_insights: formatted.key_insights || [],
        enhanced_citations: formatted.citations || citations,
      };
    }

    return formattedResult;
  }

  /**
   * Extract content from research result
   * @param {object} result - API result
   * @returns {string} Extracted content
   */
  extractContent(result) {
    if (!result.outputs || result.outputs.length === 0) {
      return '';
    }

    // Extract text from outputs
    const output = result.outputs[0];

    if (output.text) {
      return output.text;
    }

    if (output.parts) {
      return output.parts.map(part => part.text).join('\n\n');
    }

    return JSON.stringify(output, null, 2);
  }

  /**
   * Extract citations from research result
   * @param {object} result - API result
   * @returns {Array<object>} Citations
   */
  extractCitations(result) {
    const citations = [];

    if (!result.outputs || result.outputs.length === 0) {
      return citations;
    }

    const output = result.outputs[0];

    // Extract citations from various possible locations
    if (output.citations) {
      citations.push(...output.citations);
    }

    if (output.groundingMetadata?.citations) {
      citations.push(...output.groundingMetadata.citations);
    }

    if (output.metadata?.citations) {
      citations.push(...output.metadata.citations);
    }

    return citations;
  }
}

/**
 * Quick research helper function
 * @param {string} query - Research query
 * @param {object} options - Options
 * @returns {Promise<object>} Research result
 */
export async function quickResearch(query, options = {}) {
  const client = new SimpleDeepResearch();
  return client.research(query, options);
}

// Export singleton instance
export const simpleDeepResearch = new SimpleDeepResearch();

export default SimpleDeepResearch;
