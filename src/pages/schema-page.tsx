/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { useState } from 'react';
import {
  Database, Table, Code, CheckCircle, AlertCircle, Copy, Check,
  Layers, ShieldCheck, Search, Sparkles, FileText, Sun, Calendar
} from 'lucide-react';

export type TableColumnSpec = {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  pk?: boolean;
  fk?: string;
  generated?: string;
  check?: string;
  required?: boolean;
};

export type TableSpec = {
  name: string;
  description: string;
  columns: TableColumnSpec[];
};

export type SchemaTodo = {
  location: string;
  todo: string;
  solution: string;
  benefit: string;
};

export type TabType = 'erd' | 'todos' | 'routines' | 'sql' | 'sample';

const SCHEMA_TODOS: SchemaTodo[] = [
  {
    location: "pets.pets",
    todo: "add default routine columns describing preferred routine times (wake up, breakfast, lunch, dinner, evening, bedtime)",
    solution: "Added TIME columns with sane defaults: wakeup_default_time ('07:00'), breakfast_default_time ('08:00'), lunch_default_time ('12:00'), dinner_default_time ('17:00'), evening_default_time ('19:00'), bedtime_default_time ('22:00').",
    benefit: "Enables natural language scheduling like 'Give medication WITH BREAKFAST' without hardcoding times in application code."
  },
  {
    location: "pets.pet_tasks",
    todo: "add task_priority column with strict enum constraints",
    solution: "Added task_priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (task_priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')).",
    benefit: "Allows mobile push notifications and task feeds to order urgent pet needs (e.g. insulin injections) above routine tasks."
  },
  {
    location: "pets.pet_task_schedule",
    todo: "add schedule_modifier, schedule_routine_periods, occurrences, and generated schedule_frequency_summary",
    solution: "Added schedule_modifier, schedule_routine_periods, occurrence bounds, and a STORED generated column schedule_frequency_summary.",
    benefit: "Supports complex veterinarian prescriptions (e.g. 'BEFORE BREAKFAST EVERY 1 DAY') with auto-formatted string summaries."
  },
  {
    location: "pets.v_pet_task_details",
    todo: "is_overdue dynamic computation relative to query execution time",
    solution: "Valid logic: (CURRENT_TIMESTAMP > pts.due_on AND pts.status NOT IN ('COMPLETED', 'SKIPPED', 'CANCELLED')).",
    benefit: "Evaluates task overdue status dynamically whenever queried without requiring background cron updates."
  },
  {
    location: "pets.pet_ownership",
    todo: "fix trailing comma syntax error in CHECK constraint",
    solution: "Removed trailing comma in ownership_type CHECK ('PRIMARY', 'CO_OWNER', 'FOSTER', 'CO_FOSTER', 'SITTER').",
    benefit: "Fixes PostgreSQL DDL syntax error during schema creation."
  },
  {
    location: "pets.pet_ownership",
    todo: "resolve is_current unique constraint and historical tracking issue",
    solution: "Replaced standard UNIQUE constraint with Partial Unique Index: unq_active_pet_ownership ON pets.pet_ownership (owner_id, pet_id, household_id) WHERE (is_current IS TRUE).",
    benefit: "Guarantees max 1 active owner record per pet/household while allowing unlimited historical entries without constraint conflicts."
  },
  {
    location: "pets.pet_ownership",
    todo: "automate is_current flag when ownership_started_at or ownership_ended_at updates",
    solution: "Added BEFORE INSERT OR UPDATE trigger sync_pet_ownership_is_current() that auto-evaluates is_current based on active timestamp windows.",
    benefit: "Ensures is_current is always mathematically synchronized without relying on application code logic."
  },
  {
    location: "pets.pets",
    todo: "make 'name' generated from first_name + middle_name + last_name",
    solution: "Used GENERATED ALWAYS AS (TRIM(CONCAT_WS(' ', first_name, NULLIF(middle_name, ''), last_name))) STORED.",
    benefit: "Guarantees name consistency automatically at database level."
  },
  {
    location: "pets.pets",
    todo: "make 'slug' generated from name",
    solution: "Used GENERATED ALWAYS AS (LOWER(REGEXP_REPLACE(TRIM(CONCAT_WS('-', first_name, NULLIF(middle_name, ''), last_name)), '[^a-zA-Z0-9]+', '-', 'g'))) STORED.",
    benefit: "Produces URL-safe unique slugs automatically whenever pet name details change."
  },
  {
    location: "pets.pet_tasks",
    todo: "enforce check on user_id ARRAY(UUID) truthy length",
    solution: "Fixed invalid syntax ARRAY(UUID) to UUID[] and added CHECK (cardinality(assigned_user_ids) > 0).",
    benefit: "Prevents empty user arrays from being persisted while supporting multi-owner task assignments."
  }
];

