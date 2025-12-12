/**
 * Report Generator Module
 * Synthesizes research findings into comprehensive reports
 */

import { GeminiClient } from './gemini-client.js';
import { REPORT_SYNTHESIZER_PROMPT, getReportSynthesisPrompt } from './prompts.js';
import { config } from './config.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Report Generator Class
 * Creates structured research reports from gathered findings
 */
export class ReportGenerator {
  constructor(geminiClient = null) {
    this.client = geminiClient || new GeminiClient();
  }

  /**
   * Generate a comprehensive research report
   * @param {string} topic - Research topic
   * @param {Array<object>} learnings - All learnings gathered
   * @param {Array<object>} sources - All sources with citations
   * @param {object} metadata - Additional metadata (iterations, time, etc.)
   * @returns {Promise<object>} Generated report
   */
  async generateReport(topic, learnings, sources, metadata = {}) {
    // Prepare learnings with source references
    const preparedLearnings = this.prepareLearnings(learnings, sources);

    // Prepare sources list
    const preparedSources = this.prepareSources(sources);

    const prompt = getReportSynthesisPrompt(topic, preparedLearnings, preparedSources);

    try {
      const response = await this.client.generate(prompt, {
        systemInstruction: REPORT_SYNTHESIZER_PROMPT,
        useCache: false,
      });

      const report = this.formatReport(response.text, topic, preparedSources, metadata);

      // Save report if configured
      if (config.output.saveReports) {
        await this.saveReport(report, topic);
      }

      return report;
    } catch (error) {
      console.error('Error generating report:', error.message);
      // Generate a basic report as fallback
      return this.generateFallbackReport(topic, learnings, sources, metadata);
    }
  }

  /**
   * Prepare learnings with source references
   * @param {Array<object>} learnings - Raw learnings
   * @param {Array<object>} sources - Sources list
   * @returns {Array<object>} Prepared learnings
   */
  prepareLearnings(learnings, sources) {
    return learnings.map((learning, index) => {
      const insight = learning.insight || learning;
      const sourceUrl = learning.sourceUrl || null;

      // Find source index if URL provided
      let sourceIndex = null;
      if (sourceUrl) {
        sourceIndex = sources.findIndex((s) => s.url === sourceUrl);
        if (sourceIndex !== -1) sourceIndex += 1; // 1-indexed
      }

      return {
        insight,
        sourceIndex,
        index: index + 1,
      };
    });
  }

  /**
   * Prepare sources list with numbering
   * @param {Array<object>} sources - Raw sources
   * @returns {Array<object>} Prepared sources
   */
  prepareSources(sources) {
    // Deduplicate by URL
    const seen = new Set();
    const unique = [];

    for (const source of sources) {
      if (source.url && !seen.has(source.url)) {
        seen.add(source.url);
        unique.push({
          url: source.url,
          title: source.title || this.extractTitleFromUrl(source.url),
          index: unique.length + 1,
        });
      }
    }

    return unique;
  }

