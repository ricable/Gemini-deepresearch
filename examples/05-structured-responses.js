/**
 * Structured Responses with Gemini API (JSON Mode)
 *
 * This example demonstrates how to use JSON schemas to enforce
 * structured outputs from the Gemini API.
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Example 1: Simple JSON schema response
 */
async function simpleJSONSchema() {
  console.log('\n=== Example 1: Simple JSON Schema Response ===\n');

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      city: { type: SchemaType.STRING },
      country: { type: SchemaType.STRING },
      population: { type: SchemaType.NUMBER },
      founded: { type: SchemaType.NUMBER },
    },
    required: ['city', 'country', 'population'],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const prompt = 'Give me information about Paris';
  console.log('Prompt:', prompt);

  const result = await model.generateContent(prompt);
  const jsonResponse = JSON.parse(result.response.text());

  console.log('\nStructured Response:');
  console.log(JSON.stringify(jsonResponse, null, 2));
}

/**
 * Example 2: Array of objects schema
 */
async function arrayOfObjectsSchema() {
  console.log('\n=== Example 2: Array of Objects Schema ===\n');

  const schema = {
    type: SchemaType.ARRAY,
    items: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        symbol: { type: SchemaType.STRING },
        atomicNumber: { type: SchemaType.NUMBER },
        category: { type: SchemaType.STRING },
      },
      required: ['name', 'symbol', 'atomicNumber'],
    },
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const prompt = 'List 5 chemical elements with their properties';
  console.log('Prompt:', prompt);

  const result = await model.generateContent(prompt);
  const elements = JSON.parse(result.response.text());

  console.log('\nStructured Response (Array):');
  console.log(JSON.stringify(elements, null, 2));
}

/**
 * Example 3: Nested JSON schema
 */
async function nestedJSONSchema() {
  console.log('\n=== Example 3: Nested JSON Schema ===\n');

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      company: { type: SchemaType.STRING },
      headquarters: {
        type: SchemaType.OBJECT,
        properties: {
          city: { type: SchemaType.STRING },
          country: { type: SchemaType.STRING },
          address: { type: SchemaType.STRING },
        },
      },
      employees: { type: SchemaType.NUMBER },
      departments: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            headCount: { type: SchemaType.NUMBER },
            manager: { type: SchemaType.STRING },
          },
        },
      },
      revenue: {
        type: SchemaType.OBJECT,
        properties: {
          amount: { type: SchemaType.NUMBER },
          currency: { type: SchemaType.STRING },
          year: { type: SchemaType.NUMBER },
        },
      },
    },
    required: ['company', 'headquarters', 'employees'],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const prompt = 'Give me information about Apple Inc.';
  console.log('Prompt:', prompt);

  const result = await model.generateContent(prompt);
  const companyData = JSON.parse(result.response.text());

  console.log('\nNested Structured Response:');
  console.log(JSON.stringify(companyData, null, 2));
}

/**
 * Example 4: Enum and specific value constraints
 */
async function enumConstraints() {
  console.log('\n=== Example 4: Enum and Specific Value Constraints ===\n');

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      productName: { type: SchemaType.STRING },
      category: {
        type: SchemaType.STRING,
        enum: ['electronics', 'clothing', 'food', 'books', 'toys'],
      },
      price: { type: SchemaType.NUMBER },
      inStock: { type: SchemaType.BOOLEAN },
      rating: {
        type: SchemaType.NUMBER,
        minimum: 0,
        maximum: 5,
      },
      tags: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
    },
    required: ['productName', 'category', 'price', 'inStock'],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const prompt = 'Create a product listing for a wireless headphone';
  console.log('Prompt:', prompt);

  const result = await model.generateContent(prompt);
  const product = JSON.parse(result.response.text());

  console.log('\nProduct with Enum Constraints:');
  console.log(JSON.stringify(product, null, 2));
}

/**
 * Example 5: Data extraction schema
 */
