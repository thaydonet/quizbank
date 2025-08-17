import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizService, type SavedQuiz } from '../services/quizService';
import { BattleService } from '../services/battleService';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CreateBattlePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<string>('');
  const [battleConfig, setBattleConfig] = useState({
    title: '',
    description: '',
    maxParticipants: 30,
    questionTimeLimit: 30
  });

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await QuizService.getAllQuizzes();
      setQuizzes(data);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBattle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz || !battleConfig.title.trim()) return;

    setCreating(true);
    try {
      const battleRoom = await BattleService.createBattleRoom(
        battleConfig.title.trim(),
        selectedQuiz,
        battleConfig.description.trim() || undefined,
        battleConfig.maxParticipants,
        battleConfig.questionTimeLimit
      );

      if (battleRoom) {
        alert(`✅ Tạo phòng thi đấu thành công!\n\nMã phòng: ${battleRoom.room_code}\n\nHãy chia sẻ mã này cho học sinh!`);
        navigate(`/battle/room/${battleRoom.room_code}`);
      } else {
        alert('❌ Có lỗi xảy ra khi tạo phòng thi đấu');
      }
    } catch (error) {
      console.error('Error creating battle:', error);
      alert('❌ Có lỗi xảy ra khi tạo phòng thi đấu');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách đề thi...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🏆 Tạo Phòng Thi Đấu
              </h1>
              <p className="text-gray-600">
                Tạo phòng thi đấu realtime để học sinh cạnh tranh với nhau
              </p>
            </div>

            {quizzes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có đề thi nào</h3>
                <p className="text-gray-600 mb-6">Bạn cần tạo đề thi trước khi có thể tạo phòng thi đấu</p>
                <button
                  onClick={() => navigate('/quiz-bank')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Tạo đề thi mới
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateBattle} className="space-y-6">
                {/* Chọn đề thi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn đề thi *
                  </label>
                  <select
                    value={selectedQuiz}
                    onChange={(e) => setSelectedQuiz(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">-- Chọn đề thi --</option>
                    {quizzes.map((quiz) => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title} ({quiz.questionCount} câu)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tên phòng */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên phòng thi đấu *
                  </label>
                  <input
                    type="text"
                    value={battleConfig.title}
                    onChange={(e) => setBattleConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="VD: Thi đấu Toán 12 - Chương 1"
                    required
                    maxLength={100}
                  />
                </div>

                {/* Mô tả */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả (tùy chọn)
                  </label>
                  <textarea
                    value={battleConfig.description}
                    onChange={(e) => setBattleConfig(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Mô tả về cuộc thi đấu..."
                    rows={3}
                    maxLength={500}
                  />
                </div>

                {/* Cấu hình */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số người tham gia tối đa
                    </label>
                    <input
                      type="number"
                      value={battleConfig.maxParticipants}
                      onChange={(e) => setBattleConfig(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 30 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="2"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian mỗi câu (giây)
                    </label>
                    <input
                      type="number"
                      value={battleConfig.questionTimeLimit}
                      onChange={(e) => setBattleConfig(prev => ({ ...prev, questionTimeLimit: parseInt(e.target.value) || 30 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="10"
                      max="120"
                    />
                  </div>
                </div>

                {/* Thông tin đề thi đã chọn */}
                {selectedQuiz && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    {(() => {
                      const quiz = quizzes.find(q => q.id === selectedQuiz);
                      return quiz ? (
                        <div>
                          <h3 className="font-semibold text-blue-900 mb-2">📋 Thông tin đề thi</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-blue-700">Tổng câu:</span>
                              <span className="font-semibold ml-2">{quiz.questionCount}</span>
                            </div>
                            <div>
                              <span className="text-blue-700">Trắc nghiệm:</span>
                              <span className="font-semibold ml-2">{quiz.mcqCount}</span>
                            </div>
                            <div>
                              <span className="text-blue-700">Đúng/Sai:</span>
                              <span className="font-semibold ml-2">{quiz.msqCount}</span>
                            </div>
                            <div>
                              <span className="text-blue-700">Tự luận:</span>
                              <span className="font-semibold ml-2">{quiz.saCount}</span>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => navigate('/teacher/battles')}
                    className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedQuiz || !battleConfig.title.trim() || creating}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    {creating ? 'Đang tạo...' : '🏆 Tạo phòng thi đấu'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateBattlePage;
