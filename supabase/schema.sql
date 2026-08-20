-- Migration: Create interview_history and resumes tables in Supabase PostgreSQL
-- Run this script in your Supabase SQL Editor (https://app.supabase.com -> Project -> SQL Editor)

-- 1. Create interview_history table
CREATE TABLE IF NOT EXISTS public.interview_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Interview',
    overall_score INTEGER DEFAULT 0,
    duration TEXT DEFAULT '0m',
    date TEXT,
    report_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create index on user_id and created_at for fast history queries
CREATE INDEX IF NOT EXISTS idx_interview_history_user_created 
ON public.interview_history(user_id, created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.interview_history ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies allowing authenticated and demo users to insert and read their own history
CREATE POLICY "Allow users to select their own interview history" 
ON public.interview_history 
FOR SELECT 
USING (auth.uid()::text = user_id OR user_id LIKE 'local-%' OR user_id LIKE 'demo-%');

CREATE POLICY "Allow users to insert their own interview history" 
ON public.interview_history 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'local-%' OR user_id LIKE 'demo-%');

CREATE POLICY "Allow users to delete their own interview history" 
ON public.interview_history 
FOR DELETE 
USING (auth.uid()::text = user_id OR user_id LIKE 'local-%' OR user_id LIKE 'demo-%');

-- 5. Create resumes table if not exists
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    phone TEXT,
    summary TEXT,
    skills JSONB,
    experience JSONB,
    education JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own resume" 
ON public.resumes 
FOR ALL 
USING (auth.uid()::text = user_id OR user_id LIKE 'local-%' OR user_id LIKE 'demo-%');
