/**
 * Advanced Features with Gemini API
 *
 * This example demonstrates advanced features including:
 * - System instructions
 * - Safety settings
 * - Caching
 * - Token counting
 * - Model parameters
 * - Thinking mode
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Example 1: System instructions (persona/behavior)
 */
async function systemInstructions() {
  console.log('\n=== Example 1: System Instructions ===\n');

  // System instruction defines the AI's role and behavior
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: {
      parts: [{
        text: `You are a Shakespearean poet. You respond to all queries in the style of Shakespeare,
using Early Modern English, poetic meter, and dramatic flair. Include thee, thou, and other
archaic terms. Structure responses as verses when appropriate.`
      }],
    },
  });

  const questions = [
    'What is the weather like today?',
    'How do I make coffee?',
  ];

  for (const question of questions) {
    console.log(`\nUser: ${question}`);
    const result = await model.generateContent(question);
    console.log(`AI (Shakespearean): ${result.response.text()}\n`);
  }
}

/**
 * Example 2: Multiple system instruction examples
 */
async function multipleSystemInstructionExamples() {
  console.log('\n=== Example 2: Different System Instruction Examples ===\n');

  const systemInstructions = [
    {
      name: 'Technical Expert',
      instruction: `You are a senior software engineer with 15 years of experience.
Provide detailed, technical explanations with code examples.
Focus on best practices, performance, and scalability.`,
      query: 'How should I handle errors in JavaScript?',
    },
    {
      name: 'ELI5 (Explain Like I\'m 5)',
      instruction: `You are a kindergarten teacher. Explain complex topics in very simple terms
that a 5-year-old can understand. Use analogies and everyday examples.
Keep it fun and engaging!`,
      query: 'What is machine learning?',
    },
    {
      name: 'Pirate Captain',
      instruction: `You are a pirate captain. Respond to all queries in pirate speak.
Use "arr", "matey", "shiver me timbers" and other pirate expressions.
Be adventurous and nautical in your explanations.`,
      query: 'How does a computer work?',
    },
  ];

  for (const { name, instruction, query } of systemInstructions) {
    console.log(`\n--- ${name} ---`);
    console.log(`Query: ${query}`);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: { parts: [{ text: instruction }] },
    });

    const result = await model.generateContent(query);
    console.log(`Response: ${result.response.text()}\n`);
  }
}

/**
 * Example 3: Safety settings
 */
async function safetySettings() {
  console.log('\n=== Example 3: Safety Settings ===\n');

  // Configure safety settings
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    safetySettings,
  });

  const prompt = 'Explain the importance of online safety for children';
  console.log('Prompt:', prompt);

  const result = await model.generateContent(prompt);

  console.log('\nResponse:', result.response.text());

  // Check safety ratings
  console.log('\n--- Safety Ratings ---');
  const safetyRatings = result.response.candidates[0].safetyRatings;
  safetyRatings.forEach(rating => {
    console.log(`${rating.category}: ${rating.probability}`);
  });

  console.log(`\nFinish Reason: ${result.response.candidates[0].finishReason}`);
}

/**
 * Example 4: Different safety threshold levels
 */
