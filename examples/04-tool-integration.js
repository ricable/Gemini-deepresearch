/**
 * Tool Integration with Gemini API
 *
 * This example demonstrates:
 * - Function calling (custom tools)
 * - Google Search tool
 * - Code execution tool
 * - Combining multiple tools
 */

import { GoogleGenerativeAI, FunctionDeclarationSchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Example 1: Basic function calling
 */
async function basicFunctionCalling() {
  console.log('\n=== Example 1: Basic Function Calling ===\n');

  // Define available functions
  const functions = {
    getCurrentWeather: ({ location, unit = 'celsius' }) => {
      // Simulated weather API
      const weatherData = {
        'San Francisco': { temp: 18, condition: 'Partly cloudy' },
        'New York': { temp: 22, condition: 'Sunny' },
        'London': { temp: 15, condition: 'Rainy' },
      };

      const data = weatherData[location] || { temp: 20, condition: 'Unknown' };
      const temp = unit === 'fahrenheit' ? (data.temp * 9/5) + 32 : data.temp;

      return {
        location,
        temperature: temp,
        unit,
        condition: data.condition,
      };
    },
  };

  // Define function declaration for the model
  const weatherTool = {
    functionDeclarations: [
      {
        name: 'getCurrentWeather',
        description: 'Get the current weather for a specific location',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            location: {
              type: FunctionDeclarationSchemaType.STRING,
              description: 'The city name, e.g. San Francisco',
            },
            unit: {
              type: FunctionDeclarationSchemaType.STRING,
              enum: ['celsius', 'fahrenheit'],
              description: 'Temperature unit',
            },
          },
          required: ['location'],
        },
      },
    ],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    tools: [weatherTool],
  });

  const chat = model.startChat();

  // Send a message that should trigger function call
  console.log('User: What\'s the weather like in San Francisco?');
  const result = await chat.sendMessage('What\'s the weather like in San Francisco?');

  const response = result.response;
  const functionCalls = response.functionCalls();

  if (functionCalls && functionCalls.length > 0) {
    console.log('\nFunction calls detected:');

    const functionResponses = functionCalls.map(call => {
      console.log(`- Calling: ${call.name}`);
      console.log(`- Arguments:`, call.args);

      const functionResult = functions[call.name](call.args);
      console.log(`- Result:`, functionResult);

      return {
        functionResponse: {
          name: call.name,
          response: functionResult,
        },
      };
    });

    // Send function results back to model
    const followUpResult = await chat.sendMessage(functionResponses);
    console.log('\nAI Response:', followUpResult.response.text());
  } else {
    console.log('AI Response:', response.text());
  }
}

/**
 * Example 2: Multiple function calls
 */
async function multipleFunctionCalls() {
  console.log('\n=== Example 2: Multiple Function Calls ===\n');

  // Simulated functions
  const functions = {
    searchProducts: ({ query, category, maxPrice }) => {
      return {
        products: [
          { id: 1, name: 'Laptop Pro', price: 1200, category: 'electronics' },
          { id: 2, name: 'Wireless Mouse', price: 25, category: 'electronics' },
          { id: 3, name: 'Desk Lamp', price: 45, category: 'home' },
        ].filter(p =>
          (!category || p.category === category) &&
          (!maxPrice || p.price <= maxPrice)
        ),
      };
    },

    getProductDetails: ({ productId }) => {
      const products = {
        1: { name: 'Laptop Pro', price: 1200, stock: 15, rating: 4.5 },
        2: { name: 'Wireless Mouse', price: 25, stock: 50, rating: 4.8 },
      };
      return products[productId] || { error: 'Product not found' };
    },

    checkInventory: ({ productId }) => {
      const inventory = {
        1: { available: 15, warehouse: 'CA-1', nextRestock: '2025-01-15' },
        2: { available: 50, warehouse: 'NY-2', nextRestock: '2025-01-10' },
      };
      return inventory[productId] || { available: 0 };
    },
  };

  const tools = {
    functionDeclarations: [
      {
        name: 'searchProducts',
        description: 'Search for products in the catalog',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            query: { type: FunctionDeclarationSchemaType.STRING },
            category: { type: FunctionDeclarationSchemaType.STRING },
            maxPrice: { type: FunctionDeclarationSchemaType.NUMBER },
          },
          required: ['query'],
        },
      },
      {
        name: 'getProductDetails',
        description: 'Get detailed information about a specific product',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            productId: { type: FunctionDeclarationSchemaType.NUMBER },
          },
          required: ['productId'],
        },
      },
      {
        name: 'checkInventory',
        description: 'Check inventory status for a product',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            productId: { type: FunctionDeclarationSchemaType.NUMBER },
          },
          required: ['productId'],
        },
      },
    ],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    tools: [tools],
  });

  const chat = model.startChat();

  console.log('User: Find me electronics under $100 and check stock for the mouse');
  let result = await chat.sendMessage('Find me electronics under $100 and check stock for the mouse');

  // Handle potential multiple function calls
  let response = result.response;
  let functionCalls = response.functionCalls();

  while (functionCalls && functionCalls.length > 0) {
    console.log(`\nExecuting ${functionCalls.length} function call(s):`);

    const functionResponses = functionCalls.map(call => {
      console.log(`- ${call.name}(${JSON.stringify(call.args)})`);
      const functionResult = functions[call.name](call.args);

      return {
        functionResponse: {
          name: call.name,
          response: functionResult,
        },
      };
    });

    result = await chat.sendMessage(functionResponses);
    response = result.response;
    functionCalls = response.functionCalls();
  }

  console.log('\nFinal AI Response:', response.text());
}

