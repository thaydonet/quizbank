import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const roles = [
  { value: 'teacher', label: 'Giáo viên' },
  { value: 'student', label: 'Học sinh' }
];

interface AuthFormProps {
  mode?: 'login' | 'register';
  onClose?: () => void;
}

export default function AuthForm({ mode = 'login', onClose }: AuthFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [studentName, setStudentName] = useState(''); // Add student name field
  const [studentClass, setStudentClass] = useState(''); // Add student class field
  const [inviteCode, setInviteCode] = useState('');
  const [isRegister, setIsRegister] = useState(mode === 'register');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(''); // Add success message state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage(''); // Clear previous success message
    setLoading(true);
    
    // Handle forgot password
    if (isForgotPassword) {
      if (!email) {
        setError('Vui lòng nhập email để lấy lại mật khẩu!');
        setLoading(false);
        return;
      }
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/reset-password`
      });
      
      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccessMessage('Đã gửi email đặt lại mật khẩu! Vui lòng kiểm tra hộp thư của bạn.');
        // Auto-close modal after 3 seconds
        setTimeout(() => {
          if (onClose) onClose();
        }, 3000);
      }
      setLoading(false);
      return;
    }
    
    if (isRegister) {
      // Validate student name and class for students
      if (role === 'student' && !studentName.trim()) {
        setError('Vui lòng nhập tên học sinh.');
        setLoading(false);
        return;
      }
      if (role === 'student' && !studentClass.trim()) {
        setError('Vui lòng nhập lớp học.');
        setLoading(false);
        return;
      }
      
      // Nếu đăng ký giáo viên, kiểm tra mã mời
      if (role === 'teacher') {
        const { data: codeData, error: codeError } = await supabase
          .from('invite_codes')
          .select('code, used')
          .eq('code', inviteCode)
          .eq('used', false)
          .single();
        if (codeError || !codeData) {
          setError('Mã mời không hợp lệ hoặc đã được sử dụng.');
          setLoading(false);
          return;
        }
      }
      // Đăng ký
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      // Lưu role và student_name vào bảng users
      if (data.user) {
        const userData = {
          id: data.user.id,
          email,
          role,
          ...(role === 'student' && { 
            student_name: studentName.trim(),
            student_class: studentClass.trim()
          })
        };
        
        await supabase.from('users').insert(userData);
        // Nếu đăng ký giáo viên, đánh dấu mã mời đã dùng
        if (role === 'teacher') {
          await supabase.from('invite_codes').update({ 
            used: true, 
            used_at: new Date().toISOString(),
            used_by: data.user.id 
          }).eq('code', inviteCode);
        }
      }
      setSuccessMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
      // Auto-close modal after 3 seconds
      setTimeout(() => {
        if (onClose) onClose();
      }, 3000);
    } else {
      // Đăng nhập
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      setSuccessMessage('Đăng nhập thành công!');
      // Auto-close modal after 1.5 seconds
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    }
    setLoading(false);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {isForgotPassword ? 'Quên mật khẩu' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border rounded" />
        </div>
        {!isForgotPassword && (
          <div>
            <label className="block mb-1 font-medium">Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 border rounded" />
          </div>
        )}
        {!isForgotPassword && isRegister && (
          <>
            <div>
              <label className="block mb-1 font-medium">Vai trò</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full p-2 border rounded">
                {roles.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            {role === 'teacher' && (
              <div>
                <label className="block mb-1 font-medium">Mã mời (do admin cấp)</label>
                <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)} required className="w-full p-2 border rounded" />
              </div>
            )}
            {role === 'student' && (
              <>
                <div>
                  <label className="block mb-1 font-medium">Tên học sinh</label>
                  <input 
                    type="text" 
                    value={studentName} 
                    onChange={e => setStudentName(e.target.value)} 
                    required 
                    placeholder="Nhập tên đầy đủ của bạn"
                    className="w-full p-2 border rounded" 
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Lớp</label>
                  <input 
                    type="text" 
                    value={studentClass} 
                    onChange={e => setStudentClass(e.target.value)} 
                    required 
                    placeholder="Ví dụ: 12A1, 11B2"
                    className="w-full p-2 border rounded" 
                  />
                </div>
              </>
            )}
          </>
        )}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {successMessage && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}
        <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded font-semibold hover:bg-indigo-700 transition">
          {loading ? 'Đang xử lý...' : isForgotPassword ? 'Gửi email đặt lại mật khẩu' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
        </button>
      </form>
      <div className="mt-4 text-center flex flex-col gap-2">
        {!isForgotPassword && (
          <>
            <button className="text-indigo-600 underline" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
            </button>
            <button className="text-blue-600 underline" onClick={() => setIsForgotPassword(true)}>
              Quên mật khẩu?
            </button>
          </>
        )}
        {isForgotPassword && (
          <button className="text-indigo-600 underline" onClick={() => {
            setIsForgotPassword(false);
            setError('');
            setSuccessMessage('');
          }}>
            Quay lại đăng nhập
          </button>
        )}
        <button className="text-gray-600 underline" onClick={handleClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}
