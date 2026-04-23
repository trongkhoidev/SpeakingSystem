-- MIGRATION: 20260325000000_speaking_practice.sql

-- 1. Create speaking_sessions table
CREATE TABLE IF NOT EXISTS public.speaking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.speaking_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own speaking sessions"
    ON public.speaking_sessions FOR ALL
    USING (auth.uid() = user_id);

-- 2. Create speaking_questions table
CREATE TABLE IF NOT EXISTS public.speaking_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.speaking_sessions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    order_index INT DEFAULT 0,
    part INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.speaking_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage questions of their sessions"
    ON public.speaking_questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.speaking_sessions
            WHERE speaking_sessions.id = speaking_questions.session_id
            AND speaking_sessions.user_id = auth.uid()
        )
    );

-- 3. Create speaking_answers table
CREATE TABLE IF NOT EXISTS public.speaking_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.speaking_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    audio_url TEXT,
    student_transcript TEXT,
    fluency_score NUMERIC(2,1),
    lexical_score NUMERIC(2,1),
    grammar_score NUMERIC(2,1),
    pronunciation_score NUMERIC(2,1),
    overall_band NUMERIC(2,1),
    feedback_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.speaking_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own speaking answers"
    ON public.speaking_answers FOR ALL
    USING (auth.uid() = user_id);

-- Storage bucket for audio (Optional, if we save audio)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('speaking_audios', 'speaking_audios', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload speaking audio" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'speaking_audios');

CREATE POLICY "Users can read own audio"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'speaking_audios' AND auth.uid() = owner);
