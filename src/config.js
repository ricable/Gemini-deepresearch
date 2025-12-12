/**
 * Configuration Management for Gemini Deep Research Agent
 * Handles environment variables, defaults, and validation
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Configuration object with defaults and environment overrides
 */
export const config = {
  // Gemini API Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS || '65536', 10),
  },

  // Research Parameters
  research: {
    depth: parseInt(process.env.RESEARCH_DEPTH || '3', 10),
    breadth: parseInt(process.env.RESEARCH_BREADTH || '5', 10),
    maxIterations: parseInt(process.env.MAX_ITERATIONS || '10', 10),
    concurrencyLimit: parseInt(process.env.CONCURRENCY_LIMIT || '5', 10),
  },

  // Output Configuration
  output: {
    format: process.env.OUTPUT_FORMAT || 'markdown',
    saveReports: process.env.SAVE_REPORTS === 'true',
    reportsDir: process.env.REPORTS_DIR || join(__dirname, '..', 'reports'),
  },

  // Debug Mode
  debug: process.env.DEBUG === 'true',

  // Paths
  paths: {
    root: join(__dirname, '..'),
    src: __dirname,
  },
};

/**
 * Validate required configuration
 * @throws {Error} If required configuration is missing
 */
export function validateConfig() {
  const errors = [];

  if (!config.gemini.apiKey) {
    errors.push('GEMINI_API_KEY is required. Get one at https://aistudio.google.com/apikey');
  }

  if (config.research.depth < 1 || config.research.depth > 5) {
    errors.push('RESEARCH_DEPTH must be between 1 and 5');
  }

  if (config.research.breadth < 1 || config.research.breadth > 10) {
    errors.push('RESEARCH_BREADTH must be between 1 and 10');
  }

  if (config.research.maxIterations < 1 || config.research.maxIterations > 20) {
    errors.push('MAX_ITERATIONS must be between 1 and 20');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }

  return true;
}

/**
 * Get configuration summary for logging
 * @returns {object} Sanitized configuration summary
 */
export function getConfigSummary() {
  return {
    model: config.gemini.model,
    depth: config.research.depth,
    breadth: config.research.breadth,
    maxIterations: config.research.maxIterations,
    outputFormat: config.output.format,
    debug: config.debug,
  };
}

export default config;