/**
 * Example 3: Google Search tool
 */
async function googleSearchTool() {
  console.log('\n=== Example 3: Google Search Tool ===\n');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    tools: [{ googleSearch: {} }], // Enable Google Search
  });

  const prompt = 'What are the latest developments in quantum computing in 2024? Include specific company announcements.';

  console.log('User:', prompt);
  const result = await model.generateContent(prompt);

  console.log('\nAI Response:', result.response.text());

  // Check for grounding metadata
  const groundingMetadata = result.response.candidates[0].groundingMetadata;

  if (groundingMetadata) {
    console.log('\n--- Grounding Sources ---');

    if (groundingMetadata.groundingChunks) {
      groundingMetadata.groundingChunks.forEach((chunk, index) => {
        if (chunk.web) {
          console.log(`${index + 1}. ${chunk.web.title}`);
          console.log(`   ${chunk.web.uri}\n`);
        }
      });
    }

    if (groundingMetadata.webSearchQueries) {
      console.log('Search queries used:');
      groundingMetadata.webSearchQueries.forEach(query => {
        console.log(`- ${query}`);
      });
    }
  }
}

/**
 * Example 4: Code execution tool
 */
async function codeExecutionTool() {
  console.log('\n=== Example 4: Code Execution Tool ===\n');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    tools: [{ codeExecution: {} }], // Enable code execution
  });

  const prompt = `Calculate the fibonacci sequence up to the 15th number and find:
1. The sum of all even numbers in the sequence
2. The ratio between consecutive numbers (approaching golden ratio)

Please write and execute code to solve this.`;

  console.log('User:', prompt);
  const result = await model.generateContent(prompt);

  console.log('\nAI Response:', result.response.text());

  // Check for executed code
  const candidate = result.response.candidates[0];
  if (candidate.content.parts) {
    candidate.content.parts.forEach(part => {
      if (part.executableCode) {
        console.log('\n--- Executed Code ---');
        console.log(part.executableCode.code);
      }
      if (part.codeExecutionResult) {
        console.log('\n--- Execution Result ---');
        console.log('Outcome:', part.codeExecutionResult.outcome);
        if (part.codeExecutionResult.output) {
          console.log('Output:', part.codeExecutionResult.output);
        }
      }
    });
  }
}

/**
 * Example 5: Combining multiple tools
 */
async function combiningMultipleTools() {
  console.log('\n=== Example 5: Combining Multiple Tools ===\n');

  // Define custom functions
  const databaseTools = {
    functionDeclarations: [
      {
        name: 'queryUserData',
        description: 'Query user information from the database',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            userId: { type: FunctionDeclarationSchemaType.STRING },
          },
          required: ['userId'],
        },
      },
      {
        name: 'getRecommendations',
        description: 'Get personalized recommendations for a user',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            userId: { type: FunctionDeclarationSchemaType.STRING },
            category: { type: FunctionDeclarationSchemaType.STRING },
          },
          required: ['userId'],
        },
      },
    ],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    tools: [
      databaseTools,              // Custom functions
      { googleSearch: {} },       // Google Search
      { codeExecution: {} },      // Code execution
    ],
  });

  console.log('Model configured with:');
  console.log('- Custom database functions');
  console.log('- Google Search');
  console.log('- Code Execution');

  console.log('\nExample prompt: "Get user data for user-123, search for trending tech products, and calculate budget allocation"');
  console.log('The model can intelligently choose which tool(s) to use.');
}

/**
 * Example 6: Function calling with conversation
 */
