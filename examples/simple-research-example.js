#!/usr/bin/env node

/**
 * Example: Simple Deep Research with DSPy Optimization
 * Demonstrates how to use the SimpleDeepResearch class
 */

import { SimpleDeepResearch, quickResearch } from '../src/simple-deep-research.js';
import chalk from 'chalk';

/**
 * Example 1: Basic research with DSPy optimization
 */
async function basicResearchExample() {
  console.log(chalk.blue.bold('\n📚 Example 1: Basic Deep Research\n'));

  const client = new SimpleDeepResearch();

  try {
    const result = await client.research('What are the latest developments in quantum computing?', {
      useOptimization: true,
      outputStyle: 'comprehensive',
      onProgress: (status) => {
        if (status.status) {
          console.log(chalk.gray(`  Progress: ${status.status}`));
        }
      },
    });

    console.log(chalk.green('\n✓ Research Complete!\n'));
    console.log(chalk.yellow('Topic:'), result.topic);
    console.log(chalk.yellow('\nContent Preview:'));
    console.log(result.content?.substring(0, 500) + '...');

    if (result.key_insights && result.key_insights.length > 0) {
      console.log(chalk.yellow('\n🔑 Key Insights:'));
      result.key_insights.forEach((insight, i) => {
        console.log(chalk.cyan(`  ${i + 1}. ${insight}`));
      });
    }

    if (result.citations && result.citations.length > 0) {
      console.log(chalk.yellow('\n📖 Citations:'));
      result.citations.slice(0, 5).forEach((citation, i) => {
        console.log(chalk.cyan(`  ${i + 1}. ${JSON.stringify(citation)}`));
      });
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
  }
}

/**
 * Example 2: Quick research helper
 */
async function quickResearchExample() {
  console.log(chalk.blue.bold('\n📚 Example 2: Quick Research Helper\n'));

  try {
    const result = await quickResearch('History of artificial intelligence', {
      useOptimization: true,
      outputStyle: 'concise',
      maxAttempts: 50,
      pollInterval: 2000,
    });

    console.log(chalk.green('\n✓ Quick Research Complete!\n'));
    console.log(chalk.yellow('Topic:'), result.topic);
    console.log(chalk.yellow('Status:'), result.status);
    console.log(chalk.yellow('\nContent Preview:'));
    console.log(result.content?.substring(0, 500) + '...');
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
  }
}

/**
 * Example 3: Streaming research with real-time updates
 */
async function streamingResearchExample() {
  console.log(chalk.blue.bold('\n📚 Example 3: Streaming Research\n'));

  const client = new SimpleDeepResearch();

  try {
    // Note: Streaming API returns interaction ID to poll
    const interaction = await client.createResearch(
      'What is the future of renewable energy?',
      {
        stream: true,
        useOptimization: true,
        onProgress: (update) => {
          console.log(chalk.gray('  Update:'), update.status || 'processing');
        },
      }
    );

    console.log(chalk.yellow('\nInteraction ID:'), interaction.id);

    // Poll for results
    console.log(chalk.gray('\nPolling for completion...'));
    const result = await client.pollUntilComplete(interaction.id, {
      interval: 2000,
      onProgress: (status) => {
        console.log(chalk.gray(`  Status: ${status.status}`));
      },
    });

    console.log(chalk.green('\n✓ Streaming Research Complete!\n'));

    const content = client.extractContent(result);
    console.log(chalk.yellow('Content Preview:'));
    console.log(content?.substring(0, 500) + '...');
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
  }
}

/**
 * Example 4: Custom DSPy optimization
 */
async function customOptimizationExample() {
  console.log(chalk.blue.bold('\n📚 Example 4: Custom DSPy Optimization\n'));

  const client = new SimpleDeepResearch();

  try {
    // Initialize DSPy
    await client.initializeDSPy();

    // Optimize a query
    const query = 'machine learning';
    console.log(chalk.yellow('Original query:'), query);

    const optimized = await client.optimizeQuery(query, 'Focus on recent advances and practical applications');

    console.log(chalk.green('\nOptimized query:'), optimized.optimized_query);
    console.log(chalk.green('Search strategy:'), optimized.search_strategy);

    // Now use the optimized query for research
    const result = await client.research(optimized.optimized_query, {
      useOptimization: false, // Already optimized
      outputStyle: 'detailed',
    });

    console.log(chalk.green('\n✓ Research with Custom Optimization Complete!\n'));
    console.log(chalk.yellow('Content Preview:'));
    console.log(result.content?.substring(0, 500) + '...');
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
  }
}

/**
 * Example 5: Multiple research queries in sequence
 */
async function batchResearchExample() {
  console.log(chalk.blue.bold('\n📚 Example 5: Batch Research Queries\n'));

  const queries = [
    'What is blockchain technology?',
    'How does cryptocurrency work?',
    'What are NFTs?',
  ];

  const client = new SimpleDeepResearch();
  const results = [];

  for (const query of queries) {
    console.log(chalk.yellow(`\nResearching: ${query}`));

    try {
      const result = await client.research(query, {
        useOptimization: true,
        outputStyle: 'summary',
        pollInterval: 2000,
        maxAttempts: 30,
      });

      results.push({
        query,
        success: true,
        preview: result.content?.substring(0, 200) + '...',
      });

      console.log(chalk.green('  ✓ Complete'));
    } catch (error) {
      console.error(chalk.red('  ✗ Failed:'), error.message);
      results.push({
        query,
        success: false,
        error: error.message,
      });
    }
  }

  console.log(chalk.blue.bold('\n\n📊 Batch Research Summary:\n'));
  results.forEach((result, i) => {
    console.log(chalk.yellow(`${i + 1}. ${result.query}`));
    console.log(chalk.gray(`   Status: ${result.success ? '✓ Success' : '✗ Failed'}`));
    if (result.preview) {
      console.log(chalk.gray(`   Preview: ${result.preview}\n`));
    }
  });
}

/**
 * Main function to run examples
 */
async function main() {
  const args = process.argv.slice(2);
  const exampleNumber = args[0] ? parseInt(args[0]) : null;

  console.log(chalk.blue.bold('\n🚀 Simple Deep Research Examples with DSPy.ts\n'));
  console.log(chalk.gray('Using Gemini Deep Research API + DSPy Optimization\n'));

  try {
    if (exampleNumber === 1) {
      await basicResearchExample();
    } else if (exampleNumber === 2) {
      await quickResearchExample();
    } else if (exampleNumber === 3) {
      await streamingResearchExample();
    } else if (exampleNumber === 4) {
      await customOptimizationExample();
    } else if (exampleNumber === 5) {
      await batchResearchExample();
    } else {
      // Run all examples
      console.log(chalk.yellow('Running all examples...\n'));
      console.log(chalk.gray('To run a specific example: node simple-research-example.js <number>\n'));

      await basicResearchExample();
      await new Promise(resolve => setTimeout(resolve, 2000));

      await quickResearchExample();
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Skip streaming and batch for full run to save time/cost
      console.log(chalk.gray('\n\nSkipping examples 3-5 in full run mode.'));
      console.log(chalk.gray('Run individually: node simple-research-example.js 3|4|5\n'));
    }

    console.log(chalk.green.bold('\n✓ Examples completed successfully!\n'));
  } catch (error) {
    console.error(chalk.red.bold('\n✗ Error running examples:'), error.message);
    process.exit(1);
  }
}

// Run examples if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  basicResearchExample,
  quickResearchExample,
  streamingResearchExample,
  customOptimizationExample,
  batchResearchExample,
};
