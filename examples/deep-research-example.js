#!/usr/bin/env node

/**
 * Deep Research Deep Dive Example
 *
 * This example demonstrates:
 * 1. Using the Gemini Deep Research Agent for comprehensive topic analysis
 * 2. Generating structured PRDs using SPARC methodology
 * 3. Integrating DSPy.ts for prompt optimization
 * 4. Creating production-ready documentation from research
 */

import { DeepResearchAgent } from '../src/research-agent.js';
import { SPARCGenerator } from '../agents/sparc-generator.js';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Example 1: Basic Deep Research
 */
async function basicDeepResearch() {
  console.log(chalk.bold.cyan('\n📚 Example 1: Basic Deep Research\n'));

  const topic = 'AI Agent Frameworks for Software Development in 2025';
  const spinner = ora(`Researching: ${topic}`).start();

  try {
    const agent = new DeepResearchAgent({
      depth: 4,
      breadth: 5,
      maxIterations: 3,
      onProgress: (status) => {
        spinner.text = `${status.phase}: ${status.message}`;
      },
      onIteration: (iteration, queries) => {
        console.log(chalk.yellow(`\n  Iteration ${iteration}: ${queries.length} queries`));
      }
    });

    const result = await agent.research(topic);
    spinner.succeed('Research completed!');

    console.log(chalk.green('\n✅ Research Summary:'));
    console.log(`  - Iterations: ${result.metadata.iterations}`);
    console.log(`  - Sources: ${result.sources.length}`);
    console.log(`  - Key Findings: ${result.learnings.length}`);

    return result;

  } catch (error) {
    spinner.fail('Research failed');
    console.error(chalk.red(error.message));
    throw error;
  }
}

/**
 * Example 2: Deep Research with SPARC PRD Generation
 */
async function deepResearchWithSPARC() {
  console.log(chalk.bold.cyan('\n📋 Example 2: Deep Research → SPARC PRD Generation\n'));

  const topic = 'Multi-Agent Code Generation System with Claude and Gemini';
  const spinner = ora(`Deep researching: ${topic}`).start();

  try {
    // Step 1: Conduct deep research
    const agent = new DeepResearchAgent({
      depth: 5,
      breadth: 6,
      maxIterations: 5,
      onProgress: (status) => {
        spinner.text = `${status.phase}: ${status.message}`;
      }
    });

    const research = await agent.research(topic);
    spinner.succeed('Research completed!');

    // Step 2: Generate SPARC PRD
    spinner.start('Generating SPARC PRD...');
    const sparcGenerator = new SPARCGenerator();

    const prd = await sparcGenerator.generatePRD({
      topic,
      research,
      methodology: 'london-tdd',
      includePhases: ['specification', 'pseudocode', 'architecture', 'refinement', 'completion']
    });

    spinner.succeed('SPARC PRD generated!');

    console.log(chalk.green('\n✅ PRD Summary:'));
    console.log(`  - Total Phases: ${prd.phases.length}`);
    console.log(`  - User Stories: ${prd.specification?.userStories?.length || 0}`);
    console.log(`  - Architecture Components: ${prd.architecture?.components?.length || 0}`);
    console.log(`  - File: ${prd.filePath}`);

    return { research, prd };

  } catch (error) {
    spinner.fail('Failed to generate PRD');
    console.error(chalk.red(error.message));
    throw error;
  }
}

/**
 * Example 3: Interactive Deep Dive with Real-time Progress
 */
async function interactiveDeepDive() {
  console.log(chalk.bold.cyan('\n🎯 Example 3: Interactive Deep Dive\n'));

  const topic = 'Building Production-Ready AI Coding Agents';

  const agent = new DeepResearchAgent({
    depth: 5,
    breadth: 8,
    maxIterations: 10,
    onProgress: (status) => {
      const emoji = {
        'Query Generation': '🔍',
        'Research': '📖',
        'Analysis': '🧠',
        'Reflection': '💭',
        'Report': '📄'
      }[status.phase] || '⚙️';

      console.log(chalk.dim(`${emoji} ${status.phase}: ${status.message}`));
    },
    onIteration: (iteration, queries, reflection) => {
      console.log(chalk.cyan(`\n━━━ Iteration ${iteration} ━━━`));
      console.log(chalk.yellow(`📋 Queries (${queries.length}):`));
      queries.slice(0, 3).forEach((q, i) => {
        console.log(chalk.dim(`  ${i + 1}. ${q.substring(0, 80)}...`));
      });

      if (reflection?.gaps?.length > 0) {
        console.log(chalk.magenta(`\n🔍 Identified Gaps:`));
        reflection.gaps.slice(0, 3).forEach((gap, i) => {
          console.log(chalk.dim(`  - ${gap}`));
        });
      }

      console.log(chalk.green(`\n📊 Completeness Score: ${reflection?.completeness || 0}%\n`));
    }
  });

  const result = await agent.research(topic);

  console.log(chalk.bold.green('\n✨ Deep Dive Complete!\n'));
  console.log(chalk.cyan('📈 Research Metrics:'));
  console.log(`  - Total Iterations: ${result.metadata.iterations}`);
  console.log(`  - Unique Sources: ${result.sources.length}`);
  console.log(`  - Key Learnings: ${result.learnings.length}`);
  console.log(`  - Research Time: ${result.metadata.duration || 'N/A'}`);
  console.log(chalk.dim(`\n📁 Report saved to: ${result.reportPath || 'N/A'}\n`));

  return result;
}