async function functionCallingInConversation() {
  console.log('\n=== Example 6: Function Calling in Conversation ===\n');

  const functions = {
    bookFlight: ({ origin, destination, date, passengers }) => {
      return {
        bookingId: 'FL-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        origin,
        destination,
        date,
        passengers,
        price: 350 * passengers,
        status: 'confirmed',
      };
    },

    checkFlightStatus: ({ bookingId }) => {
      return {
        bookingId,
        status: 'on-time',
        gate: 'B23',
        boarding: '14:30',
        departure: '15:00',
      };
    },
  };

  const tools = {
    functionDeclarations: [
      {
        name: 'bookFlight',
        description: 'Book a flight ticket',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            origin: { type: FunctionDeclarationSchemaType.STRING },
            destination: { type: FunctionDeclarationSchemaType.STRING },
            date: { type: FunctionDeclarationSchemaType.STRING },
            passengers: { type: FunctionDeclarationSchemaType.NUMBER },
          },
          required: ['origin', 'destination', 'date', 'passengers'],
        },
      },
      {
        name: 'checkFlightStatus',
        description: 'Check the status of a flight booking',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            bookingId: { type: FunctionDeclarationSchemaType.STRING },
          },
          required: ['bookingId'],
        },
      },
    ],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    tools: [tools],
    systemInstruction: {
      parts: [{
        text: 'You are a helpful travel booking assistant. Help users book flights and check their status.'
      }],
    },
  });

  const chat = model.startChat();

  // Multi-turn conversation with function calls
  const messages = [
    'I need to book a flight from New York to London for December 25th for 2 passengers',
    'Great! Can you check the status of that booking?',
  ];

  for (const message of messages) {
    console.log(`\nUser: ${message}`);
    let result = await chat.sendMessage(message);
    let response = result.response;
    let functionCalls = response.functionCalls();

    while (functionCalls && functionCalls.length > 0) {
      const functionResponses = functionCalls.map(call => {
        console.log(`Executing: ${call.name}(${JSON.stringify(call.args)})`);
        const functionResult = functions[call.name](call.args);

        return {
          functionResponse: {
            name: call.name,
            response: functionResult,
          },
        };
      });

      result = await chat.sendMessage(functionResponses);
      response = result.response;
      functionCalls = response.functionCalls();
    }

    console.log(`AI: ${response.text()}`);
  }
}

/**
 * Example 7: Error handling in function calls
 */
async function functionCallErrorHandling() {
  console.log('\n=== Example 7: Error Handling in Function Calls ===\n');

  const functions = {
    processPayment: ({ amount, currency, cardNumber }) => {
      // Simulate validation
      if (amount <= 0) {
        return {
          success: false,
          error: 'Invalid amount',
        };
      }

      if (!cardNumber || cardNumber.length < 16) {
        return {
          success: false,
          error: 'Invalid card number',
        };
      }

      return {
        success: true,
        transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        amount,
        currency,
      };
    },
  };

  const tools = {
    functionDeclarations: [
      {
        name: 'processPayment',
        description: 'Process a payment transaction',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            amount: { type: FunctionDeclarationSchemaType.NUMBER },
            currency: { type: FunctionDeclarationSchemaType.STRING },
            cardNumber: { type: FunctionDeclarationSchemaType.STRING },
          },
          required: ['amount', 'currency', 'cardNumber'],
        },
      },
    ],
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    tools: [tools],
  });

  const chat = model.startChat();

  // Test with invalid data
  console.log('User: Process a payment of -50 USD with card 1234');
  let result = await chat.sendMessage('Process a payment of -50 USD with card 1234');
  let response = result.response;
  let functionCalls = response.functionCalls();

  if (functionCalls) {
    const functionResponses = functionCalls.map(call => {
      const functionResult = functions[call.name](call.args);
      console.log('Function result:', functionResult);

      return {
        functionResponse: {
          name: call.name,
          response: functionResult,
        },
      };
    });

    result = await chat.sendMessage(functionResponses);
    console.log('AI Response:', result.response.text());
  }
}

/**
 * Example 8: Dynamic tool selection
 */
async function dynamicToolSelection() {
  console.log('\n=== Example 8: Dynamic Tool Selection ===\n');

  console.log('The model automatically selects appropriate tools based on the query:');
  console.log('');
  console.log('Query: "What\'s 2+2?" → Uses code execution');
  console.log('Query: "What\'s trending on Twitter?" → Uses Google Search');
  console.log('Query: "Book a table" → Uses custom bookTable function');
  console.log('Query: "Find papers on AI and summarize" → Uses search + code for analysis');
  console.log('');
  console.log('You can configure:');
  console.log('- Tool choice mode: AUTO, ANY, NONE');
  console.log('- Allowed function names');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    tools: [
      { googleSearch: {} },
      { codeExecution: {} },
    ],
    toolConfig: {
      functionCallingConfig: {
        mode: 'AUTO', // Let model decide
      },
    },
  });

  console.log('\nModel configured with AUTO mode for intelligent tool selection');
}

// Run all examples
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Gemini API - Tool Integration Examples                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await basicFunctionCalling();
    await multipleFunctionCalls();
    await googleSearchTool();
    await codeExecutionTool();
    await combiningMultipleTools();
    await functionCallingInConversation();
    await functionCallErrorHandling();
    await dynamicToolSelection();

    console.log('\n\n✅ All tool integration examples completed!');
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
  basicFunctionCalling,
  multipleFunctionCalls,
  googleSearchTool,
  codeExecutionTool,
  combiningMultipleTools,
  functionCallingInConversation,
  functionCallErrorHandling,
  dynamicToolSelection,
};
