-- Script để setup dữ liệu test cho authentication system
-- Chạy trong Supabase SQL Editor

-- 1. Xóa dữ liệu cũ (nếu có)
DELETE FROM public.quiz_attempts;
DELETE FROM public.quizzes;
DELETE FROM public.group_members;
DELETE FROM public.groups;
DELETE FROM public.users WHERE email LIKE '%test.com';
DELETE FROM public.teacher_verification_codes WHERE school LIKE '%Test%';

-- 2. Tạo mã xác thực test
INSERT INTO public.teacher_verification_codes (code, school, description, max_uses, expires_at)
VALUES 
  ('DEMO2024', 'Trường Demo', 'Mã demo cho testing', 100, NOW() + INTERVAL '1 year'),
  ('THPTTEST', 'THPT Test', 'Mã test cho giáo viên', 10, NOW() + INTERVAL '6 months'),
  ('TEACHER01', 'Trường ABC', 'Mã cho giáo viên ABC', 5, NOW() + INTERVAL '1 year'),
  ('EXPIRED01', 'Trường XYZ', 'Mã đã hết hạn (để test)', 1, NOW() - INTERVAL '1 day'),
  ('USED_UP01', 'Trường DEF', 'Mã đã hết lượt sử dụng', 1, NOW() + INTERVAL '1 year');

-- Cập nhật mã đã hết lượt sử dụng
UPDATE public.teacher_verification_codes 
SET current_uses = max_uses 
WHERE code = 'USED_UP01';

-- 3. Kiểm tra mã xác thực đã tạo
SELECT 
  code,
  school,
  is_active,
  current_uses,
  max_uses,
  expires_at,
  CASE 
    WHEN NOT is_active THEN 'INACTIVE'
    WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'EXPIRED'
    WHEN current_uses >= max_uses THEN 'USED_UP'
    ELSE 'ACTIVE'
  END as status
FROM public.teacher_verification_codes
ORDER BY created_at DESC;

-- 4. Tạo function để test authentication flow
CREATE OR REPLACE FUNCTION test_teacher_verification()
RETURNS TABLE (
  test_name TEXT,
  result TEXT,
  details TEXT
) AS $$
BEGIN
  -- Test 1: Kiểm tra mã hợp lệ
  RETURN QUERY
  SELECT 
    'Valid Code Test'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM public.teacher_verification_codes 
      WHERE code = 'DEMO2024' 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND current_uses < max_uses
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Checking if DEMO2024 code is valid'::TEXT;
    
  -- Test 2: Kiểm tra mã hết hạn
  RETURN QUERY
  SELECT 
    'Expired Code Test'::TEXT,
    CASE WHEN NOT EXISTS (
      SELECT 1 FROM public.teacher_verification_codes 
      WHERE code = 'EXPIRED01' 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND current_uses < max_uses
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Checking if EXPIRED01 code is properly rejected'::TEXT;
    
  -- Test 3: Kiểm tra mã hết lượt
  RETURN QUERY
  SELECT 
    'Used Up Code Test'::TEXT,
    CASE WHEN NOT EXISTS (
      SELECT 1 FROM public.teacher_verification_codes 
      WHERE code = 'USED_UP01' 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND current_uses < max_uses
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Checking if USED_UP01 code is properly rejected'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 5. Chạy test
SELECT * FROM test_teacher_verification();

-- 6. Tạo function để cleanup test data
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS TEXT AS $$
BEGIN
  -- Xóa test users (chỉ những user có email test)
  DELETE FROM public.users WHERE email LIKE '%test.com' OR email LIKE '%demo.com';
  
  -- Xóa test quizzes
  DELETE FROM public.quizzes WHERE title LIKE '%Test%' OR title LIKE '%Demo%';
  
  -- Reset verification codes
  UPDATE public.teacher_verification_codes 
  SET current_uses = 0 
  WHERE code IN ('DEMO2024', 'THPTTEST', 'TEACHER01');
  
  RETURN 'Test data cleaned up successfully';
END;
$$ LANGUAGE plpgsql;

-- 7. Hiển thị hướng dẫn
DO $$
BEGIN
  RAISE NOTICE '=== SETUP COMPLETED ===';
  RAISE NOTICE 'Available test verification codes:';
  RAISE NOTICE '- DEMO2024: Valid code for testing (100 uses)';
  RAISE NOTICE '- THPTTEST: Valid code for testing (10 uses)';
  RAISE NOTICE '- TEACHER01: Valid code for testing (5 uses)';
  RAISE NOTICE '- EXPIRED01: Expired code (for testing error handling)';
  RAISE NOTICE '- USED_UP01: Used up code (for testing error handling)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Open test-auth.html in browser';
  RAISE NOTICE '2. Test teacher registration with email ending in .com';
  RAISE NOTICE '3. Use DEMO2024 as verification code';
  RAISE NOTICE '4. Test quiz creation after verification';
  RAISE NOTICE '';
  RAISE NOTICE 'To cleanup test data later, run: SELECT cleanup_test_data();';
END $$;