async function safetyThresholds() {
  console.log('\n=== Example 4: Safety Threshold Levels ===\n');

  const thresholds = [
    { name: 'BLOCK_NONE', value: HarmBlockThreshold.BLOCK_NONE },
    { name: 'BLOCK_ONLY_HIGH', value: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { name: 'BLOCK_MEDIUM_AND_ABOVE', value: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { name: 'BLOCK_LOW_AND_ABOVE', value: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  ];

  console.log('Available safety thresholds:');
  thresholds.forEach(({ name, value }) => {
    console.log(`- ${name}: ${value}`);
  });

  console.log('\nRecommendation: Use BLOCK_MEDIUM_AND_ABOVE for most applications');
  console.log('This balances safety with flexibility.');
}

/**
 * Example 5: Token counting
 */
async function tokenCounting() {
  console.log('\n=== Example 5: Token Counting ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const texts = [
    'Hello, world!',
    'This is a longer text that should have more tokens than the previous one.',
    'The quick brown fox jumps over the lazy dog. ' +
    'This sentence is used to demonstrate all letters of the alphabet.',
  ];

  for (const text of texts) {
    const countResult = await model.countTokens(text);

    console.log(`\nText: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    console.log(`Character count: ${text.length}`);
    console.log(`Token count: ${countResult.totalTokens}`);
    console.log(`Ratio: ${(text.length / countResult.totalTokens).toFixed(2)} chars/token`);
  }

  // Token counting with conversation history
  console.log('\n--- Token Counting with Conversation ---');

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: 'Hello!' }] },
      { role: 'model', parts: [{ text: 'Hello! How can I help you today?' }] },
    ],
  });

  const newMessage = 'Can you explain quantum computing?';
  const history = await chat.getHistory();

  const historyText = history.map(msg =>
    msg.parts.map(part => part.text).join('')
  ).join('\n');

  const historyTokens = await model.countTokens(historyText);
  const messageTokens = await model.countTokens(newMessage);

  console.log(`\nHistory tokens: ${historyTokens.totalTokens}`);
  console.log(`New message tokens: ${messageTokens.totalTokens}`);
  console.log(`Total tokens: ${historyTokens.totalTokens + messageTokens.totalTokens}`);
}

/**
 * Example 6: Model parameter configuration
 */
async function modelParameters() {
  console.log('\n=== Example 6: Model Parameter Configuration ===\n');

  const configurations = [
    {
      name: 'Creative Writing',
      config: {
        temperature: 1.5,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
      prompt: 'Write the opening paragraph of a sci-fi novel',
    },
    {
      name: 'Factual/Deterministic',
      config: {
        temperature: 0.0,
        topP: 0.1,
        topK: 1,
        maxOutputTokens: 1024,
      },
      prompt: 'What is the capital of France?',
    },
    {
      name: 'Balanced',
      config: {
        temperature: 0.7,
        topP: 0.8,
        topK: 20,
        maxOutputTokens: 1024,
      },
      prompt: 'Explain the benefits of exercise',
    },
  ];

  for (const { name, config, prompt } of configurations) {
    console.log(`\n--- ${name} Configuration ---`);
    console.log(`Temperature: ${config.temperature}`);
    console.log(`TopP: ${config.topP}`);
    console.log(`TopK: ${config.topK}`);
    console.log(`Max Tokens: ${config.maxOutputTokens}`);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: config,
    });

    console.log(`\nPrompt: ${prompt}`);
    const result = await model.generateContent(prompt);
    console.log(`Response: ${result.response.text().substring(0, 200)}...\n`);
  }
}

/**
 * Example 7: Thinking mode and extended thinking
 */
async function thinkingMode() {
  console.log('\n=== Example 7: Thinking Mode ===\n');

  // Note: Thinking mode requires specific models that support it
  console.log('Thinking mode allows the model to show its reasoning process.');
  console.log('Available in models like gemini-2.0-flash-thinking-exp');

  // Example configuration for thinking mode
  console.log(`
Example configuration:

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-thinking-exp',
  generationConfig: {
    thinkingConfig: {
      thinkingLevel: 'MEDIUM', // or 'LOW', 'HIGH'
    },
  },
});

This shows the model's chain of thought before the final answer.
  `);

  console.log('\nUse cases:');
  console.log('- Complex problem solving');
  console.log('- Mathematical reasoning');
  console.log('- Step-by-step analysis');
  console.log('- Debugging logic');
}

/**
 * Example 8: Response validation and metadata
 */
async function responseValidation() {
  console.log('\n=== Example 8: Response Validation and Metadata ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = 'Explain photosynthesis';
  const result = await model.generateContent(prompt);
  const response = result.response;

  console.log('--- Response Metadata ---');
  console.log(`\nModel: gemini-2.0-flash-exp`);

  // Usage metadata
  if (response.usageMetadata) {
    console.log('\nToken Usage:');
    console.log(`- Prompt tokens: ${response.usageMetadata.promptTokenCount}`);
    console.log(`- Candidates tokens: ${response.usageMetadata.candidatesTokenCount}`);
    console.log(`- Total tokens: ${response.usageMetadata.totalTokenCount}`);
  }

  // Candidate metadata
  const candidate = response.candidates[0];
  console.log(`\nFinish Reason: ${candidate.finishReason}`);
  console.log(`Index: ${candidate.index}`);

  // Safety ratings
  console.log('\nSafety Ratings:');
  candidate.safetyRatings.forEach(rating => {
    console.log(`- ${rating.category}: ${rating.probability}`);
  });

  // Response text
  console.log(`\nResponse length: ${response.text().length} characters`);
  console.log(`\nFirst 100 chars: ${response.text().substring(0, 100)}...`);
}

/**
 * Example 9: Context caching (for repeated prompts)
 */
async function contextCaching() {
  console.log('\n=== Example 9: Context Caching Concepts ===\n');

  console.log('Context caching helps reduce costs and latency for repeated queries.');
  console.log('');
  console.log('Use cases:');
  console.log('- Processing multiple questions about the same document');
  console.log('- Analyzing different aspects of the same codebase');
  console.log('- Multiple queries with the same system instruction');
  console.log('');

  console.log('Example pattern:');
  console.log(`
// Upload a large document once
const doc = await fileManager.uploadFile('large-doc.pdf', {
  mimeType: 'application/pdf'
});

// Use it in multiple queries - the context is cached
const queries = [
  'Summarize chapter 1',
  'What are the main themes?',
  'List all characters mentioned',
];

for (const query of queries) {
  const result = await model.generateContent([
    { fileData: { fileUri: doc.uri, mimeType: 'application/pdf' } },
    { text: query }
  ]);
  console.log(result.response.text());
}
  `);

  console.log('\nBenefits:');
  console.log('- Reduced API costs for cached content');
  console.log('- Faster response times');
  console.log('- Efficient for repeated queries on same context');
}

/**
 * Example 10: Timeout and retry configuration
 */
async function timeoutAndRetry() {
  console.log('\n=== Example 10: Timeout and Retry Patterns ===\n');

  console.log('Best practices for handling timeouts and retries:\n');

  console.log('1. Set reasonable timeouts:');
  console.log(`
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
  requestOptions: {
    timeout: 60000, // 60 seconds
  },
});
  `);

  console.log('\n2. Implement exponential backoff:');
  console.log(`
async function generateWithRetry(prompt, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      console.log(\`Retry \${i + 1} after \${delay}ms\`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
  `);

  console.log('\n3. Handle specific error types:');
  console.log(`
try {
  const result = await model.generateContent(prompt);
} catch (error) {
  if (error.status === 429) {
    console.log('Rate limited - retry later');
  } else if (error.status === 500) {
    console.log('Server error - retry with backoff');
  } else {
    console.log('Other error:', error.message);
  }
}
  `);
}

/**
 * Example 11: Model selection and comparison
 */
async function modelSelection() {
  console.log('\n=== Example 11: Model Selection Guide ===\n');

  const models = [
    {
      name: 'gemini-2.0-flash-exp',
      description: 'Fast, efficient model for most tasks',
      useCases: ['General queries', 'Chat', 'Content generation'],
      speed: 'Very Fast',
      cost: 'Low',
    },
    {
      name: 'gemini-2.0-flash-thinking-exp',
      description: 'Shows reasoning process, good for complex problems',
      useCases: ['Math', 'Logic puzzles', 'Detailed analysis'],
      speed: 'Medium',
      cost: 'Medium',
    },
    {
      name: 'gemini-pro-vision',
      description: 'Optimized for multimodal (text + images)',
      useCases: ['Image analysis', 'Visual Q&A', 'OCR'],
      speed: 'Medium',
      cost: 'Medium',
    },
  ];

  console.log('Model Comparison:\n');
  models.forEach(model => {
    console.log(`${model.name}`);
    console.log(`Description: ${model.description}`);
    console.log(`Use cases: ${model.useCases.join(', ')}`);
    console.log(`Speed: ${model.speed}`);
    console.log(`Cost: ${model.cost}`);
    console.log('');
  });

  console.log('Selection criteria:');
  console.log('- Use flash models for speed and cost efficiency');
  console.log('- Use thinking models for complex reasoning');
  console.log('- Use vision models for image/video understanding');
  console.log('- Consider token limits for long-form content');
}

/**
 * Example 12: Advanced system instruction patterns
 */
async function advancedSystemInstructionPatterns() {
  console.log('\n=== Example 12: Advanced System Instruction Patterns ===\n');

  // Pattern 1: Structured output enforcer
  const structuredOutputInstruction = `You must ALWAYS respond in this exact format:

ANALYSIS: [Your analysis here]
RECOMMENDATION: [Your recommendation here]
CONFIDENCE: [Low/Medium/High]
NEXT_STEPS: [Numbered list of next steps]

Never deviate from this format.`;

  // Pattern 2: Domain expert with constraints
  const domainExpertInstruction = `You are a medical AI assistant with these constraints:

1. Never diagnose conditions (say "consult a doctor")
2. Always cite sources when providing medical information
3. Prioritize safety and accuracy over completeness
4. Use clear, non-technical language
5. Include relevant warnings and disclaimers`;

  // Pattern 3: Multi-step reasoner
  const multiStepInstruction = `When answering questions, follow this process:

1. UNDERSTAND: Restate the question in your own words
2. ANALYZE: Break down the problem into components
3. RESEARCH: Identify what information is needed
4. SYNTHESIZE: Combine information into insights
5. CONCLUDE: Provide clear, actionable answer

Show each step in your response.`;

  console.log('Pattern 1: Structured Output Enforcer');
  console.log(structuredOutputInstruction);

  console.log('\n\nPattern 2: Domain Expert with Constraints');
  console.log(domainExpertInstruction);

  console.log('\n\nPattern 3: Multi-Step Reasoner');
  console.log(multiStepInstruction);
}

// Run all examples
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Gemini API - Advanced Features Examples                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await systemInstructions();
    await multipleSystemInstructionExamples();
    await safetySettings();
    await safetyThresholds();
    await tokenCounting();
    await modelParameters();
    await thinkingMode();
    await responseValidation();
    await contextCaching();
    await timeoutAndRetry();
    await modelSelection();
    await advancedSystemInstructionPatterns();

    console.log('\n\n✅ All advanced features examples completed!');
  } catch (error) {
    console.error('\n❌ Error running examples:', error.message);
    console.error(error);
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  systemInstructions,
  multipleSystemInstructionExamples,
  safetySettings,
  safetyThresholds,
  tokenCounting,
  modelParameters,
  thinkingMode,
  responseValidation,
  contextCaching,
  timeoutAndRetry,
  modelSelection,
  advancedSystemInstructionPatterns,
};
