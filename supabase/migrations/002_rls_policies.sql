-- ============ ROW LEVEL SECURITY (RLS) POLICIES ============
-- Enforce data isolation between users

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_recordings ENABLE ROW LEVEL SECURITY;
-- Don't enable RLS on questions (public read access)

-- ============ USER PROFILES RLS ============
-- Users can only access their own profile

CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles" ON user_profiles
    FOR INSERT
    WITH CHECK (true);  -- Backend service role only

-- ============ ASSESSMENTS RLS ============
-- Users can only access their own assessments

CREATE POLICY "Users can view their own assessments" ON assessments
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessments" ON assessments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments" ON assessments
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assessments" ON assessments
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============ AUDIO RECORDINGS RLS ============
-- Users can only access their own recordings

CREATE POLICY "Users can view their own audio recordings" ON audio_recordings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audio recordings" ON audio_recordings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Backend service can manage audio
CREATE POLICY "Service role can manage audio" ON audio_recordings
    FOR INSERT
    WITH CHECK (true);  -- Backend service role only

-- ============ QUESTIONS TABLE ============
-- Everyone can read questions (no RLS needed for this table)
-- Only admin/backend can insert/update
