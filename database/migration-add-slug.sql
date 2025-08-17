-- Migration script để thêm cột slug vào bảng quizzes hiện có
-- Chạy trong Supabase SQL Editor

-- 1. Thêm cột slug (tạm thời cho phép NULL)
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Tạo function để generate slug từ title
CREATE OR REPLACE FUNCTION generate_quiz_slug(quiz_title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Tạo slug cơ bản từ title
  base_slug := lower(trim(quiz_title));
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(base_slug, '-');
  
  -- Nếu slug trống, tạo slug mặc định
  IF base_slug = '' THEN
    base_slug := 'quiz';
  END IF;
  
  -- Thêm timestamp để đảm bảo unique
  final_slug := base_slug || '-' || extract(epoch from now())::bigint;
  
  -- Kiểm tra và thêm số nếu vẫn trùng
  WHILE EXISTS (SELECT 1 FROM public.quizzes WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || extract(epoch from now())::bigint || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- 3. Cập nhật slug cho các quiz hiện có
UPDATE public.quizzes 
SET slug = generate_quiz_slug(title) 
WHERE slug IS NULL;

-- 4. Thêm constraint NOT NULL và UNIQUE cho slug
ALTER TABLE public.quizzes ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.quizzes ADD CONSTRAINT quizzes_slug_unique UNIQUE (slug);

-- 5. Tạo index cho slug để tăng tốc độ truy vấn
CREATE INDEX IF NOT EXISTS idx_quizzes_slug ON public.quizzes(slug);

-- 6. Kiểm tra kết quả
SELECT 
  id,
  title,
  slug,
  created_at
FROM public.quizzes
ORDER BY created_at DESC
LIMIT 10;

-- 7. Hiển thị thông báo
DO $$
BEGIN
  RAISE NOTICE '=== MIGRATION COMPLETED ===';
  RAISE NOTICE 'Added slug column to quizzes table';
  RAISE NOTICE 'Generated slugs for existing quizzes';
  RAISE NOTICE 'Added unique constraint and index';
  RAISE NOTICE '';
  RAISE NOTICE 'Quiz URLs now available at: /quiz/{slug}';
END $$;
