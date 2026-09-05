#!/usr/bin/env python3
"""Live primary-publication identity/excerpt check; not clinical adjudication.

Uses one PubMed EFetch request for the five explicitly cited papers. The receipt
retains identifiers, exact short excerpts and transport hashes, not full abstracts.
Run from repository root. No API key, patient data, or inference provider is used.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'site/public/apps/rheum-derm-immune-atlas/explorer/vasculitis-evidence.js'


def canonical(text: str) -> str:
    """Allow whitespace formatting only; do not use fuzzy or semantic matching."""
    return ' '.join(text.split())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--receipt', type=Path, required=True)
    args = parser.parse_args()
    source = SOURCE.read_text(encoding='utf-8')
    marker = 'const packet = '
    packet, _ = json.JSONDecoder().raw_decode(source.split(marker, 1)[1])
    refs = {ref['id']: ref for ref in packet['references']}
    pmids = [ref['pmid'] for ref in refs.values()]
    if len(set(pmids)) != len(pmids) or not all(re.fullmatch(r'\d+', p) for p in pmids):
        raise ValueError('Duplicate or invalid publication identity')
    url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?' + urllib.parse.urlencode({
        'db': 'pubmed', 'id': ','.join(pmids), 'retmode': 'xml', 'tool': 'AtlasSourceReview'})
    request = urllib.request.Request(url, headers={'User-Agent': 'AtlasSourceReview/1.0'})
    receipt = {'schemaVersion': 1, 'sourceFileSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
               'requestUrl': url, 'retrievedAt': datetime.now(timezone.utc).isoformat(),
               'clinicalValidation': False, 'checks': []}
    try:
        for attempt in range(3):
            try:
                with urllib.request.urlopen(request, timeout=45) as response:
                    raw = response.read(); receipt['httpStatus'] = response.status
                break
            except Exception:
                if attempt == 2: raise
                time.sleep(2 ** attempt)
        receipt['responseSha256'] = hashlib.sha256(raw).hexdigest()
        articles = {}
        for article in ET.fromstring(raw).findall('./PubmedArticle'):
            pmid = article.findtext('./MedlineCitation/PMID')
            if pmid in articles: raise ValueError('Duplicate PubMed response identity')
            articles[pmid] = article
        if set(articles) != set(pmids): raise ValueError('Missing or unexpected PubMed records')
        for claim in packet['claims']:
            ref = refs[claim['refs'][0]]
            article = articles[ref['pmid']]
            title = ''.join(article.find('./MedlineCitation/Article/ArticleTitle').itertext())
            abstract = ' '.join(''.join(p.itertext()) for p in article.findall('./MedlineCitation/Article/Abstract/AbstractText'))
            dois = [p.text for p in article.findall('./PubmedData/ArticleIdList/ArticleId') if p.get('IdType') == 'doi']
            pubtypes = [p.text for p in article.findall('./MedlineCitation/Article/PublicationTypeList/PublicationType')]
            warnings = [p.get('RefType') for p in article.findall('./MedlineCitation/CommentsCorrectionsList/CommentsCorrections')
                        if p.get('RefType') in {'RetractionIn', 'ExpressionOfConcernIn'}]
            checks = {
                'titleMatches': canonical(title).rstrip('.').casefold() == canonical(ref['title']).rstrip('.').casefold(),
                'doiMatches': ref['doi'].casefold() in [d.casefold() for d in dois],
                'excerptMatches': canonical(claim['quote']) in canonical(abstract),
                'shortExcerpt': len(claim['quote'].split()) <= 25,
                'noRetractionMarkerReturned': not warnings and 'Retracted Publication' not in pubtypes,
            }
            receipt['checks'].append({'claimId': claim['id'], 'pmid': ref['pmid'], 'doi': ref['doi'],
                                      'title': title, 'quote': claim['quote'], 'checks': checks,
                                      'passed': all(checks.values())})
        receipt['passed'] = all(row['passed'] for row in receipt['checks'])
        receipt['limit'] = 'Identity and literal abstract excerpts only; absence of a returned warning is not exhaustive retraction surveillance. No human clinical approval.'
    except Exception as error:
        receipt.update(passed=False, error=f'{type(error).__name__}: {error}')
    args.receipt.parent.mkdir(parents=True, exist_ok=True)
    args.receipt.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(receipt, ensure_ascii=False, indent=2))
    return 0 if receipt['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
