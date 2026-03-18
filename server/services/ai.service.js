import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, generateObject } from 'ai';
import { FlashcardSchema, QuizSchema } from '../schemas/ai.schemas.js';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Primary: Gemma 3 is great but often rate-limited or fails with structured JSON
const PRIMARY_MODEL = process.env.OPENROUTER_PRIMARY_MODEL || 'google/gemma-3-27b-it:free';
// Fallback: Mistral Small 3.1 24B — excellent at structured JSON and less congested on free tier
const FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL || 'mistralai/mistral-small-3.1-24b-instruct:free';

function getModel(useFallback = false) {
  const modelId = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;
  return openrouter(modelId);
}

/**
 * Robust fallback helper that retries on ANY failure with the secondary model.
 */
async function withFallback(aiCall) {
  try {
    return await aiCall(getModel(false));
  } catch (error) {
    console.warn(`Attempt with ${PRIMARY_MODEL} failed, trying fallback (${FALLBACK_MODEL})...`, error.message);
    try {
      return await aiCall(getModel(true));
    } catch (fallbackError) {
      console.error(`Both models failed:`, fallbackError.message);
      throw fallbackError;
    }
  }
}

// --- Text-based generation ---

export async function generateSummary(notes) {
  const { text } = await withFallback((model) => 
    generateText({
      model,
      prompt: `You are an expert tutor. Summarize the following study notes in a clear, structured format with key concepts highlighted. Highlight important terms in bold.\n\nNotes:\n${notes}`,
    })
  );
  return text;
}

export async function generateFlashcards(notes, count = 10) {
  const { object } = await withFallback((model) => 
    generateObject({
      model,
      schema: FlashcardSchema,
      prompt: `You are an expert tutor. Generate exactly ${count} flashcards from these study notes. Return your response as a JSON object matching this schema. Each flashcard should test one specific concept.\n\nNotes:\n${notes}`,
    })
  );
  return object.flashcards;
}

export async function generateQuiz(notes, count = 5) {
  const { object } = await withFallback((model) => 
    generateObject({
      model,
      schema: QuizSchema,
      prompt: `You are an expert tutor. Generate exactly ${count} multiple-choice questions from these study notes. Return your response as a JSON object matching this schema. Make the wrong options plausible but clearly incorrect to someone who studied the material.\n\nNotes:\n${notes}`,
    })
  );
  return object.questions;
}

// --- Image-based generation ---

export async function extractTextFromImage(imageBuffer, mimeType) {
  const { text } = await withFallback((model) => 
    generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a precise text extraction assistant. Look at this image and:
1. Extract ALL text content you can see, including handwritten text.
2. Organize it logically (preserve headings, bullet points, numbered lists).
3. If you see a diagram or chart, describe what it shows in clear text.
4. If handwriting is unclear, make your best guess and put uncertain words in [brackets].

Respond with ONLY the extracted and organized text. No commentary.`,
            },
            { type: 'image', image: imageBuffer, mimeType },
          ],
        },
      ],
    })
  );
  return text;
}

export async function extractTextFromImageUrl(imageUrl) {
  const { text } = await withFallback((model) => 
    generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all text from this image. Organize logically.' },
            { type: 'image', image: new URL(imageUrl) },
          ],
        },
      ],
    })
  );
  return text;
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
