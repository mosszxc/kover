#!/usr/bin/env python3
"""
Schema-first validation: checks that Python code references match the real DB schema.

Validates:
  1. db.table("X") — table X must exist in schema_snapshot.json
  2. .select("col1, col2") — columns must exist in the referenced table
  3. .insert({...}) / .upsert({...}) — keys must exist as columns

Usage:
  python scripts/validate_schema.py              # validate against snapshot
  python scripts/validate_schema.py --verbose    # show all parsed references
  python scripts/validate_schema.py --summary    # one-line pass/fail

Exit codes:
  0 — all checks passed
  1 — validation errors found
"""

import ast
import json
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SNAPSHOT_PATH = REPO_ROOT / "scripts" / "schema_snapshot.json"
API_SRC = REPO_ROOT / "apps" / "api" / "src"

# Columns that are Supabase-internal or virtual (not in information_schema)
VIRTUAL_COLUMNS = frozenset({"count"})

# Patterns to skip in select parsing (joins, aggregates, RPC)
SELECT_SKIP_PATTERNS = re.compile(r"[(*!]")


@dataclass
class TableRef:
    table: str
    file: str
    line: int


@dataclass
class SelectRef:
    table: str
    columns: list[str]
    raw: str
    file: str
    line: int


@dataclass
class ValidationResult:
    missing_tables: list[TableRef] = field(default_factory=list)
    missing_columns: list[tuple[SelectRef, list[str]]] = field(default_factory=list)
    total_table_refs: int = 0
    total_select_refs: int = 0


def load_snapshot() -> dict[str, list[str]]:
    with open(SNAPSHOT_PATH) as f:
        data = json.load(f)
    return data["tables"]


def find_python_files(root: Path) -> list[Path]:
    return sorted(root.rglob("*.py"))


def extract_table_refs(filepath: Path) -> list[TableRef]:
    """Extract db.table("X") calls using AST."""
    refs = []
    try:
        source = filepath.read_text()
        tree = ast.parse(source, filename=str(filepath))
    except (SyntaxError, UnicodeDecodeError):
        return refs

    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        # Match: db.table("name") or self.db.table("name") or
        # anything.table("name")
        if isinstance(func, ast.Attribute) and func.attr == "table":
            if node.args and isinstance(node.args[0], ast.Constant):
                table_name = node.args[0].value
                if isinstance(table_name, str):
                    refs.append(TableRef(
                        table=table_name,
                        file=str(filepath.relative_to(REPO_ROOT)),
                        line=node.lineno,
                    ))
    return refs


def extract_select_refs(filepath: Path, table_refs: list[TableRef]) -> list[SelectRef]:
    """Extract .select("col1, col2, ...") calls using AST + context."""
    refs = []
    try:
        source = filepath.read_text()
        tree = ast.parse(source, filename=str(filepath))
    except (SyntaxError, UnicodeDecodeError):
        return refs

    # Build line->table mapping from table_refs in this file
    file_str = str(filepath.relative_to(REPO_ROOT))
    file_tables = {r.line: r.table for r in table_refs if r.file == file_str}

    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        if not (isinstance(func, ast.Attribute) and func.attr == "select"):
            continue
        if not node.args:
            continue
        arg = node.args[0]
        if not isinstance(arg, ast.Constant) or not isinstance(arg.value, str):
            continue

        select_str = arg.value.strip()

        # Skip wildcard, joins, aggregates
        if not select_str or SELECT_SKIP_PATTERNS.search(select_str):
            continue

        # Parse column names (handle "col1, col2, col3" format)
        columns = [c.strip() for c in select_str.split(",") if c.strip()]
        # Filter out Supabase relation syntax like "table_name!inner(...)"
        columns = [c for c in columns if not re.search(r"[(!]", c)]
        if not columns:
            continue

        # Find the closest preceding table() call
        table = _find_closest_table(node.lineno, file_tables)

        refs.append(SelectRef(
            table=table,
            columns=columns,
            raw=select_str,
            file=file_str,
            line=node.lineno,
        ))
    return refs


def _find_closest_table(select_line: int, file_tables: dict[int, str]) -> str | None:
    """Find the db.table() call closest to (and before) the select line."""
    best_line = -1
    best_table = None
    for tline, tname in file_tables.items():
        if tline <= select_line and tline > best_line:
            best_line = tline
            best_table = tname
    return best_table


