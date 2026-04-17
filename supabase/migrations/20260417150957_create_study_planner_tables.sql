/*
  # AI Study Planner - Database Schema

  ## Overview
  Creates the complete schema for the AI Study Planner application.

  ## New Tables

  ### study_plans
  - Top-level container for a user's study plan
  - `id` - UUID primary key
  - `user_id` - References auth.users
  - `title` - Plan name
  - `description` - Optional plan description
  - `status` - active | completed | paused

  ### subjects
  - Individual subjects within a study plan
  - `id` - UUID primary key
  - `plan_id` - References study_plans
  - `user_id` - References auth.users
  - `name` - Subject name
  - `goal` - Learning goal
  - `deadline` - Target completion date
  - `priority` - low | medium | high
  - `hours_per_day` - Daily study time commitment
  - `color` - UI color for the subject card
  - `total_hours` - Calculated total study hours
  - `completed_hours` - Tracked completed hours

  ### tasks
  - Individual study tasks generated for each subject
  - `id` - UUID primary key
  - `subject_id` - References subjects
  - `user_id` - References auth.users
  - `title` - Task name
  - `description` - Task details
  - `scheduled_date` - When to do this task
  - `duration_minutes` - Estimated time
  - `is_completed` - Completion status
  - `completed_at` - Completion timestamp
  - `task_type` - study | review | practice | assessment

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
*/

-- Study Plans table
CREATE TABLE IF NOT EXISTS study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own study plans"
  ON study_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study plans"
  ON study_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study plans"
  ON study_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study plans"
  ON study_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text DEFAULT '',
  deadline date NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  hours_per_day numeric(4,2) DEFAULT 2,
  color text DEFAULT 'blue',
  total_hours numeric(6,2) DEFAULT 0,
  completed_hours numeric(6,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects"
  ON subjects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects"
  ON subjects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  scheduled_date date NOT NULL,
  duration_minutes integer DEFAULT 60,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  task_type text DEFAULT 'study' CHECK (task_type IN ('study', 'review', 'practice', 'assessment')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_plan_id ON subjects(plan_id);
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_subject_id ON tasks(subject_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON tasks(is_completed);
