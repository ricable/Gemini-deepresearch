#!/usr/bin/env node

/**
 * Complete PRD Generation Agent
 *
 * Combines:
 * - Gemini Deep Research Agent (web-grounded research)
 * - Claude Agent SDK integration (multi-model orchestration)
 * - DSPy.ts-inspired prompt optimization
 * - SPARC methodology (London School TDD)
 *
 * This agent conducts deep research on a topic and generates a
 * comprehensive, production-ready PRD following SPARC methodology.
 */

import { ClaudeGeminiAgent } from './claude-agent-sdk.js';
import { SPARCGenerator } from './sparc-generator.js';
import { DSPyPromptOptimizer } from './dspy-optimizer.js';
import chalk from 'chalk';
import ora from 'ora';
import { promises as fs } from 'fs';

/**
 * PRD Generation Agent
 */
export class PRDAgent {
  constructor(config = {}) {
    this.config = {
      geminiApiKey: config.geminiApiKey || process.env.GEMINI_API_KEY,
      research: {
        depth: config.depth || 5,
        breadth: config.breadth || 7,
        maxIterations: config.maxIterations || 6,
        ...config.research
      },
      prd: {
        methodology: config.methodology || 'london-tdd',
        outputDir: config.outputDir || './prds',
        useOptimization: config.useOptimization !== false,
        ...config.prd
      },
      verbose: config.verbose || false,
      ...config
    };

    // Initialize sub-agents
    this.claudeGeminiAgent = new ClaudeGeminiAgent({
      geminiApiKey: this.config.geminiApiKey,
      research: this.config.research
    });

    this.sparcGenerator = new SPARCGenerator({
      apiKey: this.config.geminiApiKey,
      outputDir: this.config.prd.outputDir,
      useOptimization: this.config.prd.useOptimization
    });

    if (this.config.prd.useOptimization) {
      this.optimizer = new DSPyPromptOptimizer({
        apiKey: this.config.geminiApiKey
      });
    }
  }

  /**
   * Generate a complete PRD from a topic
   *
   * @param {string} topic - Topic to research and create PRD for
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Complete PRD and research results
   */
  async generatePRD(topic, options = {}) {
    const startTime = Date.now();
    const spinner = ora('Initializing PRD Agent...').start();

    try {
      // Step 1: Initialize agent
      await this.claudeGeminiAgent.initialize();
      spinner.succeed('Agent initialized');

      // Step 2: Conduct deep research
      spinner.start(`Researching: ${topic}`);
      this.log(chalk.cyan('\n📚 Starting Deep Research Phase...\n'));

      const research = await this.claudeGeminiAgent.executeResearch(topic, {
        depth: options.depth || this.config.research.depth,
        breadth: options.breadth || this.config.research.breadth,
        maxIterations: options.maxIterations || this.config.research.maxIterations,
        onProgress: (status) => {
          spinner.text = `${status.phase}: ${status.message}`;
          this.log(chalk.dim(`  ${status.phase}: ${status.message}`));
        }
      });

      spinner.succeed(`Research completed: ${research.sources.length} sources, ${research.learnings.length} insights`);
      this.log(chalk.green(`\n✅ Research Phase Complete`));
      this.log(chalk.dim(`  - Iterations: ${research.metadata.iterations}`));
      this.log(chalk.dim(`  - Sources: ${research.sources.length}`));
      this.log(chalk.dim(`  - Insights: ${research.learnings.length}\n`));

      // Step 3: Optimize prompts (if enabled)
      if (this.config.prd.useOptimization && this.optimizer) {
        spinner.start('Optimizing prompts with DSPy...');
        this.log(chalk.cyan('🔧 Optimizing Prompts...\n'));

        // This is optional and can be time-consuming, so we'll skip for now
        // In production, run this separately and cache results
        spinner.info('Using pre-configured prompts (optimization available separately)');
      }

      // Step 4: Generate SPARC PRD
      spinner.start('Generating SPARC PRD...');
      this.log(chalk.cyan('\n📋 Generating SPARC PRD...\n'));

      const prd = await this.sparcGenerator.generatePRD({
        topic,
        research,
        methodology: options.methodology || this.config.prd.methodology,
        techStack: options.techStack || {},
        includePhases: options.phases || ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'],
        additionalContext: options.additionalContext || {}
      });

      spinner.succeed('PRD generated successfully');
      this.log(chalk.green('\n✅ PRD Generation Complete\n'));

      // Step 5: Generate analytics
      const analytics = this.generateAnalytics(research, prd, startTime);

      // Step 6: Display summary
      this.displaySummary(prd, analytics);

      return {
        success: true,
        topic,
        research,
        prd,
        analytics
      };

    } catch (error) {
      spinner.fail('PRD generation failed');
      this.log(chalk.red(`\n❌ Error: ${error.message}\n`));

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute a workflow with multiple PRDs
   *
   * @param {Array<string>} topics - Topics to generate PRDs for
   * @param {Object} options - Workflow options
   * @returns {Promise<Array>} Results for each topic
   */
  async generateMultiplePRDs(topics, options = {}) {
    const results = [];

    for (const [index, topic] of topics.entries()) {
      console.log(chalk.bold.blue(`\n╔════════════════════════════════════════════╗`));
      console.log(chalk.bold.blue(`║  PRD ${index + 1}/${topics.length}: ${topic.substring(0, 35).padEnd(35)} ║`));
      console.log(chalk.bold.blue(`╚════════════════════════════════════════════╝\n`));

      const result = await this.generatePRD(topic, options);
      results.push(result);

      // Delay between PRDs to avoid rate limiting
      if (index < topics.length - 1 && options.delay) {
        console.log(chalk.dim(`\nWaiting ${options.delay}ms before next PRD...\n`));
        await this.delay(options.delay);
      }
    }

    return results;
  }

  /**
   * Generate analytics from research and PRD
   *
   * @private
   */
  generateAnalytics(research, prd, startTime) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      timing: {
        totalDuration: duration,
        durationFormatted: this.formatDuration(duration)
      },
      research: {
        iterations: research.metadata.iterations,
        sources: research.sources.length,
        insights: research.learnings.length,
        topSources: research.sources.slice(0, 5).map(s => ({
          title: s.title,
          url: s.url
        }))
      },
      prd: {
        phases: Object.keys(prd.phases).length,
        methodology: prd.metadata.methodology,
        filePath: prd.filePath,
        phaseNames: Object.keys(prd.phases)
      }
    };
  }

