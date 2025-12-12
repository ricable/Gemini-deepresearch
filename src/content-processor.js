/**
 * Content Processor Module
 * Handles text splitting, chunking, and content analysis
 */

import { GeminiClient } from './gemini-client.js';
import { RESEARCH_ASSISTANT_PROMPT, getContentAnalysisPrompt } from './prompts.js';

/**
 * Content Processor Class
 * Processes and analyzes search results
 */
export class ContentProcessor {
  constructor(geminiClient = null) {
    this.client = geminiClient || new GeminiClient();
    this.maxChunkSize = 4000;
    this.chunkOverlap = 200;
  }

  /**
   * Split text into manageable chunks
   * @param {string} text - Text to split
   * @param {number} maxSize - Maximum chunk size
   * @param {number} overlap - Overlap between chunks
   * @returns {Array<string>} Array of text chunks
   */
  splitText(text, maxSize = this.maxChunkSize, overlap = this.chunkOverlap) {
    if (!text || text.length <= maxSize) {
      return [text];
    }

    const chunks = [];
    const sentences = this.splitIntoSentences(text);
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          // Start new chunk with overlap from previous
          const overlapText = currentChunk.slice(-overlap);
          currentChunk = overlapText + sentence;
        } else {
          // Single sentence is too long, split it
          const parts = this.splitLongSentence(sentence, maxSize);
          chunks.push(...parts.slice(0, -1));
          currentChunk = parts[parts.length - 1];
        }
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Split text into sentences
   * @param {string} text - Text to split
   * @returns {Array<string>} Array of sentences
   */
  splitIntoSentences(text) {
    // Split on sentence boundaries while preserving the delimiter
    const sentenceRegex = /[^.!?\n]+[.!?\n]+/g;
    const sentences = text.match(sentenceRegex) || [text];
    return sentences;
  }

  /**
   * Split a long sentence that exceeds max size
   * @param {string} sentence - Long sentence to split
   * @param {number} maxSize - Maximum size per part
   * @returns {Array<string>} Array of sentence parts
   */
  splitLongSentence(sentence, maxSize) {
    const parts = [];
    let remaining = sentence;

    while (remaining.length > maxSize) {
      // Find a good breaking point (space, comma, etc.)
      let breakPoint = remaining.lastIndexOf(' ', maxSize);
      if (breakPoint === -1) breakPoint = maxSize;

      parts.push(remaining.slice(0, breakPoint).trim());
      remaining = remaining.slice(breakPoint).trim();
    }

    if (remaining) {
      parts.push(remaining);
    }

    return parts;
  }

  /**
   * Process search result content and extract insights
   * @param {object} searchResult - Search result with text and sources
   * @param {string} originalQuery - The query that produced this result
   * @returns {Promise<object>} Processed content with insights
   */
  async processSearchResult(searchResult, originalQuery) {
    const { text, sources } = searchResult;

    if (!text || text.trim().length < 50) {
      return {
        insights: [],
        dataPoints: [],
        sources: sources || [],
        quality: 'low',
        relevance: 0,
      };
    }

    // Split content if too large
    const chunks = this.splitText(text);

    // Process each chunk
    const chunkResults = await Promise.all(
      chunks.map((chunk) => this.analyzeChunk(chunk, originalQuery))
    );

    // Merge results from all chunks
    return this.mergeChunkResults(chunkResults, sources);
  }

  /**
   * Analyze a single content chunk
   * @param {string} chunk - Text chunk to analyze
   * @param {string} query - Original query
   * @returns {Promise<object>} Analysis result
   */
  async analyzeChunk(chunk, query) {
    const prompt = getContentAnalysisPrompt(chunk, query);

    try {
      const response = await this.client.generate(prompt, {
        systemInstruction: RESEARCH_ASSISTANT_PROMPT,
      });

      return this.parseAnalysisResponse(response.text);
    } catch (error) {
      console.error('Error analyzing chunk:', error.message);
      return {
        keyInsights: [],
        dataPoints: [],
        expertOpinions: [],
        sourceQuality: 'unknown',
        relevanceScore: 50,
        followUpQuestions: [],
      };
    }
  }

