import { apiRequest } from './base';

export interface QuizResponse {
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export interface QuizItem {
  id: number;
  place: string;
  question: string;
  choices: string[];
  answer: string;
  description: string;
  hint: string;
  difficulty?: string;
}

export interface QuestQuizResponse {
  quest: {
    id: number;
    name: string;
    reward_point: number;
  };
  quizzes: {
    id: number;
    question: string;
    options: string[];
    hint: string;
    difficulty: string;
    correct_answer?: number;
  }[];
  count: number;
}

export interface QuizSubmitRequest {
  answer: number;
  is_last_quiz?: boolean;
}

export interface QuizSubmitResponse {
  success: boolean;
  is_correct: boolean;
  earned: number;
  total_score: number;
  retry_allowed: boolean;
  hint?: string;
  completed: boolean;
  points_awarded: number;
  already_completed: boolean;
  new_balance?: number;
  explanation?: string;
}

export const quizApi = {
  async getQuiz(landmark: string, language: string = 'en'): Promise<QuizResponse> {
    try {
      const data: QuizResponse = await apiRequest<QuizResponse>(
        `/docent/quiz?landmark=${encodeURIComponent(landmark)}&language=${language}`,
        {
          method: 'POST',
        },
      );
      return data;
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
      const data: QuestQuizResponse = await apiRequest<QuestQuizResponse>(
        `/quest/${questId}/quizzes`,
        {
          method: 'GET',
        },
      );
      return data;
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
      const data: QuizSubmitResponse = await apiRequest<QuizSubmitResponse>(
        `/quest/${questId}/quizzes/${quizId}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ answer, is_last_quiz: isLastQuiz }),
        },
      );
      return data;
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
