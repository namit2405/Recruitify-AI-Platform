-- Fix missing slug columns in PostgreSQL database

-- Add slug column to accounts_candidate if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts_candidate' AND column_name = 'slug'
    ) THEN
        ALTER TABLE accounts_candidate ADD COLUMN slug VARCHAR(255);
        CREATE INDEX accounts_candidate_slug_019cb7d7 ON accounts_candidate(slug);
        CREATE INDEX accounts_candidate_slug_019cb7d7_like ON accounts_candidate(slug varchar_pattern_ops);
    END IF;
END $$;

-- Add slug column to accounts_organization if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts_organization' AND column_name = 'slug'
    ) THEN
        ALTER TABLE accounts_organization ADD COLUMN slug VARCHAR(255);
        CREATE INDEX accounts_organization_slug_7c0b5e5e ON accounts_organization(slug);
        CREATE INDEX accounts_organization_slug_7c0b5e5e_like ON accounts_organization(slug varchar_pattern_ops);
    END IF;
END $$;
