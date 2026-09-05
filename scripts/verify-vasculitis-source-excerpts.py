#!/usr/bin/env python3
"""Check a nonempty primary-publication packet against literal PubMed evidence.

Live mode uses one EFetch request. Offline replay verifies a supplied XML response,
not current publication status. Neither mode establishes clinical entailment,
regulatory status, full-text review, or human clinical approval. Receipts retain
short excerpts and response hashes, never complete abstracts.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'site/public/apps/rheum-derm-immune-atlas/explorer/vasculitis-evidence.js'
LIMIT = ('Publication identity and literal abstract excerpts only, not automated claim entailment. '
         'No human approval or graph promotion. Absence of a returned warning is not exhaustive retraction surveillance.')
WARNINGS = {'RetractionIn', 'RetractionOf', 'ExpressionOfConcernIn', 'ExpressionOfConcernFor', 'ErratumIn'}


def canonical(text: str) -> str:
    """Normalize whitespace only for excerpts; no fuzzy or semantic matching."""
    return ' '.join(text.split())


def nonempty(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_packet(packet: object) -> dict:
    """Reject vacuous success, duplicate identities, dangling refs and approvals."""
    if not isinstance(packet, dict) or packet.get('schemaVersion') != 1:
        raise ValueError('Unsupported evidence packet')
    references, claims = packet.get('references'), packet.get('claims')
    if not isinstance(references, list) or not references or not isinstance(claims, list) or not claims:
        raise ValueError('A nonempty reference and claim denominator is required')
    refs, pmids, dois, ids, used = {}, set(), set(), set(), set()
    for ref in references:
        if not isinstance(ref, dict) or not all(nonempty(ref.get(k)) for k in ('id', 'pmid', 'doi', 'title', 'url')):
            raise ValueError('Incomplete reference identity')
        if not re.fullmatch(r'[1-9][0-9]*', ref['pmid']) or not re.fullmatch(r'10\.\d{4,9}/\S+', ref['doi']):
            raise ValueError('Invalid PMID or DOI')
        if ref['url'] != f"https://pubmed.ncbi.nlm.nih.gov/{ref['pmid']}/":
            raise ValueError('Source URL does not match PMID')
        if ref['id'] in refs or ref['pmid'] in pmids or ref['doi'].casefold() in dois:
            raise ValueError('Duplicate reference identity')
        refs[ref['id']] = ref; pmids.add(ref['pmid']); dois.add(ref['doi'].casefold())
    for claim in claims:
        if not isinstance(claim, dict) or not all(nonempty(claim.get(k)) for k in ('id', 'condition', 'claim', 'quote', 'locator', 'studyDesign', 'limitations')):
            raise ValueError('Incomplete scoped claim')
        if claim['id'] in ids:
            raise ValueError('Duplicate claim identity')
        ids.add(claim['id'])
        if not isinstance(claim.get('refs'), list) or len(claim['refs']) != 1 or not isinstance(claim['refs'][0], str) or claim['refs'][0] not in refs:
            raise ValueError('Each scoped assertion requires one resolved primary reference')
        used.add(claim['refs'][0])
        if not 1 <= len(claim['quote'].split()) <= 25:
            raise ValueError('Excerpt must contain 1 to 25 words')
        if any(claim.get(k) is not False for k in ('humanApproved', 'clinicallyValidated', 'automaticGraphPromotion')):
            raise ValueError('Source matching cannot confer approval or graph promotion')
        if claim.get('trial') and not all(nonempty(claim.get(k)) for k in ('population', 'comparison', 'endpoint', 'result')):
            raise ValueError('Trial assertions must preserve population, comparison, endpoint and result')
    if used != set(refs):
        raise ValueError('Unused references cannot inflate the source denominator')
    return refs


def parse_packet(source: str) -> dict:
    marker = 'const packet = '
    if source.count(marker) != 1:
        raise ValueError('Ambiguous or absent evidence packet declaration')
    packet, _ = json.JSONDecoder().raw_decode(source.split(marker, 1)[1])
    validate_packet(packet)
    return packet


def verify_response(packet: dict, raw: bytes) -> list[dict]:
    refs = validate_packet(packet)
    tree = ET.fromstring(raw)
    if tree.tag != 'PubmedArticleSet' or tree.findall('.//ERROR'):
        raise ValueError('Unexpected PubMed response envelope')
    articles = {}
    for article in tree.findall('./PubmedArticle'):
        pmid = article.findtext('./MedlineCitation/PMID')
        if pmid in articles:
            raise ValueError('Duplicate PubMed response identity')
        articles[pmid] = article
    if set(articles) != {ref['pmid'] for ref in refs.values()}:
        raise ValueError('Missing or unexpected PubMed records')
    checks = []
    for claim in packet['claims']:
        ref = refs[claim['refs'][0]]; article = articles[ref['pmid']]
        title_node = article.find('./MedlineCitation/Article/ArticleTitle')
        title = ''.join(title_node.itertext()) if title_node is not None else ''
        abstract = ' '.join(''.join(p.itertext()) for p in article.findall('./MedlineCitation/Article/Abstract/AbstractText'))
        dois = [''.join(p.itertext()).casefold() for p in article.findall('./PubmedData/ArticleIdList/ArticleId') if p.get('IdType') == 'doi']
        types = [canonical(''.join(p.itertext())).casefold() for p in article.findall('./MedlineCitation/Article/PublicationTypeList/PublicationType')]
        warnings = [p.get('RefType') for p in article.findall('./MedlineCitation/CommentsCorrectionsList/CommentsCorrections') if p.get('RefType') in WARNINGS]
        flags = {
            'titleMatches': bool(title) and canonical(title).rstrip('.').casefold() == canonical(ref['title']).rstrip('.').casefold(),
            'doiMatches': ref['doi'].casefold() in dois,
            'excerptMatches': bool(abstract) and canonical(claim['quote']) in canonical(abstract),
            'noPublicationWarningReturned': not warnings and not {'retracted publication', 'retraction of publication', 'expression of concern'}.intersection(types),
        }
        checks.append({'claimId': claim['id'], 'pmid': ref['pmid'], 'doi': ref['doi'], 'title': title,
                       'quote': claim['quote'], 'publicationWarnings': warnings, 'checks': flags,
                       'passed': all(flags.values())})
    return checks


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--receipt', type=Path, required=True)
    parser.add_argument('--input-xml', type=Path, help='Replay only; never a current-status check')
    args = parser.parse_args()
    receipt = {'schemaVersion': 2, 'mode': 'offline-replay' if args.input_xml else 'live-pubmed',
               'checkedAt': datetime.now(timezone.utc).isoformat(), 'clinicalValidation': False,
               'checks': [], 'passed': False, 'limit': LIMIT}
    try:
        source = SOURCE.read_bytes(); packet = parse_packet(source.decode('utf-8'))
        receipt['sourceFileSha256'] = hashlib.sha256(source).hexdigest()
        receipt['expectedClaims'] = len(packet['claims'])
        if args.input_xml:
            raw = args.input_xml.read_bytes()
        else:
            url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?' + urllib.parse.urlencode({
                'db': 'pubmed', 'id': ','.join(r['pmid'] for r in packet['references']), 'retmode': 'xml', 'tool': 'AtlasSourceReview'})
            receipt['requestUrl'] = url
            request = urllib.request.Request(url, headers={'User-Agent': 'AtlasSourceReview/1.1'})
            for attempt in range(3):
                try:
                    with urllib.request.urlopen(request, timeout=45) as response:
                        raw = response.read(); receipt['httpStatus'] = response.status
                    receipt['retrievedAt'] = datetime.now(timezone.utc).isoformat()
                    break
                except Exception:
                    if attempt == 2: raise
                    time.sleep(2 ** attempt)
        receipt['responseSha256'] = hashlib.sha256(raw).hexdigest()
        receipt['checks'] = verify_response(packet, raw)
        receipt['passed'] = len(receipt['checks']) == receipt['expectedClaims'] and all(row['passed'] for row in receipt['checks'])
    except Exception as error:
        receipt.update(passed=False, error=f'{type(error).__name__}: {error}')
    args.receipt.parent.mkdir(parents=True, exist_ok=True)
    args.receipt.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(receipt, ensure_ascii=False, indent=2))
    return 0 if receipt['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
