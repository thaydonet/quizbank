import React, { Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import QuizBankPage from './pages/QuizBankPage';
import AIGeneratorPage from './pages/AIGeneratorPage';
import OnlineExamLandingPage from './pages/OnlineExamLandingPage';
import OnlineExamPage from './pages/OnlineExamPage';
import AdminPage from './pages/AdminPage';
import TeacherResultsPage from './pages/TeacherResultsPage';
import { CacheManager } from './services/cacheManager';
import { SelectedQuestionsProvider } from './contexts/SelectedQuestionsContext';

const App: React.FC = () => {
  useEffect(() => {
    let cleanupAutoCleanup: (() => void) | null = null;

    try {
      console.log('Initializing application cache management...');
      
      // Check if this is after an emergency clear
      if (sessionStorage.getItem('emergency_cleared')) {
        console.log('Application restarted after emergency cache clear');
        sessionStorage.removeItem('emergency_cleared');
      }
      
      // Check if force refresh was requested
      if (sessionStorage.getItem('force_refresh')) {
        console.log('Application restarted after force refresh');
        sessionStorage.removeItem('force_refresh');
      }
      
      // Clear stale cache
      CacheManager.clearSupabaseCache();
      CacheManager.clearNavigationCache();
      CacheManager.clearTemporaryCache();
      
      // Set up automatic cleanup
      cleanupAutoCleanup = CacheManager.setupAutoCleanup();
      
      console.log('Cache management initialized successfully');
    } catch (error) {
      console.error('Cache management initialization failed:', error);
      // Fallback to basic cleanup
      try {
        sessionStorage.clear();
        console.log('Performed fallback cache clear');
      } catch (fallbackError) {
        console.error('Fallback cache clear failed:', fallbackError);
      }
    }

    return () => {
      if (cleanupAutoCleanup) {
        cleanupAutoCleanup();
      }
    };
  }, []);

  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải ứng dụng...</p>
      </div>
    </div>
  );

  return (
    <HashRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Home page - no authentication required */}
          <Route path="/" element={<HomePage />} />
          
          {/* Quiz Bank - Teachers only */}
          <Route path="/quiz-bank" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <SelectedQuestionsProvider>
                <div className="flex flex-col min-h-screen bg-gray-50">
                  <Header />
                  <main className="flex-grow">
                    <QuizBankPage />
                  </main>
                  <Footer />
                </div>
              </SelectedQuestionsProvider>
            </ProtectedRoute>
          } />
          
          {/* AI Generator - Teachers only */}
          <Route path="/create" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <div className="flex flex-col min-h-screen bg-gray-50">
                <Header />
                <main className="flex-grow">
                  <AIGeneratorPage />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          } />
          
          {/* Online Exam Landing - Open to everyone */}
          <Route path="/online-exam" element={
            <div className="flex flex-col min-h-screen bg-gray-50">
              <Header />
              <main className="flex-grow">
                <OnlineExamLandingPage />
              </main>
              <Footer />
            </div>
          } />
          
          {/* Online Exam - Open to everyone */}
          <Route path="/exam" element={
            <div className="flex flex-col min-h-screen bg-gray-50">
              <Header />
              <main className="flex-grow">
                <OnlineExamPage />
              </main>
              <Footer />
            </div>
          } />
          
          {/* Online Exam with slug - Open to everyone */}
          <Route path="/exam/:slug" element={
            <div className="flex flex-col min-h-screen bg-gray-50">
              <Header />
              <main className="flex-grow">
                <OnlineExamPage />
              </main>
              <Footer />
            </div>
          } />
          
          {/* Teacher Results - Teachers only */}
          <Route path="/teacher-results" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <div className="flex flex-col min-h-screen bg-gray-50">
                <Header />
                <main className="flex-grow">
                  <TeacherResultsPage />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          } />
          
          {/* Admin - Special access only */}
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;