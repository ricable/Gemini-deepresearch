/**
 * RuVector Integration Module
 * Provides vector memory, knowledge graph, and self-learning capabilities
 * for the Deep Research Agent using ruvector and ruvLLM
 */

/**
 * RuVector Memory Store
 * Stores and retrieves research findings using vector embeddings
 */
export class ResearchMemory {
  constructor(options = {}) {
    this.ruvllm = null;
    this.isInitialized = false;
    this.config = {
      embeddingDim: options.embeddingDim || 768,
      hnswM: options.hnswM || 16,
      hnswEfConstruction: options.hnswEfConstruction || 100,
      hnswEfSearch: options.hnswEfSearch || 64,
      learningEnabled: options.learningEnabled !== false,
      qualityThreshold: options.qualityThreshold || 0.7,
    };

    // In-memory fallback when ruvector is not available
    this.fallbackMemory = [];
    this.fallbackIndex = new Map();
  }

  /**
   * Initialize the memory store
   * @returns {Promise<boolean>} Whether initialization succeeded
   */
  async initialize() {
    try {
      // Try to import ruvector/ruvllm
      const { RuvLLM } = await import('@ruvector/ruvllm');
      this.ruvllm = new RuvLLM(this.config);
      this.isInitialized = true;
      console.log('RuVector memory initialized with native acceleration');
      return true;
    } catch (error) {
      console.log('RuVector not available, using in-memory fallback');
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Store a research finding in memory
   * @param {string} content - The finding content
   * @param {object} metadata - Associated metadata
   * @returns {Promise<string>} Memory ID
   */
  async store(content, metadata = {}) {
    if (!this.isInitialized) await this.initialize();

    const memoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
        type: metadata.type || 'finding',
      },
    };

    if (this.ruvllm) {
      // Use ruvector native storage
      this.ruvllm.addMemory(content, memoryEntry.metadata);
    } else {
      // Fallback: simple in-memory storage with keyword index
      this.fallbackMemory.push(memoryEntry);
      this.indexEntry(memoryEntry);
    }

    return memoryEntry.id;
  }

  /**
   * Store multiple findings at once
   * @param {Array<object>} findings - Array of {content, metadata} objects
   * @returns {Promise<Array<string>>} Array of memory IDs
   */
  async storeBatch(findings) {
    const ids = [];
    for (const finding of findings) {
      const id = await this.store(finding.content, finding.metadata);
      ids.push(id);
    }
    return ids;
  }

  /**
   * Search for relevant memories
   * @param {string} query - Search query
   * @param {number} k - Number of results to return
   * @param {object} filters - Metadata filters
   * @returns {Promise<Array<object>>} Matching memories with scores
   */
  async search(query, k = 5, filters = {}) {
    if (!this.isInitialized) await this.initialize();

    if (this.ruvllm) {
      // Use ruvector semantic search
      const results = this.ruvllm.searchMemory(query, k);
      return results.map((r) => ({
        content: r.content,
        score: r.score,
        metadata: r.metadata || {},
      }));
    } else {
      // Fallback: keyword-based search
      return this.fallbackSearch(query, k, filters);
    }
  }

  /**
   * Find related content to a given finding
   * @param {string} content - Content to find relations for
   * @param {number} k - Number of related items
   * @returns {Promise<Array<object>>} Related findings
   */
  async findRelated(content, k = 3) {
    return this.search(content, k);
  }

  /**
   * Index entry for fallback search
   * @param {object} entry - Memory entry to index
   */
  indexEntry(entry) {
    const words = entry.content.toLowerCase().split(/\W+/);
    for (const word of words) {
      if (word.length > 3) {
        if (!this.fallbackIndex.has(word)) {
          this.fallbackIndex.set(word, []);
        }
        this.fallbackIndex.get(word).push(entry.id);
      }
    }
  }

