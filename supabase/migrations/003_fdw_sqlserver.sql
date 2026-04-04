-- ============ FOREIGN DATA WRAPPER (FDW) FOR SQL SERVER ============
-- This file contains sample SQL to set up FDW connection to SQL Server
-- NOTE: Execute this in Supabase PostgreSQL with appropriate permissions

-- Install FDW extension (may require superuser)
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Create foreign server connection to SQL Server
-- You'll need to adjust connection parameters for your SQL Server instance
CREATE SERVER IF NOT EXISTS mssql_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (
        host 'your-sqlserver-host',
        dbname 'your-database',
        port '1433'
    );

-- Create user mapping (for authentication)
CREATE USER MAPPING IF NOT EXISTS FOR current_user
    SERVER mssql_server
    OPTIONS (
        user 'sa',  -- SQL Server username
        password 'your_password'  -- SQL Server password
    );

-- ============ FOREIGN TABLES FOR EXAM QUESTIONS ============
-- This maps a SQL Server table for large question corpus

CREATE FOREIGN TABLE IF NOT EXISTS exam_questions_history (
    question_id INT,
    exam_year INT,
    exam_month TEXT,
    part INT,
    question_text TEXT,
    difficulty_level TEXT,
    created_at TIMESTAMP
)
    SERVER mssql_server
    OPTIONS (
        schema_name 'dbo',
        table_name 'ExamQuestions'
    );

-- Create index for better FDW performance
-- Note: FDW indexes are limited - use Postgres-side caching when possible

-- ============ MATERIALIZED VIEW FOR CACHING ============
-- Cache frequently accessed data from SQL Server locally

CREATE MATERIALIZED VIEW IF NOT EXISTS questions_with_history AS
SELECT 
    q.id,
    q.question_text,
    q.part,
    COUNT(eqh.question_id) as times_used,
    AVG(CASE WHEN a.overall_band >= 7.0 THEN 1 ELSE 0 END) as success_rate
FROM questions q
LEFT JOIN exam_questions_history eqh ON q.question_text ILIKE eqh.question_text
LEFT JOIN assessments a ON q.id = a.question_id
GROUP BY q.id;

-- Refresh materialized view periodically
CREATE OR REPLACE FUNCTION refresh_questions_cache()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY questions_with_history;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh_questions_cache', '0 2 * * *', 'SELECT refresh_questions_cache()');