async function dataExtractionSchema() {
  console.log('\n=== Example 5: Data Extraction Schema ===\n');

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      entities: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            type: {
              type: SchemaType.STRING,
              enum: ['person', 'organization', 'location', 'date', 'product'],
            },
            mentions: { type: SchemaType.NUMBER },
          },
        },
      },
      sentiment: {
        type: SchemaType.STRING,
        enum: ['positive', 'negative', 'neutral', 'mixed'],
      },
      summary: { type: SchemaType.STRING },
      keyPoints: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
    },
    required: ['entities', 'sentiment', 'summary'],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const text = `
    Apple Inc. announced record-breaking iPhone sales in Q4 2024, with CEO Tim Cook
    praising the team's innovation. The company's headquarters in Cupertino, California
    saw celebrations as revenue exceeded expectations. Analysts predict continued growth
    in 2025, particularly in emerging markets like India and Brazil.
  `;

  const prompt = `Analyze this text and extract entities, sentiment, and key points:\n\n${text}`;
  console.log('Text to analyze:', text.trim());

  const result = await model.generateContent(prompt);
  const analysis = JSON.parse(result.response.text());

  console.log('\nExtracted Data:');
  console.log(JSON.stringify(analysis, null, 2));
}

/**
 * Example 6: Recipe schema with detailed structure
 */
async function recipeSchema() {
  console.log('\n=== Example 6: Recipe Schema ===\n');

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      recipeName: { type: SchemaType.STRING },
      cuisine: { type: SchemaType.STRING },
      prepTime: { type: SchemaType.NUMBER, description: 'Prep time in minutes' },
      cookTime: { type: SchemaType.NUMBER, description: 'Cook time in minutes' },
      servings: { type: SchemaType.NUMBER },
      difficulty: {
        type: SchemaType.STRING,
        enum: ['easy', 'medium', 'hard'],
      },
      ingredients: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            amount: { type: SchemaType.STRING },
            unit: { type: SchemaType.STRING },
          },
        },
      },
      instructions: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            step: { type: SchemaType.NUMBER },
            instruction: { type: SchemaType.STRING },
            duration: { type: SchemaType.NUMBER, description: 'Duration in minutes (optional)' },
          },
        },
      },
      nutritionInfo: {
        type: SchemaType.OBJECT,
        properties: {
          calories: { type: SchemaType.NUMBER },
          protein: { type: SchemaType.STRING },
          carbs: { type: SchemaType.STRING },
          fat: { type: SchemaType.STRING },
        },
      },
    },
    required: ['recipeName', 'ingredients', 'instructions'],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const prompt = 'Create a recipe for spaghetti carbonara';
  console.log('Prompt:', prompt);

  const result = await model.generateContent(prompt);
  const recipe = JSON.parse(result.response.text());

  console.log('\nRecipe (Structured):');
  console.log(JSON.stringify(recipe, null, 2));
}

/**
 * Example 7: Database record schema
 */
async function databaseRecordSchema() {
  console.log('\n=== Example 7: Database Record Schema ===\n');

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      userId: { type: SchemaType.STRING },
      profile: {
        type: SchemaType.OBJECT,
        properties: {
          firstName: { type: SchemaType.STRING },
          lastName: { type: SchemaType.STRING },
          email: { type: SchemaType.STRING },
          age: { type: SchemaType.NUMBER },
          verified: { type: SchemaType.BOOLEAN },
        },
      },
      preferences: {
        type: SchemaType.OBJECT,
        properties: {
          newsletter: { type: SchemaType.BOOLEAN },
          notifications: { type: SchemaType.BOOLEAN },
          theme: {
            type: SchemaType.STRING,
            enum: ['light', 'dark', 'auto'],
          },
          language: { type: SchemaType.STRING },
        },
      },
      metadata: {
        type: SchemaType.OBJECT,
        properties: {
          createdAt: { type: SchemaType.STRING },
          lastLogin: { type: SchemaType.STRING },
          loginCount: { type: SchemaType.NUMBER },
          roles: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
      },
    },
    required: ['userId', 'profile'],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const prompt = 'Generate a user profile for John Doe, a software engineer who prefers dark mode';
  console.log('Prompt:', prompt);

  const result = await model.generateContent(prompt);
  const userRecord = JSON.parse(result.response.text());

  console.log('\nDatabase Record:');
  console.log(JSON.stringify(userRecord, null, 2));
}

