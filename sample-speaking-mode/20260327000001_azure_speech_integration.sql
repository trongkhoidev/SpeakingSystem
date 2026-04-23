-- Migration: Add Azure Assessment data to speaking_answers
-- Date: 2026-03-27

ALTER TABLE speaking_answers 
ADD COLUMN IF NOT EXISTS azure_assessment JSONB DEFAULT NULL;

COMMENT ON COLUMN speaking_answers.azure_assessment IS 'Detailed pronunciation assessment data from Azure Speech API (scores, word-level highlights)';