const TABLES_SPEC: TableSpec[] = [
  {
    name: "pets.pets",
    description: "Core record of pets managed in the system with routine schedule defaults",
    columns: [
      { name: "id", type: "UUID", pk: true, nullable: false, default: "gen_random_uuid()" },
      { name: "first_name", type: "VARCHAR(100)", required: true, nullable: false },
      { name: "middle_name", type: "VARCHAR(100)", nullable: true },
      { name: "last_name", type: "VARCHAR(100)", required: true, nullable: false },
      { name: "name", type: "VARCHAR(305)", generated: "STORED (Concat names)", nullable: true },
      { name: "slug", type: "VARCHAR(350)", generated: "STORED (URL Slug)", nullable: true },
      { name: "species", type: "VARCHAR(50)", required: true, nullable: false },
      { name: "breed", type: "VARCHAR(100)", nullable: true },
      { name: "birth_date", type: "DATE", nullable: true },
      { name: "current_weight_kg", type: "NUMERIC(5,2)", check: "current_weight_kg > 0", nullable: true },
      { name: "wakeup_default_time", type: "TIME", default: "'07:00:00'", nullable: true },
      { name: "breakfast_default_time", type: "TIME", default: "'08:00:00'", nullable: true },
      { name: "lunch_default_time", type: "TIME", default: "'12:00:00'", nullable: true },
      { name: "dinner_default_time", type: "TIME", default: "'17:00:00'", nullable: true },
      { name: "evening_default_time", type: "TIME", default: "'19:00:00'", nullable: true },
      { name: "bedtime_default_time", type: "TIME", default: "'22:00:00'", nullable: true },
      { name: "created_at", type: "TIMESTAMPTZ", default: "CURRENT_TIMESTAMP", nullable: false },
      { name: "updated_at", type: "TIMESTAMPTZ", default: "CURRENT_TIMESTAMP", nullable: false }
    ]
  },
  {
    name: "pets.pet_ownership",
    description: "Multi-tenant household & owner relationship mapping with historical tracking",
    columns: [
      { name: "id", type: "UUID", pk: true, nullable: false, default: "gen_random_uuid()" },
      { name: "owner_id", type: "UUID", fk: "auth.users(id)", required: true, nullable: false },
      { name: "pet_id", type: "UUID", fk: "pets.pets(id)", required: true, nullable: false },
      { name: "household_id", type: "UUID", required: true, nullable: false },
      { name: "household_name", type: "VARCHAR(100)", nullable: true },
      { name: "ownership_type", type: "VARCHAR(50)", check: "PRIMARY, CO_OWNER, FOSTER, CO_FOSTER, SITTER", nullable: false, default: "'PRIMARY'" },
      { name: "ownership_started_at", type: "TIMESTAMPTZ", default: "CURRENT_TIMESTAMP", nullable: false },
      { name: "ownership_ended_at", type: "TIMESTAMPTZ", nullable: true },
      { name: "is_current", type: "BOOLEAN", generated: "Auto via Trigger", nullable: true, default: "true" },
      { name: "created_at", type: "TIMESTAMPTZ", default: "CURRENT_TIMESTAMP", nullable: false },
      { name: "updated_at", type: "TIMESTAMPTZ", default: "CURRENT_TIMESTAMP", nullable: false }
    ]
  },
  {
    name: "pets.pet_tasks",
    description: "Task template definitions with priorities and recurring intervals",
    columns: [
      { name: "task_id", type: "UUID", pk: true, nullable: false, default: "gen_random_uuid()" },
      { name: "pet_id", type: "UUID", fk: "pets.pets(id)", required: true, nullable: false },
      { name: "assigned_user_ids", type: "UUID[]", required: true, check: "cardinality > 0", nullable: false },
      { name: "task_type", type: "VARCHAR(50)", check: "MEDICATION, FEEDING, VET_VISIT...", nullable: false },
      { name: "task_priority", type: "VARCHAR(20)", check: "CRITICAL, HIGH, MEDIUM, LOW", default: "'MEDIUM'", nullable: false },
      { name: "title", type: "VARCHAR(255)", required: true, nullable: false },
      { name: "description", type: "TEXT", nullable: true },
      { name: "product_name", type: "VARCHAR(100)", nullable: true },
      { name: "product_type", type: "VARCHAR(50)", nullable: true },
      { name: "total_amount_value", type: "NUMERIC(10,2)", nullable: true },
      { name: "total_amount_unit", type: "VARCHAR(50)", nullable: true },
      { name: "total_amount", type: "VARCHAR(100)", generated: "STORED (Stringified)", nullable: true },
      { name: "scheduled_at", type: "TIMESTAMPTZ", required: true, nullable: false },
      { name: "recurrence_interval", type: "INTERVAL", nullable: true },
      { name: "start_on", type: "TIMESTAMPTZ", default: "CURRENT_TIMESTAMP", nullable: false },
      { name: "stop_on", type: "TIMESTAMPTZ", nullable: true },
      { name: "status", type: "VARCHAR(20)", check: "PENDING, IN_PROGRESS, COMPLETED...", default: "'PENDING'", nullable: false }
    ]
  },
  {
    name: "pets.pet_task_schedule",
    description: "Individual task execution windows bound to pet routine periods",
    columns: [
      { name: "schedule_id", type: "UUID", pk: true, nullable: false, default: "gen_random_uuid()" },
      { name: "pet_id", type: "UUID", fk: "pets.pets(id)", required: true, nullable: false },
      { name: "task_id", type: "UUID", fk: "pets.pet_tasks(task_id)", required: true, nullable: false },
      { name: "responsible_owner_id", type: "UUID", fk: "auth.users(id)", nullable: true },
      { name: "due_on", type: "TIMESTAMPTZ", required: true, nullable: false, default: "CURRENT_TIMESTAMP" },
      { name: "due_on_leeway_prior", type: "INTERVAL", default: "'60 minutes'", nullable: false },
      { name: "due_on_leeway_post", type: "INTERVAL", default: "'60 minutes'", nullable: false },
      { name: "scheduled_time_range", type: "TSTZRANGE", generated: "STORED (tstzrange window)", nullable: true },
      { name: "schedule_modifier", type: "VARCHAR(10)", check: "WITH, BEFORE, AFTER, SCHEDULED, AT", default: "'SCHEDULED'", nullable: false },
      { name: "schedule_routine_periods", type: "VARCHAR(30)", check: "WAKE UP, BED TIME, BREAKFAST...", default: "'SCHEDULED'", nullable: false },
      { name: "schedule_occurrence_per_period", type: "INTEGER", check: "between 1 and 998", default: "1", nullable: false },
      { name: "schedule_occurrence_mode", type: "VARCHAR(20)", check: "EVERY, ALTERNATING", default: "'EVERY'", nullable: false },
      { name: "schedule_period_unit", type: "VARCHAR(20)", check: "DAY, WEEK, MONTH, YEAR", default: "'DAY'", nullable: false },
      { name: "schedule_frequency_summary", type: "VARCHAR(255)", generated: "STORED (Human string)", nullable: true },
      { name: "status", type: "VARCHAR(20)", check: "PENDING, COMPLETED, OVERDUE...", default: "'PENDING'", nullable: false },
      { name: "delivered_amount_value", type: "NUMERIC(10,2)", nullable: true },
      { name: "delivered_amount_unit", type: "VARCHAR(50)", nullable: true },
      { name: "delivered_amount", type: "VARCHAR(100)", generated: "STORED", nullable: true },
      { name: "expected_amount_value", type: "NUMERIC(10,2)", nullable: true },
      { name: "expected_amount_unit", type: "VARCHAR(50)", nullable: true },
      { name: "expected_amount", type: "VARCHAR(100)", generated: "STORED", nullable: true }
    ]
  },
  {
    name: "pets.pet_task_actions",
    description: "Audit trail logging user activities and status modifications",
    columns: [
      { name: "action_id", type: "UUID", pk: true, nullable: false, default: "gen_random_uuid()" },
      { name: "schedule_id", type: "UUID", fk: "pets.pet_task_schedule(schedule_id)", nullable: false },
      { name: "pet_id", type: "UUID", fk: "pets.pets(id)", nullable: false },
      { name: "user_id", type: "UUID", fk: "auth.users(id)", nullable: false },
      { name: "action_name", type: "VARCHAR(50)", check: "CREATED, SCHEDULED, COMPLETED...", nullable: false },
      { name: "user_comment", type: "TEXT", nullable: true },
      { name: "task_amount_value", type: "NUMERIC(10,2)", default: "0.00", nullable: true },
      { name: "task_amount_unit", type: "VARCHAR(50)", default: "'N/A'", nullable: true },
      { name: "created_at", type: "TIMESTAMPTZ", default: "CURRENT_TIMESTAMP", nullable: false },
      { name: "updated_at", type: "TIMESTAMPTZ", default: "CURRENT_TIMESTAMP", nullable: false }
    ]
  }
];

