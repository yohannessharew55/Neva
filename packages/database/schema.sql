-- ==============================================================================
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
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
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
);

-- ==============================================================================
-- LIVOTION REFERENCE SEED DATA
-- ==============================================================================

-- Seed Default User
INSERT INTO users (id, email, full_name, timezone, target_daily_calories, target_protein_grams, target_carbs_grams, target_fats_grams)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'mastery@livotion.app',
    'Livotion Practitioner',
    'UTC',
    2400,
    170,
    250,
    75
) ON CONFLICT (id) DO NOTHING;

-- Seed Skill Domains (11 Domains + Recreation)
INSERT INTO skill_domains (id, user_id, domain_type, title, current_tier, weekly_target_hours, accent_color, config) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'PHYSICAL_FITNESS', 'Physical Fitness & Conditioning', 'Tier 3 Mastery', 6.0, '#EF4444', '{"split": "Push-Pull-Legs-Upper-Lower-Conditioning", "default_gym_duration": 60}'::jsonb),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'NUTRITION_MEALS', 'Precision Nutrition & Meal Timing', 'Caloric Adherence', 3.5, '#10B981', '{"daily_calories": 2400, "protein_g": 170, "carbs_g": 250, "fats_g": 75}'::jsonb),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'DEVOTION_PRAYER', 'Devotion & Spiritual Anchor', 'Spiritual Core', 7.0, '#A855F7', '{"scripture_plan": "Proverbs + Romans", "prayer_duration_min": 45, "evening_examen": 30}'::jsonb),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'FOREX_TRADING', 'Forex Trading', 'Session Scalp', 10.0, '#059669', '{"sessions": ["London Open", "NY Overlap"], "pairs": ["EURUSD", "GBPUSD", "XAUUSD"]}'::jsonb),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'ARCHITECTURE_DESIGN', 'Architectural Design', 'Deep BIM/CAD', 15.0, '#3B82F6', '{"cad_tools": ["Revit", "Rhino", "AutoCAD"], "focus_deliverable": "Working Construction Details"}'::jsonb),
('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'SITE_SUPERVISION', 'Site Supervision & Field Ops', 'Field 2x/Wk', 5.0, '#F59E0B', '{"required_visits_per_week": 2, "audit_checklist": ["Reinforcement bars", "Pour inspection", "Safety audit"]}'::jsonb),
('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'CHESS', 'Chess Mastery', 'Tactics 2000+', 5.0, '#8B5CF6', '{"routine": "Tactics sprint, Rook endgames, Master game analysis"}'::jsonb),
('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'GUITAR', 'Guitar Deliberate Practice', 'Metronome Ladders', 5.0, '#EC4899', '{"bpm_range": "120-145 BPM", "arpeggios": "Major/Minor 7th", "repertoire": "Classical & Modern"}'::jsonb),
('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'OIL_PAINTING', 'Oil Painting & Fine Art', 'Atelier Studio', 8.0, '#E11D48', '{"technique": "Fat-over-lean", "mediums": "Liquin & Stand Oil", "canvas_in_progress": "Atmospheric Landscape"}'::jsonb),
('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'CONTENT_CREATION', 'Content Creation & Distribution', 'Multimedia Asset', 4.0, '#06B6D4', '{"channels": ["YouTube", "Architectural Journal", "X/Substack"]}'::jsonb),
('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'OPEN_MULTIPURPOSE', 'Open Multipurpose Buffer', 'Cognitive Slack', 5.0, '#64748B', '{"slots_daily": 2, "daily_slack_minutes": 75, "purpose": "Cognitive rest & friction prevention"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Seed 7-Day Workout Protocols
INSERT INTO workout_protocols (id, user_id, day_of_week, workout_name, exercise_type, target_duration_minutes, movement_list) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 1, 'Push Power & Calisthenics', 'STRENGTH_COMPOUND', 60, '[
  {"exercise": "Incline Dumbbell Bench Press", "sets": 4, "reps": "8-10", "rpe": 8, "notes": "Control 3-sec eccentric"},
  {"exercise": "Overhead Barbell Military Press", "sets": 3, "reps": "8", "rpe": 8, "notes": "Brace core tight"},
  {"exercise": "Weighted Dips", "sets": 3, "reps": "12", "rpe": 8.5, "notes": "Slight forward lean"},
  {"exercise": "Cable Lateral Raises", "sets": 4, "reps": "15", "rpe": 9, "notes": "Strict form at shoulder height"},
  {"exercise": "Core / Plank Matrix", "sets": 3, "reps": "60 sec holds", "rpe": 8, "notes": "Hollow body + side planks"}
]'::jsonb),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 2, 'Pull & Posterior Chain', 'STRENGTH_COMPOUND', 60, '[
  {"exercise": "Conventional Deadlift / RDL", "sets": 4, "reps": "6", "rpe": 8.5, "notes": "Solid hip hinge and lat engagement"},
  {"exercise": "Pull-ups (Pronated Grip)", "sets": 4, "reps": "Max", "rpe": 9, "notes": "Full dead-hang stretch"},
  {"exercise": "Chest-Supported Dumbbell Rows", "sets": 3, "reps": "10", "rpe": 8, "notes": "Pause 1 sec at peak contraction"},
  {"exercise": "Face Pulls with Rope", "sets": 4, "reps": "15", "rpe": 8, "notes": "External shoulder rotation"},
  {"exercise": "Incline Dumbbell Bicep Curls", "sets": 3, "reps": "12", "rpe": 8.5, "notes": "Supinate wrists at top"}
]'::jsonb),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 3, 'Zone 2 Cardio & Full Mobility', 'ZONE_2_CARDIO', 65, '[
  {"exercise": "Steady-State Rowing / Trail Run", "sets": 1, "reps": "45 min", "rpe": 6, "notes": "Maintain 65-75% HR max (aerobic baseline)"},
  {"exercise": "Hip 90/90 & Hamstring Mobility", "sets": 2, "reps": "10 min", "rpe": 5, "notes": "Deep diaphragmatic breathing"},
  {"exercise": "Thoracic Spine Extensions & Foam Rolling", "sets": 2, "reps": "10 min", "rpe": 5, "notes": "Decompress spine and lats"}
]'::jsonb),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 4, 'Leg Hypertrophy & Stability', 'HYPERTROPHY', 60, '[
  {"exercise": "Barbell Back Squats", "sets": 4, "reps": "8", "rpe": 8, "notes": "Below parallel, consistent tempo"},
  {"exercise": "Bulgarian Split Squats", "sets": 3, "reps": "10 / leg", "rpe": 8.5, "notes": "Quad and glute stabilization"},
  {"exercise": "Romanian Dumbbell Deadlifts", "sets": 3, "reps": "10", "rpe": 8, "notes": "Deep hamstring stretch"},
  {"exercise": "Standing Calf Raises", "sets": 4, "reps": "15", "rpe": 9, "notes": "2 sec pause at peak contraction"},
  {"exercise": "Hanging Leg Raises", "sets": 3, "reps": "12-15", "rpe": 8, "notes": "Control swing, posterior pelvic tilt"}
]'::jsonb),
('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 5, 'Upper Body Hypertrophy & Core', 'HYPERTROPHY', 55, '[
  {"exercise": "Neutral Grip Lat Pull-downs", "sets": 4, "reps": "10-12", "rpe": 8, "notes": "Full ROM, drive elbows down"},
  {"exercise": "Incline Dumbbell Press", "sets": 3, "reps": "10", "rpe": 8, "notes": "Upper clavicular pec activation"},
  {"exercise": "Cable Chest Flyes", "sets": 3, "reps": "12-15", "rpe": 8.5, "notes": "Squeeze pecs for 1 sec"},
  {"exercise": "Tricep Overhead Rope Extensions", "sets": 3, "reps": "12", "rpe": 8.5, "notes": "Full long-head tricep stretch"},
  {"exercise": "Ab Wheel Rollouts", "sets": 3, "reps": "10-12", "rpe": 8.5, "notes": "Full core brace"}
]'::jsonb),
('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 6, 'Explosive Ath-Conditioning & Sauna', 'HIIT', 45, '[
  {"exercise": "Kettlebell Swings", "sets": 5, "reps": "20", "rpe": 8.5, "notes": "Violent hip extension"},
  {"exercise": "Plyometric Box Jumps", "sets": 4, "reps": "8", "rpe": 8, "notes": "Soft landing, step down"},
  {"exercise": "Assault Bike Intervals", "sets": 10, "reps": "20s on / 40s off", "rpe": 9.5, "notes": "Max sprint effort"},
  {"exercise": "Contrast Sauna & Cold Shower", "sets": 3, "reps": "15m sauna / 2m cold", "rpe": 4, "notes": "Nervous system reset"}
]'::jsonb),
('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 7, 'Active Recovery & Restorative Walk', 'ACTIVE_RECOVERY', 60, '[
  {"exercise": "Outdoor Trail / Nature Walk", "sets": 1, "reps": "60 min", "rpe": 3, "notes": "Unplugged, parasympathetic focus"},
  {"exercise": "Full Body Gentle Foam Rolling", "sets": 1, "reps": "15 min", "rpe": 3, "notes": "Quads, calves, thoracic, glutes"},
  {"exercise": "Spinal Decompression Hangs", "sets": 3, "reps": "60 sec", "rpe": 3, "notes": "Breathe into lower back"}
]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Seed Precision Meal Plans (~2,400 kcal | 170g P | 250g C | 75g F)
INSERT INTO meal_plans (id, user_id, day_of_week, meal_category, meal_title, scheduled_time, calories, protein_g, carbs_g, fats_g, ingredients, prep_instructions) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 1, 'BREAKFAST', 'Post-Devotion Power Breakfast', '07:30:00', 520, 38, 54, 16, 
  ARRAY['3 pasture-raised eggs', '2 egg whites', 'Spinach', '80g rolled oats', 'Almond milk', 'Blueberries', 'Ceylon cinnamon', 'Black coffee'], 
  'Scramble eggs with fresh spinach in a drop of olive oil. Cook oats with almond milk, topped with fresh blueberries and Ceylon cinnamon.'),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 1, 'LUNCH', 'Midday High-Focus Lunch', '12:30:00', 610, 48, 58, 18, 
  ARRAY['180g grilled chicken breast', '150g steamed jasmine rice', 'Steamed broccoli & zucchini', '10ml extra virgin olive oil drizzle', 'Sea salt & lemon'], 
  'Grill seasoned chicken breast. Steam jasmine rice with broccoli and zucchini florets. Drizzle with extra virgin olive oil.'),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 1, 'PRE_WORKOUT', 'Pre-Workout Cognitive Sustenance', '16:30:00', 360, 24, 46, 8, 
  ARRAY['200g 0% Greek yogurt', '1 medium banana sliced', '15g raw almonds', '1 tsp raw organic honey'], 
  'Mix Greek yogurt with honey, slice banana over top, and sprinkle with crushed raw almonds for sustained ATP and clean carbohydrates.'),
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 1, 'DINNER', 'Post-Training Restorative Dinner', '19:45:00', 710, 52, 42, 28, 
  ARRAY['200g wild salmon fillet or lean grass-fed beef', 'Large arugula and cucumber salad', '1/2 ripe avocado', 'Balsamic reduction', '200g roasted baby red potatoes'], 
  'Pan-sear salmon or grass-fed beef. Roast baby potatoes in rosemary and sea salt. Toss arugula, cucumber, and avocado in balsamic glaze.'),
('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 1, 'SNACK', 'Hydration & Sleep Wind-Down Protocol', '21:45:00', 200, 8, 50, 5, 
  ARRAY['Chamomile & Tart Cherry infusion', '400mg Magnesium glycinate', 'Himalayan pink salt hydration', '5g Creatine monohydrate'], 
  'Brew tart cherry and chamomile tea. Take magnesium glycinate 45 minutes before sleep for optimal parasympathetic recovery and deep sleep cycles.')
ON CONFLICT (id) DO NOTHING;
