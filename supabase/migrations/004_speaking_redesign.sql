-- Redesign tables for Speaking Sessions and Answers

-- 1. Speaking Sessions
CREATE TABLE IF NOT EXISTS speaking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Speaking Questions (linked to a session)
CREATE TABLE IF NOT EXISTS speaking_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES speaking_sessions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    part INT CHECK (part IN (1, 2, 3)),
    order_index INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Speaking Answers
CREATE TABLE IF NOT EXISTS speaking_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES speaking_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    student_transcript TEXT,
    overall_band DECIMAL(2,1),
    feedback_json JSONB, -- The "heart" to reconstruct the UI report
    audio_url TEXT,
    is_relevant BOOLEAN DEFAULT TRUE,
    relevance_score INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_speaking_sessions_user_id ON speaking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_speaking_questions_session_id ON speaking_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_speaking_answers_question_id ON speaking_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_speaking_answers_user_id ON speaking_answers(user_id);

-- Trigger for updated_at on speaking_sessions
CREATE TRIGGER update_speaking_sessions_updated_at
BEFORE UPDATE ON speaking_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
