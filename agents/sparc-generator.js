/**
 * SPARC PRD Generator
 *
 * Generates comprehensive Product Requirements Documents (PRDs) using the SPARC methodology:
 * - Specification: Requirements analysis and user stories
 * - Pseudocode: High-level algorithm design
 * - Architecture: System design and component breakdown
 * - Refinement: TDD implementation strategy (London School)
 * - Completion: Integration, documentation, and deployment
 *
 * Integrates with DSPy.ts-inspired prompt optimization for best results.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getConfig } from '../src/config.js';
import { DSPyPromptOptimizer } from './dspy-optimizer.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * SPARC PRD Generator
 */
export class SPARCGenerator {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.GEMINI_API_KEY,
      model: config.model || 'gemini-2.5-flash',
      outputDir: config.outputDir || './prds',
      useOptimization: config.useOptimization !== false,
      ...config
    };

    const geminiConfig = getConfig();
    this.geminiAI = new GoogleGenerativeAI(this.config.apiKey);

    // Initialize optimizer if enabled
    if (this.config.useOptimization) {
      this.optimizer = new DSPyPromptOptimizer({
        apiKey: this.config.apiKey,
        model: this.config.model
      });
    }

    // Optimized prompts cache
    this.optimizedPrompts = null;
  }

  /**
   * Generate a complete SPARC PRD
   *
   * @param {Object} options - PRD generation options
   * @returns {Promise<Object>} Generated PRD
   */
  async generatePRD(options) {
    const {
      topic,
      research,
      methodology = 'london-tdd',
      techStack = {},
      includePhases = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'],
      additionalContext = {}
    } = options;

    // Ensure optimized prompts are loaded
    if (this.config.useOptimization && !this.optimizedPrompts) {
      await this.loadOrOptimizePrompts(methodology);
    }

    const prd = {
      metadata: {
        topic,
        methodology,
        techStack,
        generatedAt: new Date().toISOString(),
        generatedBy: 'SPARC PRD Generator with Gemini Deep Research'
      },
      phases: {},
      summary: null
    };

    // Generate each phase
    for (const phase of includePhases) {
      prd.phases[phase] = await this.generatePhase(phase, {
        topic,
        research,
        methodology,
        techStack,
        additionalContext,
        previousPhases: prd.phases
      });
    }

    // Generate executive summary
    prd.summary = await this.generateSummary(prd);

    // Save PRD to file
    const filePath = await this.savePRD(prd, topic);
    prd.filePath = filePath;

    return prd;
  }

  /**
   * Generate a single SPARC phase
   *
   * @private
   */
  async generatePhase(phase, context) {
    const prompt = this.buildPhasePrompt(phase, context);

    const model = this.geminiAI.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        topP: 0.95
      }
    });

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    return {
      phase,
      content,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Build prompt for a specific SPARC phase
   *
   * @private
   */
  buildPhasePrompt(phase, context) {
    const {
      topic,
      research,
      methodology,
      techStack,
      additionalContext,
      previousPhases
    } = context;

    // Base prompt (use optimized if available)
    let basePrompt = this.optimizedPrompts?.[phase] || this.getDefaultPrompt(phase);

    // Build context section
    const contextSection = this.buildContextSection({
      topic,
      research,
      methodology,
      techStack,
      additionalContext,
      previousPhases
    });

    return `${basePrompt}

${contextSection}

Generate the ${phase.toUpperCase()} section now.`;
  }

  /**
   * Build context section for prompts
   *
   * @private
   */
  buildContextSection(context) {
    const {
      topic,
      research,
      methodology,
      techStack,
      additionalContext,
      previousPhases
    } = context;

    let contextText = `# Project Context

## Topic
${topic}

## Methodology
${methodology}
`;

    // Add tech stack if provided
    if (Object.keys(techStack).length > 0) {
      contextText += `\n## Tech Stack\n`;
      for (const [category, technologies] of Object.entries(techStack)) {
        const techList = Array.isArray(technologies) ? technologies.join(', ') : technologies;
        contextText += `- **${category}**: ${techList}\n`;
      }
    }

    // Add research insights
    if (research?.learnings) {
      contextText += `\n## Research Insights\n`;
      const topLearnings = research.learnings.slice(0, 10);
      topLearnings.forEach((learning, i) => {
        contextText += `${i + 1}. ${learning}\n`;
      });
    }

    // Add sources
    if (research?.sources) {
      contextText += `\n## Research Sources\n`;
      const topSources = research.sources.slice(0, 5);
      topSources.forEach((source, i) => {
        contextText += `${i + 1}. ${source.title}: ${source.url}\n`;
      });
    }

    // Add additional context
    if (Object.keys(additionalContext).length > 0) {
      contextText += `\n## Additional Requirements\n`;
      for (const [key, value] of Object.entries(additionalContext)) {
        contextText += `- **${key}**: ${value}\n`;
      }
    }

    // Add previous phases for continuity
    if (Object.keys(previousPhases).length > 0) {
      contextText += `\n## Previous Phases\n`;
      for (const [phaseName, phaseData] of Object.entries(previousPhases)) {
        contextText += `\n### ${phaseName.toUpperCase()}\n`;
        const preview = phaseData.content.substring(0, 500);
        contextText += `${preview}...\n`;
      }
    }

    return contextText;
  }

  /**
   * Get default prompt for a phase
   *
   * @private
   */
  getDefaultPrompt(phase) {
    const prompts = {
      specification: `You are an expert Product Manager and Requirements Analyst.

Generate a comprehensive SPECIFICATION section for a Product Requirements Document (PRD).

Your output must include:

## 1. Project Overview
- Clear project vision and objectives
- Problem statement and value proposition
- Target users and stakeholders

## 2. Functional Requirements
- Detailed, numbered list of features and capabilities
- User workflows and scenarios
- Input/output specifications
- Business logic requirements

## 3. User Stories
Format each as: "As a [role], I want to [action], so that [benefit]"
Include acceptance criteria for each story:
- Given [context]
- When [action]
- Then [expected result]

## 4. Non-Functional Requirements
- **Performance**: Response times, throughput, scalability targets
- **Security**: Authentication, authorization, data protection
- **Reliability**: Uptime requirements, fault tolerance
- **Usability**: Accessibility, user experience standards
- **Maintainability**: Code quality, documentation standards

## 5. Technical Constraints
- Platform requirements
- Technology stack considerations
- Integration requirements
- Regulatory compliance

## 6. Dependencies and Assumptions
- External dependencies
- Third-party services
- Assumptions about user behavior and environment

Use clear, professional language. Be specific and measurable where possible.`,

      pseudocode: `You are an expert Software Architect and Algorithm Designer.

Generate a comprehensive PSEUDOCODE section for a Product Requirements Document (PRD).

Your output must include:

## 1. High-Level Architecture
- System components and their interactions
- Data flow between components
- Key abstractions and interfaces

## 2. Core Algorithms
For each major feature, provide language-agnostic pseudocode:
\`\`\`
FUNCTION featureName(inputs):
    // Step-by-step logic
    // Control flow
    // Return values
END FUNCTION
\`\`\`

## 3. Data Structures
- Define key data models
- Relationships between entities
- Data validation rules

## 4. State Management
- Application state structure
- State transitions
- Side effects handling

## 5. Error Handling Strategy
- Error types and categories
- Error propagation approach
- Retry and fallback logic

## 6. Test Strategy Outline
- Unit test approach
- Integration test scenarios
- Test data requirements

Keep pseudocode clear and implementation-agnostic. Focus on logic, not syntax.`,

      architecture: `You are an expert Software Architect and System Designer.

Generate a comprehensive ARCHITECTURE section for a Product Requirements Document (PRD).

Your output must include:

## 1. System Architecture Overview
- High-level architecture diagram (textual description)
- Architectural pattern (e.g., microservices, monolith, serverless)
- Rationale for architectural decisions

## 2. Component Breakdown
For each major component:
- **Name**: Component identifier
- **Responsibility**: Single responsibility description
- **Interfaces**: Input/output contracts
- **Dependencies**: Other components it depends on
- **Technology**: Recommended implementation technology

## 3. Data Architecture
- **Database Schema**: Tables/collections with fields and types
- **Data Access Patterns**: Queries, indexes, caching strategy
- **Data Flow**: How data moves through the system
- **Data Integrity**: Validation, constraints, transactions

## 4. API Design
- RESTful/GraphQL endpoint specifications
- Request/response formats
- Authentication and authorization
- Rate limiting and versioning

## 5. Infrastructure Architecture
- **Deployment Model**: Cloud, on-premises, hybrid
- **Scaling Strategy**: Horizontal, vertical, auto-scaling
- **CI/CD Pipeline**: Build, test, deploy automation
- **Monitoring**: Logging, metrics, alerting
- **Security**: Network security, secrets management

## 6. Integration Points
- External APIs and services
- Message queues or event streams
- Third-party integrations

Be specific and implementation-focused. Include diagrams as textual descriptions.`,

      refinement: `You are an expert in Test-Driven Development (TDD) using the London School methodology.

Generate a comprehensive REFINEMENT section for a Product Requirements Document (PRD).

Your output must include:

## 1. TDD Implementation Strategy
- **London School Approach**: Mock external dependencies, test behavior not state
- **Test First**: Write tests before implementation
- **Red-Green-Refactor**: Cycle for each feature

## 2. Component Implementation Order
Prioritized list of components to implement:
1. Core domain logic (most valuable)
2. API layer
3. Data access layer
4. UI components
5. Integration glue

For each component:
- Dependencies (what must exist first)
- Mock/stub strategy
- Test coverage goals

## 3. Unit Testing Approach
- **Test Structure**: Arrange-Act-Assert pattern
- **Mocking Strategy**: Mock all external dependencies
- **Test Doubles**: Mocks, stubs, spies, fakes
- **Naming Convention**: test_shouldBehavior_whenCondition

Example test structure:
\`\`\`
describe("ComponentName", () => {
  it("should [behavior] when [condition]", () => {
    // Arrange: Set up mocks and test data
    // Act: Execute the behavior
    // Assert: Verify the outcome
  });
});
\`\`\`

## 4. Integration Testing
- **Test Scenarios**: Critical user workflows
- **Test Data**: Realistic data sets
- **Environment**: Staging environment setup

## 5. Quality Assurance Gates
- **Code Coverage**: Minimum 80% (target 100%)
- **Code Review**: Mandatory peer review
- **Static Analysis**: Linting, type checking
- **Performance Testing**: Load testing criteria
- **Security Scanning**: OWASP compliance

## 6. Iterative Refinement Process
- Sprint planning and iteration cycles
- Continuous integration triggers
- Feedback loops and retrospectives

Focus on testability, maintainability, and incremental delivery.`,

      completion: `You are an expert DevOps Engineer and Technical Writer.

Generate a comprehensive COMPLETION section for a Product Requirements Document (PRD).

Your output must include:

## 1. Integration Checklist
- [ ] All components integrated and tested together
- [ ] End-to-end user workflows validated
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Accessibility compliance verified
- [ ] Cross-browser/platform testing done

## 2. Documentation Requirements
- **Technical Documentation**:
  - Architecture diagrams
  - API documentation (OpenAPI/Swagger)
  - Database schema documentation
  - Deployment runbooks
- **User Documentation**:
  - User guides and tutorials
  - FAQ and troubleshooting
  - Release notes
- **Developer Documentation**:
  - Setup instructions
  - Contribution guidelines
  - Code style guide

## 3. Deployment Procedures
- **Pre-Deployment**:
  - Backup procedures
  - Rollback plan
  - Stakeholder notification
- **Deployment Steps**:
  1. Deploy database migrations
  2. Deploy backend services
  3. Deploy frontend assets
  4. Update configuration
  5. Smoke testing
- **Post-Deployment**:
  - Validation checks
  - Monitoring confirmation
  - Performance verification

## 4. Monitoring and Observability
- **Metrics**: Key performance indicators to track
- **Logging**: Structured logging format and retention
- **Alerting**: Alert conditions and escalation paths
- **Dashboards**: Real-time monitoring dashboards

## 5. Production Readiness
- **Scalability**: Load testing results and capacity planning
- **High Availability**: Failover mechanisms and redundancy
- **Disaster Recovery**: Backup and restoration procedures
- **Security**: Penetration testing and vulnerability scanning

## 6. Post-Launch Activities
- **User Onboarding**: Training and support materials
- **Feedback Collection**: Analytics and user surveys
- **Iteration Planning**: Roadmap for future enhancements
- **Maintenance**: Bug fixing and patch management

## 7. Sign-off Criteria
Define when the project is truly complete:
- All acceptance criteria met
- All tests passing
- Documentation complete
- Performance targets achieved
- Stakeholder approval obtained

Mark as: **<SPARC-COMPLETE>** when all criteria are satisfied.`
    };

    return prompts[phase] || prompts.specification;
  }

  /**
   * Generate executive summary
   *
   * @private
   */
  async generateSummary(prd) {
    const model = this.geminiAI.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1024
      }
    });

    const prompt = `Generate a concise executive summary for this PRD.

Project: ${prd.metadata.topic}
Methodology: ${prd.metadata.methodology}

Phases completed: ${Object.keys(prd.phases).join(', ')}

Provide a 3-5 paragraph summary covering:
1. Project overview and objectives
2. Key technical approach and architecture
3. Implementation methodology
4. Expected outcomes and success criteria

Be concise and executive-friendly.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Save PRD to file
   *
   * @private
   */
  async savePRD(prd, topic) {
    // Create output directory
    await fs.mkdir(this.config.outputDir, { recursive: true });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
    const filename = `prd-${slug}-${timestamp}.md`;
    const filePath = path.join(this.config.outputDir, filename);

    // Format PRD as markdown
    const markdown = this.formatPRDAsMarkdown(prd);

    // Write to file
    await fs.writeFile(filePath, markdown, 'utf-8');

    return filePath;
  }

  /**
   * Format PRD as markdown
   *
   * @private
   */
  formatPRDAsMarkdown(prd) {
    let md = `# Product Requirements Document: ${prd.metadata.topic}\n\n`;

    md += `**Generated**: ${new Date(prd.metadata.generatedAt).toLocaleString()}\n`;
    md += `**Methodology**: ${prd.metadata.methodology}\n`;
    md += `**Generator**: ${prd.metadata.generatedBy}\n\n`;

    // Tech stack
    if (Object.keys(prd.metadata.techStack).length > 0) {
      md += `## Tech Stack\n\n`;
      for (const [category, technologies] of Object.entries(prd.metadata.techStack)) {
        const techList = Array.isArray(technologies) ? technologies.join(', ') : technologies;
        md += `- **${category}**: ${techList}\n`;
      }
      md += `\n`;
    }

    // Executive summary
    if (prd.summary) {
      md += `## Executive Summary\n\n${prd.summary}\n\n`;
    }

    md += `---\n\n`;

    // Phases
    const phaseOrder = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'];

    for (const phase of phaseOrder) {
      if (prd.phases[phase]) {
        md += `# ${phase.toUpperCase()}\n\n`;
        md += `${prd.phases[phase].content}\n\n`;
        md += `---\n\n`;
      }
    }

    // Footer
    md += `\n---\n\n`;
    md += `*This PRD was generated using the SPARC methodology with Gemini Deep Research Agent*\n`;
    md += `*For questions or modifications, consult the development team*\n`;

    return md;
  }

  /**
   * Load or optimize prompts
   *
   * @private
   */
  async loadOrOptimizePrompts(methodology) {
    // For now, use default prompts
    // In production, this would load pre-optimized prompts or run optimization
    this.optimizedPrompts = null;
  }
}

/**
 * Create a SPARC generator instance
 */
export function createGenerator(config = {}) {
  return new SPARCGenerator(config);
}

export default SPARCGenerator;
