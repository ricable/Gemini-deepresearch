/**
 * Multi-Turn Conversations with Gemini API
 *
 * This example demonstrates both stateful and stateless approaches
 * to maintaining conversation context across multiple turns.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Example 1: Stateless conversation (managing history manually)
 */
async function statelessConversation() {
  console.log('\n=== Example 1: Stateless Conversation (Manual History) ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Start chat with empty history
  const chat = model.startChat({
    history: [],
  });

  // First turn
  console.log('User: What is the capital of France?');
  let result = await chat.sendMessage('What is the capital of France?');
  console.log('AI:', result.response.text());

  // Second turn - AI remembers context
  console.log('\nUser: What is its population?');
  result = await chat.sendMessage('What is its population?');
  console.log('AI:', result.response.text());

  // Third turn
  console.log('\nUser: What are the top 3 tourist attractions there?');
  result = await chat.sendMessage('What are the top 3 tourist attractions there?');
  console.log('AI:', result.response.text());

  // Get full history
  console.log('\n--- Conversation History ---');
  const history = await chat.getHistory();
  console.log(`Total messages in history: ${history.length}`);
}

/**
 * Example 2: Conversation with pre-loaded history
 */
async function conversationWithHistory() {
  console.log('\n=== Example 2: Conversation with Pre-loaded History ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Start with existing conversation context
  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: 'Hello! I\'m planning a trip to Japan.' }],
      },
      {
        role: 'model',
        parts: [{ text: 'That\'s wonderful! Japan is a beautiful country with rich culture. What would you like to know about planning your trip?' }],
      },
      {
        role: 'user',
        parts: [{ text: 'I\'m interested in visiting in spring.' }],
      },
      {
        role: 'model',
        parts: [{ text: 'Spring is an excellent time to visit Japan! You\'ll have the chance to see the famous cherry blossoms (sakura). The peak bloom season is typically late March to early April.' }],
      },
    ],
  });

  // Continue the conversation
  console.log('User: What cities should I visit for the best cherry blossom experience?');
  const result = await chat.sendMessage('What cities should I visit for the best cherry blossom experience?');
  console.log('AI:', result.response.text());
}

/**
 * Example 3: System instruction with conversation
 */
async function conversationWithSystemInstruction() {
  console.log('\n=== Example 3: Conversation with System Instruction ===\n');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: {
      parts: [{
        text: 'You are a helpful coding tutor specializing in JavaScript. Always provide code examples and explain concepts clearly. Keep responses concise and beginner-friendly.'
      }],
    },
  });

  const chat = model.startChat({
    history: [],
  });

  // First question
  console.log('User: What are arrow functions?');
  let result = await chat.sendMessage('What are arrow functions?');
  console.log('AI:', result.response.text());

  // Follow-up question
  console.log('\nUser: Can you show me the difference with regular functions?');
  result = await chat.sendMessage('Can you show me the difference with regular functions?');
  console.log('AI:', result.response.text());
}

/**
 * Example 4: Role-based conversation (customer support scenario)
 */
async function roleBased CustomerSupport() {
  console.log('\n=== Example 4: Role-Based Customer Support ===\n');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: {
      parts: [{
        text: `You are a customer support agent for TechCorp, an electronics company.

Your responsibilities:
- Be polite and professional
- Gather necessary information before providing solutions
- Offer clear, step-by-step troubleshooting
- Escalate to human agent if needed

Product knowledge:
- We sell laptops, phones, and accessories
- Standard warranty is 1 year
- Return window is 30 days`
      }],
    },
  });

  const chat = model.startChat();

  const conversation = [
    'My laptop won\'t turn on',
    'I bought it 3 months ago',
    'Yes, I\'ve tried that. The power light doesn\'t come on at all.',
    'Yes, I\'d like to get it repaired or replaced.',
  ];

  for (const message of conversation) {
    console.log(`\nCustomer: ${message}`);
    const result = await chat.sendMessage(message);
    console.log(`Support Agent: ${result.response.text()}`);
  }
}

/**
 * Example 5: Multi-turn with context window management
 */
