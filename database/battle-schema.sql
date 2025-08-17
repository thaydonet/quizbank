-- Schema cho tính năng thi đấu group
-- Chạy trong Supabase SQL Editor

-- 1. Tạo bảng battle_rooms (phòng thi đấu)
CREATE TABLE public.battle_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('waiting', 'active', 'finished')) DEFAULT 'waiting',
  max_participants INTEGER DEFAULT 50,
  current_question_index INTEGER DEFAULT 0,
  question_time_limit INTEGER DEFAULT 30, -- seconds per question
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tạo bảng battle_participants (người tham gia)
CREATE TABLE public.battle_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.battle_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL, -- Cho phép tham gia ẩn danh
  total_score INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0, -- streak hiện tại
  max_streak INTEGER DEFAULT 0, -- streak cao nhất
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id),
  UNIQUE(room_id, display_name)
);

-- 3. Tạo bảng battle_answers (câu trả lời)
CREATE TABLE public.battle_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.battle_rooms(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES public.battle_participants(id) ON DELETE CASCADE NOT NULL,
  question_index INTEGER NOT NULL,
  question_id TEXT NOT NULL, -- ID của câu hỏi trong quiz
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER DEFAULT 0,
  time_taken INTEGER, -- milliseconds
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, participant_id, question_index)
);

-- 4. Enable RLS
ALTER TABLE public.battle_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_answers ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Battle rooms policies
CREATE POLICY "Anyone can view active battle rooms" ON public.battle_rooms
  FOR SELECT USING (status IN ('waiting', 'active'));

CREATE POLICY "Teachers can create battle rooms" ON public.battle_rooms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'teacher' AND is_verified = true
    )
  );

CREATE POLICY "Teachers can update own battle rooms" ON public.battle_rooms
  FOR UPDATE USING (created_by = auth.uid());

-- Battle participants policies
CREATE POLICY "Anyone can view participants in active rooms" ON public.battle_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.battle_rooms 
      WHERE id = room_id AND status IN ('waiting', 'active', 'finished')
    )
  );

CREATE POLICY "Users can join battle rooms" ON public.battle_participants
  FOR INSERT WITH CHECK (true); -- Cho phép tham gia ẩn danh

CREATE POLICY "Users can update own participation" ON public.battle_participants
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

-- Battle answers policies
CREATE POLICY "Participants can view own answers" ON public.battle_answers
  FOR SELECT USING (
    participant_id IN (
      SELECT id FROM public.battle_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can submit answers" ON public.battle_answers
  FOR INSERT WITH CHECK (
    participant_id IN (
      SELECT id FROM public.battle_participants WHERE user_id = auth.uid()
    )
  );

-- 6. Functions

-- Function để tạo room code (4 số)
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
BEGIN
  RETURN (1000 + floor(random() * 9000))::text;
END;
$$ LANGUAGE plpgsql;

-- Function để tính điểm
CREATE OR REPLACE FUNCTION calculate_battle_points(
  is_correct BOOLEAN,
  time_taken INTEGER,
  time_limit INTEGER,
  base_points INTEGER DEFAULT 100
)
RETURNS INTEGER AS $$
DECLARE
  points INTEGER := 0;
  time_bonus INTEGER := 0;
BEGIN
  IF NOT is_correct THEN
    RETURN 0;
  END IF;
  
  -- Base points for correct answer
  points := base_points;
  
  -- Time bonus (faster = more points)
  IF time_taken IS NOT NULL AND time_taken < time_limit * 1000 THEN
    time_bonus := ROUND((time_limit * 1000 - time_taken) / (time_limit * 10));
    points := points + time_bonus;
  END IF;
  
  RETURN points;
END;
$$ LANGUAGE plpgsql;

-- Function để cập nhật leaderboard
CREATE OR REPLACE FUNCTION update_participant_stats(
  p_participant_id UUID,
  p_is_correct BOOLEAN,
  p_points INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.battle_participants
  SET 
    total_score = total_score + p_points,
    questions_answered = questions_answered + 1,
    correct_answers = CASE WHEN p_is_correct THEN correct_answers + 1 ELSE correct_answers END,
    current_streak = CASE WHEN p_is_correct THEN current_streak + 1 ELSE 0 END,
    max_streak = CASE 
      WHEN p_is_correct AND current_streak + 1 > max_streak 
      THEN current_streak + 1 
      ELSE max_streak 
    END,
    last_activity = NOW()
  WHERE id = p_participant_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Indexes for performance
CREATE INDEX idx_battle_rooms_code ON public.battle_rooms(room_code);
CREATE INDEX idx_battle_rooms_status ON public.battle_rooms(status);
CREATE INDEX idx_battle_participants_room ON public.battle_participants(room_id);
CREATE INDEX idx_battle_participants_score ON public.battle_participants(room_id, total_score DESC);
CREATE INDEX idx_battle_answers_room_participant ON public.battle_answers(room_id, participant_id);

-- 8. Sample data
INSERT INTO public.battle_rooms (room_code, title, description, quiz_id, created_by, status)
SELECT 
  generate_room_code(),
  'Demo Battle Room',
  'Phòng thi đấu demo',
  q.id,
  q.created_by,
  'waiting'
FROM public.quizzes q
LIMIT 1;

-- Hiển thị thông báo
DO $$
BEGIN
  RAISE NOTICE '=== BATTLE SYSTEM SETUP COMPLETED ===';
  RAISE NOTICE 'Created tables: battle_rooms, battle_participants, battle_answers';
  RAISE NOTICE 'Added RLS policies and functions';
  RAISE NOTICE 'Ready for real-time battle competitions!';
END $$;
