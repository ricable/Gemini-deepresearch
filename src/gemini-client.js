/**
 * Gemini API Client with Search Grounding
 * Wrapper around Google's Generative AI SDK with batching, caching, and tools
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { LRUCache } from 'lru-cache';
import { config } from './config.js';

/**
 * Gemini Client Class
 * Handles all interactions with the Gemini API
 */
export class GeminiClient {
  constructor(apiKey = config.gemini.apiKey) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = null;
    this.modelWithSearch = null;
    this.concurrencyLimit = config.research.concurrencyLimit;
    this.activeRequests = 0;
    this.requestQueue = [];

    // Initialize caches
    this.cache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 30, // 30 minutes
    });

    this.initializeModels();
  }

  /**
   * Initialize Gemini models with different configurations
   */
  initializeModels() {
    // Standard model for text generation
    this.model = this.genAI.getGenerativeModel({
      model: config.gemini.model,
      generationConfig: {
        maxOutputTokens: config.gemini.maxOutputTokens,
        temperature: 0.7,
      },
    });

    // Model with Google Search grounding enabled
    this.modelWithSearch = this.genAI.getGenerativeModel({
      model: config.gemini.model,
      generationConfig: {
        maxOutputTokens: config.gemini.maxOutputTokens,
        temperature: 0.7,
      },
      tools: [{ googleSearch: {} }],
    });
  }

  /**
   * Generate content with optional search grounding
   * @param {string} prompt - The prompt to send
   * @param {object} options - Generation options
   * @returns {Promise<object>} Generation result
   */
  async generate(prompt, options = {}) {
    const { useSearch = false, systemInstruction = null, useCache = true } = options;

    // Check cache
    const cacheKey = this.getCacheKey(prompt, options);
    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Wait for available slot
    await this.waitForSlot();

    try {
      this.activeRequests++;

      const model = useSearch ? this.modelWithSearch : this.model;

      let result;
      if (systemInstruction) {
        const chat = model.startChat({
          history: [],
          systemInstruction: { parts: [{ text: systemInstruction }] },
        });
        result = await chat.sendMessage(prompt);
      } else {
        result = await model.generateContent(prompt);
      }

      const response = {
        text: result.response.text(),
        candidates: result.response.candidates,
        groundingMetadata: result.response.candidates?.[0]?.groundingMetadata || null,
        usageMetadata: result.response.usageMetadata,
      };

      // Cache the result
      if (useCache) {
        this.cache.set(cacheKey, response);
      }

      return response;
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  /**
   * Generate with search grounding and extract sources
   * @param {string} prompt - The search/research prompt
   * @returns {Promise<object>} Result with content and sources
   */
  async searchAndGenerate(prompt) {
    const result = await this.generate(prompt, { useSearch: true });

    // Extract grounding sources if available
    const sources = this.extractSources(result.groundingMetadata);

    return {
      text: result.text,
      sources,
      metadata: result.groundingMetadata,
    };
  }

  /**
   * Extract source URLs and titles from grounding metadata
   * @param {object} metadata - Grounding metadata from response
   * @returns {Array<object>} Array of source objects
   */
  extractSources(metadata) {
    if (!metadata) return [];

    const sources = [];

    // Extract from grounding chunks
    if (metadata.groundingChunks) {
      for (const chunk of metadata.groundingChunks) {
        if (chunk.web) {
          sources.push({
            url: chunk.web.uri,
            title: chunk.web.title || 'Unknown Title',
          });
        }
      }
    }

    // Extract from search entry point if available
    if (metadata.searchEntryPoint?.renderedContent) {
      // Could parse rendered content for additional sources
    }

    // Deduplicate sources by URL
    const uniqueSources = [];
    const seenUrls = new Set();
    for (const source of sources) {
      if (!seenUrls.has(source.url)) {
        seenUrls.add(source.url);
        uniqueSources.push(source);
      }
    }

    return uniqueSources;
  }

  /**
   * Batch generate multiple prompts with concurrency control
   * @param {Array<string>} prompts - Array of prompts
   * @param {object} options - Generation options
   * @returns {Promise<Array<object>>} Array of results
   */
  async batchGenerate(prompts, options = {}) {
    const results = [];
    const errors = [];

    // Process in batches respecting concurrency limit
    for (let i = 0; i < prompts.length; i += this.concurrencyLimit) {
      const batch = prompts.slice(i, i + this.concurrencyLimit);
      const batchPromises = batch.map(async (prompt, index) => {
        try {
          const result = await this.generate(prompt, options);
          return { index: i + index, result, error: null };
        } catch (error) {
          return { index: i + index, result: null, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const { index, result, error } of batchResults) {
        if (error) {
          errors.push({ index, error });
        } else {
          results[index] = result;
        }
      }
    }

    return { results, errors };
  }

  /**
   * Generate cache key for request
   * @param {string} prompt - The prompt
   * @param {object} options - Options object
   * @returns {string} Cache key
   */
  getCacheKey(prompt, options) {
    return `${prompt.substring(0, 100)}_${JSON.stringify(options)}`;
  }

  /**
   * Wait for available request slot
   * @returns {Promise<void>}
   */
  async waitForSlot() {
    if (this.activeRequests < this.concurrencyLimit) {
      return;
    }

    return new Promise((resolve) => {
      this.requestQueue.push(resolve);
    });
  }

  /**
   * Process waiting requests in queue
   */
  processQueue() {
    if (this.requestQueue.length > 0 && this.activeRequests < this.concurrencyLimit) {
      const resolve = this.requestQueue.shift();
      resolve();
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      calculatedSize: this.cache.calculatedSize,
    };
  }
}

// Export singleton instance
export const geminiClient = new GeminiClient();

export default GeminiClient;
