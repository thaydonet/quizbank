
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
      <nav className="space-y-4">
        {MENU_DATA.map((grade: Grade) => (
          <div key={grade.name}>
            <button
              onClick={() => toggleGrade(grade.name)}
              className="w-full flex items-center justify-between text-left px-3 py-2 text-lg font-bold text-gray-700 rounded-md hover:bg-gray-100"
            >
              {grade.name}
              <ChevronDownIcon
                className={`w-5 h-5 transition-transform ${
                  openGrades.includes(grade.name) ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openGrades.includes(grade.name) && (
              <ul className="mt-2 space-y-1 pl-4 border-l-2 border-blue-200 ml-3">
                {grade.lessons.map((lesson: Lesson) => (
                  <li key={lesson.path}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectLesson(lesson.path);
                      }}
                      className={`flex items-center gap-3 w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        activeLessonPath === lesson.path
                          ? 'bg-blue-100 text-blue-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <BookOpenIcon className="w-4 h-4 flex-shrink-0" />
                      <span>{lesson.name}</span>
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
