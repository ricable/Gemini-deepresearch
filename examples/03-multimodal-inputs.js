/**
 * Multimodal Inputs with Gemini API
 *
 * This example demonstrates how to work with different input modalities:
 * - Images (PNG, JPEG, WebP)
 * - Audio (WAV, MP3, etc.)
 * - Video (MP4, MOV, etc.)
 * - PDF documents
 * - Mixed multimodal inputs
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

/**
 * Example 1: Image understanding with inline data (base64)
 */
async function imageUnderstandingInline() {
  console.log('\n=== Example 1: Image Understanding (Inline Base64) ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Convert image to base64 (example with a hypothetical image)
  const imagePath = './examples/sample-data/sample-image.jpg';

  // Check if file exists, if not, provide example with dummy data
  let imageBase64;
  let mimeType = 'image/jpeg';

  if (fs.existsSync(imagePath)) {
    const imageBuffer = fs.readFileSync(imagePath);
    imageBase64 = imageBuffer.toString('base64');
  } else {
    console.log('Note: Using example structure (sample image not found)');
    // This is just showing the structure
    imageBase64 = 'your-base64-encoded-image-data-here';
  }

  const prompt = 'Describe this image in detail. What do you see?';

  const imageParts = [
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    },
  ];

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    console.log('AI Response:', result.response.text());
  } catch (error) {
    console.log('Example structure shown (image file needed for actual execution)');
    console.log('Image format: { inlineData: { data: base64String, mimeType: "image/jpeg" } }');
  }
}

/**
 * Example 2: Image understanding with File API
 */
async function imageUnderstandingWithFileAPI() {
  console.log('\n=== Example 2: Image Understanding (File API) ===\n');

  try {
    const imagePath = './examples/sample-data/sample-image.jpg';

    // Upload image using File API
    if (fs.existsSync(imagePath)) {
      const uploadResult = await fileManager.uploadFile(imagePath, {
        mimeType: 'image/jpeg',
        displayName: 'Sample Image',
      });

      console.log(`Uploaded file: ${uploadResult.file.displayName}`);
      console.log(`File URI: ${uploadResult.file.uri}`);

      // Use the uploaded file
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResult.file.mimeType,
            fileUri: uploadResult.file.uri,
          },
        },
        { text: 'What objects can you identify in this image? List them with confidence levels.' },
      ]);

      console.log('AI Response:', result.response.text());

      // Clean up - delete the file
      await fileManager.deleteFile(uploadResult.file.name);
      console.log('\nFile deleted from server');
    } else {
      console.log('Example structure:');
      console.log('1. Upload file: fileManager.uploadFile(path, { mimeType, displayName })');
      console.log('2. Use in prompt: { fileData: { mimeType, fileUri } }');
      console.log('3. Clean up: fileManager.deleteFile(fileName)');
    }
  } catch (error) {
    console.log('File API example structure shown');
    console.log('Error:', error.message);
  }
}

/**
 * Example 3: Multiple images comparison
 */
async function multipleImagesComparison() {
  console.log('\n=== Example 3: Multiple Images Comparison ===\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  console.log('Example: Comparing two product images');
  console.log('Structure for multiple images:');
  console.log(`
const result = await model.generateContent([
  { text: 'Compare these two images. What are the differences?' },
  {
    inlineData: {
      data: image1Base64,
      mimeType: 'image/jpeg',
    },
  },
  {
    inlineData: {
      data: image2Base64,
      mimeType: 'image/jpeg',
    },
  },
]);
  `);

  // Use case examples
  console.log('\nCommon use cases for multiple images:');
  console.log('- Product comparison (before/after)');
  console.log('- Medical imaging analysis');
  console.log('- Security/surveillance comparisons');
  console.log('- Quality control inspections');
}

/**
 * Example 4: Audio transcription and analysis
 */
async function audioTranscription() {
  console.log('\n=== Example 4: Audio Transcription and Analysis ===\n');

  console.log('Supported audio formats: WAV, MP3, AIFF, AAC, OGG, FLAC');

  try {
    const audioPath = './examples/sample-data/sample-audio.mp3';

    if (fs.existsSync(audioPath)) {
      // Upload audio file
      const uploadResult = await fileManager.uploadFile(audioPath, {
        mimeType: 'audio/mp3',
        displayName: 'Sample Audio',
      });

      console.log(`Uploaded audio: ${uploadResult.file.displayName}`);

      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      // Transcribe and analyze
      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResult.file.mimeType,
            fileUri: uploadResult.file.uri,
          },
        },
        {
          text: `Transcribe this audio and provide:
1. Full transcription
2. Summary of main points
3. Sentiment analysis
4. Key entities mentioned`,
        },
      ]);

      console.log('Analysis:', result.response.text());

      await fileManager.deleteFile(uploadResult.file.name);
    } else {
      console.log('Example structure for audio:');
      console.log(`
const audioFile = await fileManager.uploadFile('audio.mp3', {
  mimeType: 'audio/mp3'
});

const result = await model.generateContent([
  { fileData: { mimeType: 'audio/mp3', fileUri: audioFile.uri } },
  { text: 'Transcribe and summarize this audio' }
]);
      `);
    }
  } catch (error) {
    console.log('Audio processing example structure shown');
  }
}

