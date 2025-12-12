/**
 * Streaming Responses with Gemini API
 *
 * This example demonstrates how to receive responses incrementally
 * as they are generated, providing a better user experience for
 * long-form content.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Example 1: Basic streaming
 */
async function basicStreaming() {
  console.log('\n=== Example 1: Basic Streaming ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = 'Write a short story about a robot discovering emotions';
  console.log('Prompt:', prompt);
  console.log('\nStreaming response:\n');

  const result = await model.generateContentStream(prompt);

  let fullText = '';

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullText += chunkText;
    process.stdout.write(chunkText); // Stream to console in real-time
  }

  console.log('\n\n--- Stream Complete ---');
  console.log(`Total length: ${fullText.length} characters`);
}

/**
 * Example 2: Streaming with progress tracking
 */
async function streamingWithProgress() {
  console.log('\n=== Example 2: Streaming with Progress Tracking ===\n');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      maxOutputTokens: 1000,
    },
  });

  const prompt = 'Explain the theory of relativity in detail';
  console.log('Prompt:', prompt);
  console.log('\nStreaming with progress:\n');

  const result = await model.generateContentStream(prompt);

  let chunkCount = 0;
  let totalChars = 0;
  let fullText = '';

  const startTime = Date.now();

  for await (const chunk of result.stream) {
    chunkCount++;
    const chunkText = chunk.text();
    totalChars += chunkText.length;
    fullText += chunkText;

    // Show progress
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stdout.write(`\r[Chunk ${chunkCount}] [${totalChars} chars] [${elapsed}s]    `);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n\n--- Stream Statistics ---');
  console.log(`Chunks received: ${chunkCount}`);
  console.log(`Total characters: ${totalChars}`);
  console.log(`Total time: ${totalTime}s`);
  console.log(`Average chars/chunk: ${(totalChars / chunkCount).toFixed(1)}`);

  // Get final response data
  const response = await result.response;
  console.log(`\nTokens used: ${response.usageMetadata?.totalTokenCount || 'N/A'}`);
}

/**
 * Example 3: Streaming with chat
 */
async function streamingChat() {
  console.log('\n=== Example 3: Streaming Chat ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  const chat = model.startChat();

  const messages = [
    'Tell me about JavaScript promises',
    'How do they differ from callbacks?',
    'Can you show me an example?',
  ];

  for (const message of messages) {
    console.log(`\nUser: ${message}`);
    console.log('AI: ');

    const result = await chat.sendMessageStream(message);

    for await (const chunk of result.stream) {
      process.stdout.write(chunk.text());
    }

    console.log('\n');
  }
}

/**
 * Example 4: Streaming with function calling
 */
async function streamingWithFunctions() {
  console.log('\n=== Example 4: Streaming with Function Calling ===\n');

  const functions = {
    getStockPrice: ({ symbol }) => ({
      symbol,
      price: (Math.random() * 1000).toFixed(2),
      change: (Math.random() * 10 - 5).toFixed(2),
      timestamp: new Date().toISOString(),
    }),

    getCompanyInfo: ({ symbol }) => ({
      symbol,
      name: symbol === 'AAPL' ? 'Apple Inc.' : 'Tech Corp',
      sector: 'Technology',
      marketCap: '2.5T',
    }),
  };

  const tools = {
    functionDeclarations: [
      {
        name: 'getStockPrice',
        description: 'Get current stock price for a symbol',
        parameters: {
          type: 'OBJECT',
          properties: {
            symbol: { type: 'STRING' },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'getCompanyInfo',
        description: 'Get company information',
        parameters: {
          type: 'OBJECT',
          properties: {
            symbol: { type: 'STRING' },
          },
          required: ['symbol'],
        },
      },
    ],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    tools: [tools],
  });

  const chat = model.startChat();

  console.log('User: What\'s the current Apple stock price and company info?');
  console.log('AI: ');

  let result = await chat.sendMessageStream('What\'s the current Apple stock price and company info?');

  // Process stream
  let functionCalls = null;
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      process.stdout.write(chunkText);
    }
  }

  // Check for function calls after stream completes
  const response = await result.response;
  functionCalls = response.functionCalls();

  if (functionCalls) {
    console.log('\n\n[Function calls detected]');

    const functionResponses = functionCalls.map(call => {
      console.log(`Executing: ${call.name}(${JSON.stringify(call.args)})`);
      const result = functions[call.name](call.args);

      return {
        functionResponse: {
          name: call.name,
          response: result,
        },
      };
    });

    // Send function results and stream the final response
    console.log('\nAI (with function results): ');
    const followUpResult = await chat.sendMessageStream(functionResponses);

    for await (const chunk of followUpResult.stream) {
      process.stdout.write(chunk.text());
    }

    console.log('\n');
  }
}

/**
 * Example 5: Streaming with error handling
 */
