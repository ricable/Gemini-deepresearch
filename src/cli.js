#!/usr/bin/env node

/**
 * Gemini Deep Research Agent - CLI Interface
 * Interactive command-line tool for conducting deep research
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createResearchAgent } from './research-agent.js';
import { config, validateConfig, getConfigSummary } from './config.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
let packageJson;
try {
  packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
} catch {
  packageJson = { version: '1.0.0', name: 'gemini-deep-research-agent' };
}

/**
 * Display banner
 */
function displayBanner() {
  console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ${chalk.bold('Gemini Deep Research Agent')}                               ║
║   ${chalk.dim('Powered by Google Gemini AI with Search Grounding')}         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`));
}

/**
 * Create progress handler for CLI output
 * @param {ora.Ora} spinner - Ora spinner instance
 * @returns {Function} Progress handler
 */
function createProgressHandler(spinner, verbose = false) {
  return (event) => {
    switch (event.type) {
      case 'start':
        spinner.start(chalk.blue(`Starting research on: ${event.topic}`));
        break;

      case 'phase':
        const phases = {
          query_generation: 'Generating search queries...',
          research: 'Conducting research...',
          report_generation: 'Synthesizing final report...',
        };
        spinner.text = chalk.blue(phases[event.phase] || `Phase: ${event.phase}`);
        break;

      case 'queries_generated':
        spinner.succeed(chalk.green(`Generated ${event.count} search queries`));
        if (verbose) {
          event.queries.forEach((q, i) => {
            console.log(chalk.dim(`  ${i + 1}. ${q}`));
          });
        }
        spinner.start(chalk.blue('Starting research iterations...'));
        break;

      case 'iteration_start':
        spinner.text = chalk.blue(`Iteration ${event.iteration}: Gathering information...`);
        break;

      case 'searching':
        if (verbose) {
          spinner.text = chalk.blue(`Searching: ${event.query.substring(0, 50)}...`);
        }
        break;

      case 'search_complete':
        if (verbose) {
          spinner.text = chalk.blue(`Found ${event.insightsFound} insights for: ${event.query.substring(0, 40)}...`);
        }
        break;

      case 'search_error':
        if (verbose) {
          console.log(chalk.yellow(`  ⚠ Search failed: ${event.error}`));
        }
        break;

      case 'reflection':
        const { evaluation } = event;
        spinner.text = chalk.blue(
          `Evaluating progress... (Completeness: ${evaluation.completenessScore}%, Quality: ${evaluation.qualityScore}%)`
        );
        if (verbose && evaluation.identifiedGaps.length > 0) {
          console.log(chalk.dim(`  Gaps identified: ${evaluation.identifiedGaps.slice(0, 3).join(', ')}`));
        }
        break;

      case 'research_complete':
        spinner.succeed(chalk.green(`Research complete: ${event.reason}`));
        spinner.start(chalk.blue('Generating final report...'));
        break;

      case 'complete':
        spinner.succeed(chalk.green('Report generated successfully!'));
        break;

      case 'error':
        spinner.fail(chalk.red(`Error: ${event.error}`));
        break;
    }
  };
}

/**
 * Create iteration handler
 * @param {ora.Ora} spinner - Ora spinner
 * @returns {Function} Iteration handler
 */
function createIterationHandler(spinner) {
  return (event) => {
    spinner.text = chalk.blue(
      `Iteration ${event.iteration} complete: ${event.learnings} learnings from ${event.sources} sources`
    );
  };
}

/**
 * Main research command
 */
async function researchCommand(topic, options) {
  displayBanner();

  // Validate configuration
  try {
    validateConfig();
  } catch (error) {
    console.error(chalk.red('\n✖ Configuration Error:\n'));
    console.error(chalk.yellow(error.message));
    console.error(chalk.dim('\nPlease set up your .env file based on .env.example'));
    process.exit(1);
  }

  // Display configuration
  console.log(chalk.dim('\nConfiguration:'));
  const summary = getConfigSummary();
  Object.entries(summary).forEach(([key, value]) => {
    console.log(chalk.dim(`  ${key}: ${value}`));
  });

  // Override config with CLI options
  const agentOptions = {
    depth: parseInt(options.depth) || config.research.depth,
    breadth: parseInt(options.breadth) || config.research.breadth,
    maxIterations: parseInt(options.iterations) || config.research.maxIterations,
  };

  console.log(chalk.cyan(`\n📚 Research Topic: ${chalk.bold(topic)}\n`));

  const spinner = ora({
    text: 'Initializing research agent...',
    spinner: 'dots',
  }).start();

  // Create agent with progress handlers
  const agent = createResearchAgent({
    ...agentOptions,
    onProgress: createProgressHandler(spinner, options.verbose),
    onIteration: createIterationHandler(spinner),
  });

  try {
    const startTime = Date.now();
    const report = await agent.research(topic);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Display results
    console.log(chalk.cyan('\n' + '═'.repeat(60)));
    console.log(chalk.cyan.bold('\n📄 RESEARCH REPORT\n'));
    console.log(chalk.cyan('═'.repeat(60) + '\n'));

    // Display report content
    console.log(report.content);

    // Display summary
    console.log(chalk.cyan('\n' + '─'.repeat(60)));
    console.log(chalk.cyan.bold('\n📊 Research Summary:\n'));
    console.log(chalk.white(`  • Topic: ${report.topic}`));
    console.log(chalk.white(`  • Sources consulted: ${report.sources.length}`));
    console.log(chalk.white(`  • Word count: ${report.metadata.wordCount}`));
    console.log(chalk.white(`  • Iterations: ${report.metadata.iterations}`));
    console.log(chalk.white(`  • Time elapsed: ${elapsed}s`));

    if (options.output) {
      console.log(chalk.green(`\n✔ Report saved to: ${options.output}`));
    }

    // Show sources if verbose
    if (options.verbose && report.sources.length > 0) {
      console.log(chalk.dim('\nSources:'));
      report.sources.slice(0, 10).forEach((source, i) => {
        console.log(chalk.dim(`  ${i + 1}. ${source.title || source.url}`));
      });
    }

  } catch (error) {
    spinner.fail(chalk.red('Research failed'));
    console.error(chalk.red(`\n✖ Error: ${error.message}`));
    if (options.verbose) {
      console.error(chalk.dim(error.stack));
    }
    process.exit(1);
  }
}

/**
 * Quick summary command
 */
async function summaryCommand(topic, options) {
  displayBanner();

  try {
    validateConfig();
  } catch (error) {
    console.error(chalk.red('\n✖ Configuration Error:\n'));
    console.error(chalk.yellow(error.message));
    process.exit(1);
  }

  console.log(chalk.cyan(`\n📝 Quick Summary: ${chalk.bold(topic)}\n`));

  const spinner = ora('Generating summary...').start();

  try {
    const agent = createResearchAgent();
    const result = await agent.quickSummary(topic);

    spinner.succeed('Summary generated');

    console.log(chalk.cyan('\n' + '─'.repeat(60) + '\n'));
    console.log(result.summary);
    console.log(chalk.cyan('\n' + '─'.repeat(60)));

    if (result.sources.length > 0) {
      console.log(chalk.dim('\nSources:'));
      result.sources.slice(0, 5).forEach((source, i) => {
        console.log(chalk.dim(`  ${i + 1}. ${source.title}: ${source.url}`));
      });
    }
  } catch (error) {
    spinner.fail(chalk.red('Summary failed'));
    console.error(chalk.red(`\n✖ Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Set up CLI commands
 */
const program = new Command();

program
  .name('deep-research')
  .description('Gemini Deep Research Agent - AI-powered deep research tool')
  .version(packageJson.version);

program
  .command('research')
  .alias('r')
  .description('Conduct deep research on a topic')
  .argument('<topic>', 'The research topic or question')
  .option('-d, --depth <number>', 'Research depth (1-5)', '3')
  .option('-b, --breadth <number>', 'Search breadth (1-10)', '5')
  .option('-i, --iterations <number>', 'Maximum iterations (1-20)', '10')
  .option('-o, --output <file>', 'Save report to file')
  .option('-v, --verbose', 'Show detailed progress')
  .action(researchCommand);

program
  .command('summary')
  .alias('s')
  .description('Get a quick summary of a topic')
  .argument('<topic>', 'The topic to summarize')
  .option('-v, --verbose', 'Show detailed output')
  .action(summaryCommand);

program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    displayBanner();
    console.log(chalk.cyan('\n📋 Current Configuration:\n'));

    try {
      validateConfig();
      const summary = getConfigSummary();
      Object.entries(summary).forEach(([key, value]) => {
        console.log(chalk.white(`  ${key}: ${chalk.cyan(value)}`));
      });
      console.log(chalk.green('\n✔ Configuration is valid'));
    } catch (error) {
      console.error(chalk.red('\n✖ Configuration Error:'));
      console.error(chalk.yellow(error.message));
    }
  });

// Default action - research
program
  .argument('[topic]', 'Research topic')
  .option('-d, --depth <number>', 'Research depth (1-5)', '3')
  .option('-b, --breadth <number>', 'Search breadth (1-10)', '5')
  .option('-i, --iterations <number>', 'Maximum iterations (1-20)', '10')
  .option('-o, --output <file>', 'Save report to file')
  .option('-v, --verbose', 'Show detailed progress')
  .action((topic, options) => {
    if (topic) {
      researchCommand(topic, options);
    } else {
      program.help();
    }
  });

// Parse arguments
program.parse();