/**
 * Example 4: Custom Research with PRD for Specific Tech Stack
 */
async function customTechStackPRD() {
  console.log(chalk.bold.cyan('\n🛠️  Example 4: Tech Stack-Specific PRD Generation\n'));

  const topic = 'Real-time Collaborative Code Editor';
  const techStack = {
    backend: ['Node.js', 'Express', 'WebSocket', 'Redis'],
    frontend: ['React', 'TypeScript', 'Monaco Editor', 'TailwindCSS'],
    ai: ['Claude Sonnet 4.5', 'Gemini 2.5 Flash'],
    infrastructure: ['Docker', 'Kubernetes', 'GitHub Actions']
  };

  console.log(chalk.yellow('Target Tech Stack:'));
  Object.entries(techStack).forEach(([category, techs]) => {
    console.log(chalk.dim(`  ${category}: ${techs.join(', ')}`));
  });

  const spinner = ora('Researching and generating PRD...').start();

  try {
    // Research with context
    const agent = new DeepResearchAgent({
      depth: 5,
      breadth: 7,
      maxIterations: 4
    });

    const contextualTopic = `${topic} using ${Object.values(techStack).flat().join(', ')}`;
    const research = await agent.research(contextualTopic);

    // Generate PRD
    const sparcGenerator = new SPARCGenerator();
    const prd = await sparcGenerator.generatePRD({
      topic,
      research,
      techStack,
      methodology: 'london-tdd',
      additionalContext: {
        targetUsers: ['Software developers', 'Development teams'],
        scalabilityRequirements: 'Support 1000+ concurrent users',
        performanceTargets: 'Sub-100ms latency for edits'
      }
    });

    spinner.succeed('Tech-specific PRD generated!');

    console.log(chalk.green('\n✅ Generated PRD Sections:'));
    Object.keys(prd.phases).forEach(phase => {
      console.log(chalk.dim(`  ✓ ${phase}`));
    });

    return { research, prd };

  } catch (error) {
    spinner.fail('Failed');
    throw error;
  }
}

/**
 * Main runner
 */
async function main() {
  console.log(chalk.bold.blue('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.blue('║  Deep Research Deep Dive Examples         ║'));
  console.log(chalk.bold.blue('╚════════════════════════════════════════════╝\n'));

  const examples = [
    { name: 'Basic Deep Research', fn: basicDeepResearch },
    { name: 'Deep Research with SPARC PRD', fn: deepResearchWithSPARC },
    { name: 'Interactive Deep Dive', fn: interactiveDeepDive },
    { name: 'Custom Tech Stack PRD', fn: customTechStackPRD }
  ];

  // Get example to run from command line argument
  const exampleNum = parseInt(process.argv[2]) || 0;

  if (exampleNum === 0) {
    // Run all examples
    console.log(chalk.yellow('Running all examples sequentially...\n'));
    for (const example of examples) {
      try {
        await example.fn();
      } catch (error) {
        console.error(chalk.red(`Error in ${example.name}:`), error.message);
      }
    }
  } else if (exampleNum > 0 && exampleNum <= examples.length) {
    // Run specific example
    const example = examples[exampleNum - 1];
    console.log(chalk.yellow(`Running: ${example.name}\n`));
    await example.fn();
  } else {
    console.log(chalk.yellow('Usage: node deep-research-example.js [example-number]'));
    console.log(chalk.dim('\nAvailable examples:'));
    examples.forEach((ex, i) => {
      console.log(chalk.dim(`  ${i + 1}. ${ex.name}`));
    });
    console.log(chalk.dim('\nOmit example number to run all examples.\n'));
  }

  console.log(chalk.bold.green('\n✨ Examples complete!\n'));
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  basicDeepResearch,
  deepResearchWithSPARC,
  interactiveDeepDive,
  customTechStackPRD
};
