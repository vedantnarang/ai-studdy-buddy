import { z } from 'zod';

export const FlashcardSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string().describe("A clear, specific question testing one concept"),
      answer: z.string().describe("A concise but complete answer"),
    })
  ),
});

export const QuizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe("A clear question testing understanding"),
      options: z
        .array(z.string())
        .length(4)
        .describe("Exactly 4 answer choices"),
      correctIndex: z
        .number()
        .min(0)
        .max(3)
        .describe("Index of the correct answer (0-3)"),
      explanation: z
        .string()
        .describe("Why the correct answer is right"),
    })
  ),
});
