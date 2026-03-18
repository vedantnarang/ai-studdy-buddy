import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { 
  generateSummary, 
  generateFlashcards, 
  generateQuiz,
  // extractTextFromImage,
  // generateFlashcardsFromImage,
  // generateQuizFromImage 
} from './services/ai.service.js';

if (!process.env.OPENROUTER_API_KEY) {
  console.error('ERROR: OPENROUTER_API_KEY is not set in .env.local');
  process.exit(1);
}

const testText = `
Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy that, 
through cellular respiration, can later be released to fuel the organism's activities. 
This chemical energy is stored in carbohydrate molecules, such as sugars and starches, 
which are synthesized from carbon dioxide and water.
`;

async function runTests() {
  console.log('--- Starting AI Service Tests ---\n');

  try {
    console.log('Testing generateSummary...');
    const summary = await generateSummary(testText);
    console.log('Summary:', summary, '\n');

    console.log('Testing generateFlashcards...');
    const flashcards = await generateFlashcards(testText);
    console.log('Flashcards (first 2):', JSON.stringify(flashcards.slice(0, 2), null, 2), '\n');

    console.log('Testing generateQuiz...');
    const quiz = await generateQuiz(testText);
    console.log('Quiz (first question):', JSON.stringify(quiz[0], null, 2), '\n');

    console.log('--- All tests completed successfully! ---');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();
