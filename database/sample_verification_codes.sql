-- Tạo một số mã xác thực mẫu cho testing
-- Chạy script này trong Supabase SQL Editor

-- Mã cho trường THPT ABC
INSERT INTO public.teacher_verification_codes (code, school, description, max_uses, expires_at)
VALUES 
  ('THPTABC1', 'THPT ABC', 'Mã dành cho giáo viên THPT ABC', 10, NOW() + INTERVAL '1 year'),
  ('THPTXYZ1', 'THPT XYZ', 'Mã dành cho giáo viên THPT XYZ', 5, NOW() + INTERVAL '6 months'),
  ('DEMO2024', 'Trường Demo', 'Mã demo cho testing', 100, NOW() + INTERVAL '1 year');

-- Kiểm tra các mã đã tạo
SELECT * FROM public.teacher_verification_codes WHERE is_active = true;