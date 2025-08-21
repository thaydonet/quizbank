import React, { Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import QuizBankPage from './pages/QuizBankPage';
import AIGeneratorPage from './pages/AIGeneratorPage';
import OnlineExamLandingPage from './pages/OnlineExamLandingPage';
import OnlineExamPage from './pages/OnlineExamPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div></div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quiz-bank" element={
            <div className="flex flex-col min-h-screen bg-gray-50">
              <Header />
              <main className="flex-grow">
                <QuizBankPage />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/create" element={
            <div className="flex flex-col min-h-screen bg-gray-50">
              <Header />
              <main className="flex-grow">
                <AIGeneratorPage />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/online-exam" element={<OnlineExamLandingPage />} />
          <Route path="/exam" element={<OnlineExamPage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;