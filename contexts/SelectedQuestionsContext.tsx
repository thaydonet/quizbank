import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Question } from '../types';
import { QuestionBankService } from '../services/questionBankService';

interface SelectedQuestionsState {
    // Map of questionTypeId -> selected question IDs
    selections: { [questionTypeId: string]: string[] };
    // Cache for loaded questions by type
    questionsCache: { [questionTypeId: string]: Question[] };
    // Statistics
    counts: {
        all: number;
        mcq: number;
        msq: number;
        sa: number;
    };
}

interface SelectedQuestionsContextType {
    state: SelectedQuestionsState;

    // Selection management
    toggleQuestion: (questionTypeId: string, questionId: string) => void;
    selectAllInType: (questionTypeId: string, questions: Question[]) => void;
    deselectAllInType: (questionTypeId: string, questions: Question[]) => void;
    clearAllSelections: () => void;

    // Get selections
    getSelectionsForType: (questionTypeId: string) => string[];
    getTotalSelectedCount: () => number;
    getSelectedCounts: () => { all: number; mcq: number; msq: number; sa: number };
    getAllSelectedQuestions: () => Promise<Question[]>;

    // Cache management
    cacheQuestions: (questionTypeId: string, questions: Question[]) => void;
    getCachedQuestions: (questionTypeId: string) => Question[] | null;

    // Update counts synchronously
    updateCounts: () => void;
}

const SelectedQuestionsContext = createContext<SelectedQuestionsContextType | null>(null);

export const useSelectedQuestions = () => {
    const context = useContext(SelectedQuestionsContext);
    if (!context) {
        throw new Error('useSelectedQuestions must be used within SelectedQuestionsProvider');
    }
    return context;
};