const PRODUCTION_SQL = `-- PostgreSQL Production DDL Script for Pet Management & Task System
CREATE SCHEMA IF NOT EXISTS pets;

COMMENT ON SCHEMA pets IS 'PostgreSQL Production DDL Script for Pet Management & Task System';

-- ============================================================================
-- 1. PETS TABLE WITH DEFAULT ROUTINE TIMES
-- ============================================================================
CREATE TABLE IF NOT EXISTS pets.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  name VARCHAR(305) GENERATED ALWAYS AS (
    TRIM(
      CONCAT_WS(
        ' ',
        first_name,
        NULLIF(middle_name, ''),
        last_name
      )
    )
  ) STORED,
  slug VARCHAR(350) GENERATED ALWAYS AS (
    LOWER(
      REGEXP_REPLACE(
        TRIM(
          CONCAT_WS(
            '-',
            first_name,
            NULLIF(middle_name, ''),
            last_name
          )
        ),
        '[^a-zA-Z0-9]+',
        '-',
        'g'
      )
    )
  ) STORED,
  species VARCHAR(50) NOT NULL,
  breed VARCHAR(100),
  birth_date DATE,
  current_weight_kg NUMERIC(5, 2) CHECK (current_weight_kg > 0),
  
  -- Preferred Pet Routine Schedule Defaults
  wakeup_default_time TIME DEFAULT '07:00:00',
  breakfast_default_time TIME DEFAULT '08:00:00',
  lunch_default_time TIME DEFAULT '12:00:00',
  dinner_default_time TIME DEFAULT '17:00:00',
  evening_default_time TIME DEFAULT '19:00:00',
  bedtime_default_time TIME DEFAULT '22:00:00',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pets.pets IS 'Core pet registry containing details and default daily routine schedules';

-- ============================================================================
-- 2. PET OWNERSHIP & HOUSEHOLD TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pets.pet_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets.pets (id) ON DELETE CASCADE,
  household_id UUID NOT NULL,
  household_name VARCHAR(100),
  ownership_type VARCHAR(50) NOT NULL DEFAULT 'PRIMARY' CHECK (
    ownership_type IN (
      'PRIMARY',
      'CO_OWNER',
      'FOSTER',
      'CO_FOSTER',
      'SITTER'
    )
  ),
  ownership_started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ownership_ended_at TIMESTAMPTZ,
  is_current BOOLEAN DEFAULT TRUE, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pet_ownership_owner_id ON pets.pet_ownership (owner_id);
CREATE INDEX IF NOT EXISTS idx_pet_ownership_household_id ON pets.pet_ownership (household_id);

CREATE UNIQUE INDEX IF NOT EXISTS unq_active_pet_ownership 
  ON pets.pet_ownership (owner_id, pet_id, household_id) 
  WHERE (is_current IS TRUE);

-- Auto-synchronize is_current based on active dates
CREATE OR REPLACE FUNCTION pets.sync_pet_ownership_is_current()
RETURNS TRIGGER AS $$
BEGIN
    NEW.is_current := (
        (NEW.ownership_started_at <= CURRENT_TIMESTAMP)
        AND (NEW.ownership_ended_at IS NULL OR NEW.ownership_ended_at > CURRENT_TIMESTAMP)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_pet_ownership_is_current
BEFORE INSERT OR UPDATE ON pets.pet_ownership
FOR EACH ROW
EXECUTE FUNCTION pets.sync_pet_ownership_is_current();

-- Materialized View for Households
CREATE MATERIALIZED VIEW IF NOT EXISTS pets.pet_household AS
SELECT
  po.household_id,
  p.id AS pet_id,
  p.name AS pet_name,
  p.species,
  p.breed,
  p.breakfast_default_time,
  p.dinner_default_time,
  po.owner_id,
  po.ownership_type,
  po.is_current,
  po.household_name,
  p.created_at AS pet_created_at
FROM
  pets.pets p
  JOIN pets.pet_ownership po ON p.id = po.pet_id;

CREATE UNIQUE INDEX IF NOT EXISTS unq_pet_household_idx 
  ON pets.pet_household (household_id, pet_id, owner_id, ownership_type, is_current);

-- ============================================================================
-- 3. PET TASKS TEMPLATE TABLE WITH PRIORITY
-- ============================================================================
CREATE TABLE IF NOT EXISTS pets.pet_tasks (
  task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets.pets (id) ON DELETE CASCADE,
  assigned_user_ids UUID[] NOT NULL CHECK (cardinality(assigned_user_ids) > 0),
  task_type VARCHAR(50) NOT NULL CHECK (
    task_type IN (
      'MEDICATION',
      'FEEDING',
      'VET_VISIT',
      'GROOMING',
      'EXERCISE',
      'SUPPLEMENT',
      'OTHER'
    )
  ),
  task_priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (
    task_priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')
  ),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  product_name VARCHAR(100),
  product_type VARCHAR(50),
  total_amount_value NUMERIC(10, 2),
  total_amount_unit VARCHAR(50),
  total_amount VARCHAR(100) GENERATED ALWAYS AS (
    CASE
      WHEN total_amount_value IS NOT NULL AND total_amount_unit IS NOT NULL 
        THEN total_amount_value::text || ' ' || total_amount_unit
      WHEN total_amount_value IS NOT NULL THEN total_amount_value::text
      ELSE NULL
    END
  ) STORED,
  scheduled_at TIMESTAMPTZ NOT NULL,
  recurrence_interval INTERVAL,
  start_on TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  stop_on TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
    status IN (
      'PENDING',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'FAILED'
    )
  ),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_pet_id ON pets.pet_tasks (pet_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON pets.pet_tasks (task_priority);

-- ============================================================================
-- 4. TASK SCHEDULE OCCURRENCES & ROUTINE PERIODS
-- ============================================================================
CREATE TABLE IF NOT EXISTS pets.pet_task_schedule (
  schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets.pets (id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES pets.pet_tasks (task_id) ON DELETE CASCADE,
  responsible_owner_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  due_on TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_on_leeway_prior INTERVAL NOT NULL DEFAULT INTERVAL '60 minutes',
  due_on_leeway_post INTERVAL NOT NULL DEFAULT INTERVAL '60 minutes',
  scheduled_time_range TSTZRANGE GENERATED ALWAYS AS (
    tstzrange (
      due_on - due_on_leeway_prior,
      due_on + due_on_leeway_post,
      '[]'
    )
  ) STORED,
  
  -- Routine Scheduling Modifiers
  schedule_modifier VARCHAR(10) NOT NULL DEFAULT 'SCHEDULED' CHECK (
    schedule_modifier IN ('WITH', 'BEFORE', 'AFTER', 'SCHEDULED', 'AT')
  ),
  schedule_routine_periods VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED' CHECK (
    schedule_routine_periods IN (
      'WAKE UP',
      'BED TIME',
      'WITH ALL ACTIVITIES',
      'MORNING ACTIVITY',
      'AFTERNOON ACTIVITY',
      'EVENING ACTIVITY',
      'MORNING',
      'AFTERNOON',
      'EVENING',
      'ALL MEALS',
      'BREAKFAST',
      'LUNCH',
      'DINNER',
      'TIME'
    )
  ),
  schedule_occurrence_per_period INTEGER NOT NULL DEFAULT 1 CHECK (
    schedule_occurrence_per_period > 0 AND schedule_occurrence_per_period < 999
  ),
  schedule_occurrence_mode VARCHAR(20) NOT NULL DEFAULT 'EVERY' CHECK (
    schedule_occurrence_mode IN ('EVERY', 'ALTERNATING')
  ),
  schedule_period_unit VARCHAR(20) NOT NULL DEFAULT 'DAY' CHECK (
    schedule_period_unit IN ('DAY', 'WEEK', 'MONTH', 'YEAR')
  ),
  schedule_frequency_summary VARCHAR(255) GENERATED ALWAYS AS (
    TRIM(
      CONCAT_WS(
        ' ',
        schedule_modifier,
        schedule_routine_periods,
        '(' || schedule_occurrence_mode || ' ' || schedule_occurrence_per_period::text || ' ' || schedule_period_unit || ')'
      )
    )
  ) STORED,

  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
    status IN (
      'PENDING',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'SKIPPED',
      'OVERDUE'
    )
  ),
  delivered_amount_value NUMERIC(10, 2),
  delivered_amount_unit VARCHAR(50),
  delivered_amount VARCHAR(100) GENERATED ALWAYS AS (
    CASE
      WHEN delivered_amount_value IS NOT NULL AND delivered_amount_unit IS NOT NULL 
        THEN delivered_amount_value::text || ' ' || delivered_amount_unit
      WHEN delivered_amount_value IS NOT NULL THEN delivered_amount_value::text
      ELSE NULL
    END
  ) STORED,
  expected_amount_value NUMERIC(10, 2),
  expected_amount_unit VARCHAR(50),
  expected_amount VARCHAR(100) GENERATED ALWAYS AS (
    CASE
      WHEN expected_amount_value IS NOT NULL AND expected_amount_unit IS NOT NULL 
        THEN expected_amount_value::text || ' ' || expected_amount_unit
      WHEN expected_amount_value IS NOT NULL THEN expected_amount_value::text
      ELSE NULL
    END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_schedule_due ON pets.pet_task_schedule (due_on, status);
CREATE INDEX IF NOT EXISTS idx_task_schedule_range ON pets.pet_task_schedule USING GIST (scheduled_time_range);

-- ============================================================================
-- 5. TASK ACTION AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pets.pet_task_actions (
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES pets.pet_task_schedule (schedule_id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets.pets (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  action_name VARCHAR(50) NOT NULL CHECK (
    action_name IN (
      'CREATED',
      'SCHEDULED',
      'RESCHEDULED',
      'REASSIGNED',
      'STARTED',
      'COMPLETED',
      'SKIPPED',
      'CANCELLED',
      'BLOCKED'
    )
  ),
  user_comment TEXT,
  task_amount_value NUMERIC(10, 2) DEFAULT 0.00,
  task_amount_unit VARCHAR(50) DEFAULT 'N/A',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. UNIFIED VIEW FOR TASK DETAILS & OVERDUE EVALUATION
-- ============================================================================
CREATE OR REPLACE VIEW pets.v_pet_task_details AS
SELECT
  pts.schedule_id,
  pts.due_on,
  pts.status AS schedule_status,
  pts.scheduled_time_range,
  pts.schedule_modifier,
  pts.schedule_routine_periods,
  pts.schedule_frequency_summary,
  
  -- Dynamic overdue logic relative to query execution time
  (
    CURRENT_TIMESTAMP > pts.due_on
    AND pts.status NOT IN ('COMPLETED', 'SKIPPED', 'CANCELLED')
  ) AS is_overdue,
  
  p.id AS pet_id,
  p.name AS pet_name,
  p.slug AS pet_slug,
  p.species,
  p.wakeup_default_time,
  p.breakfast_default_time,
  p.dinner_default_time,
  p.bedtime_default_time,
  
  pt.task_id,
  pt.title AS task_title,
  pt.task_type,
  pt.task_priority,
  pt.total_amount,
  pts.expected_amount,
  pts.delivered_amount,
  pts.responsible_owner_id,
  (
    SELECT action_name
    FROM pets.pet_task_actions pta
    WHERE pta.schedule_id = pts.schedule_id
    ORDER BY pta.created_at DESC
    LIMIT 1
  ) AS last_action_taken
FROM
  pets.pet_task_schedule pts
  JOIN pets.pets p ON pts.pet_id = p.id
  JOIN pets.pet_tasks pt ON pts.task_id = pt.task_id;

COMMENT ON VIEW pets.v_pet_task_details IS 'Dynamic task view with pet routine preferences, priority, and real-time overdue checking';
`;

