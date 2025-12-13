/**
 * DSPy.ts Prompt Optimizer Integration
 *
 * This module integrates DSPy.ts-inspired prompt optimization techniques
 * to automatically improve prompts for PRD generation and research tasks.
 *
 * While DSPy.ts is a TypeScript framework, this implementation adapts
 * its core concepts for use with the Gemini Deep Research Agent.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getConfig } from '../src/config.js';

/**
 * Prompt Optimizer using DSPy-inspired techniques
 */
export class DSPyPromptOptimizer {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.GEMINI_API_KEY,
      model: config.model || 'gemini-2.5-flash',
      optimizationMetric: config.metric || 'quality',
      maxIterations: config.maxIterations || 5,
      temperature: config.temperature || 0.9,
      ...config
    };

    const geminiConfig = getConfig();
    this.geminiAI = new GoogleGenerativeAI(this.config.apiKey);

    // Optimization history
    this.history = [];
  }

  /**
   * Optimize a prompt using iterative refinement
   *
   * Inspired by DSPy's BootstrapFewShot optimizer
   *
   * @param {string} basePrompt - Initial prompt to optimize
   * @param {Array<Object>} examples - Training examples with input/output pairs
   * @param {Function} metric - Evaluation metric function
   * @returns {Promise<Object>} Optimized prompt and performance metrics
   */
  async optimizePrompt(basePrompt, examples = [], metric = null) {
    const evaluationMetric = metric || this.defaultQualityMetric;

    let currentPrompt = basePrompt;
    let bestPrompt = basePrompt;
    let bestScore = 0;
    const iterations = [];

    for (let i = 0; i < this.config.maxIterations; i++) {
      // Test current prompt against examples
      const scores = [];

      for (const example of examples.slice(0, 5)) { // Limit to 5 for cost
        const result = await this.testPrompt(currentPrompt, example.input);
        const score = await evaluationMetric(result, example.expectedOutput);
        scores.push(score);
      }

      const avgScore = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);

      iterations.push({
        iteration: i + 1,
        prompt: currentPrompt,
        score: avgScore,
        scores
      });

      // Update best if improved
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestPrompt = currentPrompt;
      }

      // Generate improved prompt for next iteration
      if (i < this.config.maxIterations - 1) {
        currentPrompt = await this.refinePrompt(currentPrompt, avgScore, scores);
      }
    }

    const optimization = {
      originalPrompt: basePrompt,
      optimizedPrompt: bestPrompt,
      improvement: bestScore,
      iterations,
      timestamp: new Date().toISOString()
    };

    this.history.push(optimization);

    return optimization;
  }

  /**
   * Generate few-shot examples automatically
   *
   * Inspired by DSPy's automatic demonstration generation
   *
   * @param {string} task - Task description
   * @param {number} count - Number of examples to generate
   * @returns {Promise<Array<Object>>} Generated examples
   */
  async generateFewShotExamples(task, count = 3) {
    const model = this.geminiAI.getGenerativeModel({
      model: this.config.model
    });

    const prompt = `Generate ${count} diverse, high-quality examples for the following task:

Task: ${task}

For each example, provide:
1. A realistic input scenario
2. The expected high-quality output
3. Explanation of why this output is good

Format as JSON array:
[
  {
    "input": "...",
    "expectedOutput": "...",
    "rationale": "..."
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      return JSON.parse(jsonText);
    } catch (error) {
      console.warn('Failed to parse generated examples:', error.message);
      return [];
    }
  }

  /**
   * Optimize a prompt for SPARC PRD generation
   *
   * Specialized optimization for PRD generation tasks
   *
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimized prompts for each SPARC phase
   */
  async optimizeForSPARC(options = {}) {
    const {
      domain = 'software development',
      methodology = 'london-tdd',
      sampleResearch = null
    } = options;

    const phases = [
      'specification',
      'pseudocode',
      'architecture',
      'refinement',
      'completion'
    ];

    const optimizedPrompts = {};

    for (const phase of phases) {
      const basePrompt = this.getBaseSPARCPrompt(phase, domain, methodology);

      // Generate examples for this phase
      const examples = await this.generateFewShotExamples(
        `Generate ${phase} section for a ${domain} PRD using ${methodology}`,
        2
      );

      // Optimize the prompt
      const optimization = await this.optimizePrompt(
        basePrompt,
        examples,
        this.sparcQualityMetric
      );

      optimizedPrompts[phase] = optimization.optimizedPrompt;
    }

    return {
      prompts: optimizedPrompts,
      metadata: {
        domain,
        methodology,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Test a prompt against an input
   *
   * @private
   */
  async testPrompt(prompt, input) {
    const model = this.geminiAI.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    });

    const fullPrompt = `${prompt}\n\nInput: ${input}`;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  }

  /**
   * Refine a prompt based on performance
   *
   * @private
   */
  async refinePrompt(currentPrompt, score, scores) {
    const model = this.geminiAI.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: 2048
      }
    });

    const prompt = `You are a prompt optimization expert. Improve the following prompt to achieve better results.

Current Prompt:
${currentPrompt}

Performance Score: ${(score * 100).toFixed(1)}%
Individual Scores: ${scores.map(s => (s * 100).toFixed(0) + '%').join(', ')}

Analyze the prompt and suggest improvements that would:
1. Make instructions clearer and more specific
2. Add helpful constraints or guidelines
3. Improve output structure and format
4. Better align with the evaluation criteria

Provide ONLY the improved prompt, without explanations.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }

  /**
   * Default quality metric
   *
   * @private
   */
  async defaultQualityMetric(output, expected) {
    // Simple similarity check (in production, use embeddings or LLM evaluation)
    const outputWords = new Set(output.toLowerCase().split(/\s+/));
    const expectedWords = new Set(expected.toLowerCase().split(/\s+/));

    const intersection = new Set([...outputWords].filter(x => expectedWords.has(x)));
    const union = new Set([...outputWords, ...expectedWords]);

    return intersection.size / union.size;
  }

  /**
   * SPARC-specific quality metric
   *
   * @private
   */
  async sparcQualityMetric(output, expected) {
    // Check for key SPARC elements
    const criteria = [
      /###?\s+(Specification|Requirements)/i,
      /###?\s+(Architecture|Design)/i,
      /user\s+stor(y|ies)/i,
      /acceptance\s+criteria/i,
      /test/i
    ];

    const score = criteria.filter(regex => regex.test(output)).length / criteria.length;

    // Also check length and structure
    const hasStructure = output.includes('#') && output.split('\n').length > 10;
    const lengthScore = Math.min(output.length / 1000, 1);

    return (score + (hasStructure ? 0.2 : 0) + lengthScore * 0.3) / 1.5;
  }

  /**
   * Get base prompt for a SPARC phase
   *
   * @private
   */
  getBaseSPARCPrompt(phase, domain, methodology) {
    const prompts = {
      specification: `Generate a detailed Specification section for a ${domain} project using ${methodology}.

Include:
- Project overview and objectives
- Functional requirements (detailed, numbered)
- User stories with acceptance criteria
- Non-functional requirements (performance, security, scalability)
- Technical constraints and dependencies

Use clear, professional language and structured formatting.`,

      pseudocode: `Generate a Pseudocode section for a ${domain} project using ${methodology}.

Include:
- High-level algorithm design
- Key data structures
- Control flow logic
- Error handling approach
- Test strategy outline

Use clear, language-agnostic pseudocode.`,

      architecture: `Generate an Architecture section for a ${domain} project using ${methodology}.

Include:
- System architecture overview
- Component breakdown and responsibilities
- Interface definitions and contracts
- Data architecture (schema, access patterns)
- Infrastructure design (deployment, CI/CD)

Use clear diagrams or structured descriptions.`,

      refinement: `Generate a Refinement/Implementation section for a ${domain} project using ${methodology} and London School TDD.

Include:
- Test-driven development approach
- Component implementation order
- Mock/stub strategy
- Integration testing approach
- Quality assurance gates

Focus on iterative refinement and testing.`,

      completion: `Generate a Completion section for a ${domain} project using ${methodology}.

Include:
- Integration checklist
- Documentation requirements
- Deployment procedures
- Monitoring and observability setup
- Post-deployment validation

Ensure production-readiness.`
    };

    return prompts[phase] || prompts.specification;
  }

  /**
   * Get optimization history
   */
  getHistory(limit = 10) {
    return this.history.slice(-limit);
  }

  /**
   * Clear optimization history
   */
  clearHistory() {
    this.history = [];
  }
}

/**
 * Create a prompt optimizer instance
 */
export function createOptimizer(config = {}) {
  return new DSPyPromptOptimizer(config);
}

export default DSPyPromptOptimizer;
