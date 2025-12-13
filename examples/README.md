# Examples: Deep Research and PRD Generation

This directory contains comprehensive examples demonstrating the full capabilities of the Gemini Deep Research Agent and SPARC PRD generation system.

## 📚 Examples Overview

### 1. **Deep Research Example** (`deep-research-example.js`)

Demonstrates various research capabilities and workflows.

**What it covers:**
- Basic deep research on a topic
- Deep research with SPARC PRD generation
- Interactive deep dive with real-time progress
- Custom tech stack-specific PRD generation

**Run it:**
```bash
# Show all examples
node examples/deep-research-example.js

# Run specific example (1-4)
node examples/deep-research-example.js 1
node examples/deep-research-example.js 2
```

**Examples included:**

#### Example 1: Basic Deep Research
Simple research workflow demonstrating core capabilities.

```javascript
const agent = new DeepResearchAgent({
  depth: 4,
  breadth: 5,
  maxIterations: 3
});

const result = await agent.research('AI Agent Frameworks for Software Development in 2025');
```

#### Example 2: Deep Research → SPARC PRD
Complete workflow from research to production-ready PRD.

```javascript
const research = await agent.research(topic);
const prd = await sparcGenerator.generatePRD({ topic, research });
```

#### Example 3: Interactive Deep Dive
Real-time progress tracking with detailed iteration logging.

```javascript
const agent = new DeepResearchAgent({
  onProgress: (status) => console.log(status),
  onIteration: (iteration, queries, reflection) => {
    console.log(`Iteration ${iteration}: ${queries.length} queries`);
    console.log(`Completeness: ${reflection.completeness}%`);
  }
});
```

#### Example 4: Tech Stack-Specific PRD
Generate PRD tailored to specific technology stack.

```javascript
const prd = await sparcGenerator.generatePRD({
  topic,
  research,
  techStack: {
    backend: ['Node.js', 'Express', 'PostgreSQL'],
    frontend: ['React', 'TypeScript', 'TailwindCSS']
  }
});
```

---

### 2. **Complete Workflow Example** (`complete-workflow-example.js`)

Advanced examples showing full integration of all components.

**What it covers:**
- Complete PRD generation workflow
- DSPy.ts prompt optimization integration
- Parallel multi-project PRD generation
- Advanced custom workflows

**Run it:**
```bash
# Show menu
node examples/complete-workflow-example.js

# Run specific workflow (1-4)
node examples/complete-workflow-example.js 1
```

**Workflows included:**

#### Workflow 1: Complete PRD Generation
End-to-end PRD generation with full SPARC methodology.

```javascript
const agent = new PRDAgent({
  research: { depth: 5, breadth: 8, maxIterations: 7 },
  prd: { methodology: 'london-tdd', useOptimization: true }
});

const result = await agent.generatePRD('AI-Powered Code Review Assistant', {
  techStack: { /* ... */ },
  additionalContext: { /* ... */ }
});
```

**Output:**
- Comprehensive PRD document (5,000-15,000 words)
- Research report with 20-50 sources
- Analytics and metrics
- Estimated time: 5-15 minutes

#### Workflow 2: Optimized with DSPy
Multi-phase workflow with prompt optimization.

**Phases:**
1. **Deep Research**: Gather comprehensive information
2. **Prompt Optimization**: Improve generation quality with DSPy
3. **PRD Generation**: Create optimized SPARC PRD

```javascript
// Phase 1: Research
const research = await agent.executeResearch(topic);

// Phase 2: Optimization
const optimizer = new DSPyPromptOptimizer();
const examples = await optimizer.generateFewShotExamples(task, 3);
const optimized = await optimizer.optimizeForSPARC({ domain, methodology });

// Phase 3: Generation
const prd = await generator.generatePRD({ topic, research });
```

#### Workflow 3: Multi-Project Generation
Generate PRDs for multiple related projects.

```javascript
const projects = [
  'AI-Powered Code Review Tool',
  'Intelligent Test Generation Assistant',
  'Automated Documentation Generator',
  'Smart Refactoring Recommendation Engine'
];

const results = await agent.generateMultiplePRDs(projects, {
  methodology: 'london-tdd',
  delay: 3000  // 3s between projects
});
```

**Use cases:**
- Compare different approaches
- Generate related project documentation
- Batch documentation creation
- Competitive analysis

#### Workflow 4: Advanced Custom Workflow
Multi-step workflow with custom research and synthesis.

```javascript
const workflow = [
  {
    type: 'research',
    name: 'market-analysis',
    topic: 'AI Code Generation Market Analysis 2025'
  },
  {
    type: 'research',
    name: 'competitor-analysis',
    topic: 'GitHub Copilot, Cursor competitive analysis'
  },
  {
    type: 'generate-with-search',
    name: 'synthesis',
    prompt: 'Synthesize research into actionable insights'
  }
];

const result = await agent.executeWorkflow(workflow);
```

---

## 🎯 Use Case Examples

### Use Case 1: Planning New Feature

**Scenario:** You want to add AI-powered code review to your IDE.

```bash
# Generate comprehensive PRD
node examples/deep-research-example.js 2
# When prompted: "AI Code Review Integration for VS Code"
```

**Result:**
- Market research on existing solutions
- Technical architecture recommendations
- Complete SPARC PRD with implementation plan
- Test strategy using London School TDD

### Use Case 2: Architecture Decision

**Scenario:** Choosing between different architectural patterns.

```bash
# Research and compare approaches
node examples/complete-workflow-example.js 3
```