async function streamingWithErrorHandling() {
  console.log('\n=== Example 5: Streaming with Error Handling ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = 'Explain quantum computing';
  console.log('Prompt:', prompt);
  console.log('\nStreaming response:\n');

  try {
    const result = await model.generateContentStream(prompt);

    let fullText = '';

    for await (const chunk of result.stream) {
      try {
        const chunkText = chunk.text();
        fullText += chunkText;
        process.stdout.write(chunkText);
      } catch (chunkError) {
        console.error('\n⚠️  Error processing chunk:', chunkError.message);
        // Continue with next chunk
      }
    }

    // Verify final response
    const response = await result.response;

    if (response.candidates[0].finishReason === 'STOP') {
      console.log('\n\n✅ Stream completed successfully');
    } else {
      console.log(`\n\n⚠️  Stream ended with reason: ${response.candidates[0].finishReason}`);
    }

  } catch (error) {
    console.error('\n❌ Streaming error:', error.message);
  }
}

/**
 * Example 6: Streaming with cancellation
 */
async function streamingWithCancellation() {
  console.log('\n=== Example 6: Streaming with Cancellation ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = 'Write a very long essay about the history of computing';
  console.log('Prompt:', prompt);
  console.log('\nStreaming (will cancel after 5 chunks):\n');

  const result = await model.generateContentStream(prompt);

  let chunkCount = 0;
  const maxChunks = 5;

  try {
    for await (const chunk of result.stream) {
      chunkCount++;
      process.stdout.write(chunk.text());

      if (chunkCount >= maxChunks) {
        console.log('\n\n[Cancelling stream...]');
        break; // Stop consuming the stream
      }
    }

    console.log(`\nStream stopped after ${chunkCount} chunks`);

  } catch (error) {
    console.error('Error during cancellation:', error.message);
  }
}

/**
 * Example 7: Streaming with buffering
 */
async function streamingWithBuffering() {
  console.log('\n=== Example 7: Streaming with Buffering ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = 'Explain the water cycle in detail';
  console.log('Prompt:', prompt);
  console.log('\nBuffered streaming (updates every 50 chars):\n');

  const result = await model.generateContentStream(prompt);

  let buffer = '';
  const bufferSize = 50; // Update display every 50 characters

  for await (const chunk of result.stream) {
    buffer += chunk.text();

    while (buffer.length >= bufferSize) {
      const toDisplay = buffer.slice(0, bufferSize);
      process.stdout.write(toDisplay);
      buffer = buffer.slice(bufferSize);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Flush remaining buffer
  if (buffer.length > 0) {
    process.stdout.write(buffer);
  }

  console.log('\n\n--- Buffered stream complete ---');
}

/**
 * Example 8: Streaming with real-time processing
 */
async function streamingWithProcessing() {
  console.log('\n=== Example 8: Streaming with Real-time Processing ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = 'List 10 programming concepts with brief explanations';
  console.log('Prompt:', prompt);
  console.log('\nProcessing stream in real-time:\n');

  const result = await model.generateContentStream(prompt);

  let fullText = '';
  let wordCount = 0;
  let sentenceCount = 0;

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullText += chunkText;

    // Real-time analysis
    const words = chunkText.split(/\s+/).filter(w => w.length > 0);
    wordCount += words.length;

    const sentences = chunkText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    sentenceCount += sentences.length;

    // Display chunk
    process.stdout.write(chunkText);

    // Show live stats
    process.stdout.write(`\r[Words: ${wordCount} | Sentences: ${sentenceCount}]    \n`);
  }

  console.log('\n--- Final Statistics ---');
  console.log(`Total words: ${wordCount}`);
  console.log(`Total sentences: ${sentenceCount}`);
  console.log(`Average words/sentence: ${(wordCount / sentenceCount).toFixed(1)}`);
}

/**
 * Example 9: Streaming multiple requests concurrently
 */
async function concurrentStreaming() {
  console.log('\n=== Example 9: Concurrent Streaming ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompts = [
    'Explain photosynthesis briefly',
    'Explain cellular respiration briefly',
    'Explain the carbon cycle briefly',
  ];

  console.log('Streaming 3 prompts concurrently:\n');

  const streamPromises = prompts.map(async (prompt, index) => {
    console.log(`[Stream ${index + 1}] Starting: ${prompt}`);

    const result = await model.generateContentStream(prompt);
    let fullText = '';

    for await (const chunk of result.stream) {
      fullText += chunk.text();
    }

    console.log(`\n[Stream ${index + 1}] Complete (${fullText.length} chars)`);
    return { index, prompt, response: fullText };
  });

  const results = await Promise.all(streamPromises);

  console.log('\n--- All Streams Complete ---');
  results.forEach(({ index, response }) => {
    console.log(`Stream ${index + 1}: ${response.substring(0, 100)}...`);
  });
}

/**
 * Example 10: Streaming with JSON mode
 */
async function streamingJSON() {
  console.log('\n=== Example 10: Streaming JSON Responses ===\n');

  const schema = {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING' },
      chapters: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            number: { type: 'NUMBER' },
            title: { type: 'STRING' },
            summary: { type: 'STRING' },
          },
        },
      },
    },
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const prompt = 'Create an outline for a book about artificial intelligence with 5 chapters';
  console.log('Prompt:', prompt);
  console.log('\nStreaming JSON:\n');

  const result = await model.generateContentStream(prompt);

  let jsonString = '';

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    jsonString += chunkText;
    process.stdout.write(chunkText);
  }

  console.log('\n\n--- Parsing Streamed JSON ---');
  try {
    const parsed = JSON.parse(jsonString);
    console.log('Successfully parsed JSON:');
    console.log(JSON.stringify(parsed, null, 2));
  } catch (error) {
    console.error('Error parsing JSON:', error.message);
  }
}

// Run all examples
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Gemini API - Streaming Responses Examples               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await basicStreaming();
    await streamingWithProgress();
    await streamingChat();
    await streamingWithFunctions();
    await streamingWithErrorHandling();
    await streamingWithCancellation();
    await streamingWithBuffering();
    await streamingWithProcessing();
    await concurrentStreaming();
    await streamingJSON();

    console.log('\n\n✅ All streaming examples completed!');
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
  basicStreaming,
  streamingWithProgress,
  streamingChat,
  streamingWithFunctions,
  streamingWithErrorHandling,
  streamingWithCancellation,
  streamingWithBuffering,
  streamingWithProcessing,
  concurrentStreaming,
  streamingJSON,
};
