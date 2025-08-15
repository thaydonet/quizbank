import React from 'react';
import { Link } from 'react-router-dom';
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          © {currentYear} Ngân Hàng Câu Hỏi Toán AI. Thầy Đồ - <Link to="/" className="text-2xl font-bold text-indigo-300">Home</Link>.
        </p>
      </div>
    </footer>
  );
};

export default Footer;