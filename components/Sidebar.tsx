import React, { useState, useEffect } from 'react';
import { MENU_DATA } from '../constants';
import type { Grade, Chapter, Lesson, QuestionType } from '../types';
import ChevronDownIcon from './icons/ChevronDownIcon';
import BookOpenIcon from './icons/BookOpenIcon';

interface SidebarProps {
  onSelectQuestionType: (path: string) => void;
  activeQuestionTypePath: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectQuestionType, activeQuestionTypePath }) => {
  // Load từ localStorage hoặc mặc định
  const [openGrades, setOpenGrades] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar-openGrades');
    return saved ? JSON.parse(saved) : [MENU_DATA[0].name];
  });
  const [openChapters, setOpenChapters] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar-openChapters');
    return saved ? JSON.parse(saved) : [];
  });
  const [openLessons, setOpenLessons] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar-openLessons');
    return saved ? JSON.parse(saved) : [];
  });

  // Lưu vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem('sidebar-openGrades', JSON.stringify(openGrades));
  }, [openGrades]);

  useEffect(() => {
    localStorage.setItem('sidebar-openChapters', JSON.stringify(openChapters));
  }, [openChapters]);

  useEffect(() => {
    localStorage.setItem('sidebar-openLessons', JSON.stringify(openLessons));
  }, [openLessons]);

  const toggleGrade = (gradeName: string) => {
    setOpenGrades(prev =>
      prev.includes(gradeName)
        ? prev.filter(g => g !== gradeName)
        : [...prev, gradeName]
    );
  };

  const toggleChapter = (chapterKey: string) => {
    setOpenChapters(prev =>
      prev.includes(chapterKey)
        ? prev.filter(c => c !== chapterKey)
        : [...prev, chapterKey]
    );
  };

  const toggleLesson = (lessonKey: string) => {
    setOpenLessons(prev =>
      prev.includes(lessonKey)
        ? prev.filter(l => l !== lessonKey)
        : [...prev, lessonKey]
    );
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 p-4 flex-shrink-0 overflow-y-auto max-h-screen">
      <nav className="space-y-3">
        {MENU_DATA.map((grade: Grade) => (
          <div key={grade.name}>
            {/* Grade Level - Màu đỏ */}
            <button
              onClick={() => toggleGrade(grade.name)}
              className="w-full flex items-center justify-between text-left px-4 py-3 text-lg font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              aria-expanded={openGrades.includes(grade.name)}
            >
              <span>{grade.name}</span>
              <ChevronDownIcon
                className={`w-5 h-5 text-red-500 transition-transform duration-300 ${
                  openGrades.includes(grade.name) ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {/* Chapters - Ngang cấp với Grade, màu xanh dương */}
            {openGrades.includes(grade.name) && (
              <div className="mt-2 space-y-2">
                {grade.chapters.map((chapter: Chapter) => {
                  const chapterKey = `${grade.name}-${chapter.name}`;
                  return (
                    <div key={chapterKey}>
                      <button
                        onClick={() => toggleChapter(chapterKey)}
                        className="w-full flex items-center justify-between text-left px-4 py-2.5 text-base font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        aria-expanded={openChapters.includes(chapterKey)}
                      >
                        <span>{chapter.name}</span>
                        <ChevronDownIcon
                          className={`w-4 h-4 text-blue-500 transition-transform duration-300 ${
                            openChapters.includes(chapterKey) ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      
                      {/* Lessons - Vào vị trí của Chapter cũ, màu xanh lá */}
                      {openChapters.includes(chapterKey) && (
                        <div className="mt-2 ml-4 space-y-2">
                          {chapter.lessons.map((lesson: Lesson) => {
                            const lessonKey = `${chapterKey}-${lesson.name}`;
                            return (
                              <div key={lessonKey}>
                                <button
                                  onClick={() => toggleLesson(lessonKey)}
                                  className="w-full flex items-center justify-between text-left px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                                  aria-expanded={openLessons.includes(lessonKey)}
                                >
                                  <span>{lesson.name}</span>
                                  <ChevronDownIcon
                                    className={`w-4 h-4 text-green-500 transition-transform duration-300 ${
                                      openLessons.includes(lessonKey) ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>
                                
                                {/* Question Types - Lớn hơn, màu tím */}
                                {openLessons.includes(lessonKey) && (
                                  <div className="mt-2 ml-4 space-y-2">
                                    {lesson.types.map((type: QuestionType) => (
                                      <a
                                        key={type.path}
                                        href="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          onSelectQuestionType(type.path);
                                        }}
                                        className={`flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-150 ${
                                          activeQuestionTypePath === type.path
                                            ? 'bg-purple-100 text-purple-700 font-semibold border-2 border-purple-400 shadow-sm'
                                            : 'text-purple-600 bg-purple-50 border border-purple-200 hover:bg-purple-100 hover:text-purple-700'
                                        }`}
                                      >
                                        <BookOpenIcon className="w-4 h-4 flex-shrink-0" />
                                        <span className="flex-1">{type.name}</span>
                                      </a>
                                    ))}
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
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;