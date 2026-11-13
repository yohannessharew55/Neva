import React, { useState } from 'react';
import { Database, Copy, Check, Download, Terminal, Code2 } from 'lucide-react';

export const DatabaseSchemaView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sqlSchema = `-- ==============================================================================
-- LIVOTION: DELIBERATE MASTERY & HOLISTIC LIFE OPERATING SYSTEM
-- Database Schema & Comprehensive Seed Data (PostgreSQL DDL v2.0)
-- Based on the Apex Horizon System Architecture
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users & Core Profiles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    timezone VARCHAR(64) DEFAULT 'UTC',
    target_daily_calories INT DEFAULT 2400,
    target_protein_grams INT DEFAULT 170,
    target_carbs_grams INT DEFAULT 250,
    target_fats_grams INT DEFAULT 75,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Comprehensive Domain Enum
DO $$ BEGIN
    CREATE TYPE domain_enum AS ENUM (
        'PHYSICAL_FITNESS',
        'NUTRITION_MEALS',
        'DEVOTION_PRAYER',
        'FOREX_TRADING',
        'ARCHITECTURE_DESIGN',
        'SITE_SUPERVISION',
        'CHESS',
        'GUITAR',
        'OIL_PAINTING',
        'CONTENT_CREATION',
        'OPEN_MULTIPURPOSE',
        'RECREATION'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Domain Registry & Parameters
CREATE TABLE IF NOT EXISTS skill_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    domain_type domain_enum NOT NULL,
    title VARCHAR(100) NOT NULL,
    current_tier VARCHAR(50) DEFAULT 'Foundation',
    weekly_target_hours NUMERIC(4, 1) NOT NULL DEFAULT 5.0,
    accent_color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Daily Fitness Programming & Workout Logs
DO $$ BEGIN
    CREATE TYPE exercise_category AS ENUM (
        'STRENGTH_COMPOUND',
        'HYPERTROPHY',
        'ZONE_2_CARDIO',
        'HIIT',
        'MOBILITY_FLEXIBILITY',
        'ACTIVE_RECOVERY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS workout_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    workout_name VARCHAR(100) NOT NULL,
    exercise_type exercise_category NOT NULL,
    target_duration_minutes INT DEFAULT 60,
    movement_list JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Daily Meal Planning & Fuel Architecture
DO $$ BEGIN
    CREATE TYPE meal_type AS ENUM ('BREAKFAST', 'LUNCH', 'PRE_WORKOUT', 'POST_WORKOUT', 'DINNER', 'SNACK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    meal_category meal_type NOT NULL,
    meal_title VARCHAR(150) NOT NULL,
    scheduled_time TIME NOT NULL,
    calories INT NOT NULL,
    protein_g INT NOT NULL,
    carbs_g INT NOT NULL,
    fats_g INT NOT NULL,
    ingredients TEXT[],
    prep_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Planning Hierarchy (Yearly -> Quarterly -> Monthly -> Weekly)
DO $$ BEGIN
    CREATE TYPE horizon_level AS ENUM ('YEARLY', 'QUARTERLY', 'MONTHLY', 'WEEKLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS strategic_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES skill_domains(id) ON DELETE SET NULL,
    parent_goal_id UUID REFERENCES strategic_goals(id) ON DELETE CASCADE,
    horizon horizon_level NOT NULL,
    title VARCHAR(255) NOT NULL,
    target_metric VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tasks, Timeblocks & Daily Routines
DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('SPIRITUAL', 'DEEP_WORK', 'PHYSICAL', 'SITE_OPS', 'FLEX_BUFFER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS schedule_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES skill_domains(id) ON DELETE SET NULL,
    goal_id UUID REFERENCES strategic_goals(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    allocated_minutes INT NOT NULL,
    priority priority_level DEFAULT 'DEEP_WORK',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rrule TEXT,
    checklist JSONB DEFAULT '[]'::jsonb,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tracked Focus & Practice Sessions
CREATE TABLE IF NOT EXISTS practice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES skill_domains(id) ON DELETE CASCADE,
    task_id UUID REFERENCES schedule_tasks(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    actual_duration_seconds INT DEFAULT 0,
    flow_state_rating INT CHECK (flow_state_rating BETWEEN 1 AND 5),
    notes_markdown TEXT,
    metrics_snapshot JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Alarms, Reminders & Acoustic Triggers
CREATE TABLE IF NOT EXISTS alert_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES schedule_tasks(id) ON DELETE CASCADE,
    trigger_time TIMESTAMPTZ NOT NULL,
    sound_profile VARCHAR(50) DEFAULT 'CHIME_MEDITATION',
    is_persistent BOOLEAN DEFAULT TRUE,
    is_dismissed BOOLEAN DEFAULT FALSE
);

-- 10. Weekly & Monthly Feedback Retrospectives
CREATE TABLE IF NOT EXISTS feedback_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    horizon_reviewed horizon_level NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_hours_logged NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    hours_per_domain JSONB NOT NULL DEFAULT '{}'::jsonb,
    adherence_rates JSONB NOT NULL DEFAULT '{}'::jsonb,
    wins_summary TEXT,
    friction_points TEXT,
    adjustments_for_next_cycle TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSql = () => {
    const blob = new Blob([sqlSchema], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'livotion-schema-v2.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 text-zinc-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50 flex items-center gap-2">
            <Database className="text-cyan-400" /> Relational Database Schema (PostgreSQL DDL v2.0)
          </h2>
          <p className="text-zinc-400 text-sm mt-0.5">
            Located in <code className="text-cyan-300 font-mono text-xs">packages/database/schema.sql</code>. Ready for direct psql or Supabase migration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copied SQL' : 'Copy DDL'}
          </button>
          <button
            onClick={downloadSql}
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Download size={14} /> Download .sql
          </button>
        </div>
      </div>

      {/* Terminal Migration Instruction Box */}
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300 space-y-2">
        <div className="flex items-center gap-2 text-zinc-400 font-semibold">
          <Terminal size={14} className="text-cyan-400" /> PostgreSQL Command-line Migration Command:
        </div>
        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80 text-emerald-400 select-all overflow-x-auto">
          psql "$DATABASE_URL" -f packages/database/schema.sql
        </div>
      </div>

      {/* Code Viewer */}
      <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <Code2 size={14} className="text-cyan-400" /> packages/database/schema.sql
          </div>
          <span>PostgreSQL 14+</span>
        </div>
        <pre className="p-5 text-xs font-mono text-zinc-300 overflow-x-auto max-h-[600px] leading-relaxed select-text">
          <code>{sqlSchema}</code>
        </pre>
      </div>
    </div>
  );
};