/**
 * Example 5: Video understanding
 */
async function videoUnderstanding() {
  console.log('\n=== Example 5: Video Understanding ===\n');

  console.log('Supported video formats: MP4, MPEG, MOV, AVI, FLV, MPG, WEBM, WMV, 3GPP');

  try {
    const videoPath = './examples/sample-data/sample-video.mp4';

    if (fs.existsSync(videoPath)) {
      // Upload video file
      const uploadResult = await fileManager.uploadFile(videoPath, {
        mimeType: 'video/mp4',
        displayName: 'Sample Video',
      });

      console.log(`Uploaded video: ${uploadResult.file.displayName}`);
      console.log('Waiting for video processing...');

      // Wait for video to be processed
      let file = await fileManager.getFile(uploadResult.file.name);
      while (file.state === 'PROCESSING') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        file = await fileManager.getFile(uploadResult.file.name);
      }

      if (file.state === 'ACTIVE') {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const result = await model.generateContent([
          {
            fileData: {
              mimeType: file.mimeType,
              fileUri: file.uri,
            },
          },
          {
            text: `Analyze this video and provide:
1. Scene description
2. Actions happening
3. Objects present
4. Timeline of key events
5. Overall summary`,
          },
        ]);

        console.log('Video Analysis:', result.response.text());

        await fileManager.deleteFile(file.name);
      }
    } else {
      console.log('Example structure for video:');
      console.log(`
// Upload video
const videoFile = await fileManager.uploadFile('video.mp4', {
  mimeType: 'video/mp4'
});

// Wait for processing
let file = await fileManager.getFile(videoFile.file.name);
while (file.state === 'PROCESSING') {
  await new Promise(resolve => setTimeout(resolve, 2000));
  file = await fileManager.getFile(videoFile.file.name);
}

// Analyze when ready
const result = await model.generateContent([
  { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
  { text: 'Describe what happens in this video' }
]);
      `);
    }
  } catch (error) {
    console.log('Video processing example structure shown');
  }
}

/**
 * Example 6: PDF document understanding
 */
async function pdfUnderstanding() {
  console.log('\n=== Example 6: PDF Document Understanding ===\n');

  try {
    const pdfPath = './examples/sample-data/sample-document.pdf';

    if (fs.existsSync(pdfPath)) {
      // Upload PDF
      const uploadResult = await fileManager.uploadFile(pdfPath, {
        mimeType: 'application/pdf',
        displayName: 'Sample Document',
      });

      console.log(`Uploaded PDF: ${uploadResult.file.displayName}`);

      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResult.file.mimeType,
            fileUri: uploadResult.file.uri,
          },
        },
        {
          text: `Analyze this PDF document and provide:
1. Document type and purpose
2. Main sections and topics
3. Key findings or conclusions
4. Important data points or statistics
5. Summary in 3-5 bullet points`,
        },
      ]);

      console.log('Document Analysis:', result.response.text());

      await fileManager.deleteFile(uploadResult.file.name);
    } else {
      console.log('Example structure for PDF:');
      console.log(`
const pdfFile = await fileManager.uploadFile('document.pdf', {
  mimeType: 'application/pdf'
});

const result = await model.generateContent([
  { fileData: { mimeType: 'application/pdf', fileUri: pdfFile.uri } },
  { text: 'Summarize this document' }
]);
      `);
    }
  } catch (error) {
    console.log('PDF processing example structure shown');
  }
}

