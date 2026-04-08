import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, generateObject } from 'ai';
import { FlashcardSchema, QuizSchema } from '../schemas/ai.schemas.js';
import { buildFlashcardPrompt, buildQuizPrompt, buildSummaryPrompt } from './prompts.js';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Primary: Gemma 3 is great but often rate-limited or fails with structured JSON
const PRIMARY_MODEL = process.env.OPENROUTER_PRIMARY_MODEL || 'google/gemma-3-12b-it:free';
// Fallback: openrouter/auto — automatically picks from available free models
const FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL || 'openrouter/auto';

const VISION_MODELS = [
  'google/gemma-3-12b-it:free',
  'google/gemini-2.5-flash',
  'meta-llama/llama-3.2-11b-vision-instruct:free',
];

function getModel(useFallback = false) {
  const modelId = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;
  return openrouter(modelId);
}


async function withFallback(aiCall) {
  try {
    return await aiCall(getModel(false));
  } catch (error) {
    console.warn(`Attempt with ${PRIMARY_MODEL} failed, trying fallback (${FALLBACK_MODEL}) in 1s...`, error.message);
    
    // Add 1s delay to help 'clear' temporary rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      return await aiCall(getModel(true));
    } catch (fallbackError) {
      console.error(`Both models failed:`, fallbackError.message);
      throw fallbackError;
    }
  }
}

async function withVisionFallback(fn) {
  let lastError;
  
  for (const modelId of VISION_MODELS) {
    try {
      return await fn(modelId);
    } catch (error) {
      console.warn(`Vision model ${modelId} failed with ${error.statusCode || error.status || 'Error'}: ${error.message}, trying next...`);
      lastError = error;
      continue;
    }
  }
  
  throw new Error(`All vision models are currently unavailable.`);
}


export async function generateSummary(notes, imageUrls = []) {
  const hasImages = imageUrls.length > 0;

  if (hasImages) {
    return withVisionFallback(async (modelId) => {
      const { text } = await generateText({
        model: openrouter(modelId),
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: buildSummaryPrompt(notes, imageUrls.length) },
            ...imageUrls.map(url => ({ type: 'image', image: new URL(url) })) 
          ]
        }]
      });
      return text;
    });
  }


  const { text } = await withFallback((model) => 
    generateText({
      model,
      prompt: buildSummaryPrompt(notes, 0),
    })
  );
  return text;
}

export async function generateFlashcards(notes, imageUrls = [], count = 10) {
  const hasImages = imageUrls.length > 0;

  if (hasImages) {
    return withVisionFallback(async (modelId) => {
      const { object } = await generateObject({
        model: openrouter(modelId),
        schema: FlashcardSchema,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: buildFlashcardPrompt(notes, imageUrls.length) },
            ...imageUrls.map(url => ({ type: 'image', image: new URL(url) }))
          ]
        }]
      });
      return object.flashcards;
    });
  }

  // text-only path
  const { object } = await withFallback((model) => 
    generateObject({
      model,
      schema: FlashcardSchema,
      prompt: buildFlashcardPrompt(notes, 0) + `\n\nGenerate exactly ${count} flashcards.`,
    })
  );
  return object.flashcards;
}

export async function generateQuiz(notes, imageUrls = [], count = 10) {
  const hasImages = imageUrls.length > 0;

  if (hasImages) {
    return withVisionFallback(async (modelId) => {
      const { object } = await generateObject({
        model: openrouter(modelId),
        schema: QuizSchema,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: buildQuizPrompt(notes, imageUrls.length) },
            ...imageUrls.map(url => ({ type: 'image', image: new URL(url) }))
          ]
        }]
      });
      return object.questions;
    });
  }

  // text-only path
  const { object } = await withFallback((model) => 
    generateObject({
      model,
      schema: QuizSchema,
      prompt: buildQuizPrompt(notes, 0) + `\n\nGenerate exactly ${count} questions.`,
    })
  );
  return object.questions;
}

// --- Image-based generation ---

export async function extractTextFromImage(buffer, mimeType) {
  const prompt = `You are an expert tutor. Analyze this uploaded image and extract the meaningful educational information. Transcribe any text/handwriting accurately. If it is a diagram or chart, explain what it represents. If it contains math, write out the equations cleanly. Format your response in Markdown.`;

  const { text } = await generateText({
    model: openrouter('google/gemini-2.5-flash'),
    maxTokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image', image: buffer, mimeType },
        ],
      },
    ],
  });
  return text;
}

export async function extractTextFromImageUrl(imageUrl) {
  return await withVisionFallback(async (modelId) => {
    const { text } = await generateText({
      model: openrouter(modelId),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract and return all the readable text from this image. Do not include any conversational filler, markdown formatting blocks, or explanations. Just output the raw extracted text as accurately as possible.' },
            { type: 'image', image: new URL(imageUrl) }
          ]
        }
      ],
      maxTokens: 1500,
    });
    return text.trim();
  });
}

export async function generateFlashcardsFromImage(imageBuffer, mimeType, count = 10) {
  const { object } = await withFallback((model) => 
    generateObject({
      model,
      schema: FlashcardSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert tutor. Look at this image of study material and generate exactly ${count} flashcards as a JSON object matching this schema. Each flashcard should test one specific concept from the image.`,
            },
            { type: 'image', image: imageBuffer, mimeType },
          ],
        },
      ],
    })
  );
  return object.flashcards;
}

export async function generateQuizFromImage(imageBuffer, mimeType, count = 5) {
  const { object } = await withFallback((model) => 
    generateObject({
      model,
      schema: QuizSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Look at this image of study material and generate exactly ${count} multiple-choice questions as a JSON object matching this schema.`,
            },
            { type: 'image', image: imageBuffer, mimeType },
          ],
        },
      ],
    })
  );
  return object.questions;
}

/**
 * Generate a step-by-step diagram explanation for an image stored at a public URL.
 *
 * @param {string} imageUrl       - Publicly accessible URL of the diagram (e.g. Cloudinary).
 * @param {string} combinedContext - All topic notes / extracted texts joined together.
 * @param {string} customPrompt   - Optional student question / extra context.
 * @returns {Promise<string>}      Markdown-formatted explanation.
 */
export async function generateDiagramExplanation(imageUrl, combinedContext = '', customPrompt = '') {
  const contextSection = combinedContext.trim()
    ? `\n\nUse the following class notes for additional context:\n"""\n${combinedContext.trim()}\n"""`
    : '';

  const questionSection = customPrompt.trim()
    ? `\n\nAlso specifically address the student's request: "${customPrompt.trim()}"`
    : '';

  const prompt =
    `You are an expert tutor. Explain the attached diagram step-by-step so a student can fully understand it.${contextSection}${questionSection}\n\nFormat your response in Markdown. Use headings, bullet points, and LaTeX math (wrapped in $...$ or $$...$$) where appropriate.`;

  return withVisionFallback(async (modelId) => {
    const { text } = await generateText({
      model: openrouter(modelId),
      maxTokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: new URL(imageUrl) },
          ],
        },
      ],
    });
    return text.trim();
  });
}
