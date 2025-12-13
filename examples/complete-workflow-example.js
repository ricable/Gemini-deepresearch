#!/usr/bin/env node

/**
 * Complete Workflow Example
 *
 * This example demonstrates the full integration of:
 * - Gemini Deep Research Agent
 * - Claude Agent SDK patterns
 * - DSPy.ts prompt optimization
 * - SPARC PRD generation with London School TDD
 *
 * It shows a real-world scenario of building a production-ready PRD
 * for an AI coding assistant product.
 */

import { PRDAgent } from '../agents/prd-agent.js';
import { ClaudeGeminiAgent } from '../agents/claude-agent-sdk.js';
import { DSPyPromptOptimizer } from '../agents/dspy-optimizer.js';
import { SPARCGenerator } from '../agents/sparc-generator.js';
import chalk from 'chalk';

/**
 * Example 1: Complete PRD Generation Workflow
 */
async function completeWorkflowExample() {
  console.log(chalk.bold.cyan('\n' + '='.repeat(60)));
  console.log(chalk.bold.cyan('  COMPLETE WORKFLOW: AI CODING ASSISTANT PRD'));
  console.log(chalk.bold.cyan('='.repeat(60) + '\n'));

  // Define the project
  const project = {
    topic: 'AI-Powered Code Review and Refactoring Assistant',
    techStack: {
      backend: ['Node.js', 'Express', 'PostgreSQL', 'Redis'],
      frontend: ['React', 'TypeScript', 'TailwindCSS', 'Monaco Editor'],
      ai: ['Claude Sonnet 4.5', 'Gemini 2.5 Flash'],
      infrastructure: ['Docker', 'Kubernetes', 'GitHub Actions', 'Prometheus']
    },
    context: {
      targetUsers: 'Professional software developers and engineering teams',
      scalabilityTarget: '10,000+ concurrent users',
      performanceTarget: 'Sub-100ms API response time for 95th percentile',
      securityRequirements: 'SOC2 Type II compliance, end-to-end encryption',
      integrations: 'GitHub, GitLab, Bitbucket, VS Code, JetBrains IDEs'
    }
  };

  console.log(chalk.yellow('Project Configuration:'));
  console.log(chalk.dim(JSON.stringify(project, null, 2)));
  console.log();

  // Initialize the PRD agent
  const agent = new PRDAgent({
    research: {
      depth: 5,
      breadth: 8,
      maxIterations: 7
    },
    prd: {
      methodology: 'london-tdd',
      useOptimization: true
    },
    verbose: true
  });

  // Generate the PRD
  const result = await agent.generatePRD(project.topic, {
    techStack: project.techStack,
    additionalContext: project.context
  });

  if (result.success) {
    console.log(chalk.green('\n✅ PRD Generated Successfully!\n'));
    console.log(chalk.cyan('Key Deliverables:'));
    console.log(chalk.white(`  📄 PRD Document: ${result.prd.filePath}`));
    console.log(chalk.white(`  📊 Research Sources: ${result.research.sources.length}`));
    console.log(chalk.white(`  📝 Key Insights: ${result.research.learnings.length}`));
    console.log(chalk.white(`  ⏱️  Total Time: ${result.analytics.timing.durationFormatted}`));
  } else {
    console.error(chalk.red('\n❌ PRD Generation Failed'));
    console.error(chalk.red(`Error: ${result.error}`));
  }

  return result;
}

/**
 * Example 2: Multi-Phase Workflow with Optimization
 */