  /**
   * Display summary of generated PRD
   *
   * @private
   */
  displaySummary(prd, analytics) {
    console.log(chalk.bold.green('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    console.log(chalk.bold.cyan('📊 PRD GENERATION SUMMARY\n'));

    console.log(chalk.yellow('Topic:'), chalk.white(prd.metadata.topic));
    console.log(chalk.yellow('Methodology:'), chalk.white(prd.metadata.methodology));
    console.log(chalk.yellow('Duration:'), chalk.white(analytics.timing.durationFormatted));
    console.log();

    console.log(chalk.cyan('Research Metrics:'));
    console.log(chalk.dim(`  - Iterations: ${analytics.research.iterations}`));
    console.log(chalk.dim(`  - Sources: ${analytics.research.sources}`));
    console.log(chalk.dim(`  - Insights: ${analytics.research.insights}`));
    console.log();

    console.log(chalk.cyan('PRD Content:'));
    console.log(chalk.dim(`  - Phases: ${analytics.prd.phases}`));
    console.log(chalk.dim(`  - Sections: ${analytics.prd.phaseNames.join(', ')}`));
    console.log();

    console.log(chalk.cyan('Output:'));
    console.log(chalk.green(`  📁 ${prd.filePath}`));
    console.log();

    console.log(chalk.cyan('Top Sources:'));
    analytics.research.topSources.slice(0, 3).forEach((source, i) => {
      console.log(chalk.dim(`  ${i + 1}. ${source.title}`));
      console.log(chalk.dim(`     ${source.url}`));
    });

    console.log(chalk.bold.green('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  /**
   * Format duration in human-readable format
   *
   * @private
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Log message if verbose mode enabled
   *
   * @private
   */
  log(message) {
    if (this.config.verbose) {
      console.log(message);
    }
  }

  /**
   * Delay helper
   *
   * @private
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(chalk.yellow('\nUsage: node prd-agent.js "<topic>" [options]\n'));
    console.log(chalk.dim('Options:'));
    console.log(chalk.dim('  --depth <1-5>          Research depth (default: 5)'));
    console.log(chalk.dim('  --breadth <1-10>       Parallel queries (default: 7)'));
    console.log(chalk.dim('  --iterations <1-20>    Max iterations (default: 6)'));
    console.log(chalk.dim('  --methodology <name>   TDD methodology (default: london-tdd)'));
    console.log(chalk.dim('  --verbose              Enable verbose logging'));
    console.log(chalk.dim('\nExample:'));
    console.log(chalk.dim('  node prd-agent.js "AI Code Review Tool" --depth 5 --verbose\n'));
    process.exit(0);
  }

  const topic = args[0];
  const options = {
    depth: parseInt(args[args.indexOf('--depth') + 1]) || 5,
    breadth: parseInt(args[args.indexOf('--breadth') + 1]) || 7,
    maxIterations: parseInt(args[args.indexOf('--iterations') + 1]) || 6,
    methodology: args[args.indexOf('--methodology') + 1] || 'london-tdd',
    verbose: args.includes('--verbose')
  };

  const agent = new PRDAgent(options);
  const result = await agent.generatePRD(topic, options);

  process.exit(result.success ? 0 : 1);
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default PRDAgent;
export { PRDAgent };