const SAMPLE_QUERIES_SQL = `-- SAMPLE DATA INSERTS & TEST QUERIES WITH PRIORITY & ROUTINES

-- 1. Insert Pet with Default Routine Preferences
INSERT INTO pets.pets (
    first_name, 
    last_name, 
    species, 
    breed, 
    breakfast_default_time, 
    dinner_default_time
) VALUES (
    'Barnaby',
    'Barkington',
    'Dog',
    'Golden Retriever',
    '08:30:00',
    '18:30:00'
) RETURNING id, name, slug, breakfast_default_time;

-- 2. Insert Task Template with Priority
INSERT INTO pets.pet_tasks (
    pet_id,
    assigned_user_ids,
    task_type,
    task_priority,
    title,
    product_name,
    total_amount_value,
    total_amount_unit,
    scheduled_at
) VALUES (
    (SELECT id FROM pets.pets WHERE slug = 'barnaby-barkington' LIMIT 1),
    ARRAY['11111111-1111-1111-1111-111111111111'::uuid],
    'MEDICATION',
    'CRITICAL',
    'Insulin Injection',
    'Caninsulin',
    2.50,
    'units',
    NOW() + INTERVAL '30 minutes'
) RETURNING task_id, title, task_priority, total_amount;

-- 3. Schedule Task tied to Pet Routine Period
INSERT INTO pets.pet_task_schedule (
    pet_id,
    task_id,
    due_on,
    schedule_modifier,
    schedule_routine_periods,
    schedule_occurrence_per_period,
    schedule_occurrence_mode,
    schedule_period_unit
) VALUES (
    (SELECT id FROM pets.pets WHERE slug = 'barnaby-barkington' LIMIT 1),
    (SELECT task_id FROM pets.pet_tasks WHERE title = 'Insulin Injection' LIMIT 1),
    NOW() - INTERVAL '10 minutes', -- Intentionally set in past to trigger is_overdue
    'BEFORE',
    'BREAKFAST',
    1,
    'EVERY',
    'DAY'
) RETURNING schedule_id, schedule_frequency_summary;

-- 4. Query Task View with Priority and Routine Times
SELECT 
    task_title,
    task_priority,
    pet_name,
    breakfast_default_time,
    schedule_frequency_summary,
    schedule_status,
    is_overdue
FROM pets.v_pet_task_details;
`;