async function optimizedWorkflowExample() {
  console.log(chalk.bold.cyan('\n' + '='.repeat(60)));
  console.log(chalk.bold.cyan('  OPTIMIZED WORKFLOW: With DSPy Prompt Optimization'));
  console.log(chalk.bold.cyan('='.repeat(60) + '\n'));

  // Step 1: Research Phase
  console.log(chalk.yellow('📚 Phase 1: Deep Research\n'));

  const agent = new ClaudeGeminiAgent({
    research: {
      depth: 5,
      breadth: 7,
      maxIterations: 5
    }
  });

  await agent.initialize();

  const research = await agent.executeResearch(
    'Modern AI Coding Assistants: Architecture, Capabilities, and Best Practices 2025',
    {
      onProgress: (status) => {
        console.log(chalk.dim(`  ${status.phase}: ${status.message}`));
      }
    }
  );

  console.log(chalk.green(`✅ Research Complete: ${research.sources.length} sources\n`));

  // Step 2: Prompt Optimization Phase
  console.log(chalk.yellow('🔧 Phase 2: Prompt Optimization\n'));

  const optimizer = new DSPyPromptOptimizer();

  // Generate few-shot examples for better PRD generation
  const examples = await optimizer.generateFewShotExamples(
    'Generate a comprehensive software specification with user stories and acceptance criteria',
    3
  );

  console.log(chalk.green(`✅ Generated ${examples.length} training examples\n`));

  // Optimize prompts for SPARC methodology
  const optimizedPrompts = await optimizer.optimizeForSPARC({
    domain: 'AI-powered software development tools',
    methodology: 'london-tdd'
  });

  console.log(chalk.green('✅ Prompts Optimized for SPARC\n'));

  // Step 3: PRD Generation Phase
  console.log(chalk.yellow('📋 Phase 3: SPARC PRD Generation\n'));

  const generator = new SPARCGenerator({
    useOptimization: true
  });

  const prd = await generator.generatePRD({
    topic: 'AI Code Review Assistant',
    research,
    methodology: 'london-tdd',
    techStack: {
      backend: ['Node.js', 'Python', 'FastAPI'],
      frontend: ['React', 'TypeScript'],
      ai: ['Claude Sonnet 4.5', 'Gemini 2.5 Flash'],
      ml: ['TensorFlow', 'PyTorch', 'scikit-learn']
    }
  });

  console.log(chalk.green(`✅ PRD Generated: ${prd.filePath}\n`));

  return { research, optimizedPrompts, prd };
}

/**
 * Example 3: Parallel Multi-Project PRD Generation
 */
async function multiProjectExample() {
  console.log(chalk.bold.cyan('\n' + '='.repeat(60)));
  console.log(chalk.bold.cyan('  MULTI-PROJECT: Parallel PRD Generation'));
  console.log(chalk.bold.cyan('='.repeat(60) + '\n'));

  const projects = [
    'AI-Powered Code Review Tool',
    'Intelligent Test Generation Assistant',
    'Automated Documentation Generator',
    'Smart Refactoring Recommendation Engine'
  ];

  const agent = new PRDAgent({
    research: { depth: 4, breadth: 6, maxIterations: 4 },
    verbose: false
  });

  console.log(chalk.yellow(`Generating PRDs for ${projects.length} projects...\n`));

  const results = await agent.generateMultiplePRDs(projects, {
    methodology: 'london-tdd',
    delay: 3000 // 3s delay between projects
  });

  // Summary
  console.log(chalk.bold.green('\n' + '='.repeat(60)));
  console.log(chalk.bold.green('  GENERATION COMPLETE'));
  console.log(chalk.bold.green('='.repeat(60) + '\n'));

  const successful = results.filter(r => r.success).length;
  console.log(chalk.cyan(`✅ Successful: ${successful}/${projects.length}`));
  console.log(chalk.cyan('\nGenerated PRDs:'));

  results.forEach((result, i) => {
    if (result.success) {
      console.log(chalk.green(`  ${i + 1}. ${result.topic}`));
      console.log(chalk.dim(`     ${result.prd.filePath}`));
    } else {
      console.log(chalk.red(`  ${i + 1}. ${result.topic} - FAILED`));
    }
  });

  return results;
}

/**
 * Example 4: Custom Workflow with Advanced Features
 */