**Topics:**
- Microservices Architecture for AI Services
- Serverless Architecture for AI Services
- Monolithic Architecture for AI Services

**Result:**
- PRD for each approach
- Side-by-side comparison
- Informed decision making

### Use Case 3: Technical Documentation

**Scenario:** Generate documentation for existing project.

```javascript
import { PRDAgent } from './agents/prd-agent.js';

const agent = new PRDAgent();

const result = await agent.generatePRD('Your Project Name', {
  techStack: {
    // Your actual tech stack
  },
  additionalContext: {
    currentImplementation: 'Brief description of what exists',
    futureGoals: 'What you want to achieve'
  }
});
```

---

## 📊 Example Outputs

### Research Output Structure

```javascript
{
  learnings: [
    "AI coding assistants in 2025 focus on context-aware suggestions...",
    "Modern architectures use multi-agent systems for complex tasks...",
    // ... more insights
  ],
  sources: [
    { title: "Source Title", url: "https://..." },
    // ... more sources
  ],
  metadata: {
    iterations: 5,
    depth: 5,
    breadth: 7
  }
}
```

### PRD Output Structure

```markdown
# Product Requirements Document: [Topic]

**Generated**: 2025-01-15 10:30:00
**Methodology**: london-tdd

## Tech Stack
- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: React, TypeScript, TailwindCSS

## Executive Summary
[3-5 paragraph summary of the PRD]

---

# SPECIFICATION

## 1. Project Overview
[Detailed overview...]

## 2. Functional Requirements
1. [Requirement 1]
2. [Requirement 2]

## 3. User Stories
**As a** developer, **I want to** receive AI code suggestions, **so that** I can code faster

**Acceptance Criteria:**
- Given [context]
- When [action]
- Then [result]

---

# PSEUDOCODE
[Algorithm designs...]

---

# ARCHITECTURE
[System design...]

---

# REFINEMENT
[TDD implementation strategy...]

---

# COMPLETION
[Integration and deployment...]
```

---

## ⚙️ Configuration Examples

### Quick Research (Fast iteration)

```javascript
const agent = new PRDAgent({
  research: {
    depth: 3,
    breadth: 4,
    maxIterations: 3
  }
});
```

**Time:** ~2-3 minutes
**Use for:** Quick overviews, rapid prototyping

### Standard Research (Balanced)

```javascript
const agent = new PRDAgent({
  research: {
    depth: 4,
    breadth: 6,
    maxIterations: 5
  }
});
```

**Time:** ~5-7 minutes
**Use for:** Regular PRDs, feature planning

### Deep Research (Comprehensive)

```javascript
const agent = new PRDAgent({
  research: {
    depth: 5,
    breadth: 8,
    maxIterations: 8
  }
});
```

**Time:** ~10-15 minutes
**Use for:** Major features, architectural decisions

---

## 🔧 Customization Examples

### Custom Methodology

```javascript
const prd = await generator.generatePRD({
  topic,
  research,
  methodology: 'custom-tdd',
  includePhases: ['specification', 'architecture', 'completion']
});
```

### Custom Output Directory

```javascript
const agent = new PRDAgent({
  prd: {
    outputDir: './docs/prds'
  }
});
```

### Verbose Logging

```javascript
const agent = new PRDAgent({
  verbose: true
});
```

---

## 📈 Performance Tips

### 1. Optimize for Speed

```javascript
// Reduce iterations and breadth
const agent = new PRDAgent({
  research: {
    depth: 3,
    breadth: 4,
    maxIterations: 3
  }
});
```

### 2. Optimize for Quality

```javascript
// Increase iterations and breadth
const agent = new PRDAgent({
  research: {
    depth: 5,
    breadth: 8,
    maxIterations: 10
  },
  prd: {
    useOptimization: true
  }
});
```

### 3. Balance Cost and Quality

```javascript
// Moderate settings
const agent = new PRDAgent({
  research: {
    depth: 4,
    breadth: 6,
    maxIterations: 5
  }
});
```

---

## 🎓 Learning Path

### Beginner

1. Start with `deep-research-example.js` Example 1
2. Try different depth/breadth settings
3. Examine the generated research report

### Intermediate

1. Run `deep-research-example.js` Example 2
2. Study the generated PRD structure
3. Customize tech stack and context

### Advanced

1. Run `complete-workflow-example.js` Workflow 1
2. Explore DSPy optimization (Workflow 2)
3. Create custom workflows (Workflow 4)

---

## 🤝 Contributing Examples

Have a great use case? Contribute an example!

**Example template:**

```javascript
/**
 * Example: [Name]
 *
 * Demonstrates: [What it shows]
 * Use case: [When to use it]
 */
async function myExample() {
  // Implementation
}
```

---

## 📚 Additional Resources

- [Agent Documentation](../agents/README.md)
- [Main README](../README.md)
- [SPARC Methodology](https://github.com/ruvnet/claude-flow/wiki/SPARC-Methodology)
- [DSPy.ts Documentation](https://github.com/ruvnet/dspy.ts)

---

## 🐛 Troubleshooting

### Example won't run

```bash
# Make sure dependencies are installed
npm install

# Set your API key
export GEMINI_API_KEY=your_api_key_here

# Run with verbose logging
node examples/deep-research-example.js 1 --verbose
```

### Out of memory

```bash
# Reduce research parameters
# Edit the example file and lower depth/breadth values
```

### API rate limiting

```bash
# Add delays between requests
# Use lower breadth setting to reduce parallel queries
```

---

Enjoy exploring the examples! 🚀
