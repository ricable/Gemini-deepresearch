# Gemini API Interaction Examples

This directory contains comprehensive JavaScript examples demonstrating various interaction patterns with the Google Gemini API. Each example file is standalone and can be run independently.

## 📚 Table of Contents

- [Getting Started](#getting-started)
- [Examples Overview](#examples-overview)
- [Running Examples](#running-examples)
- [Example Details](#example-details)
- [Best Practices](#best-practices)
- [Additional Resources](#additional-resources)

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- A Google Gemini API key
- Basic knowledge of JavaScript and async/await

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your API key in `.env`:
```bash
GEMINI_API_KEY=your_api_key_here
```

## 📋 Examples Overview

| File | Description | Complexity |
|------|-------------|------------|
| `01-basic-text-interactions.js` | Simple text generation and configuration | ⭐ Beginner |
| `02-multi-turn-conversations.js` | Chat conversations and context management | ⭐⭐ Intermediate |
| `03-multimodal-inputs.js` | Images, audio, video, and PDF processing | ⭐⭐ Intermediate |
| `04-tool-integration.js` | Function calling, Google Search, code execution | ⭐⭐⭐ Advanced |
| `05-structured-responses.js` | JSON schema enforcement and data extraction | ⭐⭐ Intermediate |
| `06-streaming.js` | Real-time streaming responses | ⭐⭐ Intermediate |
| `07-advanced-features.js` | System instructions, safety settings, parameters | ⭐⭐⭐ Advanced |

## ▶️ Running Examples

### Run a single example file:

```bash
node examples/01-basic-text-interactions.js
```

### Run all examples in a file:

Each file contains multiple examples that will run sequentially when you execute the file.

### Run a specific example function:

```javascript
import { simpleTextGeneration } from './examples/01-basic-text-interactions.js';
await simpleTextGeneration();
```

## 📖 Example Details

### 1. Basic Text Interactions

**File:** `01-basic-text-interactions.js`

Learn the fundamentals of the Gemini API with these examples:

- ✅ Simple text generation
- ✅ Configuration options (temperature, tokens, etc.)
- ✅ Multiple response candidates
- ✅ Structured input with parts
- ✅ Stop sequences
- ✅ Response length control
- ✅ Temperature comparison
- ✅ Error handling and safety ratings

**Quick Example:**
```javascript
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
const result = await model.generateContent('Explain quantum computing');
console.log(result.response.text());
```

### 2. Multi-Turn Conversations

**File:** `02-multi-turn-conversations.js`

Master conversational AI with these patterns:

- ✅ Stateless conversation (manual history)
- ✅ Pre-loaded conversation history
- ✅ System instructions with chat
- ✅ Role-based conversations
- ✅ Context window management
- ✅ Export/import conversations
- ✅ Conversation branching
- ✅ Message correction

**Quick Example:**
```javascript
const chat = model.startChat();
let result = await chat.sendMessage('What is the capital of France?');
console.log(result.response.text());

result = await chat.sendMessage('What is its population?');
console.log(result.response.text()); // Remembers context
```

### 3. Multimodal Inputs

**File:** `03-multimodal-inputs.js`

Work with different media types:

- ✅ Image understanding (inline base64)
- ✅ Image understanding (File API)
- ✅ Multiple images comparison
- ✅ Audio transcription and analysis
- ✅ Video understanding
- ✅ PDF document processing
- ✅ Mixed multimodal inputs
- ✅ File management utilities
- ✅ Batch multimodal processing

**Quick Example:**
```javascript
const imageParts = [{
  inlineData: {
    data: base64Image,
    mimeType: 'image/jpeg'
  }
}];

const result = await model.generateContent([
  'Describe this image',
  ...imageParts
]);
```

### 4. Tool Integration

**File:** `04-tool-integration.js`

Extend the model's capabilities with tools:

- ✅ Basic function calling
- ✅ Multiple function calls
- ✅ Google Search tool
- ✅ Code execution tool
- ✅ Combining multiple tools
- ✅ Function calling in conversations
- ✅ Error handling
- ✅ Dynamic tool selection

**Quick Example:**
```javascript
const tools = {
  functionDeclarations: [{
    name: 'getCurrentWeather',
    description: 'Get weather for a location',
    parameters: {
      type: 'OBJECT',
      properties: {
        location: { type: 'STRING' }
      }
    }
  }]
};

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
  tools: [tools]
});
```

### 5. Structured Responses

**File:** `05-structured-responses.js`

Enforce structured outputs with JSON schemas:

- ✅ Simple JSON schema
- ✅ Array of objects
- ✅ Nested JSON structures
- ✅ Enum constraints
- ✅ Data extraction
- ✅ Recipe schema
- ✅ Database record schema
- ✅ API response schema
- ✅ JSON with conversation
- ✅ Validation and error handling

**Quick Example:**
```javascript
const schema = {
  type: 'OBJECT',
  properties: {
    city: { type: 'STRING' },
    population: { type: 'NUMBER' }
  },
  required: ['city', 'population']
};

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: schema
  }
});
```

### 6. Streaming

**File:** `06-streaming.js`

Receive responses in real-time:

- ✅ Basic streaming
- ✅ Streaming with progress tracking
- ✅ Streaming with chat
- ✅ Streaming with function calling
- ✅ Error handling
- ✅ Stream cancellation
- ✅ Buffering
- ✅ Real-time processing
- ✅ Concurrent streaming
- ✅ Streaming JSON

**Quick Example:**
```javascript
const result = await model.generateContentStream(prompt);

for await (const chunk of result.stream) {
  process.stdout.write(chunk.text());
}
```

### 7. Advanced Features

**File:** `07-advanced-features.js`

Master advanced configurations:

- ✅ System instructions (personas)
- ✅ Multiple system instruction examples
- ✅ Safety settings
- ✅ Safety thresholds
- ✅ Token counting
- ✅ Model parameters
- ✅ Thinking mode
- ✅ Response validation
- ✅ Context caching
- ✅ Timeout and retry patterns
- ✅ Model selection guide
- ✅ Advanced instruction patterns

**Quick Example:**
```javascript
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
  systemInstruction: {
    parts: [{
      text: 'You are a helpful coding tutor specializing in JavaScript.'
    }]
  },
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048
  }
});
```

## 💡 Best Practices

### 1. Error Handling

Always wrap API calls in try-catch blocks:

```javascript
try {
  const result = await model.generateContent(prompt);
  console.log(result.response.text());
} catch (error) {
  console.error('Error:', error.message);
  // Handle specific error types
  if (error.status === 429) {
    // Rate limited
  }
}
```

### 2. Token Management

Count tokens to stay within limits:

```javascript
const countResult = await model.countTokens(prompt);
console.log(`Tokens: ${countResult.totalTokens}`);
```

### 3. Safety Settings

Configure appropriate safety settings:

```javascript
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
  }
];
```

### 4. Caching

Use caching for repeated queries to reduce costs:

```javascript
// Upload large context once
const doc = await fileManager.uploadFile('large-doc.pdf');

// Reuse in multiple queries
for (const query of queries) {
  const result = await model.generateContent([
    { fileData: { fileUri: doc.uri } },
    { text: query }
  ]);
}
```

### 5. Streaming for Long Responses

Use streaming for better UX with long responses:

```javascript
const result = await model.generateContentStream(prompt);
for await (const chunk of result.stream) {
  updateUI(chunk.text()); // Update UI incrementally
}
```

## 🔧 Common Use Cases

### Content Generation
- Blog posts and articles
- Product descriptions
- Email drafts
- Social media content

### Data Extraction
- Extract structured data from text
- Parse documents
- Analyze customer feedback
- Generate summaries

### Conversational AI
- Customer support chatbots
- Virtual assistants
- Educational tutors
- Interactive FAQs

### Multimodal Analysis
- Image captioning
- Video summarization
- Document analysis
- Audio transcription

### Code Assistance
- Code generation
- Code review
- Debugging help
- Documentation

## 📚 Additional Resources

### Official Documentation
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Gemini API Interactions](https://ai.google.dev/gemini-api/docs/interactions)
- [API Reference](https://ai.google.dev/api)

### SDK Resources
- [@google/generative-ai on npm](https://www.npmjs.com/package/@google/generative-ai)
- [GitHub Repository](https://github.com/google/generative-ai-js)

### Community
- [Google AI Discord](https://discord.gg/google-ai)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-gemini)
- [GitHub Discussions](https://github.com/google/generative-ai-js/discussions)

## 🎯 Next Steps

1. **Start Simple**: Begin with `01-basic-text-interactions.js` to understand the fundamentals
2. **Experiment**: Modify the examples to fit your use case
3. **Combine Patterns**: Mix techniques from different examples
4. **Build Projects**: Use these examples as building blocks for your applications
5. **Stay Updated**: Check the official documentation for new features

## ❓ Troubleshooting

### Common Issues

**API Key Not Found**
```bash
Error: GEMINI_API_KEY environment variable not set
```
Solution: Create a `.env` file with your API key.

**Rate Limiting**
```bash
Error: 429 Too Many Requests
```
Solution: Implement exponential backoff or reduce request frequency.

**Token Limits**
```bash
Error: Token limit exceeded
```
Solution: Reduce prompt size or use pagination for long content.

**File Upload Errors**
```bash
Error: File not found
```
Solution: Check file paths and create sample-data directory if needed.

## 📝 License

These examples are provided under the MIT License. See the main project LICENSE file for details.

## 🤝 Contributing

Found an issue or want to add more examples? Contributions are welcome! Please submit a pull request or open an issue.

---

**Happy Coding!** 🚀

For questions or support, please refer to the [official Gemini API documentation](https://ai.google.dev/gemini-api/docs).
