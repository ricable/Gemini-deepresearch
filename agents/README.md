# AI Agents for Deep Research and PRD Generation

This directory contains advanced AI agents that combine Gemini Deep Research with SPARC methodology for automated PRD generation.

## 🎯 Overview

The agent system provides:

1. **Claude-Gemini Hybrid Agent**: Multi-model orchestration for research workflows
2. **DSPy.ts Prompt Optimizer**: Automatic prompt improvement using DSPy-inspired techniques
3. **SPARC PRD Generator**: Comprehensive PRD generation following London School TDD
4. **Complete PRD Agent**: End-to-end pipeline from research to production-ready PRD

## 📦 Components

### 1. Claude Agent SDK Integration (`claude-agent-sdk.js`)

Bridges Gemini Deep Research with Claude Agent SDK patterns for multi-model orchestration.

**Features:**
- Execute deep research workflows
- Generate content with web search grounding
- Multi-step agent workflows
- Progress tracking and history

**Example:**
```javascript
import { ClaudeGeminiAgent } from './agents/claude-agent-sdk.js';

const agent = new ClaudeGeminiAgent({
  research: { depth: 5, breadth: 7, maxIterations: 6 }
});

await agent.initialize();
const research = await agent.executeResearch('AI Coding Agents 2025');
```

### 2. DSPy.ts Prompt Optimizer (`dspy-optimizer.js`)

Implements DSPy-inspired prompt optimization for better PRD generation.

**Features:**
- Iterative prompt refinement
- Few-shot example generation
- SPARC-specific optimization
- Performance metrics tracking

**Example:**
```javascript
import { DSPyPromptOptimizer } from './agents/dspy-optimizer.js';

const optimizer = new DSPyPromptOptimizer();

// Optimize prompts for SPARC methodology
const optimized = await optimizer.optimizeForSPARC({
  domain: 'software development',
  methodology: 'london-tdd'
});
```

### 3. SPARC PRD Generator (`sparc-generator.js`)

Generates comprehensive PRDs following SPARC methodology:
- **S**pecification: Requirements and user stories
- **P**seudocode: High-level algorithm design
- **A**rchitecture: System design and components
- **R**efinement: TDD implementation (London School)
- **C**ompletion: Integration and deployment

**Features:**
- All five SPARC phases
- Tech stack-aware generation
- Research insights integration
- London School TDD methodology
- Automatic documentation

**Example:**
```javascript
import { SPARCGenerator } from './agents/sparc-generator.js';

const generator = new SPARCGenerator();

const prd = await generator.generatePRD({
  topic: 'Real-time Collaborative Editor',
  research: researchResults,
  methodology: 'london-tdd',
  techStack: {
    backend: ['Node.js', 'WebSocket'],
    frontend: ['React', 'TypeScript']
  }
});
```

### 4. Complete PRD Agent (`prd-agent.js`)

End-to-end agent combining all components for automated PRD generation.

**Features:**
- Automated deep research
- SPARC PRD generation
- Analytics and reporting
- Multi-PRD workflows
- CLI interface

**Example:**
```javascript
import { PRDAgent } from './agents/prd-agent.js';

const agent = new PRDAgent({
  depth: 5,
  breadth: 7,
  methodology: 'london-tdd',
  verbose: true
});

const result = await agent.generatePRD('AI-Powered Code Review Tool');
```

## 🚀 Quick Start

### Using the Complete PRD Agent

```bash
# Generate a PRD from the command line
node agents/prd-agent.js "Your Topic Here"

# With options
node agents/prd-agent.js "AI Coding Assistant" --depth 5 --breadth 7 --verbose

# Multiple PRDs
node agents/prd-agent.js "Topic 1" "Topic 2" "Topic 3"
```

### Programmatic Usage

```javascript
import { PRDAgent } from './agents/prd-agent.js';

const agent = new PRDAgent({
  research: {
    depth: 5,
    breadth: 7,
    maxIterations: 6
  },
  prd: {
    methodology: 'london-tdd',
    outputDir: './prds',
    useOptimization: true
  },
  verbose: true
});

const result = await agent.generatePRD('AI-Powered Development Assistant', {
  techStack: {
    backend: ['Node.js', 'Express', 'PostgreSQL'],
    frontend: ['React', 'TypeScript', 'TailwindCSS'],
    ai: ['Claude Sonnet 4.5', 'Gemini 2.5 Flash']
  },
  additionalContext: {
    targetUsers: ['Professional developers', 'Development teams'],
    scalability: 'Support 10,000+ concurrent users',
    performance: 'Sub-100ms API response time'
  }
});

console.log(`PRD generated: ${result.prd.filePath}`);
```

## 📋 SPARC Methodology

### Phase Breakdown

#### 1. **Specification**
- Project overview and objectives
- Functional requirements
- User stories with acceptance criteria
- Non-functional requirements (performance, security)
- Technical constraints and dependencies

#### 2. **Pseudocode**
- High-level algorithm design
- Key data structures
- Control flow logic
- Error handling strategy
- Test strategy outline

#### 3. **Architecture**
- System architecture overview
- Component breakdown
- Data architecture and API design
- Infrastructure architecture
- Integration points

#### 4. **Refinement** (London School TDD)
- Test-driven development approach
- Component implementation order
- Mock/stub strategy
- Integration testing
- Quality assurance gates

#### 5. **Completion**
- Integration checklist
- Documentation requirements
- Deployment procedures
- Monitoring and observability
- Production readiness criteria

