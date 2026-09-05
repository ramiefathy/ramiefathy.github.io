#!/usr/bin/env python3
"""Bind targeted correction coverage to current files; never promote clinical validation."""
import argparse
import collections
import hashlib
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'site/public/clinical-source-review/review-status.json'

def build():
    changes = json.loads((DEST.parent / 'corrections.json').read_text())
    if len(changes) != 659 or len({r['id'] for r in changes}) != len(changes):
        raise ValueError('Correction ledger identity/count mismatch')
    paths = collections.Counter(r['path'] for r in changes)
    files = []
    for path, count in sorted(paths.items()):
        p = Path(path)
        if p.is_absolute() or '..' in p.parts or p.parts[0] != 'site':
            raise ValueError('Unsafe correction source path')
        files.append({'path': path, 'sha256': hashlib.sha256((ROOT / path).read_bytes()).hexdigest(), 'correction_records': count})
    monographs = {r['pointer'].split('/')[2] for r in changes if r['pointer'].startswith('/monographs/')}
    return {'schema_version': 1, 'source_commit': 'fe42b9d2ae5695f853d0f360ac60f665bed1e5f4',
            'recovery_date': '2026-09-05', 'full_clinical_validation_complete': False,
            'correction_records': len(changes), 'targeted_monographs': sorted(monographs),
            'total_field_guide_monographs': 60, 'whole_monograph_validation_passes': 0,
            'coverage_note': 'Targeted corrections only. Complete independent claim adjudication remains pending.', 'files': files}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--check', action='store_true'); args = parser.parse_args()
    text = json.dumps(build(), indent=2, ensure_ascii=False) + '\n'
    if args.check:
        if not DEST.exists() or DEST.read_text() != text: raise SystemExit('Clinical source review is stale; review changed files before rebuilding its receipt.')
    else: DEST.write_text(text)
    print('659 correction records; 17 targeted monographs; no blanket clinical-validation passes.')
