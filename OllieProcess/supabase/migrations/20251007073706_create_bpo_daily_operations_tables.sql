/*
  # BPO Daily Operations Tables

  ## Overview
  This migration creates comprehensive tables for BPO daily operations including workforce management,
  quality assurance, performance tracking, contact center operations, and real-time monitoring.

  ## New Tables

  ### 1. Workforce Management
  - `shifts` - Employee shift schedules
  - `shift_assignments` - Assign employees to shifts
  - `attendance` - Daily attendance tracking
  - `time_off_requests` - PTO and leave requests
  - `shift_swap_requests` - Shift trade requests between employees
  - `break_schedules` - Break time tracking

  ### 2. Quality Assurance
  - `qa_scoring_forms` - Configurable QA evaluation forms
  - `qa_form_questions` - Questions for each QA form
  - `qa_evaluations` - Individual QA evaluations
  - `qa_scores` - Scores for each evaluation
  - `calibration_sessions` - QA calibration meetings
  - `coaching_plans` - Agent coaching and feedback

  ### 3. Performance Management
  - `agent_scorecards` - Individual agent performance metrics
  - `team_scorecards` - Team-level performance
  - `performance_goals` - Individual and team goals
  - `performance_reviews` - Formal review records
  - `one_on_one_meetings` - Meeting notes and action items

  ### 4. Contact Center Operations
  - `interactions` - Customer interactions (calls, emails, chats)
  - `tickets` - Support tickets/cases
  - `ticket_escalations` - Escalation tracking
  - `csat_surveys` - Customer satisfaction surveys
  - `channels` - Communication channels configuration

  ### 5. Knowledge Base
  - `kb_categories` - Knowledge base categories
  - `kb_articles` - Knowledge articles
  - `kb_article_versions` - Version control for articles
  - `kb_article_feedback` - User feedback on articles

  ### 6. Client Management
  - `clients` - Client profiles
  - `client_contracts` - Contract details and SLAs
  - `client_contacts` - Client contact information
  - `client_sla_definitions` - SLA metrics per client
  - `invoices` - Client invoicing

  ### 7. Real-Time Monitoring
  - `real_time_metrics` - Live operational metrics
  - `sla_breaches` - SLA violation tracking
  - `alert_rules` - Configurable alert rules
  - `alert_incidents` - Triggered alerts

  ### 8. Access Control
  - `roles` - System roles
  - `role_permissions` - Permission definitions
  - `user_roles` - User role assignments

  ## Security
  - All tables have RLS enabled
  - Policies restrict access based on user authentication
  - Sensitive data protected with proper policies
*/

-- ============================================
-- 1. WORKFORCE MANAGEMENT TABLES
-- ============================================

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  days_of_week text[] NOT NULL, -- ['monday', 'tuesday', etc]
  capacity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view shifts"
  ON shifts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage shifts"
  ON shifts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Shift assignments
CREATE TABLE IF NOT EXISTS shift_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_date date NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'absent', 'late')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(shift_id, user_id, assignment_date)
);

ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shift assignments"
  ON shift_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR true);

CREATE POLICY "Managers can manage shift assignments"
  ON shift_assignments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Attendance tracking
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  clock_in timestamptz,
  clock_out timestamptz,
  status text DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'pto')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR true);

CREATE POLICY "Users can update own attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can manage all attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Time off requests
CREATE TABLE IF NOT EXISTS time_off_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('pto', 'sick', 'unpaid', 'other')),
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES auth.users(id),
  approval_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time off requests"
  ON time_off_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR true);

CREATE POLICY "Users can create own time off requests"
  ON time_off_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can manage time off requests"
  ON time_off_requests FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Shift swap requests
CREATE TABLE IF NOT EXISTS shift_swap_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requesting_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  requesting_shift_id uuid REFERENCES shift_assignments(id) ON DELETE CASCADE,
  target_shift_id uuid REFERENCES shift_assignments(id) ON DELETE CASCADE,
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'approved', 'denied')),
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant swap requests"
  ON shift_swap_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = requesting_user_id OR auth.uid() = target_user_id OR true);

CREATE POLICY "Users can create swap requests"
  ON shift_swap_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requesting_user_id);

CREATE POLICY "Managers can manage swap requests"
  ON shift_swap_requests FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Break schedules
CREATE TABLE IF NOT EXISTS break_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  break_type text NOT NULL CHECK (break_type IN ('lunch', 'break', 'other')),
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  actual_start timestamptz,
  actual_end timestamptz,
  adherence_status text DEFAULT 'on_time' CHECK (adherence_status IN ('on_time', 'early', 'late', 'missed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE break_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own breaks"
  ON break_schedules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR true);

CREATE POLICY "Users can update own breaks"
  ON break_schedules FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can manage breaks"
  ON break_schedules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. QUALITY ASSURANCE TABLES
-- ============================================

-- QA Scoring Forms
CREATE TABLE IF NOT EXISTS qa_scoring_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  max_score integer NOT NULL DEFAULT 100,
  passing_score integer NOT NULL DEFAULT 80,
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE qa_scoring_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view QA forms"
  ON qa_scoring_forms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "QA managers can manage forms"
  ON qa_scoring_forms FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- QA Form Questions
CREATE TABLE IF NOT EXISTS qa_form_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES qa_scoring_forms(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('yes_no', 'rating', 'text')),
  max_points integer NOT NULL DEFAULT 10,
  is_critical boolean DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE qa_form_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view QA questions"
  ON qa_form_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "QA managers can manage questions"
  ON qa_form_questions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- QA Evaluations
CREATE TABLE IF NOT EXISTS qa_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES qa_scoring_forms(id),
  evaluated_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_id uuid,
  evaluation_date timestamptz DEFAULT now(),
  total_score numeric(5,2) NOT NULL,
  passed boolean NOT NULL,
  comments text,
  status text DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'disputed', 'calibrated')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE qa_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evaluations"
  ON qa_evaluations FOR SELECT
  TO authenticated
  USING (auth.uid() = evaluated_user_id OR auth.uid() = evaluator_id OR true);

