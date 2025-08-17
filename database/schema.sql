-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('teacher', 'student', 'pending_teacher')) NOT NULL,
  full_name TEXT,
  school TEXT,
  teacher_code TEXT, -- Mã xác thực giáo viên
  is_verified BOOLEAN DEFAULT false,
  verification_requested_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teacher verification codes table
CREATE TABLE public.teacher_verification_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  school TEXT NOT NULL,
  description TEXT,
  created_by TEXT, -- Admin email
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  questions JSONB NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL,
  score NUMERIC,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create groups table
CREATE TABLE public.groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE public.group_members (
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Quizzes policies
CREATE POLICY "Anyone can view public quizzes" ON public.quizzes
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Teachers can create quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'teacher' AND is_verified = true
    )
  );

CREATE POLICY "Teachers can update own quizzes" ON public.quizzes
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Teachers can delete own quizzes" ON public.quizzes
  FOR DELETE USING (created_by = auth.uid());

-- Quiz attempts policies
CREATE POLICY "Users can view own attempts" ON public.quiz_attempts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Students can create attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Groups policies
CREATE POLICY "Teachers can view own groups" ON public.groups
  FOR SELECT USING (
    teacher_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'teacher' AND is_verified = true)
  );

CREATE POLICY "Teachers can create groups" ON public.groups
  FOR INSERT WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'teacher' AND is_verified = true)
  );

CREATE POLICY "Teachers can update own groups" ON public.groups
  FOR UPDATE USING (
    teacher_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'teacher' AND is_verified = true)
  );

-- Group members policies
CREATE POLICY "Group members can view group membership" ON public.group_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can join groups" ON public.group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Functions

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  teacher_code TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  teacher_code := NEW.raw_user_meta_data->>'teacher_code';
  
  -- Nếu đăng ký làm giáo viên, set role là pending_teacher
  IF user_role = 'teacher' THEN
    user_role := 'pending_teacher';
  END IF;
  
  INSERT INTO public.users (id, email, role, full_name, school, teacher_code, is_verified, verification_requested_at)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'school', ''),
    teacher_code,
    CASE WHEN user_role = 'student' THEN true ELSE false END,
    CASE WHEN user_role = 'pending_teacher' THEN NOW() ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Function to generate quiz slug
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

-- Function to verify teacher with code
CREATE OR REPLACE FUNCTION verify_teacher_with_code(user_id UUID, verification_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  code_record RECORD;
BEGIN
  -- Tìm mã xác thực
  SELECT * INTO code_record 
  FROM public.teacher_verification_codes 
  WHERE code = verification_code 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND current_uses < max_uses;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Cập nhật user thành teacher đã xác thực
  UPDATE public.users 
  SET 
    role = 'teacher',
    is_verified = true,
    verified_at = NOW(),
    teacher_code = verification_code
  WHERE id = user_id AND role = 'pending_teacher';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Tăng số lần sử dụng mã
  UPDATE public.teacher_verification_codes 
  SET current_uses = current_uses + 1
  WHERE code = verification_code;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function để admin tạo mã xác thực
CREATE OR REPLACE FUNCTION create_teacher_verification_code(
  code_text TEXT,
  school_name TEXT,
  description_text TEXT DEFAULT NULL,
  max_uses_count INTEGER DEFAULT 1,
  expires_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.teacher_verification_codes (
    code, school, description, max_uses, expires_at
  ) VALUES (
    upper(code_text), school_name, description_text, max_uses_count, expires_date
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;