async function conversationWithContextManagement() {
  console.log('\n=== Example 5: Context Window Management ===\n');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      maxOutputTokens: 200,
    },
  });

  const chat = model.startChat({
    history: [],
  });

  // Simulate a long conversation
  const topics = [
    'Tell me about photosynthesis',
    'How does it relate to the carbon cycle?',
    'What role do oceans play?',
    'How does climate change affect this?',
  ];

  for (const topic of topics) {
    console.log(`\nUser: ${topic}`);
    const result = await chat.sendMessage(topic);
    console.log(`AI: ${result.response.text()}`);

    // Monitor token usage
    const history = await chat.getHistory();
    console.log(`[History size: ${history.length} messages]`);
  }
}

/**
 * Example 6: Conversation export/import (saving and resuming)
 */
async function exportImportConversation() {
  console.log('\n=== Example 6: Export/Import Conversation ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Start initial conversation
  console.log('--- Starting Initial Conversation ---');
  const chat1 = model.startChat();

  console.log('User: What are the benefits of TypeScript?');
  await chat1.sendMessage('What are the benefits of TypeScript?');

  console.log('User: How do I set up a TypeScript project?');
  await chat1.sendMessage('How do I set up a TypeScript project?');

  // Export history
  const history = await chat1.getHistory();
  const exportedHistory = JSON.stringify(history, null, 2);

  console.log('\n--- Exporting Conversation ---');
  console.log(`Exported ${history.length} messages`);

  // Simulate resuming conversation in a new session
  console.log('\n--- Resuming Conversation from Export ---');
  const importedHistory = JSON.parse(exportedHistory);

  const chat2 = model.startChat({
    history: importedHistory,
  });

  console.log('\nUser: Can you remind me what we were discussing?');
  const result = await chat2.sendMessage('Can you remind me what we were discussing?');
  console.log('AI:', result.response.text());
}

/**
 * Example 7: Conversation with branching (exploring alternatives)
 */
async function conversationBranching() {
  console.log('\n=== Example 7: Conversation Branching ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Main conversation path
  const mainChat = model.startChat();

  console.log('--- Main Conversation Path ---');
  console.log('User: I need to build a web application');
  await mainChat.sendMessage('I need to build a web application');

  const mainHistory = await mainChat.getHistory();

  // Branch 1: React path
  console.log('\n--- Branch 1: React Path ---');
  const reactChat = model.startChat({ history: [...mainHistory] });
  console.log('User: I want to use React');
  const reactResult = await reactChat.sendMessage('I want to use React');
  console.log('AI:', reactResult.response.text());

  // Branch 2: Vue path
  console.log('\n--- Branch 2: Vue Path ---');
  const vueChat = model.startChat({ history: [...mainHistory] });
  console.log('User: I want to use Vue');
  const vueResult = await vueChat.sendMessage('I want to use Vue');
  console.log('AI:', vueResult.response.text());
}

/**
 * Example 8: Conversation with message editing/correction
 */
async function conversationWithCorrection() {
  console.log('\n=== Example 8: Conversation with Correction ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: 'What is the capital of Spain?' }],
      },
      {
        role: 'model',
        parts: [{ text: 'The capital of Spain is Madrid.' }],
      },
    ],
  });

  // User wants to correct their previous question
  console.log('User: Sorry, I meant to ask about Portugal, not Spain.');
  const result = await chat.sendMessage('Sorry, I meant to ask about Portugal, not Spain.');
  console.log('AI:', result.response.text());

  console.log('\nUser: What\'s the population?');
  const result2 = await chat.sendMessage('What\'s the population?');
  console.log('AI:', result2.response.text());
}

// Run all examples
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Gemini API - Multi-Turn Conversations Examples          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await statelessConversation();
    await conversationWithHistory();
    await conversationWithSystemInstruction();
    await roleBasedCustomerSupport();
    await conversationWithContextManagement();
    await exportImportConversation();
    await conversationBranching();
    await conversationWithCorrection();

    console.log('\n\n✅ All conversation examples completed successfully!');
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
  statelessConversation,
  conversationWithHistory,
  conversationWithSystemInstruction,
  roleBasedCustomerSupport,
  conversationWithContextManagement,
  exportImportConversation,
  conversationBranching,
  conversationWithCorrection,
};
