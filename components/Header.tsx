import React from 'react';
import { Link } from 'react-router-dom';
import SparklesIcon from './icons/SparklesIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/quiz-bank" className="text-2xl font-bold text-indigo-600">
              Math Quiz <span className="text-gray-800">Bank AI</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;