  /**
   * Parse analysis response from LLM
   * @param {string} response - Raw response text
   * @returns {object} Parsed analysis
   */
  parseAnalysisResponse(response) {
    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          keyInsights: parsed.keyInsights || [],
          dataPoints: parsed.dataPoints || [],
          expertOpinions: parsed.expertOpinions || [],
          sourceQuality: parsed.sourceQuality || 'medium',
          relevanceScore: parsed.relevanceScore || 50,
          followUpQuestions: parsed.followUpQuestions || [],
        };
      }

      // Fallback: extract insights from plain text
      return this.extractInsightsFromText(response);
    } catch (error) {
      return this.extractInsightsFromText(response);
    }
  }

  /**
   * Extract insights from plain text response
   * @param {string} text - Plain text response
   * @returns {object} Extracted insights
   */
  extractInsightsFromText(text) {
    const lines = text.split('\n').filter((l) => l.trim());
    const insights = [];
    const dataPoints = [];

    for (const line of lines) {
      const cleaned = line.replace(/^[\-\*\d\.\)]\s*/, '').trim();
      if (cleaned.length > 20 && cleaned.length < 500) {
        // Simple heuristic: lines with numbers are likely data points
        if (/\d+%|\$\d+|\d{4}/.test(cleaned)) {
          dataPoints.push(cleaned);
        } else {
          insights.push(cleaned);
        }
      }
    }

    return {
      keyInsights: insights.slice(0, 10),
      dataPoints: dataPoints.slice(0, 5),
      expertOpinions: [],
      sourceQuality: 'medium',
      relevanceScore: 70,
      followUpQuestions: [],
    };
  }

  /**
   * Merge results from multiple chunks
   * @param {Array<object>} chunkResults - Array of chunk analysis results
   * @param {Array<object>} sources - Original sources
   * @returns {object} Merged results
   */
  mergeChunkResults(chunkResults, sources) {
    const merged = {
      insights: [],
      dataPoints: [],
      expertOpinions: [],
      followUpQuestions: [],
      sources: sources || [],
      quality: 'medium',
      relevance: 0,
    };

    let totalRelevance = 0;
    const qualityCounts = { high: 0, medium: 0, low: 0 };

    for (const result of chunkResults) {
      merged.insights.push(...(result.keyInsights || []));
      merged.dataPoints.push(...(result.dataPoints || []));
      merged.expertOpinions.push(...(result.expertOpinions || []));
      merged.followUpQuestions.push(...(result.followUpQuestions || []));
      totalRelevance += result.relevanceScore || 50;
      qualityCounts[result.sourceQuality || 'medium']++;
    }

    // Deduplicate
    merged.insights = [...new Set(merged.insights)];
    merged.dataPoints = [...new Set(merged.dataPoints)];
    merged.expertOpinions = [...new Set(merged.expertOpinions)];
    merged.followUpQuestions = [...new Set(merged.followUpQuestions)];

    // Calculate averages
    merged.relevance = Math.round(totalRelevance / chunkResults.length);
    merged.quality =
      qualityCounts.high >= qualityCounts.medium ? 'high' : qualityCounts.low > qualityCounts.medium ? 'low' : 'medium';

    return merged;
  }

  /**
   * Clean and normalize text
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    if (!text) return '';

    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[\r\n]+/g, '\n') // Normalize line breaks
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
      .trim();
  }

  /**
   * Extract key sentences from text
   * @param {string} text - Source text
   * @param {number} count - Number of sentences to extract
   * @returns {Array<string>} Key sentences
   */
  extractKeySentences(text, count = 5) {
    const sentences = this.splitIntoSentences(text);

    // Simple scoring based on length and keyword presence
    const scored = sentences.map((s) => ({
      text: s.trim(),
      score: this.scoreSentence(s),
    }));

    // Sort by score and return top sentences
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map((s) => s.text);
  }

  /**
   * Score a sentence for importance
   * @param {string} sentence - Sentence to score
   * @returns {number} Importance score
   */
  scoreSentence(sentence) {
    let score = 0;

    // Length bonus (prefer medium-length sentences)
    const length = sentence.length;
    if (length > 50 && length < 200) score += 10;
    else if (length > 200 && length < 300) score += 5;

    // Contains numbers or statistics
    if (/\d+%|\$[\d,]+|\d{4}/.test(sentence)) score += 15;

    // Contains key indicator phrases
    const indicators = [
      'according to',
      'research shows',
      'studies indicate',
      'experts say',
      'data suggests',
      'significant',
      'important',
      'key finding',
      'conclusion',
    ];

    for (const indicator of indicators) {
      if (sentence.toLowerCase().includes(indicator)) score += 5;
    }

    return score;
  }
}

// Export singleton instance
export const contentProcessor = new ContentProcessor();

export default ContentProcessor;