  /**
   * Extract a title from URL
   * @param {string} url - Source URL
   * @returns {string} Extracted title
   */
  extractTitleFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.replace(/\//g, ' ').replace(/[-_]/g, ' ');
      return `${urlObj.hostname}${path}`.trim() || url;
    } catch {
      return url;
    }
  }

  /**
   * Format the final report
   * @param {string} content - Raw report content
   * @param {string} topic - Research topic
   * @param {Array<object>} sources - Sources list
   * @param {object} metadata - Report metadata
   * @returns {object} Formatted report
   */
  formatReport(content, topic, sources, metadata) {
    const timestamp = new Date().toISOString();

    // Add metadata header if not present
    let formattedContent = content;

    if (!content.startsWith('#')) {
      formattedContent = `# Research Report: ${topic}\n\n${content}`;
    }

    // Ensure references section exists
    if (!formattedContent.toLowerCase().includes('## references')) {
      formattedContent += this.generateReferencesSection(sources);
    }

    // Add metadata footer
    formattedContent += this.generateMetadataFooter(metadata, timestamp);

    return {
      topic,
      content: formattedContent,
      sources,
      metadata: {
        ...metadata,
        generatedAt: timestamp,
        sourceCount: sources.length,
        wordCount: this.countWords(formattedContent),
      },
    };
  }

  /**
   * Generate references section
   * @param {Array<object>} sources - Sources list
   * @returns {string} Formatted references section
   */
  generateReferencesSection(sources) {
    if (!sources || sources.length === 0) {
      return '\n\n## References\n\nNo external sources referenced.\n';
    }

    let section = '\n\n## References\n\n';

    for (const source of sources) {
      section += `[${source.index}] [${source.title}](${source.url})\n\n`;
    }

    return section;
  }

  /**
   * Generate metadata footer
   * @param {object} metadata - Report metadata
   * @param {string} timestamp - Generation timestamp
   * @returns {string} Formatted metadata footer
   */
  generateMetadataFooter(metadata, timestamp) {
    return `
---

*Report generated by Gemini Deep Research Agent*
- **Generated**: ${timestamp}
- **Model**: ${config.gemini.model}
- **Iterations**: ${metadata.iterations || 'N/A'}
- **Sources consulted**: ${metadata.sourceCount || 'N/A'}
- **Research depth**: ${config.research.depth}
`;
  }

  /**
   * Count words in text
   * @param {string} text - Text to count
   * @returns {number} Word count
   */
  countWords(text) {
    return text
      .replace(/[#\*\-\[\]\(\)]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }

  /**
   * Generate a fallback report when LLM fails
   * @param {string} topic - Research topic
   * @param {Array<object>} learnings - Learnings
   * @param {Array<object>} sources - Sources
   * @param {object} metadata - Metadata
   * @returns {object} Fallback report
   */
  generateFallbackReport(topic, learnings, sources, metadata) {
    const preparedSources = this.prepareSources(sources);

    let content = `# Research Report: ${topic}

## Executive Summary

This report presents research findings on "${topic}" gathered through automated deep research.

## Key Findings

`;

    // Add learnings as bullet points
    for (const learning of learnings.slice(0, 20)) {
      const insight = learning.insight || learning;
      content += `- ${insight}\n`;
    }

    content += `
## Analysis

The research gathered ${learnings.length} distinct findings from ${sources.length} sources. Further analysis would be beneficial to synthesize these findings into actionable insights.

## Limitations

This report was generated using automated research methods. The findings should be verified against primary sources for critical applications.

## Conclusions

The topic "${topic}" encompasses multiple aspects that require careful consideration. The gathered research provides a foundation for understanding the key concepts and current state of knowledge in this area.
`;

    content += this.generateReferencesSection(preparedSources);
    content += this.generateMetadataFooter(metadata, new Date().toISOString());

    return {
      topic,
      content,
      sources: preparedSources,
      metadata: {
        ...metadata,
        generatedAt: new Date().toISOString(),
        sourceCount: sources.length,
        wordCount: this.countWords(content),
        fallback: true,
      },
    };
  }

  /**
   * Save report to file
   * @param {object} report - Report object
   * @param {string} topic - Topic for filename
   * @returns {Promise<string>} Saved file path
   */
  async saveReport(report, topic) {
    try {
      // Create reports directory if needed
      await mkdir(config.output.reportsDir, { recursive: true });

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeTopic = topic
        .replace(/[^a-zA-Z0-9]/g, '-')
        .substring(0, 50)
        .toLowerCase();
      const filename = `${safeTopic}-${timestamp}.md`;
      const filepath = join(config.output.reportsDir, filename);

      // Write file
      await writeFile(filepath, report.content, 'utf-8');

      return filepath;
    } catch (error) {
      console.error('Error saving report:', error.message);
      return null;
    }
  }

  /**
   * Convert report to different formats
   * @param {object} report - Report object
   * @param {string} format - Output format (markdown, json, html)
   * @returns {string} Formatted output
   */
  convertFormat(report, format = 'markdown') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(report, null, 2);

      case 'html':
        return this.convertToHtml(report);

      case 'markdown':
      default:
        return report.content;
    }
  }

  /**
   * Convert report to HTML
   * @param {object} report - Report object
   * @returns {string} HTML content
   */
  convertToHtml(report) {
    // Simple Markdown to HTML conversion
    let html = report.content
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Research Report: ${report.topic}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { color: #1a1a1a; }
    h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; }
    a { color: #0066cc; }
    li { margin: 0.5rem 0; }
  </style>
</head>
<body>
<p>${html}</p>
</body>
</html>`;
  }
}

// Export singleton instance
export const reportGenerator = new ReportGenerator();

export default ReportGenerator;
