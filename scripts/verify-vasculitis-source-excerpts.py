#!/usr/bin/env python3
"""Check a nonempty primary-publication packet against literal PubMed evidence.

Live mode uses one EFetch request. Offline replay verifies a supplied XML response,
not current publication status. Neither mode establishes clinical entailment,
regulatory status, full-text review, or human clinical approval. Receipts retain
short excerpts and response hashes, never complete abstracts. Held publications
and their correction notices are re-fetched and checked separately; a successful
link check never clears a clinical source-review hold.
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
PACKETS = {'vasculitis': SOURCE, 'connective-tissue': SOURCE.with_name('connective-tissue-evidence.js')}
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
    holds = packet.get('publicationHolds', [])
    if not isinstance(holds, list):
        raise ValueError('Publication holds must be an explicit list')
    held_pmids = set()
    for hold in holds:
        if not isinstance(hold, dict) or not all(nonempty(hold.get(k)) for k in ('id', 'sourcePmid', 'condition', 'trial', 'caveat')):
            raise ValueError('Incomplete publication-review hold')
        if not re.fullmatch(r'[1-9][0-9]*', hold['sourcePmid']) or hold['sourcePmid'] in held_pmids or hold['sourcePmid'] in pmids:
            raise ValueError('Ambiguous held publication identity')
        if hold['id'] in ids:
            raise ValueError('Duplicate held or accepted claim identity')
        ids.add(hold['id'])
        held_pmids.add(hold['sourcePmid'])
        corrections = hold.get('correctionPmids')
        if not isinstance(corrections, list) or not corrections or any(not isinstance(p, str) or not re.fullmatch(r'[1-9][0-9]*', p) or p == hold['sourcePmid'] for p in corrections) or len(set(corrections)) != len(corrections):
            raise ValueError('Invalid publication-correction identities')
        if hold.get('reviewStatus') != 'PUBLICATION_CORRECTION_REVIEW_PENDING' or hold.get('disposition') != 'NOT_ADJUDICATED':
            raise ValueError('A pending publication hold cannot claim adjudication')
        if any(hold.get(k) is not False for k in ('humanApproved', 'clinicallyValidated', 'automaticGraphPromotion')):
            raise ValueError('Publication holds cannot confer approval or graph promotion')
        validate_hold_notices(hold)
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
    articles = response_articles(packet, raw)
    verify_hold_links(packet, raw)
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


def validate_hold_notices(hold: dict) -> None:
    """Require correction metadata; examining a notice never approves a trial."""
    if not all(nonempty(hold.get(k)) for k in ('sourceDoi', 'sourceTitle', 'med')):
        raise ValueError('Incomplete held-publication identity')
    if not re.fullmatch(r'10\.\d{4,9}/\S+', hold['sourceDoi']):
        raise ValueError('Invalid held-publication DOI')
    if not isinstance(hold.get('refs'), list) or len(hold['refs']) != 1 or not nonempty(hold['refs'][0]):
        raise ValueError('Held publication requires one source reference')
    notices = hold.get('correctionNotices')
    if not isinstance(notices, list) or len(notices) != len(hold['correctionPmids']):
        raise ValueError('Every correction requires exact notice metadata')
    seen = set()
    for notice in notices:
        if not isinstance(notice, dict) or not all(nonempty(notice.get(k)) for k in ('pmid', 'doi', 'title', 'url', 'summary', 'reviewedAt')):
            raise ValueError('Incomplete correction-notice metadata')
        pmid = notice['pmid']
        if pmid in seen or pmid not in hold['correctionPmids'] or not re.fullmatch(r'10\.\d{4,9}/\S+', notice['doi']):
            raise ValueError('Invalid or duplicate correction-notice identity')
        seen.add(pmid)
        if notice['url'] != f'https://pubmed.ncbi.nlm.nih.gov/{pmid}/':
            raise ValueError('Correction URL does not match PMID')
        datetime.strptime(notice['reviewedAt'], '%Y-%m-%d')
        if notice.get('reviewStatus') not in {'METADATA_ONLY_NOT_RECONCILED', 'NOTICE_CONTENT_EXAMINED'}:
            raise ValueError('Invalid correction-notice review status')
        if notice['reviewStatus'] == 'NOTICE_CONTENT_EXAMINED':
            if not all(nonempty(notice.get(k)) for k in ('quote', 'locator', 'sourceUrl')) or not 1 <= len(notice['quote'].split()) <= 25:
                raise ValueError('Examined notice requires a short excerpt and source locator')
            if urllib.parse.urlparse(notice['sourceUrl']).scheme != 'https':
                raise ValueError('Publisher notice link must use HTTPS')


def request_pmids(packet: dict) -> list[str]:
    """Accepted abstracts, held publications and their notices all need retrieval."""
    validate_packet(packet)
    ids = [r['pmid'] for r in packet['references']]
    for hold in packet.get('publicationHolds', []):
        ids.extend([hold['sourcePmid'], *hold['correctionPmids']])
    if len(ids) != len(set(ids)):
        raise ValueError('Overlapping accepted, held or correction publication identities')
    return sorted(ids, key=int)

def response_articles(packet: dict, raw: bytes) -> dict:
    tree = ET.fromstring(raw)
    if tree.tag != 'PubmedArticleSet' or tree.findall('.//ERROR'):
        raise ValueError('Unexpected PubMed response envelope')
    articles = {}
    for article in tree.findall('./PubmedArticle'):
        pmid = article.findtext('./MedlineCitation/PMID')
        if pmid in articles:
            raise ValueError('Duplicate PubMed response identity')
        articles[pmid] = article
    if set(articles) != set(request_pmids(packet)):
        raise ValueError('Missing or unexpected PubMed records, including held publications and notices')
    return articles


def verify_hold_links(packet: dict, raw: bytes) -> list[dict]:
    """Check indexed identities and reciprocal links, not notice entailment."""
    articles = response_articles(packet, raw)
    def links(article, kind):
        return [p.findtext('PMID') for p in article.findall('./MedlineCitation/CommentsCorrectionsList/CommentsCorrections') if p.get('RefType') == kind]
    def identity(article, title, doi):
        title_node = article.find('./MedlineCitation/Article/ArticleTitle')
        actual = ''.join(title_node.itertext()) if title_node is not None else ''
        dois = [''.join(p.itertext()).casefold() for p in article.findall('./PubmedData/ArticleIdList/ArticleId') if p.get('IdType') == 'doi']
        return canonical(actual).rstrip('.').casefold() == canonical(title).rstrip('.').casefold() and doi.casefold() in dois
    def types(article):
        return {canonical(''.join(p.itertext())).casefold() for p in article.findall('./MedlineCitation/Article/PublicationTypeList/PublicationType')}
    checks = []
    severe_types = {'retracted publication', 'retraction of publication', 'expression of concern'}
    for hold in packet.get('publicationHolds', []):
        parent = articles[hold['sourcePmid']]
        expected = hold['correctionPmids']; observed = links(parent, 'ErratumIn')
        flags = {'sourceIdentityMatches': identity(parent, hold['sourceTitle'], hold['sourceDoi']),
                 'exactCorrectionSet': set(observed) == set(expected) and len(observed) == len(expected),
                 'noNewSevereWarning': not severe_types.intersection(types(parent)) and not any(links(parent, kind) for kind in WARNINGS - {'ErratumIn'})}
        notice_checks = []
        for notice in hold['correctionNotices']:
            article = articles[notice['pmid']]
            warnings = [p.get('RefType') for p in article.findall('./MedlineCitation/CommentsCorrectionsList/CommentsCorrections') if p.get('RefType') in WARNINGS]
            notice_flags = {'identityMatches': identity(article, notice['title'], notice['doi']),
                            'correctsExpectedPublication': links(article, 'ErratumFor') == [hold['sourcePmid']],
                            'isPublishedErratum': 'published erratum' in types(article),
                            'noNewPublicationWarning': not warnings and not severe_types.intersection(types(article))}
            notice_checks.append({'pmid': notice['pmid'], 'doi': notice['doi'], 'checks': notice_flags,
                                  'contentReviewStatus': notice['reviewStatus'], 'passed': all(notice_flags.values())})
        flags['correctionNoticesMatch'] = all(c['passed'] for c in notice_checks)
        row = {'holdId': hold['id'], 'sourcePmid': hold['sourcePmid'], 'observedCorrectionPmids': observed,
               'reviewStatus': hold['reviewStatus'], 'clinicalValidation': False, 'checks': flags,
               'notices': notice_checks, 'passed': all(flags.values())}
        if not row['passed']:
            raise ValueError('Publication-hold surveillance requires review: ' + json.dumps(row, sort_keys=True))
        checks.append(row)
    return checks


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--receipt', type=Path, required=True)
    parser.add_argument('--packet', choices=tuple(PACKETS), default='vasculitis')
    parser.add_argument('--input-xml', type=Path, help='Replay only; never a current-status check')
    args = parser.parse_args()
    receipt = {'schemaVersion': 3, 'mode': 'offline-replay' if args.input_xml else 'live-pubmed',
               'checkedAt': datetime.now(timezone.utc).isoformat(), 'clinicalValidation': False,
               'checks': [], 'publicationHoldChecks': [], 'passed': False, 'limit': LIMIT}
    try:
        source = PACKETS[args.packet].read_bytes(); packet = parse_packet(source.decode('utf-8'))
        receipt['sourceFileSha256'] = hashlib.sha256(source).hexdigest()
        receipt['packet'] = args.packet
        receipt['publicationHolds'] = packet.get('publicationHolds', [])
        receipt['expectedClaims'] = len(packet['claims'])
        receipt['requestedPmids'] = request_pmids(packet)
        receipt['expectedHeldPublications'] = len(packet.get('publicationHolds', []))
        receipt['expectedCorrectionNotices'] = sum(len(h['correctionPmids']) for h in packet.get('publicationHolds', []))
        if args.input_xml:
            raw = args.input_xml.read_bytes()
        else:
            url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?' + urllib.parse.urlencode({
                'db': 'pubmed', 'id': ','.join(receipt['requestedPmids']), 'retmode': 'xml', 'tool': 'AtlasSourceReview'})
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
        receipt['publicationHoldChecks'] = verify_hold_links(packet, raw)
        receipt['passed'] = len(receipt['checks']) == receipt['expectedClaims'] and len(receipt['publicationHoldChecks']) == receipt['expectedHeldPublications'] and all(row['passed'] for row in [*receipt['checks'], *receipt['publicationHoldChecks']])
    except Exception as error:
        receipt.update(passed=False, error=f'{type(error).__name__}: {error}')
    args.receipt.parent.mkdir(parents=True, exist_ok=True)
    args.receipt.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(json.dumps(receipt, ensure_ascii=False, indent=2))
    return 0 if receipt['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