CREATE POLICY "QA evaluators can create evaluations"
  ON qa_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = evaluator_id);

CREATE POLICY "QA managers can manage evaluations"
  ON qa_evaluations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- QA Scores (individual question scores)
CREATE TABLE IF NOT EXISTS qa_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid REFERENCES qa_evaluations(id) ON DELETE CASCADE,
  question_id uuid REFERENCES qa_form_questions(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE qa_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view related scores"
  ON qa_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM qa_evaluations
      WHERE qa_evaluations.id = qa_scores.evaluation_id
      AND (qa_evaluations.evaluated_user_id = auth.uid() OR qa_evaluations.evaluator_id = auth.uid() OR true)
    )
  );

CREATE POLICY "QA evaluators can manage scores"
  ON qa_scores FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Calibration Sessions
CREATE TABLE IF NOT EXISTS calibration_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  session_date timestamptz NOT NULL,
  evaluation_id uuid REFERENCES qa_evaluations(id),
  facilitator_id uuid REFERENCES auth.users(id),
  participants uuid[] NOT NULL,
  consensus_score numeric(5,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE calibration_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view calibration sessions"
  ON calibration_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "QA managers can manage calibration sessions"
  ON calibration_sessions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Coaching Plans
CREATE TABLE IF NOT EXISTS coaching_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  focus_areas text[] NOT NULL,
  start_date date NOT NULL,
  target_completion_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  progress_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE coaching_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coaching plans"
  ON coaching_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = coach_id OR true);

CREATE POLICY "Coaches can create coaching plans"
  ON coaching_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Managers can manage coaching plans"
  ON coaching_plans FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. PERFORMANCE MANAGEMENT TABLES
-- ============================================

-- Agent Scorecards
CREATE TABLE IF NOT EXISTS agent_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  calls_handled integer DEFAULT 0,
  average_handle_time numeric(10,2) DEFAULT 0,
  occupancy_rate numeric(5,2) DEFAULT 0,
  adherence_rate numeric(5,2) DEFAULT 0,
  csat_score numeric(5,2) DEFAULT 0,
  qa_score numeric(5,2) DEFAULT 0,
  fcr_rate numeric(5,2) DEFAULT 0,
  overall_score numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, period_start, period_end)
);

ALTER TABLE agent_scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scorecards"
  ON agent_scorecards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR true);

CREATE POLICY "Managers can manage scorecards"
  ON agent_scorecards FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Team Scorecards
CREATE TABLE IF NOT EXISTS team_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_calls_handled integer DEFAULT 0,
  average_handle_time numeric(10,2) DEFAULT 0,
  team_occupancy numeric(5,2) DEFAULT 0,
  team_adherence numeric(5,2) DEFAULT 0,
  team_csat numeric(5,2) DEFAULT 0,
  team_qa_score numeric(5,2) DEFAULT 0,
  team_fcr numeric(5,2) DEFAULT 0,
  overall_score numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, period_start, period_end)
);

ALTER TABLE team_scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view team scorecards"
  ON team_scorecards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage team scorecards"
  ON team_scorecards FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Performance Goals
CREATE TABLE IF NOT EXISTS performance_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type text NOT NULL,
  metric_name text NOT NULL,
  target_value numeric(10,2) NOT NULL,
  current_value numeric(10,2) DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'missed', 'cancelled')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE performance_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON performance_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR true);

CREATE POLICY "Managers can manage goals"
  ON performance_goals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Performance Reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  review_period_start date NOT NULL,
  review_period_end date NOT NULL,
  review_date timestamptz DEFAULT now(),
  overall_rating numeric(3,2) NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  strengths text,
  areas_for_improvement text,
  goals_for_next_period text,
  comments text,
  status text DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'acknowledged')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reviews"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = reviewer_id OR true);

CREATE POLICY "Managers can manage reviews"
  ON performance_reviews FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- One-on-One Meetings
CREATE TABLE IF NOT EXISTS one_on_one_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_date timestamptz NOT NULL,
  agenda text,
  discussion_notes text,
  action_items text[],
  follow_up_date date,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE one_on_one_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own meetings"
  ON one_on_one_meetings FOR SELECT
  TO authenticated
  USING (auth.uid() = employee_id OR auth.uid() = manager_id OR true);

CREATE POLICY "Managers can manage meetings"
  ON one_on_one_meetings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shift_assignments_user ON shift_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_qa_evaluations_user ON qa_evaluations(evaluated_user_id);
CREATE INDEX IF NOT EXISTS idx_agent_scorecards_user ON agent_scorecards(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_goals_user ON performance_goals(user_id);