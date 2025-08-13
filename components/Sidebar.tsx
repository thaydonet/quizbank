import React, { useState } from 'react';
import { MENU_DATA } from '../constants';
import type { Grade, Lesson } from '../types';
import ChevronDownIcon from './icons/ChevronDownIcon';
import BookOpenIcon from './icons/BookOpenIcon';

interface SidebarProps {
  onSelectLesson: (path: string) => void;
  activeLessonPath: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectLesson, activeLessonPath }) => {
  const [openGrades, setOpenGrades] = useState<string[]>([MENU_DATA[0].name]);

  const toggleGrade = (gradeName: string) => {
    setOpenGrades(prev =>
      prev.includes(gradeName)
        ? prev.filter(g => g !== gradeName)
        : [...prev, gradeName]
    );
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-200 p-4 flex-shrink-0">
      <nav className="space-y-2">
        {MENU_DATA.map((grade: Grade) => (
          <div key={grade.name}>
            <button
              onClick={() => toggleGrade(grade.name)}
              className="w-full flex items-center justify-between text-left px-3 py-2 text-base font-bold text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              aria-expanded={openGrades.includes(grade.name)}
            >
              <span>{grade.name}</span>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                  openGrades.includes(grade.name) ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openGrades.includes(grade.name) && (
              <ul className="mt-1 space-y-1 pl-4 border-l-2 border-indigo-200 ml-3">
                {grade.lessons.map((lesson: Lesson) => (
                  <li key={lesson.path}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectLesson(lesson.path);
                      }}
                      className={`flex items-center gap-3 w-full text-left pl-3 pr-2 py-2 text-sm rounded-md transition-all duration-150 ${
                        activeLessonPath === lesson.path
                          ? 'bg-indigo-50 text-indigo-700 font-semibold border-r-4 border-indigo-500'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <BookOpenIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{lesson.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;