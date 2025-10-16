import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Question } from '../types';
import { QuestionBankService } from '../services/questionBankService';

interface QuestionTypeSelections {
  [questionTypeId: string]: string[];
}

interface SelectedQuestionsState {
  // Current question type
  activeQuestionTypeId: string;
  activeQuestionTypePath: string;

  // Selected questions for current type
  selectedQuestionIds: string[];

  // Selections for all question types (persisted when switching)
  questionTypeSelections: QuestionTypeSelections;

  // Cached questions data
  questionsCache: { [questionTypeId: string]: Question[] };

  // Actions
  setActiveQuestionType: (id: string, path: string) => void;
  toggleQuestionSelection: (questionId: string) => void;
  selectAllQuestions: (questionIds: string[]) => void;
  deselectAllQuestions: (questionIds: string[]) => void;
  clearAllSelections: () => void;

  // Advanced selection methods
  selectQuestionsByType: (type: 'mcq' | 'msq' | 'sa', questionIds: string[]) => void;
  selectQuestionsByDifficulty: (difficulty: string, questionIds: string[]) => void;

  // Cache management
  setCachedQuestions: (questionTypeId: string, questions: Question[]) => void;
  getCachedQuestions: (questionTypeId: string) => Question[] | null;
  clearCache: () => void;

  // Computed getters
  getTotalSelectedCount: () => number;
  getSelectedCountsByType: () => Promise<{ all: number; mcq: number; msq: number; sa: number }>;
  getAllSelectedQuestions: () => Promise<Question[]>;
  getSelectedQuestionsForCurrentType: () => Question[];
}

