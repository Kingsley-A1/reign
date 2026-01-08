-- REIGN Database Migration: Add Goals System
-- Migration: 005_add_goals.sql
-- Description: Creates tables for goals and goal reviews

-- Goals table for cloud sync
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title STRING(255) NOT NULL,
    description STRING,
    category STRING(50) NOT NULL,
    type STRING(20) NOT NULL CHECK (type IN ('yearly', 'monthly', 'weekly')),
    parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    target_date DATE,
    status STRING(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    notes STRING,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    INDEX idx_goals_user (user_id),
    INDEX idx_goals_type (user_id, type),
    INDEX idx_goals_status (user_id, status),
    INDEX idx_goals_parent (parent_goal_id)
);

-- Reviews table for weekly/monthly reflections
CREATE TABLE IF NOT EXISTS goal_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_type STRING(20) NOT NULL CHECK (review_type IN ('weekly', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    goals_completed INT DEFAULT 0,
    goals_total INT DEFAULT 0,
    wins STRING,
    challenges STRING,
    lessons STRING,
    next_focus STRING,
    mood INT CHECK (mood >= 1 AND mood <= 5),
    created_at TIMESTAMPTZ DEFAULT now(),
    INDEX idx_reviews_user (user_id, review_type),
    INDEX idx_reviews_period (user_id, period_start DESC)
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_goals_user_category ON goals(user_id, category);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(user_id, target_date);
