import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, generateObject } from 'ai';
import { FlashcardSchema, QuizSchema } from '../schemas/ai.schemas.js';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const PRIMARY_MODEL = 'google/gemini-2.0-flash-001';
const FALLBACK_MODEL = 'anthropic/claude-3-haiku';

async function withFallback(aiCall) {
  try {
    return await aiCall(PRIMARY_MODEL);
  } catch (error) {
    console.warn(`Primary model (${PRIMARY_MODEL}) failed, trying fallback (${FALLBACK_MODEL})...`, error.message);
    try {
      return await aiCall(FALLBACK_MODEL);
    } catch (fallbackError) {
      console.error(`Both models failed:`, fallbackError.message);
      throw fallbackError;
    }
  }
}

export async function generateSummary(text) {
  return withFallback((model) => 
    generateText({
      model: openrouter(model),
      system: 'You are an educational assistant. Summarize the following study material concisely while retaining key information.',
      prompt: text,
    })
  ).then(res => res.text);
}

export async function generateFlashcards(text) {
  const result = await withFallback((model) => 
    generateObject({
      model: openrouter(model),
      schema: FlashcardSchema,
      system: 'Generate educational flashcards from the provided text. Focus on key terms, concepts, and definitions.',
      prompt: text,
    })
  );
  return result.object.flashcards;
}

export async function generateQuiz(text) {
  const result = await withFallback((model) => 
    generateObject({
      model: openrouter(model),
      schema: QuizSchema,
      system: 'Generate a multiple-choice quiz from the provided text. Each question must have 4 options and a clear explanation.',
      prompt: text,
    })
  );
  return result.object.quiz;
}

export async function extractTextFromImage(imageUrl) {
  return withFallback((model) => 
    generateText({
      model: openrouter(model),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all study-related text from this image. Return just the raw text.' },
            { type: 'image', image: imageUrl },
          ],
        },
      ],
    })
  ).then(res => res.text);
}

export async function generateFlashcardsFromImage(imageUrl) {
  const result = await withFallback((model) => 
    generateObject({
      model: openrouter(model),
      schema: FlashcardSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Generate flashcards based on the contents of this image.' },
            { type: 'image', image: imageUrl },
          ],
        },
      ],
    })
  );
  return result.object.flashcards;
}

export async function generateQuizFromImage(imageUrl) {
  const result = await withFallback((model) => 
    generateObject({
      model: openrouter(model),
      schema: QuizSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Generate a multiple-choice quiz based on the contents of this image.' },
            { type: 'image', image: imageUrl },
          ],
        },
      ],
    })
  );
  return result.object.quiz;
}
