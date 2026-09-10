#!/usr/bin/env python3
"""Reproduce the bounded current-association snapshot from captured request/response bytes.

This is a fresh database cross-check, not replication of historical ranking scores.
No network access is used. --check rejects any difference from the committed snapshot.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import pathlib
import re
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[1]
APP = ROOT / 'site/public/apps/dermatotarget-atlas'
EVIDENCE = APP / 'data/source-evidence'


def load(folder: str, item: str) -> dict:
    """Verify both captured payload hashes before returning any source data."""
    manifest = json.loads((EVIDENCE / folder / 'manifest.json').read_text(encoding='utf-8'))
    records = [r for r in manifest if r['id'] == item]
    if len(records) != 1:
        raise ValueError(f'Ambiguous receipt: {folder}/{item}')
    record = records[0]
    if record.get('http_status') != 200:
        raise ValueError(f'Unsuccessful capture: {folder}/{item}')
    for kind in ('request', 'response'):
        raw = (EVIDENCE / folder / f'{item}-{kind}.json').read_bytes()
        if hashlib.sha256(raw).hexdigest() != record[f'{kind}_sha256']:
            raise ValueError(f'Source hash mismatch: {folder}/{item}/{kind}')
    result = json.loads((EVIDENCE / folder / f'{item}-response.json').read_text(encoding='utf-8'))
    if result.get('errors') or result.get('error'):
        raise ValueError(f'Source error: {folder}/{item}')
    return result


def build() -> dict:
    targets_path = APP / 'data/targets.json'
    targets = json.loads(targets_path.read_text(encoding='utf-8'))
    if len(targets) != 600 or len({(t['disease_key'], t['gene']) for t in targets}) != 600:
        raise ValueError('Historical pair denominator has changed; review the snapshot scope.')
    genes = load('identity', 'ensembl-symbols')
    ensembl_release = load('identity', 'ensembl-release')['releases']
    meta = load('ontology', 'meta')['data']['meta']['dataVersion']
    results, dates = [], []
    for key in sorted({t['disease_key'] for t in targets}):
        rows = [t for t in targets if t['disease_key'] == key]
        folder = 'atopic' if key == 'atopic_dermatitis' else 'ontology'
        item = key + '-associations'
        d = load(folder, item)['data']['disease']
        if not d or rows[0]['disease_id'].replace('_', ':', 1) not in d['dbXRefs']:
            raise ValueError(f'Legacy disease identity is not established: {key}')
        expected_name = rows[0]['disease_name'].casefold()
        synonyms = [term.casefold() for group in d['synonyms'] for term in group['terms']]
        if d['name'].casefold() != expected_name and expected_name not in synonyms:
            raise ValueError(f'Disease label is not a confirmed synonym: {key}')
        request = json.loads((EVIDENCE / folder / f'{item}-request.json').read_text(encoding='utf-8'))['query']
        if 'enableIndirect:false' not in request or d['id'] not in request:
            raise ValueError('Indirect or mismatched disease request.')
        match = re.search(r'Bs:(\[[^\]]*\])', request)
        queried = json.loads(match.group(1)) if match else []
        valid_ids = []
        for t in rows:
            g = genes.get(t['gene']) or {}
            if (g.get('display_name') == t['gene'] and g.get('species') == 'homo_sapiens'
                and g.get('object_type') == 'Gene' and g.get('assembly_name') == 'GRCh38'
                and re.fullmatch(r'ENSG\d{11}', g.get('id', ''))
                and (not t['target_id'] or t['target_id'] == g['id'])):
                valid_ids.append(g['id'])
        if Counter(queried) != Counter(valid_ids) or len(set(queried)) != len(queried):
            raise ValueError(f'Request target identity mismatch: {key}')
        association = d['associatedTargets']
        hits = association['rows']
        if association['count'] != len(hits) or len(hits) > len(queried):
            raise ValueError(f'Incomplete query pagination: {key}')
        by_id = {x['target']['id']: x for x in hits}
        if len(by_id) != len(hits) or not set(by_id).issubset(queried):
            raise ValueError(f'Duplicate or unrequested association: {key}')
        receipt = next(r for r in json.loads((EVIDENCE / folder / 'manifest.json').read_text(encoding='utf-8')) if r['id'] == item)
        dates.append(receipt['retrieved_at'])
        for t in rows:
            g = genes.get(t['gene']) or {}
            valid = g.get('id') in valid_ids and g.get('display_name') == t['gene'] and (not t['target_id'] or t['target_id'] == g.get('id'))
            hit = by_id.get(g.get('id')) if valid else None
            if hit and hit['target']['approvedSymbol'] != t['gene']:
                raise ValueError(f'Association symbol mismatch: {key}/{t["gene"]}')
            status = ('IDENTITY_UNRESOLVED' if not valid else
                      'DIRECT_ASSOCIATION_RETURNED' if hit else 'NOT_RETURNED_BY_EXACT_QUERY')
            note = {
                'IDENTITY_UNRESOLVED': 'Historical identifier or symbol conflicts with the independently retrieved human GRCh38 gene identity. No automatic remapping or efficacy inference.',
                'DIRECT_ASSOCIATION_RETURNED': 'Direct database association returned for the confirmed gene and disease. This is not causal, directional, clinical-benefit, drug-approval, or historical-score validation.',
                'NOT_RETURNED_BY_EXACT_QUERY': 'No row returned by this complete, direct-only query for the confirmed identities. This is not a negative study, zero biological effect, or evidence of absence.',
            }[status]
            scores = hit['datasourceScores'] if hit else []
            for score in [hit['score']] + [x['score'] for x in scores] if hit else []:
                if isinstance(score, bool) or not isinstance(score, (int, float)) or not 0 <= score <= 1:
                    raise ValueError('Invalid association score.')
            if len({s['id'] for s in scores}) != len(scores):
                raise ValueError('Duplicate evidence datasource.')
            results.append({
                'disease_key': key, 'disease_name': t['disease_name'], 'gene': t['gene'],
                'historical_disease_id': t['disease_id'], 'historical_target_id': t['target_id'],
                'disease_id': d['id'], 'resolved_disease_name': d['name'],
                'target_id': g.get('id') if valid else None,
                'identity_candidate': {'id': g.get('id'), 'symbol': g.get('display_name')},
                'identity_method': 'EXACT_SYMBOL_GRCH38' if valid else 'UNRESOLVED_OR_CONFLICT',
                'status': status, 'score': hit['score'] if hit else None,
                'datasource_scores': sorted([{'id': x['id'], 'score': x['score']} for x in scores], key=lambda x: x['id']),
                'clinically_validated': False, 'therapeutic_direction': 'NOT_ESTABLISHED', 'note': note,
                'sources': [f'source-evidence/{folder}/{item}-request.json', f'source-evidence/{folder}/{item}-response.json', 'source-evidence/identity/ensembl-symbols-response.json'],
            })
    return {'schema_version': 1, 'source': 'Open Targets Platform',
            'source_version': '.'.join(str(meta[k]) for k in ('year', 'month', 'iteration') if meta[k] is not None),
            'ensembl_releases': ensembl_release, 'retrieved_at': max(dates), 'enable_indirect': False,
            'historical_targets_sha256': hashlib.sha256(targets_path.read_bytes()).hexdigest(),
            'scope': 'All 600 historical target–disease pairs; fresh direct-association cross-check only.',
            'counts': dict(sorted(Counter(r['status'] for r in results).items())),
            'pairs': results}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    result = build()
    raw = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    destination = APP / 'data/association-review.json'
    if args.check:
        if destination.read_text(encoding='utf-8') != raw:
            raise SystemExit('Association snapshot is stale or mismatched.')
    else:
        destination.write_text(raw, encoding='utf-8', newline='\n')
    print(json.dumps(result['counts'], sort_keys=True))
