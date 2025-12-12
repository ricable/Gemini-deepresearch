/**
 * Basic Text Interactions with Gemini API
 *
 * This example demonstrates the simplest ways to interact with the Gemini API
 * using text prompts and various configuration options.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Example 1: Simple text generation
 */
async function simpleTextGeneration() {
  console.log('\n=== Example 1: Simple Text Generation ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  const prompt = 'Explain quantum computing in simple terms';

  const result = await model.generateContent(prompt);
  const response = result.response;
  console.log('Response:', response.text());
  console.log('Usage Metadata:', response.usageMetadata);
}

/**
 * Example 2: Text generation with configuration
 */
async function textGenerationWithConfig() {
  console.log('\n=== Example 2: Text Generation with Configuration ===\n');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 1.0, // Higher = more creative
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 1024,
      candidateCount: 1,
    },
  });

  const prompt = 'Write a creative story about a robot learning to paint';
  const result = await model.generateContent(prompt);

  console.log('Response:', result.response.text());
  console.log('\nGeneration Config Used:');
  console.log('- Temperature: 1.0 (high creativity)');
  console.log('- Max Output Tokens: 1024');
}

/**
 * Example 3: Multiple candidates (alternative responses)
 */
async function multipleResponseCandidates() {
  console.log('\n=== Example 3: Multiple Response Candidates ===\n');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      candidateCount: 3, // Request 3 alternative responses
      temperature: 0.9,
      maxOutputTokens: 200,
    },
  });

  const prompt = 'Give me a tagline for a sustainable fashion brand';
  const result = await model.generateContent(prompt);

  console.log('All candidate responses:');
  result.response.candidates.forEach((candidate, index) => {
    console.log(`\nCandidate ${index + 1}:`);
    console.log(candidate.content.parts[0].text);
    console.log(`Finish Reason: ${candidate.finishReason}`);
  });
}

/**
 * Example 4: Content with parts array (structured input)
 */
async function structuredInputParts() {
  console.log('\n=== Example 4: Structured Input with Parts ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Using parts array for more control over input structure
  const prompt = {
    contents: [{
      role: 'user',
      parts: [
        { text: 'Analyze the following customer feedback:' },
        { text: 'The product arrived quickly but the quality was disappointing. The customer service was excellent though.' },
        { text: 'Provide sentiment analysis and key points.' },
      ],
    }],
  };

  const result = await model.generateContent(prompt);
  console.log('Analysis:', result.response.text());
}

/**
 * Example 5: Stop sequences
 */
async function stopSequences() {
  console.log('\n=== Example 5: Stop Sequences ===\n');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      stopSequences: ['END', '###'],
      maxOutputTokens: 500,
    },
  });

  const prompt = 'List 5 programming languages:\n1.';
  const result = await model.generateContent(prompt);

  console.log('Response (will stop at END or ###):', result.response.text());
}

/**
 * Example 6: Controlling response length
 */
async function controlResponseLength() {
  console.log('\n=== Example 6: Controlling Response Length ===\n');

  // Short response
  const shortModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      maxOutputTokens: 50,
    },
  });

  const prompt = 'Explain machine learning';

  const shortResult = await shortModel.generateContent(prompt);
  console.log('Short Response (max 50 tokens):');
  console.log(shortResult.response.text());

  // Long response
  const longModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      maxOutputTokens: 2048,
    },
  });

  const longResult = await longModel.generateContent(prompt + ' in detail with examples');
  console.log('\n\nLong Response (max 2048 tokens):');
  console.log(longResult.response.text());
}

/**
 * Example 7: Different temperature settings
 */
async function temperatureComparison() {
  console.log('\n=== Example 7: Temperature Comparison ===\n');

  const prompt = 'Write a one-sentence company slogan for a tech startup';
  const temperatures = [0.0, 0.5, 1.0, 1.5];

  for (const temp of temperatures) {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: temp,
        maxOutputTokens: 100,
      },
    });

    const result = await model.generateContent(prompt);
    console.log(`\nTemperature ${temp}:`);
    console.log(result.response.text());
  }
}

/**
 * Example 8: Error handling and safety ratings
 */
async function errorHandlingAndSafety() {
  console.log('\n=== Example 8: Error Handling and Safety Ratings ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  try {
    const prompt = 'What are the main causes of climate change?';
    const result = await model.generateContent(prompt);

    console.log('Response:', result.response.text());

    // Check safety ratings
    if (result.response.candidates[0].safetyRatings) {
      console.log('\nSafety Ratings:');
      result.response.candidates[0].safetyRatings.forEach(rating => {
        console.log(`- ${rating.category}: ${rating.probability}`);
      });
    }

    // Check finish reason
    console.log(`\nFinish Reason: ${result.response.candidates[0].finishReason}`);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response);
    }
  }
}

// Run all examples
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Gemini API - Basic Text Interactions Examples           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await simpleTextGeneration();
    await textGenerationWithConfig();
    await multipleResponseCandidates();
    await structuredInputParts();
    await stopSequences();
    await controlResponseLength();
    await temperatureComparison();
    await errorHandlingAndSafety();

    console.log('\n\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Error running examples:', error.message);
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  simpleTextGeneration,
  textGenerationWithConfig,
  multipleResponseCandidates,
  structuredInputParts,
  stopSequences,
  controlResponseLength,
  temperatureComparison,
  errorHandlingAndSafety,
};
