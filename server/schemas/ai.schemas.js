import { z } from 'zod';

export const FlashcardSchema = z.object({
  flashcards: z.array(z.object({
    front: z.string().min(1, 'Front text is required'),
    back: z.string().min(1, 'Back text is required')
  }))
});

export const QuizSchema = z.object({
  quiz: z.array(z.object({
    question: z.string().min(1, 'Question is required'),
    options: z.array(z.string()).length(4, 'Quizzes must have exactly 4 options'),
    answer: z.string().min(1, 'Correct answer is required'),
    explanation: z.string().min(1, 'Explanation is required')
  }))
});