export const useSelectedQuestionsStore = create<SelectedQuestionsState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeQuestionTypeId: '',
      activeQuestionTypePath: '',
      selectedQuestionIds: [],
      questionTypeSelections: {},
      questionsCache: {},

      // Set active question type and restore selections
      setActiveQuestionType: (id: string, path: string) => {
        const state = get();

        // Save current selections before switching
        if (state.activeQuestionTypeId && state.selectedQuestionIds.length > 0) {
          set({
            questionTypeSelections: {
              ...state.questionTypeSelections,
              [state.activeQuestionTypeId]: state.selectedQuestionIds
            }
          });
        }

        // Switch to new question type and restore previous selections
        const previousSelections = state.questionTypeSelections[id] || [];
        set({
          activeQuestionTypeId: id,
          activeQuestionTypePath: path,
          selectedQuestionIds: previousSelections
        });
      },

      // Toggle single question selection
      toggleQuestionSelection: (questionId: string) => {
        set((state) => ({
          selectedQuestionIds: state.selectedQuestionIds.includes(questionId)
            ? state.selectedQuestionIds.filter(id => id !== questionId)
            : [...state.selectedQuestionIds, questionId]
        }));
      },

      // Select all provided questions
      selectAllQuestions: (questionIds: string[]) => {
        set((state) => {
          const newSelections = [...state.selectedQuestionIds];
          questionIds.forEach(id => {
            if (!newSelections.includes(id)) {
              newSelections.push(id);
            }
          });
          return { selectedQuestionIds: newSelections };
        });
      },

      // Deselect all provided questions
      deselectAllQuestions: (questionIds: string[]) => {
        set((state) => ({
          selectedQuestionIds: state.selectedQuestionIds.filter(id => !questionIds.includes(id))
        }));
      },

      // Clear all selections
      clearAllSelections: () => {
        set({
          selectedQuestionIds: [],
          questionTypeSelections: {}
        });
      },

      // Select questions by type
      selectQuestionsByType: (type: 'mcq' | 'msq' | 'sa', questionIds: string[]) => {
        const state = get();
        const cachedQuestions = state.questionsCache[state.activeQuestionTypeId] || [];
        const questionsOfType = cachedQuestions
          .filter(q => q.type === type)
          .map(q => q.id)
          .filter(id => questionIds.includes(id));

        get().selectAllQuestions(questionsOfType);
      },

      // Select questions by difficulty
      selectQuestionsByDifficulty: (difficulty: string, questionIds: string[]) => {
        const state = get();
        const cachedQuestions = state.questionsCache[state.activeQuestionTypeId] || [];
        const questionsOfDifficulty = cachedQuestions
          .filter(q => q.difficulty === difficulty)
          .map(q => q.id)
          .filter(id => questionIds.includes(id));

        get().selectAllQuestions(questionsOfDifficulty);
      },

      // Cache management
      setCachedQuestions: (questionTypeId: string, questions: Question[]) => {
        set((state) => ({
          questionsCache: {
            ...state.questionsCache,
            [questionTypeId]: questions
          }
        }));
      },

      getCachedQuestions: (questionTypeId: string) => {
        return get().questionsCache[questionTypeId] || null;
      },

      clearCache: () => {
        set({ questionsCache: {} });
      },

      // Get total selected count across all question types
      getTotalSelectedCount: () => {
        const state = get();
        const currentSelections = state.selectedQuestionIds.length;
        const savedSelections = Object.values(state.questionTypeSelections)
          .reduce((total, selections) => total + selections.length, 0);
        return currentSelections + savedSelections;
      },

      // Get selected counts by question type
      getSelectedCountsByType: async () => {
        const state = get();
        let mcqCount = 0, msqCount = 0, saCount = 0;

        // Count from current question type
        const currentQuestions = state.questionsCache[state.activeQuestionTypeId] || [];
        const currentSelected = currentQuestions.filter(q => state.selectedQuestionIds.includes(q.id));
        mcqCount += currentSelected.filter(q => q.type === 'mcq').length;
        msqCount += currentSelected.filter(q => q.type === 'msq').length;
        saCount += currentSelected.filter(q => q.type === 'sa').length;

        // Count from other question types
        for (const [questionTypeId, selections] of Object.entries(state.questionTypeSelections)) {
          if (questionTypeId !== state.activeQuestionTypeId && selections.length > 0) {
            try {
              let questions = state.questionsCache[questionTypeId];
              if (!questions) {
                const dbQuestions = await QuestionBankService.getQuestionsByType(questionTypeId, { approvedOnly: true });
                questions = dbQuestions.map(dbQ => ({
                  id: dbQ.id,
                  type: dbQ.type,
                  question: dbQ.question_text,
                  option_a: dbQ.option_a || '',
                  option_b: dbQ.option_b || '',
                  option_c: dbQ.option_c || '',
                  option_d: dbQ.option_d || '',
                  correct_option: dbQ.correct_option,
                  explanation: dbQ.explanation,
                  difficulty: dbQ.difficulty_level,
                  tags: dbQ.tags || [],
                  isDynamic: dbQ.is_dynamic || false
                }));
                // Cache the questions
                get().setCachedQuestions(questionTypeId, questions);
              }

              const selectedFromType = questions.filter(q => selections.includes(q.id));
              mcqCount += selectedFromType.filter(q => q.type === 'mcq').length;
              msqCount += selectedFromType.filter(q => q.type === 'msq').length;
              saCount += selectedFromType.filter(q => q.type === 'sa').length;
            } catch (error) {
              console.error(`Error loading questions for type ${questionTypeId}:`, error);
            }
          }
        }

        return {
          all: mcqCount + msqCount + saCount,
          mcq: mcqCount,
          msq: msqCount,
          sa: saCount
        };
      },

      // Get all selected questions from all question types
      getAllSelectedQuestions: async (): Promise<Question[]> => {
        const state = get();
        const allSelectedQuestions: Question[] = [];

        // Add current question type selections
        const currentQuestions = state.questionsCache[state.activeQuestionTypeId] || [];
        const currentSelections = currentQuestions.filter(q => state.selectedQuestionIds.includes(q.id));
        allSelectedQuestions.push(...currentSelections);

        // Add selections from other question types
        for (const [questionTypeId, selections] of Object.entries(state.questionTypeSelections)) {
          if (questionTypeId !== state.activeQuestionTypeId && selections.length > 0) {
            try {
              let questions = state.questionsCache[questionTypeId];
              if (!questions) {
                const dbQuestions = await QuestionBankService.getQuestionsByType(questionTypeId, { approvedOnly: true });
                questions = dbQuestions.map(dbQ => ({
                  id: dbQ.id,
                  type: dbQ.type,
                  question: dbQ.question_text,
                  option_a: dbQ.option_a || '',
                  option_b: dbQ.option_b || '',
                  option_c: dbQ.option_c || '',
                  option_d: dbQ.option_d || '',
                  correct_option: dbQ.correct_option,
                  explanation: dbQ.explanation,
                  difficulty: dbQ.difficulty_level,
                  tags: dbQ.tags || [],
                  isDynamic: dbQ.is_dynamic || false
                }));
                // Cache the questions
                get().setCachedQuestions(questionTypeId, questions);
              }

              const selectedFromType = questions.filter(q => selections.includes(q.id));
              allSelectedQuestions.push(...selectedFromType);
            } catch (error) {
              console.error(`Error loading questions for type ${questionTypeId}:`, error);
            }
          }
        }

        return allSelectedQuestions;
      },

      // Get selected questions for current question type only
      getSelectedQuestionsForCurrentType: () => {
        const state = get();
        const currentQuestions = state.questionsCache[state.activeQuestionTypeId] || [];
        return currentQuestions.filter(q => state.selectedQuestionIds.includes(q.id));
      }
    }),
    {
      name: 'selected-questions-store',
      partialize: (state) => ({
        questionTypeSelections: state.questionTypeSelections,
        // Don't persist cache to avoid stale data
      })
    }
  )
);

// Selector hooks for better performance
export const useActiveQuestionType = () => useSelectedQuestionsStore(state => ({
  id: state.activeQuestionTypeId,
  path: state.activeQuestionTypePath
}));

export const useSelectedQuestionIds = () => useSelectedQuestionsStore(state => state.selectedQuestionIds);

export const useTotalSelectedCount = () => useSelectedQuestionsStore(state => state.getTotalSelectedCount());

export const useQuestionSelectionActions = () => useSelectedQuestionsStore(state => ({
  setActiveQuestionType: state.setActiveQuestionType,
  toggleQuestionSelection: state.toggleQuestionSelection,
  selectAllQuestions: state.selectAllQuestions,
  deselectAllQuestions: state.deselectAllQuestions,
  clearAllSelections: state.clearAllSelections,
  selectQuestionsByType: state.selectQuestionsByType,
  selectQuestionsByDifficulty: state.selectQuestionsByDifficulty
}));