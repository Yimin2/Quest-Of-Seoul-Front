import { apiRequest } from './base';
import { fromZodError } from 'zod-validation-error';
import {
  QuizResponseSchema,
  QuestQuizResponseSchema,
  QuizSubmitResponseSchema,
  type QuizResponse,
  type QuizItem,
  type QuestQuizResponse,
  type QuizSubmitRequest,
  type QuizSubmitResponse,
} from './schema';

export type {
  QuizResponse,
  QuizItem,
  QuestQuizResponse,
  QuizSubmitRequest,
  QuizSubmitResponse,
};

export const quizApi = {
  async getQuiz(landmark: string, language: string = 'en'): Promise<QuizResponse> {
    try {
      const data = await apiRequest<unknown>(
        `/docent/quiz?landmark=${encodeURIComponent(landmark)}&language=${language}`,
        {
          method: 'POST',
        },
      );

      const result = QuizResponseSchema.safeParse(data);

      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error('Quiz Validation Error:', validationError.toString());
        throw validationError;
      }

      return result.data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Unable to connect to server. Please check if the API server is running.');
      }
      throw error;
    }
  },

  async getMultipleQuizzes(
    landmark: string,
    count: number = 5,
    language: string = 'en',
  ): Promise<QuizItem[]> {
    try {
      const quizPromises = Array.from({ length: count }, () => this.getQuiz(landmark, language));

      const responses = await Promise.all(quizPromises);

      const quizItems: QuizItem[] = responses.map((response, index) => ({
        id: index + 1,
        place: landmark,
        question: response.question,
        choices: response.options,
        answer: response.options[response.correct_answer],
        description: response.explanation || '',
        hint: 'Think carefully about this question!',
      }));

      return quizItems;
    } catch (error) {
      throw error;
    }
  },

  async getQuestQuizzes(questId: number): Promise<QuestQuizResponse> {
    try {
      const data = await apiRequest<unknown>(`/quest/${questId}/quizzes`, {
        method: 'GET',
      });

      const result = QuestQuizResponseSchema.safeParse(data);

      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error('QuestQuizzes Validation Error:', validationError.toString());
        throw validationError;
      }

      return result.data;
    } catch (error) {
      throw error;
    }
  },

  async submitQuestQuiz(
    questId: number,
    quizId: number,
    answer: number,
    isLastQuiz: boolean = false,
  ): Promise<QuizSubmitResponse> {
    try {
      const data = await apiRequest<unknown>(
        `/quest/${questId}/quizzes/${quizId}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ answer, is_last_quiz: isLastQuiz }),
        },
      );

      const result = QuizSubmitResponseSchema.safeParse(data);

      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error('QuizSubmit Validation Error:', validationError.toString());
        throw validationError;
      }

      return result.data;
    } catch (error) {
      throw error;
    }
  },

  convertQuestQuizzesToItems(questQuizResponse: QuestQuizResponse): QuizItem[] {
    return questQuizResponse.quizzes.map((quiz) => ({
      id: quiz.id,
      place: questQuizResponse.quest.name,
      question: quiz.question,
      choices: quiz.options,
      answer:
        quiz.correct_answer !== undefined ? quiz.options[quiz.correct_answer] : quiz.options[0],
      description: '',
      hint: quiz.hint,
      difficulty: quiz.difficulty,
    }));
  },
};
