#!/bin/bash
# SQL Migration Linter
# Checks that every CREATE TABLE has matching RLS, GRANT, and POLICY statements.
# Used by: CI (lint-migrations.yml), local pre-commit, manual runs.
#
# Usage:
#   ./scripts/lint-migrations.sh [file1.sql file2.sql ...]
#   If no args, checks all staged .sql files (git diff --cached).

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

errors=0
warnings=0
checked=0

lint_file() {
  local file="$1"

  if [[ ! -f "$file" ]]; then
    echo -e "${RED}FAIL${NC}: $file — file not found"
    errors=$((errors + 1))
    return
  fi

  # Read file content (case-insensitive matching via lowercased copy)
  local content
  content=$(cat "$file")
  local content_lower
  content_lower=$(echo "$content" | tr '[:upper:]' '[:lower:]')

  # Extract table names from CREATE TABLE statements
  # Matches: CREATE TABLE [IF NOT EXISTS] [schema.]table_name
  local tables
  tables=$(echo "$content_lower" | grep -oP 'create\s+table\s+(if\s+not\s+exists\s+)?(public\.)?\K[a-z_][a-z0-9_]*' || true)

  if [[ -z "$tables" ]]; then
    # No CREATE TABLE — skip (could be ALTER, INSERT, etc.)
    return
  fi

  checked=$((checked + 1))
  local file_ok=true

  for table in $tables; do
    # 1. Check ENABLE ROW LEVEL SECURITY
    if ! echo "$content_lower" | grep -qP "alter\s+table\s+(public\.)?${table}\s+enable\s+row\s+level\s+security"; then
      echo -e "${RED}FAIL${NC}: $file — CREATE TABLE ${table} without ENABLE ROW LEVEL SECURITY"
      errors=$((errors + 1))
      file_ok=false
    fi

    # 2. Check GRANT (at least one GRANT mentioning this table)
    if ! echo "$content_lower" | grep -qP "grant\s+.+\s+on\s+(public\.)?${table}\s+to\s+"; then
      echo -e "${RED}FAIL${NC}: $file — CREATE TABLE ${table} without GRANT"
      errors=$((errors + 1))
      file_ok=false
    fi

    # 3. Check CREATE POLICY (at least one policy for this table)
    if ! echo "$content_lower" | grep -qP "create\s+policy\s+.+\s+on\s+(public\.)?${table}"; then
      echo -e "${RED}FAIL${NC}: $file — CREATE TABLE ${table} without CREATE POLICY"
      errors=$((errors + 1))
      file_ok=false
    fi

    # 4. Check specific GRANT roles (warnings, not errors)
    for role in anon authenticated service_role; do
      if ! echo "$content_lower" | grep -qP "grant\s+.+\s+on\s+(public\.)?${table}\s+to\s+${role}"; then
        echo -e "${YELLOW}WARN${NC}: $file — no GRANT to ${role} for table ${table}"
        warnings=$((warnings + 1))
      fi
    done
  done

  if [[ "$file_ok" == true ]]; then
    echo -e "${GREEN}OK${NC}: $file"
  fi
}

# Determine which files to lint
files=()
if [[ $# -gt 0 ]]; then
  files=("$@")
else
  # Check staged .sql files (for pre-commit hook usage)
  while IFS= read -r f; do
    [[ -n "$f" ]] && files+=("$f")
  done < <(git diff --cached --name-only --diff-filter=ACM 2>/dev/null | grep '\.sql$' || true)

  # If nothing staged, check all .sql files changed in this branch vs develop
  if [[ ${#files[@]} -eq 0 ]]; then
    while IFS= read -r f; do
      [[ -n "$f" ]] && files+=("$f")
    done < <(git diff --name-only origin/develop...HEAD --diff-filter=ACM 2>/dev/null | grep '\.sql$' || true)
  fi
fi

if [[ ${#files[@]} -eq 0 ]]; then
  echo -e "${GREEN}No SQL migration files to lint.${NC}"
  exit 0
fi

echo "Linting ${#files[@]} SQL migration file(s)..."
echo ""

for file in "${files[@]}"; do
  lint_file "$file"
done

echo ""
echo "─────────────────────────────────"
echo "Checked: $checked file(s) with CREATE TABLE"
echo -e "Errors:  ${errors}"
echo -e "Warnings: ${warnings}"
echo "─────────────────────────────────"

if [[ $errors -gt 0 ]]; then
  echo ""
  echo -e "${RED}Migration lint failed!${NC}"
  echo "Every CREATE TABLE must have:"
  echo "  1. ALTER TABLE ... ENABLE ROW LEVEL SECURITY"
  echo "  2. CREATE POLICY for the table"
  echo "  3. GRANT ... ON table TO anon/authenticated/service_role"
  echo ""
  echo "Use ./scripts/new-migration.sh <name> <table> to generate a template."
  exit 1
fi

echo -e "${GREEN}All migrations passed lint checks.${NC}"
exit 0
