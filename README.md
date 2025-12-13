# Gemini Deep Research Agent

A powerful AI-powered deep research agent built with Google Gemini API. This agent conducts iterative, comprehensive research on any topic by generating search queries, analyzing results, identifying knowledge gaps, and synthesizing findings into well-structured reports with citations.

## 🚀 New: SPARC PRD Generation

**Transform deep research into production-ready Product Requirements Documents!**

The agent now includes advanced capabilities for generating comprehensive PRDs using the **SPARC methodology** (Specification, Pseudocode, Architecture, Refinement, Completion) with **London School TDD** practices.

**Key Features:**
- 🔬 **Deep Research → PRD Pipeline**: Automated end-to-end workflow
- 🤖 **Claude Agent SDK Integration**: Multi-model orchestration patterns
- 🎯 **DSPy.ts Prompt Optimization**: Automatically improve prompt quality
- 📋 **SPARC Methodology**: Complete 5-phase PRD generation
- ✅ **London School TDD**: Test-driven development planning

**Quick Start:**
```bash
# Generate a PRD from a topic
node agents/prd-agent.js "AI-Powered Code Review Tool" --depth 5 --verbose

# Or use programmatically
import { PRDAgent } from './agents/prd-agent.js';
const agent = new PRDAgent();
const result = await agent.generatePRD('Your Project Topic');
```

See [Agents README](./agents/README.md) and [Examples](./examples/README.md) for details.

---

## Features

### Core Research Features

- **Iterative Research Loop**: Automatically generates queries, searches, analyzes, and refines until comprehensive coverage
- **Search Grounding**: Uses Gemini's built-in search grounding for real-time web research
- **Reflection & Gap Analysis**: Evaluates research completeness and identifies missing information
- **Citation Management**: Tracks sources and generates properly cited reports
- **Configurable Depth**: Adjust research depth and breadth based on your needs
- **Multiple Output Formats**: Markdown, JSON, or HTML reports
- **CLI & Programmatic API**: Use from command line or integrate into your applications

### RuVector Integration (Enhanced)

- **Vector Memory**: Stores research findings as embeddings for semantic retrieval across sessions
- **Knowledge Graph**: Connects topics, sources, and findings using graph relationships
- **Self-Learning**: Improves research quality through user feedback and pattern learning
- **Smart Query Routing**: Automatically determines optimal depth/breadth based on query complexity

### Advanced Agent System (NEW)

- **Claude-Gemini Hybrid Agent**: Multi-model orchestration for enhanced research workflows
- **DSPy.ts Optimizer**: Automatic prompt improvement using DSPy-inspired techniques
- **SPARC PRD Generator**: Complete PRD generation following industry best practices
- **Complete PRD Agent**: End-to-end pipeline from research to production-ready documentation

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Deep Research Agent                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │    Query     │───▶│   Gemini     │───▶│   Content    │       │
│  │  Generator   │    │   Search     │    │  Processor   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                                        │               │
│         │            ┌──────────────┐           │               │
│         └───────────▶│  Reflector   │◀──────────┘               │
│                      │ (Gap Analysis)│                           │
│                      └──────────────┘                           │
│                             │                                    │
│                             ▼                                    │
│                      ┌──────────────┐                           │
│                      │   Report     │                           │
│                      │  Generator   │                           │
│                      └──────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

```bash
# Clone the repository
git clone https://github.com/ruvnet/gemini-deep-research-agent.git
cd gemini-deep-research-agent

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file

## Usage

### CLI Usage

```bash
# Basic research
npm run research "What are the latest developments in quantum computing?"

# With options
npm run research "AI in healthcare" --depth 4 --breadth 7 --verbose

# Quick summary (faster, less comprehensive)
npm start summary "Electric vehicles market trends 2025"

# Show configuration
npm start config
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-d, --depth <number>` | Research depth (1-5) | 3 |
| `-b, --breadth <number>` | Number of parallel queries (1-10) | 5 |
| `-i, --iterations <number>` | Maximum research iterations (1-20) | 10 |
| `-o, --output <file>` | Save report to file | - |
| `-v, --verbose` | Show detailed progress | false |

### Programmatic Usage

```javascript
import research, { createResearchAgent, quickSummary } from 'gemini-deep-research-agent';

// Simple usage - one line research
const report = await research('Renewable energy trends 2025');
console.log(report.content);

// Quick summary for faster results
const { summary, sources } = await quickSummary('Electric vehicles');
console.log(summary);

// Advanced usage with custom configuration
const agent = createResearchAgent({
  depth: 4,
  breadth: 6,
  maxIterations: 15,
  onProgress: (event) => {
    console.log(`Progress: ${event.type}`);
  },
  onIteration: (event) => {
    console.log(`Iteration ${event.iteration}: ${event.learnings} findings`);
  },
});

const report = await agent.research('Machine learning in finance');

console.log(report.content);       // Markdown report
console.log(report.sources);       // Array of sources
console.log(report.metadata);      // Research metadata
```

### Using Individual Components

```javascript
import {
  GeminiClient,
  QueryGenerator,
  ContentProcessor,
  Reflector,
  ReportGenerator,
} from 'gemini-deep-research-agent';