/**
 * Example 7: Mixed multimodal inputs
 */
async function mixedMultimodalInputs() {
  console.log('\n=== Example 7: Mixed Multimodal Inputs ===\n');

  console.log('Example: Combining text, image, and context');
  console.log(`
const result = await model.generateContent([
  { text: 'Product Review Analysis' },
  { text: 'Customer feedback: "The design is sleek but colors are off"' },
  {
    inlineData: {
      data: productImageBase64,
      mimeType: 'image/jpeg',
    },
  },
  {
    text: 'Based on the image and feedback, what color adjustments would you recommend?'
  },
]);
  `);

  console.log('\nUse cases:');
  console.log('- Medical diagnosis (symptoms + medical images)');
  console.log('- Product development (feedback + product photos)');
  console.log('- Real estate (description + property photos)');
  console.log('- Education (questions + diagrams)');
}

/**
 * Example 8: File management utilities
 */
async function fileManagementUtilities() {
  console.log('\n=== Example 8: File Management Utilities ===\n');

  try {
    // List all uploaded files
    console.log('Listing all uploaded files:');
    const listResult = await fileManager.listFiles();

    if (listResult.files && listResult.files.length > 0) {
      listResult.files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.displayName}`);
        console.log(`   URI: ${file.uri}`);
        console.log(`   Size: ${file.sizeBytes} bytes`);
        console.log(`   State: ${file.state}`);
        console.log(`   MIME: ${file.mimeType}\n`);
      });
    } else {
      console.log('No files currently uploaded');
    }

    // Example of getting file metadata
    console.log('\nFile API Methods:');
    console.log('- fileManager.uploadFile(path, options)');
    console.log('- fileManager.listFiles()');
    console.log('- fileManager.getFile(fileName)');
    console.log('- fileManager.deleteFile(fileName)');

  } catch (error) {
    console.log('File management example');
    console.log('Error:', error.message);
  }
}

/**
 * Example 9: Batch multimodal processing
 */
async function batchMultimodalProcessing() {
  console.log('\n=== Example 9: Batch Multimodal Processing ===\n');

  console.log('Example: Processing multiple images in batch');
  console.log(`
const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
const uploadedFiles = [];

// Upload all files
for (const imagePath of images) {
  const file = await fileManager.uploadFile(imagePath, {
    mimeType: 'image/jpeg'
  });
  uploadedFiles.push(file);
}

// Process each file
const results = await Promise.all(
  uploadedFiles.map(file =>
    model.generateContent([
      { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
      { text: 'Describe this image' }
    ])
  )
);

// Clean up
for (const file of uploadedFiles) {
  await fileManager.deleteFile(file.name);
}
  `);

  console.log('\nBest practices:');
  console.log('- Upload files in parallel for speed');
  console.log('- Process in batches to manage rate limits');
  console.log('- Always clean up files after use');
  console.log('- Monitor file state for video/large files');
}

// Run all examples
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Gemini API - Multimodal Inputs Examples                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await imageUnderstandingInline();
    await imageUnderstandingWithFileAPI();
    await multipleImagesComparison();
    await audioTranscription();
    await videoUnderstanding();
    await pdfUnderstanding();
    await mixedMultimodalInputs();
    await fileManagementUtilities();
    await batchMultimodalProcessing();

    console.log('\n\n✅ All multimodal examples completed!');
    console.log('\nNote: Some examples show structure only.');
    console.log('Create sample-data/ directory with media files to test fully.');
  } catch (error) {
    console.error('\n❌ Error running examples:', error.message);
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  imageUnderstandingInline,
  imageUnderstandingWithFileAPI,
  multipleImagesComparison,
  audioTranscription,
  videoUnderstanding,
  pdfUnderstanding,
  mixedMultimodalInputs,
  fileManagementUtilities,
  batchMultimodalProcessing,
};
