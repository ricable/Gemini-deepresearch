/**
 * Gemini Deep Research Agent
 * Main entry point for programmatic usage
 * Enhanced with RuVector for vector memory and self-learning
 *
 * @module gemini-deep-research-agent
 */

// Core components
export { GeminiClient, geminiClient } from './gemini-client.js';
export { QueryGenerator, queryGenerator } from './query-generator.js';
export { ContentProcessor, contentProcessor } from './content-processor.js';
export { Reflector, reflector } from './reflector.js';
export { ReportGenerator, reportGenerator } from './report-generator.js';

// Main agent
export {
  DeepResearchAgent,
  createResearchAgent,
  researchAgent,
} from './research-agent.js';

// RuVector integration for enhanced capabilities
export {
  RuVectorIntegration,
  ResearchMemory,
  ResearchKnowledgeGraph,
  ResearchLearner,
  QueryRouter,
  ruvectorIntegration,
} from './ruvector-integration.js';

// Configuration
export { config, validateConfig, getConfigSummary } from './config.js';

// Prompts (for customization)
export {
  RESEARCH_STRATEGIST_PROMPT,
  RESEARCH_ASSISTANT_PROMPT,
  QUERY_REFINER_PROMPT,
  REPORT_SYNTHESIZER_PROMPT,
  REFLECTOR_PROMPT,
  getQueryGenerationPrompt,
  getContentAnalysisPrompt,
  getReflectionPrompt,
  getReportSynthesisPrompt,
} from './prompts.js';

// Default export - create a ready-to-use research function
import { createResearchAgent } from './research-agent.js';
import { validateConfig } from './config.js';

/**
 * Quick research function for simple usage
 * @param {string} topic - Research topic
 * @param {object} options - Research options
 * @returns {Promise<object>} Research report
 *
 * @example
 * import research from 'gemini-deep-research-agent';
 *
 * const report = await research('Quantum computing applications in 2025');
 * console.log(report.content);
 */
export default async function research(topic, options = {}) {
  validateConfig();
  const agent = createResearchAgent(options);
  return agent.research(topic, options);
}

/**
 * Quick summary function
 * @param {string} topic - Topic to summarize
 * @returns {Promise<object>} Summary with sources
 *
 * @example
 * import { quickSummary } from 'gemini-deep-research-agent';
 *
 * const { summary, sources } = await quickSummary('Electric vehicles market');
 * console.log(summary);
 */
export async function quickSummary(topic) {
  validateConfig();
  const agent = createResearchAgent();
  return agent.quickSummary(topic);
}
