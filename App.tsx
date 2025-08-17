import React, { Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherGroupsPage from './pages/TeacherGroupsPage';
import StudentGroupsPage from './pages/StudentGroupsPage';
import TeacherVerificationForm from './components/auth/TeacherVerificationForm';
import QuizBankPage from './pages/QuizBankPage';
import AIGeneratorPage from './pages/AIGeneratorPage';
import OnlineExamPage from './pages/OnlineExamPage';
import OnlineExamLandingPage from './pages/OnlineExamLandingPage';
import ExamGroupPage from './pages/ExamGroupPage';
import PublicQuizPage from './pages/PublicQuizPage';
import CreateBattlePage from './pages/CreateBattlePage';
import JoinBattlePage from './pages/JoinBattlePage';
import BattleRoomPage from './pages/BattleRoomPage';
import LoadingScreen from './components/LoadingScreen';
import { ToastContainer } from './components/Toast';
import TeacherStatsPage from './pages/TeacherStatsPage';
import NewAdminPanel from './pages/NewAdminPanel';
import ErrorBoundary from './components/ErrorBoundary';

// Component để routing dựa trên role
const AppRoutes: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <LoadingScreen
        message="Đang khởi tạo ứng dụng"
        onTimeout={() => {
          console.warn('App loading timeout, forcing reload');
          window.location.reload();
        }}
      />
    );
  }

  // Nếu chưa đăng nhập, hiển thị trang chủ public
  if (!user || !profile) {
    return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

  // Nếu đã đăng nhập nhưng là pending teacher, hiển thị form xác thực
  if (profile.role === 'pending_teacher') {
    return (
      <Routes>
        <Route path="*" element={
          <TeacherVerificationForm 
            onVerificationSuccess={() => window.location.reload()} 
          />
        } />
      </Routes>
    );
  }

  // Nếu đã đăng nhập, routing theo role
  return (
    <Routes>
      {/* Dashboard routes */}
      <Route path="/" element={
        profile.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />
      } />
      
      {/* Shared routes */}
      <Route path="/quiz-bank" element={
        <ProtectedRoute requiredRole="teacher">
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <QuizBankPage />
            </main>
            <Footer />
          </div>
        </ProtectedRoute>
      } />
      
      <Route path="/exam" element={<OnlineExamPage />} />
      <Route path="/online-exam" element={<OnlineExamLandingPage />} />
      <Route path="/quiz/:slug" element={<PublicQuizPage />} />

      {/* Battle routes */}
      <Route path="/battle/join" element={<JoinBattlePage />} />
      <Route path="/battle/room/:roomCode" element={<BattleRoomPage />} />
      
      {/* Teacher-only routes */}
      <Route path="/create" element={
        <ProtectedRoute requiredRole="teacher">
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <AIGeneratorPage />
            </main>
            <Footer />
          </div>
        </ProtectedRoute>
      } />
      
      <Route path="/teacher/groups" element={
        <ProtectedRoute requiredRole="teacher">
          <TeacherGroupsPage />
        </ProtectedRoute>
      } />

      <Route path="/teacher/battle/create" element={
        <ProtectedRoute requiredRole="teacher">
          <CreateBattlePage />
        </ProtectedRoute>
      } />

      <Route path="/teacher/stats" element={
        <ProtectedRoute requiredRole="teacher">
          <TeacherStatsPage />
        </ProtectedRoute>
      } />

      {/* Admin route - chỉ admin mới vào được */}
      <Route path="/admin" element={<NewAdminPanel />} />
      
      {/* Student-only routes */}
      <Route path="/student/groups" element={
        <ProtectedRoute requiredRole="student">
          <StudentGroupsPage />
        </ProtectedRoute>
      } />
      
      <Route path="/exam-group" element={<ExamGroupPage />} />
      
      {/* Fallback */}
      <Route path="*" element={
        profile.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />
      } />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <HashRouter>
          <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          }>
            <AppRoutes />
            <ToastContainer />
          </Suspense>
        </HashRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;