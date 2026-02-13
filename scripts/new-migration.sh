#!/bin/bash
# Generate a SQL migration with RLS + GRANT boilerplate.
#
# Usage:
#   ./scripts/new-migration.sh <migration_name> <table_name>
#
# Example:
#   ./scripts/new-migration.sh create_experiments experiments

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <migration_name> <table_name>"
  echo "Example: $0 create_experiments experiments"
  exit 1
fi

MIGRATION_NAME="$1"
TABLE_NAME="$2"
TIMESTAMP=$(date -u +%Y%m%d%H%M%S)
FILENAME="supabase/migrations/${TIMESTAMP}_${MIGRATION_NAME}.sql"

mkdir -p supabase/migrations

cat > "$FILENAME" << EOF
-- Migration: ${MIGRATION_NAME}
-- Table: ${TABLE_NAME}
-- Created: $(date -u +%Y-%m-%dT%H:%M:%SZ)

-- 1. Create table
CREATE TABLE public.${TABLE_NAME} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    -- TODO: add your columns here
);

-- 2. Enable RLS
ALTER TABLE public.${TABLE_NAME} ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
CREATE POLICY "Allow anon read" ON public.${TABLE_NAME}
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated full access" ON public.${TABLE_NAME}
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow service_role full access" ON public.${TABLE_NAME}
    FOR ALL TO service_role USING (true);

-- 4. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.${TABLE_NAME} TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.${TABLE_NAME} TO authenticated;
GRANT ALL ON public.${TABLE_NAME} TO service_role;
EOF

echo "Created: $FILENAME"
echo ""
echo "Next steps:"
echo "  1. Edit $FILENAME — add your columns"
echo "  2. Run: ./scripts/lint-migrations.sh $FILENAME"
echo "  3. Apply via Supabase MCP or supabase db push"