  /**
   * Fallback keyword-based search
   * @param {string} query - Search query
   * @param {number} k - Number of results
   * @param {object} filters - Metadata filters
   * @returns {Array<object>} Search results
   */
  fallbackSearch(query, k, filters) {
    const queryWords = query.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const scores = new Map();

    // Score each entry based on keyword matches
    for (const word of queryWords) {
      const matchingIds = this.fallbackIndex.get(word) || [];
      for (const id of matchingIds) {
        scores.set(id, (scores.get(id) || 0) + 1);
      }
    }

    // Sort by score and return top k
    const results = [];
    for (const entry of this.fallbackMemory) {
      const score = scores.get(entry.id) || 0;
      if (score > 0) {
        // Apply filters
        let passesFilters = true;
        for (const [key, value] of Object.entries(filters)) {
          if (entry.metadata[key] !== value) {
            passesFilters = false;
            break;
          }
        }

        if (passesFilters) {
          results.push({
            content: entry.content,
            score: score / queryWords.length,
            metadata: entry.metadata,
          });
        }
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  /**
   * Get memory statistics
   * @returns {object} Memory stats
   */
  getStats() {
    if (this.ruvllm) {
      return {
        provider: 'ruvector',
        isNative: true,
        ...this.ruvllm.stats(),
      };
    }
    return {
      provider: 'fallback',
      isNative: false,
      entryCount: this.fallbackMemory.length,
      indexSize: this.fallbackIndex.size,
    };
  }

  /**
   * Clear all memories
   */
  clear() {
    if (this.ruvllm) {
      // RuvLLM doesn't have a clear method, would need to reinitialize
      this.ruvllm = null;
      this.isInitialized = false;
    }
    this.fallbackMemory = [];
    this.fallbackIndex.clear();
  }
}

/**
 * Knowledge Graph for Research
 * Connects topics, sources, and findings using graph relationships
 */
export class ResearchKnowledgeGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.ruvector = null;
  }

  /**
   * Initialize the knowledge graph
   */
  async initialize() {
    try {
      // Try to use ruvector's graph capabilities
      const ruvector = await import('ruvector');
      this.ruvector = ruvector;
      console.log('RuVector graph initialized');
    } catch {
      console.log('Using in-memory graph fallback');
    }
  }

  /**
   * Add a node to the graph
   * @param {string} type - Node type (topic, source, finding, query)
   * @param {string} id - Unique identifier
   * @param {object} data - Node data
   */
  addNode(type, id, data = {}) {
    const nodeId = `${type}:${id}`;
    this.nodes.set(nodeId, {
      type,
      id: nodeId,
      data,
      createdAt: Date.now(),
    });
    return nodeId;
  }

  /**
   * Add an edge between nodes
   * @param {string} fromId - Source node ID
   * @param {string} toId - Target node ID
   * @param {string} relationship - Relationship type
   * @param {object} properties - Edge properties
   */
  addEdge(fromId, toId, relationship, properties = {}) {
    this.edges.push({
      from: fromId,
      to: toId,
      relationship,
      properties,
      createdAt: Date.now(),
    });
  }

  /**
   * Add a research topic
   * @param {string} topic - Topic name
   * @param {object} metadata - Topic metadata
   * @returns {string} Node ID
   */
  addTopic(topic, metadata = {}) {
    return this.addNode('topic', topic.toLowerCase().replace(/\s+/g, '_'), {
      name: topic,
      ...metadata,
    });
  }

  /**
   * Add a source
   * @param {string} url - Source URL
   * @param {string} title - Source title
   * @returns {string} Node ID
   */
  addSource(url, title = '') {
    const id = Buffer.from(url).toString('base64').substring(0, 20);
    return this.addNode('source', id, { url, title });
  }

  /**
   * Add a finding and connect it
   * @param {string} content - Finding content
   * @param {string} topicId - Related topic node ID
   * @param {string} sourceId - Source node ID
   * @returns {string} Finding node ID
   */
  addFinding(content, topicId, sourceId = null) {
    const findingId = this.addNode('finding', `f_${Date.now()}`, { content });

    // Connect finding to topic
    this.addEdge(findingId, topicId, 'ABOUT');

    // Connect finding to source if provided
    if (sourceId) {
      this.addEdge(findingId, sourceId, 'FROM_SOURCE');
    }

    return findingId;
  }

  /**
   * Find related topics using graph traversal
   * @param {string} topicId - Starting topic ID
   * @param {number} depth - Traversal depth
   * @returns {Array<object>} Related topics
   */
  findRelatedTopics(topicId, depth = 2) {
    const related = new Set();
    const queue = [{ id: topicId, depth: 0 }];
    const visited = new Set([topicId]);

    while (queue.length > 0) {
      const { id, depth: currentDepth } = queue.shift();

      if (currentDepth >= depth) continue;

      // Find connected nodes
      for (const edge of this.edges) {
        let connectedId = null;
        if (edge.from === id) connectedId = edge.to;
        if (edge.to === id) connectedId = edge.from;

        if (connectedId && !visited.has(connectedId)) {
          visited.add(connectedId);
          const node = this.nodes.get(connectedId);

          if (node && node.type === 'topic') {
            related.add(connectedId);
          }

          queue.push({ id: connectedId, depth: currentDepth + 1 });
        }
      }
    }

    return Array.from(related).map((id) => this.nodes.get(id));
  }

  /**
   * Get all findings for a topic
   * @param {string} topicId - Topic node ID
   * @returns {Array<object>} Findings
   */
  getFindingsForTopic(topicId) {
    const findings = [];

    for (const edge of this.edges) {
      if (edge.to === topicId && edge.relationship === 'ABOUT') {
        const node = this.nodes.get(edge.from);
        if (node && node.type === 'finding') {
          findings.push(node);
        }
      }
    }

    return findings;
  }

  /**
   * Execute a Cypher-like query (simplified)
   * @param {string} pattern - Query pattern
   * @returns {Array<object>} Query results
   */
  query(pattern) {
    // Simplified Cypher-like query support
    // Example: "MATCH (t:topic)-[:ABOUT]-(f:finding) RETURN f"
    const results = [];

    // Parse simple patterns
    const matchRelated = pattern.match(/MATCH\s+\((\w+):(\w+)\)/i);
    if (matchRelated) {
      const [, , nodeType] = matchRelated;
      for (const [id, node] of this.nodes) {
        if (node.type === nodeType) {
          results.push(node);
        }
      }
    }

    return results;
  }

  /**
   * Export graph data
   * @returns {object} Graph data
   */
  export() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
    };
  }

  /**
   * Get graph statistics
   * @returns {object} Graph stats
   */
  getStats() {
    const nodeTypes = {};
    for (const node of this.nodes.values()) {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
    }

    const relationshipTypes = {};
    for (const edge of this.edges) {
      relationshipTypes[edge.relationship] =
        (relationshipTypes[edge.relationship] || 0) + 1;
    }

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      nodeTypes,
      relationshipTypes,
    };
  }
}