export function SchemaPage() {
  const [activeTab, setActiveTab] = useState<TabType>('erd');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>(TABLES_SPEC[0].name);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredTables = TABLES_SPEC.filter(table =>
    table.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    table.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
    table.columns.some(col => col.name.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const activeTableObj = TABLES_SPEC.find(t => t.name === selectedTable) || TABLES_SPEC[0];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col" >
      {/* Header Bar */}
      < header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" >
        <div className="flex items-center space-x-3" >
          <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30" >
            <Database className="w-6 h-6" />
          </div>
          < div >
            <h1 className="text-xl font-bold text-white flex items-center gap-2" >
              PostgreSQL Pet Task Schema
              < span className="text-xs font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full" >
                TypeScript Ready
              </span>
            </h1>
            < p className="text-xs text-slate-400" > PostgreSQL 13 + DDL • Daily Pet Routines • Task Priority Enums • Routine Modifiers </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs sm:text-sm" >
          <button
            onClick={() => setActiveTab('erd')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition ${activeTab === 'erd' ? 'bg-indigo-600 text-white font-medium shadow' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Layers className="w-4 h-4" />
            <span>Schema Spec </span>
          </button>
          < button
            onClick={() => setActiveTab('routines')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition ${activeTab === 'routines' ? 'bg-indigo-600 text-white font-medium shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Sun className="w-4 h-4 text-amber-400" />
            <span>Pet Routines & Priority </span>
          </button>
          < button
            onClick={() => setActiveTab('todos')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition ${activeTab === 'todos' ? 'bg-indigo-600 text-white font-medium shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>TODOs({SCHEMA_TODOS.length}) </span>
          </button>
          < button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition ${activeTab === 'sql' ? 'bg-indigo-600 text-white font-medium shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Code className="w-4 h-4" />
            <span>DDL Script </span>
          </button>
          < button
            onClick={() => setActiveTab('sample')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition ${activeTab === 'sample' ? 'bg-indigo-600 text-white font-medium shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <FileText className="w-4 h-4" />
            <span>Sample Queries </span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto" >
        {/* TAB 1: SCHEMA SPEC & TABLE EXPLORER */}
        {
          activeTab === 'erd' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" >
              <div className="lg:col-span-4 space-y-4" >
                <div className="relative" >
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filter tables or columns..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                < div className="space-y-2" >
                  {
                    filteredTables.map((table) => (
                      <button
                        key={table.name}
                        onClick={() => setSelectedTable(table.name)}
                        className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${selectedTable === table.name
                          ? 'bg-slate-800/90 border-indigo-500/50 text-white shadow-lg'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                      >
                        <div>
                          <div className="flex items-center space-x-2" >
                            <Table className="w-4 h-4 text-indigo-400" />
                            <span className="font-mono font-semibold text-sm" > {table.name} </span>
                          </div>
                          < p className="text-xs text-slate-500 mt-1 line-clamp-1" > {table.description} </p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              < div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-6" >
                <div className="border-b border-slate-800 pb-4 mb-6 flex items-start justify-between" >
                  <div>
                    <h2 className="text-lg font-mono font-bold text-indigo-400 flex items-center gap-2" >
                      <Table className="w-5 h-5 text-indigo-400" />
                      {activeTableObj.name}
                    </h2>
                    < p className="text-sm text-slate-400 mt-1" > {activeTableObj.description} </p>
                  </div>
                  < span className="text-xs font-mono bg-slate-800 px-3 py-1 rounded-full text-slate-300" >
                    {activeTableObj.columns.length} columns
                  </span>
                </div>

                < div className="overflow-x-auto" >
                  <table className="w-full text-left text-sm border-collapse" >
                    <thead>
                      <tr className="border-b border-slate-800 text-xs uppercase text-slate-500 tracking-wider" >
                        <th className="py-2.5 px-3" > Column </th>
                        < th className="py-2.5 px-3" > Data Type </th>
                        < th className="py-2.5 px-3" > Constraints & Attributes </th>
                      </tr>
                    </thead>
                    < tbody className="divide-y divide-slate-800/60 font-mono text-xs" >
                      {
                        activeTableObj.columns.map((col: TableColumnSpec) => (
                          <tr key={col.name} className="hover:bg-slate-900/50" >
                            <td className="py-3 px-3 font-medium text-slate-200 flex items-center gap-2" >
                              {col.pk && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
                              {col.fk && <Layers className="w-3.5 h-3.5 text-cyan-400" />}
                              {col.name}
                            </td>
                            < td className="py-3 px-3 text-indigo-300" > {col.type} </td>
                            < td className="py-3 px-3 text-slate-400 space-x-1.5" >
                              {col.pk && <span className="bg-amber-400/10 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded"> PRIMARY KEY</ span >}
                              {col.fk && <span className="bg-cyan-400/10 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 rounded" > FK: {col.fk} </span>}
                              {col.required && <span className="bg-rose-400/10 text-rose-300 border border-rose-400/30 px-2 py-0.5 rounded" > NOT NULL </span>}
                              {col.default && <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded" > DEFAULT {col.default} </span>}
                              {col.generated && <span className="bg-purple-400/10 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded" > {col.generated} </span>}
                              {col.check && <span className="bg-emerald-400/10 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded" > CHECK({col.check}) </span>}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        {/* TAB 2: ROUTINES & PRIORITY LOGIC */}
        {
          activeTab === 'routines' && (
            <div className="space-y-6" >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" >
                {/* Pet Routine Default Times */}
                < div className="bg-slate-950 border border-slate-800 rounded-2xl p-6" >
                  <div className="flex items-center space-x-3 mb-4" >
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg" >
                      <Sun className="w-5 h-5" />
                    </div>
                    < div >
                      <h3 className="font-bold text-white" > Pets Routine Schedule Defaults </h3>
                      < p className="text-xs text-slate-400" > Stored on pets.pets table </p>
                    </div>
                  </div>
                  < p className="text-xs text-slate-300 mb-4 leading-relaxed" >
                    Instead of forcing pet owners to pick arbitrary clock times for daily tasks, pets store customizable routine preferences:
                  </p>
                  < div className="grid grid-cols-2 gap-3 font-mono text-xs" >
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between" >
                      <span className="text-slate-400" > wakeup </span>
                      < span className="text-amber-300 font-bold" >07:00:00 </span>
                    </div>
                    < div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between" >
                      <span className="text-slate-400" > breakfast </span>
                      < span className="text-amber-300 font-bold" >08:00:00 </span>
                    </div>
                    < div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between" >
                      <span className="text-slate-400" > lunch </span>
                      < span className="text-amber-300 font-bold" > 12:00:00 </span>
                    </div>
                    < div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between" >
                      <span className="text-slate-400" > dinner </span>
                      < span className="text-amber-300 font-bold" > 17:00:00 </span>
                    </div>
                    < div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between" >
                      <span className="text-slate-400" > evening </span>
                      < span className="text-amber-300 font-bold" > 19:00:00 </span>
                    </div>
                    < div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between" >
                      <span className="text-slate-400" > bedtime </span>
                      < span className="text-amber-300 font-bold" > 22:00:00 </span>
                    </div>
                  </div>
                </div>

                {/* Task Priority Enums */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6" >
                  <div className="flex items-center space-x-3 mb-4" >
                    <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg" >
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    < div >
                      <h3 className="font-bold text-white" > Task Priority Rules </h3>
                      < p className="text-xs text-slate-400" > Stored on pets.pet_tasks table </p>
                    </div>
                  </div>
                  < div className="space-y-3 font-mono text-xs" >
                    <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-lg flex items-center justify-between" >
                      <span className="text-rose-300 font-bold" > CRITICAL </span>
                      < span className="text-slate-400 text-right" > Insulin, post - surgery meds, urgent care </span>
                    </div>
                    < div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-center justify-between" >
                      <span className="text-amber-300 font-bold" > HIGH </span>
                      < span className="text-slate-400 text-right" > Daily feeding, heartworm chewables </span>
                    </div>
                    < div className="bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-lg flex items-center justify-between" >
                      <span className="text-indigo-300 font-bold" > MEDIUM(Default) </span>
                      < span className="text-slate-400 text-right" > Daily walks, grooming, supplements </span>
                    </div>
                    < div className="bg-slate-800 border border-slate-700 p-3 rounded-lg flex items-center justify-between" >
                      <span className="text-slate-300 font-bold" > LOW </span>
                      < span className="text-slate-400 text-right" > Nail clipping, bath time, weighing </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Routine Schedule Modifiers & Generated Summaries */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6" >
                <h3 className="font-bold text-white mb-2 flex items-center gap-2" >
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  Routine Schedule Modifiers & Auto - Generated Frequency String
                </h3>
                < p className="text-xs text-slate-400 mb-4" >
                  The < code className="text-indigo-300" > schedule_frequency_summary </code> STORED column combines schedule modifiers, period units, and routine period targets:
                </p>

                < div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 font-mono text-xs space-y-3" >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2" >
                    <span className="text-slate-400" > Modifier Examples: </span>
                    < span className="text-emerald-400" > BEFORE, AFTER, WITH, AT, SCHEDULED </span>
                  </div>
                  < div className="flex items-center justify-between border-b border-slate-800 pb-2" >
                    <span className="text-slate-400" > Routine Periods: </span>
                    < span className="text-emerald-400" > BREAKFAST, DINNER, BED TIME, ALL MEALS, MORNING ACTIVITY </span>
                  </div>
                  < div className="flex items-center justify-between" >
                    <span className="text-slate-400" > Calculated STORED Output: </span>
                    < span className="text-purple-300 font-bold" > "BEFORE BREAKFAST (EVERY 1 DAY)" </span>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* TAB 3: TODO SOLUTIONS */}
        {
          activeTab === 'todos' && (
            <div className="space-y-4" >
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between" >
                <div className="flex items-center space-x-3" >
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-300" > All Inline TODO Items Resolved </h3>
                    < p className="text-xs text-emerald-400/80" >
                      Includes pet routines, task priorities, schedule routine modifiers, partial indexes, and dynamic overdue evaluations.
                    </p>
                  </div>
                </div>
              </div>

              < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >
                {
                  SCHEMA_TODOS.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition" >
                      <div className="flex items-center justify-between mb-2" >
                        <span className="text-xs font-mono bg-slate-800 text-indigo-400 px-2.5 py-1 rounded-md border border-slate-700" >
                          {item.location}
                        </span>
                        < span className="text-xs text-slate-500 font-mono" > TODO #{idx + 1} </span>
                      </div>
                      < h4 className="text-sm font-semibold text-rose-300 mb-2 flex items-start gap-1.5" >
                        <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                        <span>"{item.todo}" </span>
                      </h4>
                      < div className="bg-slate-900 border border-slate-800/80 rounded-lg p-3 my-2 font-mono text-xs text-emerald-300" >
                        {item.solution}
                      </div>
                      < p className="text-xs text-slate-400 flex items-center gap-1 mt-2" >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        {item.benefit}
                      </p>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

        {/* TAB 4: PRODUCTION DDL CODE */}
        {
          activeTab === 'sql' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl" >
              <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between" >
                <div className="flex items-center space-x-2" >
                  <Code className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-mono text-slate-300" > pets_schema_production.sql </span>
                </div>
                < button
                  onClick={() => handleCopyCode(PRODUCTION_SQL)
                  }
                  className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Script!' : 'Copy DDL Script'} </span>
                </button>
              </div>
              < pre className="p-6 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto" >
                <code>{PRODUCTION_SQL} </code>
              </pre>
            </div>
          )}

        {/* TAB 5: SAMPLE QUERIES */}
        {
          activeTab === 'sample' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl" >
              <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between" >
                <div className="flex items-center space-x-2" >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono text-slate-300" > sample_queries_and_tests.sql </span>
                </div>
                < button
                  onClick={() => handleCopyCode(SAMPLE_QUERIES_SQL)
                  }
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Sample Query'} </span>
                </button>
              </div>
              < pre className="p-6 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto" >
                <code>{SAMPLE_QUERIES_SQL} </code>
              </pre>
            </div>
          )}
      </main>

      < footer className="border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500" >
        PostgreSQL 13 + Schema Architecture • Includes TypeScript Types, STORED Generated Columns, & Routine Modifiers
      </footer>
    </div>
  );
}

