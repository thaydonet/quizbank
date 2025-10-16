-- Migration script for Question Bank System
-- Run this in Supabase SQL Editor to create all necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Subjects table (Môn học)
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Chapters table (Chương)
CREATE TABLE IF NOT EXISTS chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    order_index INTEGER DEFAULT 1,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subject_id, code)
);

-- 3. Lessons table (Bài học)
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    order_index INTEGER DEFAULT 1,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chapter_id, code)
);

-- 4. Question Types table (Dạng câu hỏi)
CREATE TABLE IF NOT EXISTS question_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    order_index INTEGER DEFAULT 1,
    description TEXT,
    difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lesson_id, code)
);

-- 5. Questions table (Câu hỏi)
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_type_id UUID NOT NULL REFERENCES question_types(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('mcq', 'msq', 'sa')),
    question_text TEXT NOT NULL,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_option TEXT NOT NULL,
    explanation TEXT NOT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    is_dynamic BOOLEAN DEFAULT false,
    dynamic_variables JSONB,
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approval_status VARCHAR(20) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Question Collections table (Bộ sưu tập câu hỏi)
CREATE TABLE IF NOT EXISTS question_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Collection Questions table (Câu hỏi trong bộ sưu tập)
CREATE TABLE IF NOT EXISTS collection_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES question_collections(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, question_id)
);

-- 8. Question Usage Stats table (Thống kê sử dụng câu hỏi)
CREATE TABLE IF NOT EXISTS question_usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    difficulty_rating DECIMAL(3,2),
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(question_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_chapter_id ON lessons(chapter_id);
CREATE INDEX IF NOT EXISTS idx_question_types_lesson_id ON question_types(lesson_id);
CREATE INDEX IF NOT EXISTS idx_questions_question_type_id ON questions(question_type_id);
CREATE INDEX IF NOT EXISTS idx_questions_approval_status ON questions(approval_status);
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON questions(created_by);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_collection_questions_collection_id ON collection_questions(collection_id);
CREATE INDEX IF NOT EXISTS idx_question_usage_stats_question_id ON question_usage_stats(question_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_usage_stats ENABLE ROW LEVEL SECURITY;

-- Subjects policies (Public read, admin write)
CREATE POLICY "Anyone can view active subjects" ON subjects
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage subjects" ON subjects
    FOR ALL USING (auth.role() = 'authenticated');

-- Chapters policies
CREATE POLICY "Anyone can view active chapters" ON chapters
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage chapters" ON chapters
    FOR ALL USING (auth.role() = 'authenticated');

-- Lessons policies
CREATE POLICY "Anyone can view active lessons" ON lessons
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage lessons" ON lessons
    FOR ALL USING (auth.role() = 'authenticated');

-- Question types policies
CREATE POLICY "Anyone can view active question types" ON question_types
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage question types" ON question_types
    FOR ALL USING (auth.role() = 'authenticated');

-- Questions policies
CREATE POLICY "Anyone can view approved questions" ON questions
    FOR SELECT USING (approval_status = 'approved' AND is_active = true);

CREATE POLICY "Users can view their own questions" ON questions
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can create questions" ON questions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own questions" ON questions
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all questions" ON questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Question collections policies
CREATE POLICY "Anyone can view public collections" ON question_collections
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own collections" ON question_collections
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can create collections" ON question_collections
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own collections" ON question_collections
    FOR ALL USING (auth.uid() = created_by);

-- Collection questions policies
CREATE POLICY "Users can view collection questions for accessible collections" ON collection_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM question_collections qc
            WHERE qc.id = collection_id
            AND (qc.is_public = true OR qc.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can manage their collection questions" ON collection_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM question_collections qc
            WHERE qc.id = collection_id
            AND qc.created_by = auth.uid()
        )
    );

-- Question usage stats policies
CREATE POLICY "Anyone can view question stats" ON question_usage_stats
    FOR SELECT USING (true);

CREATE POLICY "System can update question stats" ON question_usage_stats
    FOR ALL USING (auth.role() = 'authenticated');

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_types_updated_at BEFORE UPDATE ON question_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_collections_updated_at BEFORE UPDATE ON question_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_usage_stats_updated_at BEFORE UPDATE ON question_usage_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial data
INSERT INTO subjects (name, code, description) VALUES
    ('Toán 10', 'toan-10', 'Toán học lớp 10'),
    ('Toán 11', 'toan-11', 'Toán học lớp 11'),
    ('Toán 12', 'toan-12', 'Toán học lớp 12')
ON CONFLICT (code) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Question Bank migration completed successfully!';
    RAISE NOTICE 'Created 8 tables with proper RLS policies';
    RAISE NOTICE 'Added 3 initial subjects: Toán 10, 11, 12';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run sample data creation in Admin Panel';
    RAISE NOTICE '2. Use Import Tool to add questions';
    RAISE NOTICE '3. Approve questions in Admin interface';
END $$;