// Use Gemini client directly
const client = new GeminiClient();
const response = await client.searchAndGenerate('Latest AI research');
console.log(response.text);
console.log(response.sources);

// Generate queries
const queryGen = new QueryGenerator();
const queries = await queryGen.generateInitialQueries('Climate change solutions', 5);
console.log(queries);

// Process content
const processor = new ContentProcessor();
const insights = await processor.processSearchResult(searchResult, 'climate change');
console.log(insights);
```

### Using RuVector Features

```javascript
import { createResearchAgent, RuVectorIntegration } from 'gemini-deep-research-agent';

// Create agent with RuVector enabled (default)
const agent = createResearchAgent({
  useRuvector: true,  // Enable vector memory and knowledge graph
});

// Research a topic - findings are automatically stored
const report = await agent.research('Quantum computing applications');

// Search prior research (from previous sessions)
const priorFindings = await agent.searchPriorResearch('quantum', 10);
console.log('Found prior research:', priorFindings.length);

// Find related topics from knowledge graph
const related = await agent.findRelatedTopics('quantum computing');
console.log('Related topics:', related);

// Provide feedback for self-learning
agent.provideFeedback('quantum computing', report, 5, 'Excellent coverage');

// Get learning statistics
const stats = agent.getStats();
console.log('Memory stats:', stats.memory);
console.log('Graph stats:', stats.graph);
console.log('Learning stats:', stats.learner);

// Export knowledge graph for visualization
const graphData = agent.exportKnowledgeGraph();
console.log('Nodes:', graphData.nodes.length);
console.log('Edges:', graphData.edges.length);
```

### Using RuVector Components Directly

```javascript
import {
  ResearchMemory,
  ResearchKnowledgeGraph,
  ResearchLearner,
  QueryRouter,
} from 'gemini-deep-research-agent';

// Vector memory for semantic storage
const memory = new ResearchMemory();
await memory.initialize();

// Store findings
await memory.store('AI models are improving rapidly', {
  topic: 'artificial intelligence',
  type: 'finding',
});

// Search semantically
const results = await memory.search('machine learning progress', 5);
console.log(results);

// Knowledge graph for connections
const graph = new ResearchKnowledgeGraph();
const topicId = graph.addTopic('Machine Learning');
const sourceId = graph.addSource('https://example.com/ml-article', 'ML Article');
graph.addFinding('Deep learning dominates NLP', topicId, sourceId);

// Smart query routing
const router = new QueryRouter();
const routing = router.route('Explain the comprehensive impact of AI on healthcare');
console.log('Complexity:', routing.complexity);  // 'complex'
console.log('Recommended depth:', routing.recommendedDepth);  // 5
console.log('Estimated time:', routing.estimatedTime);  // '3-10 minutes'
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Gemini API key (required) | - |
| `GEMINI_MODEL` | Gemini model to use | `gemini-2.5-flash` |
| `RESEARCH_DEPTH` | Default research depth | `3` |
| `RESEARCH_BREADTH` | Default search breadth | `5` |
| `MAX_ITERATIONS` | Maximum research iterations | `10` |
| `CONCURRENCY_LIMIT` | Parallel API calls | `5` |
| `MAX_OUTPUT_TOKENS` | Max tokens per response | `65536` |
| `OUTPUT_FORMAT` | Default output format | `markdown` |
| `SAVE_REPORTS` | Auto-save reports | `true` |
| `REPORTS_DIR` | Reports directory | `./reports` |
| `DEBUG` | Enable debug mode | `false` |

## Research Process

1. **Query Generation**: The agent analyzes the topic and generates diverse search queries covering multiple angles

2. **Web Research**: Each query is executed using Gemini's search grounding, retrieving real-time information from the web

3. **Content Processing**: Results are analyzed, chunked, and key insights are extracted

4. **Reflection**: The agent evaluates completeness, quality, and identifies knowledge gaps

5. **Iteration**: If gaps exist, follow-up queries are generated and the process repeats

6. **Report Synthesis**: All findings are synthesized into a comprehensive, cited report

## Report Structure

Generated reports include:

- **Executive Summary**: Brief overview of key findings
- **Introduction**: Context and background
- **Key Findings**: Organized by theme with citations
- **Analysis**: Synthesis and discussion
- **Limitations**: Acknowledged gaps and caveats
- **Conclusions**: Key takeaways and recommendations
- **References**: Numbered citations with URLs

## Project Structure

