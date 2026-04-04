# Supabase Configuration

## Setup Instructions

### 1. Create Supabase Project
- Go to https://supabase.com
- Create new project
- Copy URL and API key to `.env`

### 2. Run Migrations

Execute migrations in order:

```sql
-- 1. Initial schema
psql -U postgres $SUPABASE_URL < migrations/001_initial_schema.sql

-- 2. RLS Policies
psql -U postgres $SUPABASE_URL < migrations/002_rls_policies.sql

-- 3. FDW (optional - only if using SQL Server)
psql -U postgres $SUPABASE_URL < migrations/003_fdw_sqlserver.sql
```

Or use the Supabase UI SQL editor to run each migration.

### 3. Storage Setup

Create a bucket in Supabase for audio storage:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', false);
```

### 4. Authentication

Enable Google OAuth in Supabase:
1. Go to Authentication > Providers
2. Enable Google
3. Add OAuth credentials
4. Update CORS settings

### 5. Environment Variables

Copy `.env.example` to `.env` and fill in:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_JWT_SECRET`

## RLS Policy Summary

| Table | User Can | Details |
|-------|----------|---------|
| user_profiles | Read own, Update own | Only their own profile |
| assessments | CRUD own | Only their own assessment history |
| audio_recordings | Read own, Delete own | Only their own recordings |
| questions | Read all (public) | No RLS - public reading |

## SQL Server Integration

If using Foreign Data Wrapper to SQL Server:

1. **Prerequisites**: FDW extension, network connectivity
2. **Server Credentials**: Update in `003_fdw_sqlserver.sql`
3. **Performance**: Cache frequently accessed data using materialized views
4. **Refresh**: Setup `pg_cron` for periodic cache refresh

## Monitoring

Check assessment statistics:

```sql
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_assessments,
    AVG(overall_band) as avg_band,
    MAX(overall_band) as max_band
FROM assessments
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

Check storage usage:

```sql
SELECT 
    user_id,
    COUNT(*) as recording_count,
    SUM(file_size_bytes) / 1024 / 1024 as storage_mb
FROM audio_recordings
GROUP BY user_id;
```
