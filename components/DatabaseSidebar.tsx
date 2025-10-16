import React, { useState, useEffect } from 'react';
import { QuestionBankService, Subject, Chapter, Lesson, QuestionType } from '../services/questionBankService';
import ChevronDownIcon from './icons/ChevronDownIcon';
import BookOpenIcon from './icons/BookOpenIcon';

interface DatabaseSidebarProps {
  onSelectQuestionType?: (questionTypeId: string, path: string) => void;
  onQuestionTypeSelect?: (questionTypeId: string, path: string) => void;
  activeQuestionTypePath?: string | null;
  activeQuestionTypeId?: string;
  onClose?: () => void;
}

interface HierarchyData {
  subjects: Array<Subject & {
    chapters: Array<Chapter & {
      lessons: Array<Lesson & {
        questionTypes: QuestionType[];
      }>;
    }>;
  }>;
}

const DatabaseSidebar: React.FC<DatabaseSidebarProps> = ({ 
  onSelectQuestionType, 
  onQuestionTypeSelect,
  activeQuestionTypePath,
  activeQuestionTypeId,
  onClose
}) => {
  const [hierarchyData, setHierarchyData] = useState<HierarchyData>({ subjects: [] });
  const [loading, setLoading] = useState(true);
  const [openSubjects, setOpenSubjects] = useState<string[]>([]);
  const [openChapters, setOpenChapters] = useState<string[]>([]);
  const [openLessons, setOpenLessons] = useState<string[]>([]);

  useEffect(() => {
    loadHierarchyData();
  }, []);

  const loadHierarchyData = async () => {
    try {
      setLoading(true);
      
      // Load subjects
      const subjects = await QuestionBankService.getSubjects();
      
      // Load full hierarchy for each subject
      const subjectsWithHierarchy = await Promise.all(
        subjects.map(async (subject) => {
          try {
            const chapters = await QuestionBankService.getChaptersBySubject(subject.id);
            
            const chaptersWithLessons = await Promise.all(
              chapters.map(async (chapter) => {
                try {
                  const lessons = await QuestionBankService.getLessonsByChapter(chapter.id);
                  
                  const lessonsWithTypes = await Promise.all(
                    lessons.map(async (lesson) => {
                      try {
                        const questionTypes = await QuestionBankService.getQuestionTypesByLesson(lesson.id);
                        return { ...lesson, questionTypes };
                      } catch (error) {
                        console.error(`Error loading question types for lesson ${lesson.name}:`, error);
                        return { ...lesson, questionTypes: [] };
                      }
                    })
                  );
                  
                  return { ...chapter, lessons: lessonsWithTypes };
                } catch (error) {
                  console.error(`Error loading lessons for chapter ${chapter.name}:`, error);
                  return { ...chapter, lessons: [] };
                }
              })
            );
            
            return { ...subject, chapters: chaptersWithLessons };
          } catch (error) {
            console.error(`Error loading chapters for subject ${subject.name}:`, error);
            return { ...subject, chapters: [] };
          }
        })
      );

      // Sort subjects: Toán 12 → Toán 11 → Toán 10
      const sortedSubjects = subjectsWithHierarchy.sort((a, b) => {
        const getGradeNumber = (name: string) => {
          const match = name.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        };
        
        const gradeA = getGradeNumber(a.name);
        const gradeB = getGradeNumber(b.name);
        
        // Sort in descending order (12, 11, 10)
        return gradeB - gradeA;
      });

      setHierarchyData({ subjects: sortedSubjects });
      
      // Auto-open first subject if available (should be Toán 12)
      if (sortedSubjects.length > 0) {
        setOpenSubjects([sortedSubjects[0].id]);
      }
    } catch (error) {
      console.error('Error loading hierarchy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setOpenSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const toggleChapter = (chapterKey: string) => {
    setOpenChapters(prev =>
      prev.includes(chapterKey)
        ? prev.filter(key => key !== chapterKey)
        : [...prev, chapterKey]
    );
  };

  const toggleLesson = (lessonKey: string) => {
    setOpenLessons(prev =>
      prev.includes(lessonKey)
        ? prev.filter(key => key !== lessonKey)
        : [...prev, lessonKey]
    );
  };

  const handleQuestionTypeClick = (questionType: QuestionType, subject: Subject, chapter: Chapter, lesson: Lesson) => {
    const path = `${subject.code}-${chapter.code}-${lesson.code}-${questionType.code}`;
    
    // Support both prop names for backward compatibility
    if (onSelectQuestionType) {
      onSelectQuestionType(questionType.id, path);
    } else if (onQuestionTypeSelect) {
      onQuestionTypeSelect(questionType.id, path);
    }
    
    // Close sidebar on mobile after selection
    if (onClose) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 p-4 h-full overflow-y-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[300px] bg-white border-r border-gray-200 p-0 h-full overflow-y-auto pt-4">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
          <BookOpenIcon className="w-5 h-5" />
          Ngân hàng câu hỏi
        </h2>
        <p className="text-sm text-indigo-600 mt-1">Ngân hàng Toán</p>
      </div>

      <div className="p-2 pt-0">
        {hierarchyData.subjects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📚</div>
            <p>Chưa có dữ liệu</p>
            <p className="text-xs">Hãy thêm môn học trong Admin Panel</p>
          </div>
        ) : (
          hierarchyData.subjects.map((subject) => (
            <div key={subject.id} className="mb-2">
              {/* Subject Level - Toán 12, Toán 11, Toán 10 in red */}
              <button
                onClick={() => toggleSubject(subject.id)}
                className="w-full flex items-center justify-between p-2 text-left hover:bg-red-50 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-700">{subject.name}</span>
                </div>
                <ChevronDownIcon 
                  className={`w-4 h-4 text-red-500 transition-transform ${
                    openSubjects.includes(subject.id) ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {/* Chapters - Chương 1, Chương 2, etc. in dark blue */}
              {openSubjects.includes(subject.id) && (
                <div className="ml-4 mt-1 space-y-1">
                  {subject.chapters.map((chapter) => {
                    const chapterKey = `${subject.id}-${chapter.id}`;
                    return (
                      <div key={chapter.id}>
                        {/* Chapter Level */}
                        <button
                          onClick={() => toggleChapter(chapterKey)}
                          className="w-full flex items-center justify-between p-2 text-left hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-700 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-800">{chapter.name}</span>
                          </div>
                          <ChevronDownIcon 
                            className={`w-3 h-3 text-blue-600 transition-transform ${
                              openChapters.includes(chapterKey) ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>

                        {/* Lessons - Bài 1, Bài 2, etc. in green */}
                        {openChapters.includes(chapterKey) && (
                          <div className="ml-4 mt-1 space-y-1">
                            {chapter.lessons.map((lesson) => {
                              const lessonKey = `${chapterKey}-${lesson.id}`;
                              return (
                                <div key={lesson.id}>
                                  {/* Lesson Level */}
                                  <button
                                    onClick={() => toggleLesson(lessonKey)}
                                    className="w-full flex items-center justify-between p-2 text-left hover:bg-green-50 rounded-md transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                                      <span className="text-sm text-green-700">{lesson.name}</span>
                                    </div>
                                    <ChevronDownIcon 
                                      className={`w-3 h-3 text-green-600 transition-transform ${
                                        openLessons.includes(lessonKey) ? 'rotate-180' : ''
                                      }`} 
                                    />
                                  </button>

                                  {/* Question Types - keep existing styling */}
                                  {openLessons.includes(lessonKey) && (
                                    <div className="ml-4 mt-1 space-y-1">
                                      {lesson.questionTypes.map((questionType) => {
                                        const path = `${subject.code}-${chapter.code}-${lesson.code}-${questionType.code}`;
                                        const isActive = activeQuestionTypePath === path;
                                        
                                        return (
                                          <button
                                            key={questionType.id}
                                            onClick={() => handleQuestionTypeClick(questionType, subject, chapter, lesson)}
                                            className={`w-full flex items-center gap-2 p-2 text-left rounded-md transition-colors ${
                                              isActive
                                                ? 'bg-indigo-100 text-indigo-900 border-l-2 border-indigo-500'
                                                : 'hover:bg-gray-50 text-gray-600'
                                            }`}
                                          >
                                            <div className={`w-1 h-1 rounded-full ${
                                              questionType.difficulty_level === 'easy' ? 'bg-blue-400' :
                                              questionType.difficulty_level === 'medium' ? 'bg-yellow-400' :
                                              'bg-red-400'
                                            }`}></div>
                                            <span className="text-xs">{questionType.name}</span>
                                            
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DatabaseSidebar;