/**
 * Self-Learning Research System
 * Improves research quality through feedback and adaptation
 */
export class ResearchLearner {
  constructor(memory) {
    this.memory = memory;
    this.feedbackHistory = [];
    this.queryPatterns = new Map();
    this.ruvllm = null;
  }

  /**
   * Initialize the learner
   */
  async initialize() {
    try {
      const { RuvLLM } = await import('@ruvector/ruvllm');
      this.ruvllm = new RuvLLM({
        learningEnabled: true,
        qualityThreshold: 0.7,
      });
    } catch {
      console.log('RuvLLM not available, using basic learning');
    }
  }

  /**
   * Record feedback on a research result
   * @param {string} query - Original query
   * @param {object} result - Research result
   * @param {number} rating - User rating (1-5)
   * @param {string} correction - Optional correction
   */
  recordFeedback(query, result, rating, correction = null) {
    const feedback = {
      query,
      resultId: result.id,
      rating,
      correction,
      timestamp: Date.now(),
    };

    this.feedbackHistory.push(feedback);

    // Update query patterns
    const pattern = this.extractQueryPattern(query);
    if (!this.queryPatterns.has(pattern)) {
      this.queryPatterns.set(pattern, { successCount: 0, failCount: 0 });
    }

    const patternStats = this.queryPatterns.get(pattern);
    if (rating >= 4) {
      patternStats.successCount++;
    } else if (rating <= 2) {
      patternStats.failCount++;
    }

    // If using RuvLLM, provide feedback for adaptation
    if (this.ruvllm && result.requestId) {
      this.ruvllm.feedback({
        requestId: result.requestId,
        rating,
        correction,
      });
    }
  }

  /**
   * Extract a pattern from a query for learning
   * @param {string} query - Query string
   * @returns {string} Query pattern
   */
  extractQueryPattern(query) {
    // Simple pattern extraction - could be enhanced with NLP
    const words = query.toLowerCase().split(/\s+/);
    const keywords = words.filter(
      (w) =>
        w.length > 4 &&
        !['what', 'how', 'when', 'where', 'which', 'about', 'the'].includes(w)
    );
    return keywords.sort().slice(0, 3).join('_');
  }

  /**
   * Get recommendations for improving a query
   * @param {string} query - Query to improve
   * @returns {Array<string>} Recommendations
   */
  getQueryRecommendations(query) {
    const recommendations = [];
    const pattern = this.extractQueryPattern(query);
    const stats = this.queryPatterns.get(pattern);

    if (stats && stats.failCount > stats.successCount) {
      recommendations.push('Consider making the query more specific');
      recommendations.push('Try adding temporal context (e.g., "in 2024")');
    }

    // Find successful similar patterns
    for (const [p, s] of this.queryPatterns) {
      if (p !== pattern && s.successCount > 3 && this.patternSimilarity(pattern, p) > 0.5) {
        recommendations.push(`Similar successful pattern: "${p.replace(/_/g, ' ')}"`);
      }
    }

    return recommendations;
  }