## 🎓 London School TDD

The agents follow London School TDD principles:

- **Outside-In Development**: Start with high-level behavior
- **Mock External Dependencies**: Test components in isolation
- **Behavior Over State**: Test what objects do, not what they are
- **Test First**: Write tests before implementation
- **Red-Green-Refactor**: Iterative development cycle

## 🔧 Configuration

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
GEMINI_MODEL=gemini-2.5-flash
```

### Agent Configuration

```javascript
const config = {
  // Gemini API
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: 'gemini-2.5-flash',

  // Research settings
  research: {
    depth: 5,           // 1-5, quality and thoroughness
    breadth: 7,         // 1-10, parallel queries per iteration
    maxIterations: 6    // 1-20, maximum research loops
  },

  // PRD settings
  prd: {
    methodology: 'london-tdd',
    outputDir: './prds',
    useOptimization: true
  },

  // Logging
  verbose: true
};
```

## 📊 Output Structure

Generated PRDs are saved as markdown files:

```
prds/
├── prd-ai-coding-assistant-2025-01-15.md
├── prd-real-time-editor-2025-01-15.md
└── ...
```

Each PRD contains:
- Executive summary
- Tech stack overview
- All SPARC phases with detailed content
- Research sources and citations
- Generation metadata

## 🎯 Use Cases

### 1. Product Planning
Generate comprehensive PRDs for new product features based on market research.

### 2. Technical Documentation
Create detailed technical specifications from high-level requirements.

### 3. Architecture Design
Design system architectures informed by latest best practices and research.

### 4. TDD Implementation Planning
Plan test-driven development with London School methodology.

### 5. Multi-Project Analysis
Generate PRDs for multiple related projects to compare approaches.

## 🤝 Integration Examples

### With Existing Codebase

```javascript
import { PRDAgent } from './agents/prd-agent.js';
import { analyzeCodebase } from './your-analyzer.js';

const codebaseAnalysis = await analyzeCodebase('./src');

const agent = new PRDAgent();
const result = await agent.generatePRD('Refactor Authentication System', {
  additionalContext: {
    currentArchitecture: codebaseAnalysis.architecture,
    technicalDebt: codebaseAnalysis.issues,
    constraints: codebaseAnalysis.dependencies
  }
});
```

### With CI/CD Pipeline

```javascript
// In your CI pipeline
import { PRDAgent } from './agents/prd-agent.js';

const agent = new PRDAgent({ verbose: false });

// Generate PRD from issue/PR description
const issueDescription = process.env.ISSUE_DESCRIPTION;
const result = await agent.generatePRD(issueDescription);

// Upload PRD as artifact
await uploadArtifact(result.prd.filePath);
```

## 🔬 Advanced Features

### Custom Workflow Steps

```javascript
const agent = new ClaudeGeminiAgent();

await agent.executeWorkflow([
  {
    type: 'research',
    name: 'market-research',
    topic: '{{topic}} market analysis',
    outputKey: 'marketResearch'
  },
  {
    type: 'research',
    name: 'technical-research',
    topic: '{{topic}} technical implementation',
    outputKey: 'technicalResearch'
  },
  {
    type: 'generate',
    name: 'synthesis',
    prompt: 'Synthesize market and technical research: {{marketResearch}} {{technicalResearch}}',
    outputKey: 'synthesis'
  }
], { topic: 'AI Code Generation' });
```

### Prompt Optimization

```javascript
const optimizer = new DSPyPromptOptimizer();

// Generate training examples
const examples = await optimizer.generateFewShotExamples(
  'Generate specification section for software PRD',
  5
);

// Optimize prompt
const optimized = await optimizer.optimizePrompt(
  basePrompt,
  examples,
  customMetric
);
```

## 📈 Performance

- **Research Time**: 2-5 minutes per topic (depth 5, breadth 7)
- **PRD Generation**: 1-3 minutes per phase
- **Total Time**: 5-15 minutes for complete PRD
- **Source Quality**: 10-50 unique sources per research
- **PRD Length**: 5,000-15,000 words typical

## 🛠️ Troubleshooting

### Rate Limiting

If you encounter rate limiting:
```javascript
const agent = new PRDAgent({
  research: {
    breadth: 5,  // Reduce parallel queries
    maxIterations: 4  // Reduce iterations
  }
});
```

### Out of Memory

For large-scale generation:
```javascript
// Process PRDs sequentially
const results = await agent.generateMultiplePRDs(topics, {
  delay: 5000  // 5s delay between PRDs
});
```

### API Errors

Check API key and quotas:
```bash
# Verify API key is set
echo $GEMINI_API_KEY

# Check Gemini API quota
# Visit: https://aistudio.google.com/app/apikey
```

## 📚 References

- [DSPy.ts GitHub](https://github.com/ruvnet/dspy.ts)
- [SPARC Methodology](https://github.com/ruvnet/claude-flow/wiki/SPARC-Methodology)
- [London School TDD](https://gist.github.com/mondweep/d9c1615c32e3f375e0bef9e8e75496d4)
- [Gemini API Documentation](https://ai.google.dev/docs)

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- Additional optimization algorithms (MIPROv2, MIPROv3)
- More TDD methodologies (Chicago School, etc.)
- Custom PRD templates
- Integration with other LLM providers
- Performance optimizations

## 📄 License

MIT License - see LICENSE file for details
