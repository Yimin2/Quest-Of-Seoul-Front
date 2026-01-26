import { z } from 'zod';

export const QuizResponseSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correct_answer: z.number(),
  explanation: z.string().optional(),
});

export type QuizResponse = z.infer<typeof QuizResponseSchema>;

export const QuizItemSchema = z.object({
  id: z.number(),
  place: z.string(),
  question: z.string(),
  choices: z.array(z.string()),
  answer: z.string(),
  description: z.string(),
  hint: z.string(),
  difficulty: z.string().optional(),
});

export type QuizItem = z.infer<typeof QuizItemSchema>;

export const QuestQuizResponseSchema = z.object({
  quest: z.object({
    id: z.number(),
    name: z.string(),
    reward_point: z.number(),
  }),
  quizzes: z.array(
    z.object({
      id: z.number(),
      question: z.string(),
      options: z.array(z.string()),
      hint: z.string(),
      difficulty: z.string(),
      correct_answer: z.number().optional(),
    })
  ),
  count: z.number(),
});

export type QuestQuizResponse = z.infer<typeof QuestQuizResponseSchema>;

export const QuizSubmitRequestSchema = z.object({
  answer: z.number(),
  is_last_quiz: z.boolean().optional(),
});

export type QuizSubmitRequest = z.infer<typeof QuizSubmitRequestSchema>;

export const QuizSubmitResponseSchema = z.object({
  success: z.boolean(),
  is_correct: z.boolean(),
  earned: z.number(),
  total_score: z.number(),
  retry_allowed: z.boolean(),
  hint: z.string().optional(),
  completed: z.boolean(),
  points_awarded: z.number(),
  already_completed: z.boolean(),
  new_balance: z.number().optional(),
  explanation: z.string().optional(),
});

export type QuizSubmitResponse = z.infer<typeof QuizSubmitResponseSchema>;