/**
 * Example 8: API response schema
 */
async function apiResponseSchema() {
  console.log('\n=== Example 8: API Response Schema ===\n');

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      status: {
        type: SchemaType.STRING,
        enum: ['success', 'error', 'pending'],
      },
      statusCode: { type: SchemaType.NUMBER },
      data: {
        type: SchemaType.OBJECT,
        properties: {
          items: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                title: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                createdAt: { type: SchemaType.STRING },
              },
            },
          },
          pagination: {
            type: SchemaType.OBJECT,
            properties: {
              page: { type: SchemaType.NUMBER },
              pageSize: { type: SchemaType.NUMBER },
              totalPages: { type: SchemaType.NUMBER },
              totalItems: { type: SchemaType.NUMBER },
            },
          },
        },
      },
      meta: {
        type: SchemaType.OBJECT,
        properties: {
          requestId: { type: SchemaType.STRING },
          timestamp: { type: SchemaType.STRING },
          version: { type: SchemaType.STRING },
        },
      },
    },
    required: ['status', 'statusCode', 'data'],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const prompt = 'Generate an API response for a blog posts listing endpoint with 3 posts';
  console.log('Prompt:', prompt);

  const result = await model.generateContent(prompt);
  const apiResponse = JSON.parse(result.response.text());

  console.log('\nAPI Response Format:');
  console.log(JSON.stringify(apiResponse, null, 2));
}

/**
 * Example 9: JSON schema with conversation
 */
async function schemaWithConversation() {
  console.log('\n=== Example 9: JSON Schema with Conversation ===\n');

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      answer: { type: SchemaType.STRING },
      confidence: { type: SchemaType.NUMBER },
      sources: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
      relatedQuestions: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
    },
    required: ['answer', 'confidence'],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const chat = model.startChat();

  const questions = [
    'What is machine learning?',
    'What are common applications?',
  ];

  for (const question of questions) {
    console.log(`\nUser: ${question}`);
    const result = await chat.sendMessage(question);
    const structuredAnswer = JSON.parse(result.response.text());

    console.log('Structured Answer:');
    console.log(JSON.stringify(structuredAnswer, null, 2));
  }
}

/**
 * Example 10: Validation and error handling
 */
async function validationAndErrorHandling() {
  console.log('\n=== Example 10: Validation and Error Handling ===\n');

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      email: {
        type: SchemaType.STRING,
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      },
      age: {
        type: SchemaType.NUMBER,
        minimum: 0,
        maximum: 150,
      },
      score: {
        type: SchemaType.NUMBER,
        minimum: 0,
        maximum: 100,
      },
    },
    required: ['email', 'age'],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  try {
    const prompt = 'Generate a user with email and age 25';
    const result = await model.generateContent(prompt);
    const userData = JSON.parse(result.response.text());

    console.log('Valid User Data:');
    console.log(JSON.stringify(userData, null, 2));

    // Validate the response
    if (!userData.email.includes('@')) {
      console.log('⚠️  Warning: Email format might be invalid');
    }

    if (userData.age < 0 || userData.age > 150) {
      console.log('⚠️  Warning: Age out of valid range');
    }

    console.log('✅ Validation passed');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run all examples
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Gemini API - Structured Responses (JSON) Examples       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await simpleJSONSchema();
    await arrayOfObjectsSchema();
    await nestedJSONSchema();
    await enumConstraints();
    await dataExtractionSchema();
    await recipeSchema();
    await databaseRecordSchema();
    await apiResponseSchema();
    await schemaWithConversation();
    await validationAndErrorHandling();

    console.log('\n\n✅ All structured response examples completed!');
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
  simpleJSONSchema,
  arrayOfObjectsSchema,
  nestedJSONSchema,
  enumConstraints,
  dataExtractionSchema,
  recipeSchema,
  databaseRecordSchema,
  apiResponseSchema,
  schemaWithConversation,
  validationAndErrorHandling,
};