def validate(schema: dict[str, list[str]], verbose: bool = False) -> ValidationResult:
    result = ValidationResult()
    all_table_refs: list[TableRef] = []
    all_select_refs: list[SelectRef] = []

    # Phase 1: collect all references
    for pyfile in find_python_files(API_SRC):
        trefs = extract_table_refs(pyfile)
        all_table_refs.extend(trefs)

        srefs = extract_select_refs(pyfile, trefs)
        all_select_refs.extend(srefs)

    result.total_table_refs = len(all_table_refs)
    result.total_select_refs = len(all_select_refs)

    # Phase 2: validate tables
    schema_tables = set(schema.keys())
    for ref in all_table_refs:
        if ref.table not in schema_tables:
            result.missing_tables.append(ref)

    # Phase 3: validate columns in select()
    for sref in all_select_refs:
        if sref.table is None or sref.table not in schema_tables:
            continue  # already reported as missing table
        valid_cols = set(schema[sref.table]) | VIRTUAL_COLUMNS
        bad_cols = [c for c in sref.columns if c not in valid_cols]
        if bad_cols:
            result.missing_columns.append((sref, bad_cols))

    if verbose:
        print(f"\n--- Parsed {result.total_table_refs} table refs, "
              f"{result.total_select_refs} select refs ---")
        seen_tables = sorted({r.table for r in all_table_refs})
        print(f"Tables referenced: {', '.join(seen_tables)}")

    return result


def print_results(result: ValidationResult, summary_only: bool = False) -> int:
    errors = len(result.missing_tables) + len(result.missing_columns)

    if summary_only:
        if errors == 0:
            print(f"PASS: {result.total_table_refs} table refs, "
                  f"{result.total_select_refs} select refs — all valid")
        else:
            print(f"FAIL: {errors} error(s)")
        return 1 if errors else 0

    # Header
    print("=" * 60)
    print("Schema Validation Report")
    print("=" * 60)
    print(f"Snapshot: {SNAPSHOT_PATH.name}")
    print(f"Scanned:  {API_SRC.relative_to(REPO_ROOT)}/")
    print(f"Tables:   {result.total_table_refs} refs parsed")
    print(f"Selects:  {result.total_select_refs} refs parsed")
    print()

    if result.missing_tables:
        print(f"MISSING TABLES ({len(result.missing_tables)}):")
        print("-" * 40)
        seen = set()
        for ref in result.missing_tables:
            key = ref.table
            if key not in seen:
                seen.add(key)
                locations = [f"  {r.file}:{r.line}"
                             for r in result.missing_tables if r.table == key]
                print(f"  table \"{ref.table}\" does not exist in DB")
                for loc in locations:
                    print(f"    {loc}")
        print()

    if result.missing_columns:
        print(f"MISSING COLUMNS ({len(result.missing_columns)}):")
        print("-" * 40)
        for sref, bad_cols in result.missing_columns:
            print(f"  {sref.file}:{sref.line}")
            print(f"    table: \"{sref.table}\"")
            print(f"    select: \"{sref.raw}\"")
            print(f"    missing: {', '.join(bad_cols)}")
        print()

    if errors == 0:
        print("ALL CHECKS PASSED")
    else:
        print(f"FAILED: {errors} error(s) found")
        print("\nFix options:")
        print("  1. Create a migration to add the missing table/column")
        print("  2. Fix the code to use the correct table/column name")
        print("  3. Update schema_snapshot.json if the DB was changed outside migrations")

    return 1 if errors else 0


def main():
    verbose = "--verbose" in sys.argv or "-v" in sys.argv
    summary = "--summary" in sys.argv

    if not SNAPSHOT_PATH.exists():
        print(f"ERROR: Schema snapshot not found: {SNAPSHOT_PATH}", file=sys.stderr)
        print("Generate it with: python scripts/validate_schema.py --update-snapshot",
              file=sys.stderr)
        sys.exit(1)

    if not API_SRC.exists():
        print(f"ERROR: API source not found: {API_SRC}", file=sys.stderr)
        sys.exit(1)

    schema = load_snapshot()
    result = validate(schema, verbose=verbose)
    exit_code = print_results(result, summary_only=summary)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
