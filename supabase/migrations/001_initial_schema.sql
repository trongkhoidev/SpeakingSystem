-- ============ USERS TABLE ============
-- Created and managed by Supabase Auth automatically
-- But we'll add additional user profile data

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free',  -- free, pro, premium
    daily_quota_minutes INT DEFAULT 30,
    monthly_quota_minutes INT DEFAULT 600,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ QUESTIONS TABLE ============
-- Store IELTS speaking questions

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cefr_level TEXT CHECK (cefr_level IN ('B1', 'B2', 'C1', 'C2')),
    part INT CHECK (part IN (1, 2, 3)),
    question_text TEXT NOT NULL,
    reference_answer TEXT,  -- Expected answer for comparison
    keywords JSONB,  -- Important vocabulary to check
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ ASSESSMENTS TABLE ============
-- Store assessment results

CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    
    -- Transcript and raw scores
    deepgram_transcript TEXT,
    azure_pronunciation JSONB,
    
    -- Band scores
    fluency_coherence DECIMAL(2,1),
    lexical_resource DECIMAL(2,1),
    grammatical_accuracy DECIMAL(2,1),
    pronunciation DECIMAL(2,1),
    overall_band DECIMAL(2,1),
    
    -- Analysis data
    lexical_analysis JSONB,
    grammar_analysis JSONB,
    color_coded_transcript JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ AUDIO RECORDINGS TABLE ============
-- Metadata for stored audio files

CREATE TABLE IF NOT EXISTS audio_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    duration_seconds FLOAT,
    file_size_bytes INT,
    audio_format TEXT,  -- webm, wav, m4a
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ INDEXES ============

CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_question_id ON assessments(question_id);
CREATE INDEX idx_assessments_created_at ON assessments(created_at);
CREATE INDEX idx_audio_recordings_assessment_id ON audio_recordings(assessment_id);
CREATE INDEX idx_audio_recordings_user_id ON audio_recordings(user_id);

-- Update timestamps on modifications
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
BEFORE UPDATE ON assessments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