async function advancedWorkflowExample() {
  console.log(chalk.bold.cyan('\n' + '='.repeat(60)));
  console.log(chalk.bold.cyan('  ADVANCED WORKFLOW: Custom Multi-Step Process'));
  console.log(chalk.bold.cyan('='.repeat(60) + '\n'));

  const agent = new ClaudeGeminiAgent();
  await agent.initialize();

  // Define a custom workflow
  const workflow = [
    {
      type: 'research',
      name: 'market-analysis',
      topic: 'AI Code Generation Market Analysis 2025',
      options: { depth: 4, maxIterations: 3 },
      outputKey: 'marketResearch'
    },
    {
      type: 'research',
      name: 'competitor-analysis',
      topic: 'GitHub Copilot, Cursor, Replit AI competitive analysis',
      options: { depth: 4, maxIterations: 3 },
      outputKey: 'competitorResearch'
    },
    {
      type: 'research',
      name: 'technical-architecture',
      topic: 'Best practices for AI coding assistant architecture',
      options: { depth: 5, maxIterations: 4 },
      outputKey: 'technicalResearch'
    },
    {
      type: 'generate-with-search',
      name: 'synthesis',
      prompt: `Synthesize the following research into key insights for building an AI coding assistant:

Market Research: {{marketResearch}}
Competitor Analysis: {{competitorResearch}}
Technical Research: {{technicalResearch}}

Provide:
1. Market opportunities and gaps
2. Competitive advantages we should focus on
3. Technical architecture recommendations
4. Key features to prioritize`,
      outputKey: 'synthesis'
    }
  ];

  console.log(chalk.yellow('Executing custom workflow with 4 steps...\n'));

  const result = await agent.executeWorkflow(workflow, {
    marketResearch: '',
    competitorResearch: '',
    technicalResearch: '',
    synthesis: ''
  });

  console.log(chalk.green('\n✅ Workflow Complete\n'));
  console.log(chalk.cyan('Steps Executed:'));

  result.steps.forEach((step, i) => {
    const status = step.success ? chalk.green('✓') : chalk.red('✗');
    console.log(`  ${status} ${i + 1}. ${step.stepName}`);
  });

  // Now generate PRD using the synthesized research
  if (result.success) {
    console.log(chalk.yellow('\n📋 Generating PRD from workflow results...\n'));

    const generator = new SPARCGenerator();
    const synthesis = result.finalContext.synthesis;

    const prd = await generator.generatePRD({
      topic: 'Next-Generation AI Coding Assistant',
      research: {
        learnings: [synthesis.content],
        sources: synthesis.sources || [],
        metadata: {}
      },
      methodology: 'london-tdd'
    });

    console.log(chalk.green(`✅ PRD Generated: ${prd.filePath}\n`));

    return { workflow: result, prd };
  }

  return { workflow: result };
}

/**
 * Main runner
 */
async function main() {
  console.log(chalk.bold.blue('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.blue('║  Complete Workflow Examples: Deep Research → SPARC PRD    ║'));
  console.log(chalk.bold.blue('╚════════════════════════════════════════════════════════════╝\n'));

  const examples = [
    { name: 'Complete PRD Generation Workflow', fn: completeWorkflowExample },
    { name: 'Optimized Workflow with DSPy', fn: optimizedWorkflowExample },
    { name: 'Parallel Multi-Project Generation', fn: multiProjectExample },
    { name: 'Advanced Custom Workflow', fn: advancedWorkflowExample }
  ];

  // Get example to run from command line argument
  const exampleNum = parseInt(process.argv[2]) || 0;

  if (exampleNum === 0) {
    // Show menu
    console.log(chalk.yellow('Select an example to run:\n'));
    examples.forEach((ex, i) => {
      console.log(chalk.white(`  ${i + 1}. ${ex.name}`));
    });
    console.log(chalk.white(`  0. Run all examples\n`));
    console.log(chalk.dim('Usage: node complete-workflow-example.js [1-4]\n'));
    process.exit(0);
  } else if (exampleNum > 0 && exampleNum <= examples.length) {
    // Run specific example
    const example = examples[exampleNum - 1];
    console.log(chalk.yellow(`Running: ${example.name}\n`));
    await example.fn();
  } else {
    console.log(chalk.red('Invalid example number'));
    process.exit(1);
  }

  console.log(chalk.bold.green('\n✨ Example complete!\n'));
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  });
}

export {
  completeWorkflowExample,
  optimizedWorkflowExample,
  multiProjectExample,
  advancedWorkflowExample
};
