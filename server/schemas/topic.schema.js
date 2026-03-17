import { z } from 'zod';

export const topicSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

export const notesSchema = z.object({
  notes: z.string(),
});
