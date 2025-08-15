import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          © {currentYear} Ngân Hàng Câu Hỏi Toán AI. Thầy Đồ.
        </p>
      </div>
    </footer>
  );
};

export default Footer;