export const SelectedQuestionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<SelectedQuestionsState>({
        selections: {},
        questionsCache: {},
        counts: { all: 0, mcq: 0, msq: 0, sa: 0 }
    });

    // Calculate counts synchronously from cached data
    const calculateCounts = useCallback((selections: { [questionTypeId: string]: string[] }, cache: { [questionTypeId: string]: Question[] }) => {
        let mcqCount = 0, msqCount = 0, saCount = 0;

        Object.entries(selections).forEach(([questionTypeId, selectedIds]) => {
            const cachedQuestions = cache[questionTypeId];
            if (cachedQuestions && selectedIds.length > 0) {
                const selectedQuestions = cachedQuestions.filter(q => selectedIds.includes(q.id));
                mcqCount += selectedQuestions.filter(q => q.type === 'mcq').length;
                msqCount += selectedQuestions.filter(q => q.type === 'msq').length;
                saCount += selectedQuestions.filter(q => q.type === 'sa').length;
            }
        });

        return {
            all: mcqCount + msqCount + saCount,
            mcq: mcqCount,
            msq: msqCount,
            sa: saCount
        };
    }, []);

    // Update counts synchronously
    const updateCounts = useCallback(() => {
        setState(prevState => {
            const newCounts = calculateCounts(prevState.selections, prevState.questionsCache);
            return {
                ...prevState,
                counts: newCounts
            };
        });
    }, [calculateCounts]);

    // Toggle question selection
    const toggleQuestion = useCallback((questionTypeId: string, questionId: string) => {
        setState(prevState => {
            const currentSelections = prevState.selections[questionTypeId] || [];
            const newSelections = currentSelections.includes(questionId)
                ? currentSelections.filter(id => id !== questionId)
                : [...currentSelections, questionId];

            const newSelectionsMap = {
                ...prevState.selections,
                [questionTypeId]: newSelections
            };

            const newCounts = calculateCounts(newSelectionsMap, prevState.questionsCache);

            return {
                ...prevState,
                selections: newSelectionsMap,
                counts: newCounts
            };
        });
    }, [calculateCounts]);

    // Select all questions in a type
    const selectAllInType = useCallback((questionTypeId: string, questions: Question[]) => {
        setState(prevState => {
            const currentSelections = prevState.selections[questionTypeId] || [];
            const questionIds = questions.map(q => q.id);

            // Add new selections that aren't already selected
            const newSelections = [...currentSelections];
            questionIds.forEach(id => {
                if (!newSelections.includes(id)) {
                    newSelections.push(id);
                }
            });

            const newSelectionsMap = {
                ...prevState.selections,
                [questionTypeId]: newSelections
            };

            const newCounts = calculateCounts(newSelectionsMap, prevState.questionsCache);

            return {
                ...prevState,
                selections: newSelectionsMap,
                counts: newCounts
            };
        });
    }, [calculateCounts]);

    // Deselect all questions in a type
    const deselectAllInType = useCallback((questionTypeId: string, questions: Question[]) => {
        setState(prevState => {
            const currentSelections = prevState.selections[questionTypeId] || [];
            const questionIds = questions.map(q => q.id);

            // Remove questions from current selections
            const newSelections = currentSelections.filter(id => !questionIds.includes(id));

            const newSelectionsMap = {
                ...prevState.selections,
                [questionTypeId]: newSelections
            };

            const newCounts = calculateCounts(newSelectionsMap, prevState.questionsCache);

            return {
                ...prevState,
                selections: newSelectionsMap,
                counts: newCounts
            };
        });
    }, [calculateCounts]);

    // Clear all selections
    const clearAllSelections = useCallback(() => {
        setState(prevState => ({
            ...prevState,
            selections: {},
            counts: { all: 0, mcq: 0, msq: 0, sa: 0 }
        }));
    }, []);

    // Cache questions for a type
    const cacheQuestions = useCallback((questionTypeId: string, questions: Question[]) => {
        setState(prevState => {
            const newCache = {
                ...prevState.questionsCache,
                [questionTypeId]: questions
            };

            // Recalculate counts with new cache
            const newCounts = calculateCounts(prevState.selections, newCache);

            return {
                ...prevState,
                questionsCache: newCache,
                counts: newCounts
            };
        });
    }, [calculateCounts]);

    // Get cached questions
    const getCachedQuestions = useCallback((questionTypeId: string): Question[] | null => {
        return state.questionsCache[questionTypeId] || null;
    }, [state.questionsCache]);

    // Get selections for a specific type
    const getSelectionsForType = useCallback((questionTypeId: string): string[] => {
        return state.selections[questionTypeId] || [];
    }, [state.selections]);

    // Get total selected count
    const getTotalSelectedCount = useCallback((): number => {
        return state.counts.all;
    }, [state.counts.all]);

    // Get selected counts by type
    const getSelectedCounts = useCallback(() => {
        return state.counts;
    }, [state.counts]);

    // Get all selected questions from all types
    const getAllSelectedQuestions = useCallback(async (): Promise<Question[]> => {
        const allSelectedQuestions: Question[] = [];

        for (const [questionTypeId, selectedIds] of Object.entries(state.selections)) {
            if (selectedIds.length === 0) continue;

            // Try to get from cache first
            let questions = state.questionsCache[questionTypeId];

            // If not in cache, fetch from service
            if (!questions) {
                try {
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
                    setState(prevState => ({
                        ...prevState,
                        questionsCache: {
                            ...prevState.questionsCache,
                            [questionTypeId]: questions!
                        }
                    }));
                } catch (error) {
                    console.error(`Error loading questions for type ${questionTypeId}:`, error);
                    continue;
                }
            }

            // Add selected questions
            const selectedQuestions = questions.filter(q => selectedIds.includes(q.id));
            allSelectedQuestions.push(...selectedQuestions);
        }

        return allSelectedQuestions;
    }, [state.selections, state.questionsCache]);

    const contextValue: SelectedQuestionsContextType = {
        state,
        toggleQuestion,
        selectAllInType,
        deselectAllInType,
        clearAllSelections,
        getSelectionsForType,
        getTotalSelectedCount,
        getSelectedCounts,
        getAllSelectedQuestions,
        cacheQuestions,
        getCachedQuestions,
        updateCounts
    };

    return (
        <SelectedQuestionsContext.Provider value={contextValue}>
            {children}
        </SelectedQuestionsContext.Provider>
    );
};