```
gemini-deep-research-agent/
├── src/
│   ├── index.js              # Main entry point
│   ├── cli.js                # CLI interface
│   ├── config.js             # Configuration management
│   ├── gemini-client.js      # Gemini API wrapper
│   ├── query-generator.js    # Search query generation
│   ├── content-processor.js  # Content analysis
│   ├── reflector.js          # Gap analysis & reflection
│   ├── report-generator.js   # Report synthesis
│   ├── research-agent.js     # Main orchestrator
│   ├── ruvector-integration.js # RuVector memory & learning
│   └── prompts.js            # System prompts
├── agents/                   # Advanced AI agents (NEW)
│   ├── README.md             # Agent documentation
│   ├── claude-agent-sdk.js   # Claude-Gemini hybrid agent
│   ├── dspy-optimizer.js     # DSPy.ts prompt optimizer
│   ├── sparc-generator.js    # SPARC PRD generator
│   └── prd-agent.js          # Complete PRD generation agent
├── examples/                 # Usage examples (NEW)
│   ├── README.md             # Examples documentation
│   ├── deep-research-example.js      # Research examples
│   └── complete-workflow-example.js  # Full workflow examples
├── prds/                     # Generated PRD documents (NEW)
├── reports/                  # Generated research reports
├── .env.example              # Environment template
├── package.json
└── README.md
```

## Tips for Best Results

1. **Be Specific**: More specific topics yield better results
   - Good: "Impact of AI on drug discovery in 2024"
   - Less good: "AI in healthcare"

2. **Adjust Depth**: Use higher depth (4-5) for complex topics, lower (1-2) for quick overviews

3. **Use Verbose Mode**: Add `-v` to see what the agent is doing and debug issues

4. **Review Sources**: Always verify critical information against the cited sources

## Limitations

- Requires a valid Gemini API key
- Research quality depends on web search results
- May not access paywalled or restricted content
- Rate limits apply based on your API tier
- Results should be verified for critical applications

## PRD Generation with SPARC Methodology

### What is SPARC?

SPARC is a comprehensive methodology for systematic software development:

- **S**pecification: Requirements, user stories, acceptance criteria
- **P**seudocode: High-level algorithm and logic design
- **A**rchitecture: System design, components, infrastructure
- **R**efinement: TDD implementation (London School)
- **C**ompletion: Integration, documentation, deployment

### PRD Generation Features

#### 1. Complete PRD Agent

Generate a full PRD from a single topic:

```bash
# CLI
node agents/prd-agent.js "Your Project Idea"

# Programmatic
import { PRDAgent } from './agents/prd-agent.js';
const agent = new PRDAgent();
const result = await agent.generatePRD('AI Code Review Tool', {
  techStack: {
    backend: ['Node.js', 'PostgreSQL'],
    frontend: ['React', 'TypeScript']
  }
});
```

**Output:** Complete PRD with all SPARC phases, research sources, and implementation guide.

#### 2. DSPy.ts Prompt Optimization

Automatically improve prompt quality:

```javascript
import { DSPyPromptOptimizer } from './agents/dspy-optimizer.js';
const optimizer = new DSPyPromptOptimizer();

// Optimize prompts for your domain
const optimized = await optimizer.optimizeForSPARC({
  domain: 'software development',
  methodology: 'london-tdd'
});
```

#### 3. Claude-Gemini Hybrid Agent

Multi-model orchestration for complex workflows:

```javascript
import { ClaudeGeminiAgent } from './agents/claude-agent-sdk.js';
const agent = new ClaudeGeminiAgent();

// Execute custom workflows
const result = await agent.executeWorkflow([
  { type: 'research', topic: 'Market analysis' },
  { type: 'generate', prompt: 'Synthesize findings' }
]);
```

### Examples

Comprehensive examples are available in the `examples/` directory:

```bash
# Deep research examples
node examples/deep-research-example.js

# Complete workflow examples
node examples/complete-workflow-example.js
```

See [Examples README](./examples/README.md) for detailed documentation.

### London School TDD Integration

All PRDs include TDD implementation strategies using London School principles:

- **Outside-In Development**: Start with high-level behavior
- **Mock External Dependencies**: Test components in isolation
- **Behavior Over State**: Test what objects do, not what they are
- **Red-Green-Refactor**: Iterative development cycle

Example PRD output includes:
- Unit test structure and naming conventions
- Mock/stub strategies
- Integration test scenarios
- Quality assurance gates
- Test coverage targets

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

Areas for contribution:
- Additional optimization algorithms (MIPROv2, MIPROv3)
- More TDD methodologies (Chicago School, etc.)
- Custom PRD templates
- Integration with other LLM providers

## License

MIT License - see LICENSE file for details

## Credits

- Built with [Google Gemini API](https://ai.google.dev/)
- Inspired by [Google's Deep Research](https://blog.google/technology/developers/deep-research-agent-gemini-api/)
- SPARC methodology by [ruvnet](https://github.com/ruvnet/claude-flow)
- DSPy.ts integration inspired by [ruvnet/dspy.ts](https://github.com/ruvnet/dspy.ts)
- Created by [ruvnet](https://github.com/ruvnet)

## Related Projects

- [google-gemini/gemini-fullstack-langgraph-quickstart](https://github.com/google-gemini/gemini-fullstack-langgraph-quickstart)
- [ruvnet/ruvector](https://github.com/ruvnet/ruvector)
- [ruvnet/agentic-flow](https://github.com/ruvnet/agentic-flow)