  /**
   * Calculate similarity between patterns
   * @param {string} p1 - First pattern
   * @param {string} p2 - Second pattern
   * @returns {number} Similarity score (0-1)
   */
  patternSimilarity(p1, p2) {
    const words1 = new Set(p1.split('_'));
    const words2 = new Set(p2.split('_'));
    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  /**
   * Predict query success likelihood
   * @param {string} query - Query to evaluate
   * @returns {number} Success probability (0-1)
   */
  predictSuccess(query) {
    const pattern = this.extractQueryPattern(query);
    const stats = this.queryPatterns.get(pattern);

    if (!stats) return 0.5; // Unknown pattern

    const total = stats.successCount + stats.failCount;
    if (total === 0) return 0.5;

    return stats.successCount / total;
  }

  /**
   * Get learning statistics
   * @returns {object} Learning stats
   */
  getStats() {
    const avgRating =
      this.feedbackHistory.length > 0
        ? this.feedbackHistory.reduce((sum, f) => sum + f.rating, 0) /
          this.feedbackHistory.length
        : 0;

    return {
      totalFeedback: this.feedbackHistory.length,
      averageRating: avgRating.toFixed(2),
      learnedPatterns: this.queryPatterns.size,
      isNativeEnabled: !!this.ruvllm,
    };
  }
}

/**
 * Smart Query Router
 * Routes queries to optimal processing based on complexity
 */
export class QueryRouter {
  constructor() {
    this.ruvllm = null;
    this.routingHistory = [];
  }

  /**
   * Initialize the router
   */
  async initialize() {
    try {
      const { RuvLLM } = await import('@ruvector/ruvllm');
      this.ruvllm = new RuvLLM();
    } catch {
      console.log('Using rule-based routing');
    }
  }

  /**
   * Route a query to the appropriate handler
   * @param {string} query - Query to route
   * @returns {object} Routing decision
   */
  route(query) {
    const complexity = this.assessComplexity(query);
    const decision = {
      query,
      complexity,
      recommendedDepth: this.getRecommendedDepth(complexity),
      recommendedBreadth: this.getRecommendedBreadth(complexity),
      estimatedTime: this.estimateTime(complexity),
      timestamp: Date.now(),
    };

    this.routingHistory.push(decision);
    return decision;
  }

  /**
   * Assess query complexity
   * @param {string} query - Query to assess
   * @returns {string} Complexity level (simple, moderate, complex)
   */
  assessComplexity(query) {
    const indicators = {
      simple: ['what is', 'define', 'who is', 'when was'],
      moderate: ['how does', 'explain', 'compare', 'describe'],
      complex: [
        'analyze',
        'evaluate',
        'comprehensive',
        'in-depth',
        'implications',
        'impact of',
        'future of',
      ],
    };

    const lowerQuery = query.toLowerCase();

    // Check for complex indicators first
    for (const indicator of indicators.complex) {
      if (lowerQuery.includes(indicator)) return 'complex';
    }

    // Check for moderate indicators
    for (const indicator of indicators.moderate) {
      if (lowerQuery.includes(indicator)) return 'moderate';
    }

    // Default to simple for short queries, moderate for longer ones
    return query.split(' ').length <= 5 ? 'simple' : 'moderate';
  }

  /**
   * Get recommended research depth
   * @param {string} complexity - Complexity level
   * @returns {number} Recommended depth (1-5)
   */
  getRecommendedDepth(complexity) {
    const depths = { simple: 1, moderate: 3, complex: 5 };
    return depths[complexity] || 3;
  }

  /**
   * Get recommended search breadth
   * @param {string} complexity - Complexity level
   * @returns {number} Recommended breadth (1-10)
   */
  getRecommendedBreadth(complexity) {
    const breadths = { simple: 3, moderate: 5, complex: 8 };
    return breadths[complexity] || 5;
  }

  /**
   * Estimate research time
   * @param {string} complexity - Complexity level
   * @returns {string} Estimated time
   */
  estimateTime(complexity) {
    const times = {
      simple: '30 seconds - 1 minute',
      moderate: '1-3 minutes',
      complex: '3-10 minutes',
    };
    return times[complexity] || '1-3 minutes';
  }
}

/**
 * Main RuVector Integration Class
 * Combines all ruvector features for the research agent
 */
export class RuVectorIntegration {
  constructor() {
    this.memory = new ResearchMemory();
    this.graph = new ResearchKnowledgeGraph();
    this.learner = new ResearchLearner(this.memory);
    this.router = new QueryRouter();
    this.isInitialized = false;
  }

  /**
   * Initialize all components
   */
  async initialize() {
    await Promise.all([
      this.memory.initialize(),
      this.graph.initialize(),
      this.learner.initialize(),
      this.router.initialize(),
    ]);
    this.isInitialized = true;
    return this;
  }

  /**
   * Get all statistics
   * @returns {object} Combined stats
   */
  getStats() {
    return {
      memory: this.memory.getStats(),
      graph: this.graph.getStats(),
      learner: this.learner.getStats(),
    };
  }
}

// Export singleton instance
export const ruvectorIntegration = new RuVectorIntegration();

export default RuVectorIntegration;
