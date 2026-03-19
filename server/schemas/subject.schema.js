import { z } from 'zod';

export const subjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#([0-9A-Fa-f]{6})$/, 'Color must be a valid hex code (e.g. #6366f1)').optional().default('#6366f1'),
});
