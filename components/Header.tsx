
import React from 'react';
import { Link } from 'react-router-dom';
import SparklesIcon from './icons/SparklesIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              Math<span className="text-gray-700">Bank AI</span>
            </Link>
          </div>
          <div className="flex items-center">
            <Link
              to="/create"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
            >
              <SparklesIcon className="w-5 h-5" />
              Tạo câu hỏi AI
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
