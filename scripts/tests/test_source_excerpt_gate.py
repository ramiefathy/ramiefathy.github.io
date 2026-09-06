"""Synthetic identity and short-excerpt failure injection; never external calls."""
import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('gate', Path(__file__).resolve().parents[1] / 'verify-vasculitis-source-excerpts.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def packet():
    return {'schemaVersion': 1, 'references': [{'id': 'S', 'pmid': '123', 'doi': '10.1234/synthetic',
        'title': 'Synthetic trial', 'url': 'https://pubmed.ncbi.nlm.nih.gov/123/'}],
        'claims': [{'id': 'C', 'condition': 'synthetic', 'claim': 'A test-only claim.', 'quote': 'alpha beta',
        'locator': 'Abstract', 'refs': ['S'], 'studyDesign': 'Synthetic test', 'limitations': 'Not research evidence.',
        'humanApproved': False, 'clinicallyValidated': False, 'automaticGraphPromotion': False}]}


def xml(title='Synthetic trial', abstract='alpha beta', doi='10.1234/synthetic', pmid='123', warning='', pubtype='Journal Article'):
    return f'''<PubmedArticleSet><PubmedArticle><MedlineCitation><PMID>{pmid}</PMID>
    <Article><ArticleTitle>{title}</ArticleTitle><Abstract><AbstractText>{abstract}</AbstractText></Abstract>
    <PublicationTypeList><PublicationType>{pubtype}</PublicationType></PublicationTypeList></Article>
    <CommentsCorrectionsList>{warning}</CommentsCorrectionsList></MedlineCitation>
    <PubmedData><ArticleIdList><ArticleId IdType="doi">{doi}</ArticleId></ArticleIdList></PubmedData>
    </PubmedArticle></PubmedArticleSet>'''.encode()


class SourceGateTest(unittest.TestCase):
    def test_valid_response(self):
        self.assertTrue(gate.verify_response(packet(), xml())[0]['passed'])

    def test_whitespace_only_excerpt_normalization(self):
        self.assertTrue(gate.verify_response(packet(), xml(abstract='alpha\n  beta'))[0]['passed'])

    def test_missing_or_wrong_evidence_fails(self):
        for kwargs in ({'abstract': ''}, {'abstract': 'alpha gamma'}, {'abstract': 'Alpha beta'}, {'title': ''},
                       {'title': 'Other trial'}, {'doi': ''}, {'doi': '10.1234/other'}):
            with self.subTest(kwargs=kwargs):
                self.assertFalse(gate.verify_response(packet(), xml(**kwargs))[0]['passed'])

    def test_title_markup_and_doi_case_are_identity_equivalent(self):
        self.assertTrue(gate.verify_response(packet(), xml(title='Synthetic <i>trial</i>.', doi='10.1234/SYNTHETIC'))[0]['passed'])

    def test_missing_extra_duplicate_and_malformed_response_rejected(self):
        good = xml()
        duplicate = good.replace(b'</PubmedArticleSet>', good[len(b'<PubmedArticleSet>'):])
        for raw in (b'<PubmedArticleSet/>', xml(pmid='456'), duplicate, b'<ERROR>bad</ERROR>', b'broken'):
            with self.subTest(raw=raw[:60]), self.assertRaises(Exception):
                gate.verify_response(packet(), raw)

    def test_all_warning_types_block_automatic_pass(self):
        for kind in gate.WARNINGS:
            with self.subTest(kind=kind):
                self.assertFalse(gate.verify_response(packet(), xml(warning=f'<CommentsCorrections RefType="{kind}"/>'))[0]['passed'])

    def test_retracted_publication_type_blocks_pass(self):
        self.assertFalse(gate.verify_response(packet(), xml(pubtype='Retracted Publication'))[0]['passed'])

    def test_non_warning_comment_does_not_erase_valid_evidence(self):
        self.assertTrue(gate.verify_response(packet(), xml(warning='<CommentsCorrections RefType="CommentIn"/>'))[0]['passed'])

    def test_empty_denominators_rejected(self):
        for key in ('references', 'claims'):
            p = packet(); p[key] = []
            with self.subTest(key=key), self.assertRaises(ValueError): gate.validate_packet(p)

    def test_duplicate_references_rejected(self):
        p = packet(); p['references'].append(copy.deepcopy(p['references'][0]))
        with self.assertRaises(ValueError): gate.validate_packet(p)

    def test_duplicate_claims_rejected(self):
        p = packet(); p['claims'] *= 2
        with self.assertRaises(ValueError): gate.validate_packet(p)

    def test_dangling_or_ambiguous_reference_rejected(self):
        for refs in ([], ['absent'], ['S', 'S'], [None]):
            p = packet(); p['claims'][0]['refs'] = refs
            with self.subTest(refs=refs), self.assertRaises(ValueError): gate.validate_packet(p)

    def test_empty_long_excerpt_rejected(self):
        for quote in ('', ' ', 'word ' * 26):
            p = packet(); p['claims'][0]['quote'] = quote
            with self.subTest(quote=quote), self.assertRaises(ValueError): gate.validate_packet(p)

    def test_no_approval_from_source_match(self):
        for key in ('humanApproved', 'clinicallyValidated', 'automaticGraphPromotion'):
            for value in (True, None, 0, 'false'):
                p = packet(); p['claims'][0][key] = value
                with self.subTest(key=key, value=value), self.assertRaises(ValueError): gate.validate_packet(p)

    def test_identity_url_and_doi_checks(self):
        for key, value in (('pmid', 'x123'), ('doi', 'invalid'), ('url', 'https://pubmed.ncbi.nlm.nih.gov/456/')):
            p = packet(); p['references'][0][key] = value
            with self.subTest(key=key), self.assertRaises(ValueError): gate.validate_packet(p)

    def test_trial_context_is_required(self):
        p = packet(); p['claims'][0]['trial'] = 'SYNTHETIC'
        with self.assertRaises(ValueError): gate.validate_packet(p)

    def test_packet_declaration_must_be_unique(self):
        with self.assertRaises(ValueError): gate.parse_packet('nothing')
        with self.assertRaises(ValueError): gate.parse_packet('const packet = {} const packet = {}')

    def test_actual_packet_shape_not_clinical_truth(self):
        p = gate.parse_packet(gate.SOURCE.read_text(encoding='utf-8'))
        self.assertEqual(len(p['claims']), 10)
        self.assertEqual(len([c for c in p['claims'] if c.get('trial')]), 5)


class ConnectiveTissueGateTest(unittest.TestCase):
    def test_second_packet_is_nonempty_and_keeps_holds_separate(self):
        p = gate.parse_packet(gate.PACKETS['connective-tissue'].read_text(encoding='utf-8'))
        self.assertEqual(len(p['claims']), 7)
        self.assertEqual(len(p['publicationHolds']), 2)
        self.assertTrue(all(c['evidenceAccess'] == 'abstract' for c in p['claims']))

    def test_hold_cannot_silently_become_clinical_approval(self):
        for key, value in [('clinicallyValidated', True), ('automaticGraphPromotion', True),
                           ('humanApproved', True), ('disposition', 'SUPPORTED')]:
            p = gate.parse_packet(gate.PACKETS['connective-tissue'].read_text(encoding='utf-8'))
            p['publicationHolds'][0][key] = value
            with self.subTest(key=key), self.assertRaises(ValueError): gate.validate_packet(p)

    def test_held_and_accepted_identities_cannot_overlap(self):
        p = gate.parse_packet(gate.PACKETS['connective-tissue'].read_text(encoding='utf-8'))
        p['publicationHolds'][0]['sourcePmid'] = p['references'][0]['pmid']
        with self.assertRaises(ValueError): gate.validate_packet(p)

    def test_pending_corrections_require_exact_nonempty_distinct_identifiers(self):
        for bad in [[], ['broken'], ['123', '123'], [123], ['33971155']]:
            p = gate.parse_packet(gate.PACKETS['connective-tissue'].read_text(encoding='utf-8'))
            p['publicationHolds'][0]['correctionPmids'] = bad
            with self.subTest(bad=bad), self.assertRaises(ValueError): gate.validate_packet(p)



class PublicationHoldSurveillanceTest(unittest.TestCase):
    def held_packet(self):
        p = packet()
        p['publicationHolds'] = [{'id': 'H', 'sourcePmid': '456', 'sourceDoi': '10.1234/held', 'sourceTitle': 'Held trial', 'refs': ['HREF'], 'condition': 'synthetic', 'med': 'synthetic', 'trial': 'Synthetic trial', 'caveat': 'Not clinical evidence.', 'correctionPmids': ['789'], 'correctionNotices': [{'pmid': '789', 'doi': '10.1234/correction', 'title': 'Correction', 'url': 'https://pubmed.ncbi.nlm.nih.gov/789/', 'reviewStatus': 'METADATA_ONLY_NOT_RECONCILED', 'summary': 'Content not reviewed.', 'reviewedAt': '2026-09-05'}], 'reviewStatus': 'PUBLICATION_CORRECTION_REVIEW_PENDING', 'disposition': 'NOT_ADJUDICATED', 'humanApproved': False, 'clinicallyValidated': False, 'automaticGraphPromotion': False}]
        return p

    def held_xml(self, parent_warning='', notice_warning='', back='456', forward='789', parent_doi='10.1234/held', notice_doi='10.1234/correction', parent_title='Held trial', notice_title='Correction', notice_type='Published Erratum'):
        parent = xml(pmid='456', doi=parent_doi, title=parent_title, warning=f'<CommentsCorrections RefType="ErratumIn"><PMID>{forward}</PMID></CommentsCorrections>'+parent_warning)
        notice = xml(pmid='789', doi=notice_doi, title=notice_title, pubtype=notice_type, warning=f'<CommentsCorrections RefType="ErratumFor"><PMID>{back}</PMID></CommentsCorrections>'+notice_warning)
        return b'<PubmedArticleSet>'+b''.join(raw[len(b'<PubmedArticleSet>'):-len(b'</PubmedArticleSet>')] for raw in [xml(), parent, notice])+b'</PubmedArticleSet>'

    def test_missing_held_publications_cannot_pass_accepted_excerpt_check(self):
        with self.assertRaises(ValueError): gate.verify_response(self.held_packet(), xml())

    def test_complete_hold_surveillance_does_not_accept_the_held_claim(self):
        p = self.held_packet(); raw = self.held_xml()
        self.assertEqual(len(gate.verify_response(p, raw)), 1)
        checks = gate.verify_hold_links(p, raw)
        self.assertEqual(len(checks), 1); self.assertTrue(checks[0]['passed'])
        self.assertFalse(checks[0]['clinicalValidation'])
        self.assertEqual(checks[0]['reviewStatus'], 'PUBLICATION_CORRECTION_REVIEW_PENDING')

    def test_request_denominator_contains_every_held_source_and_notice(self):
        self.assertEqual(gate.request_pmids(self.held_packet()), ['123', '456', '789'])

    def test_identity_and_bilateral_links_fail_closed(self):
        for kwargs in [{'back':'999'}, {'forward':'999'}, {'parent_doi':'10.1234/other'}, {'notice_doi':'10.1234/other'}, {'parent_title':'Other trial'}, {'notice_title':'Other correction'}, {'notice_type':'Journal Article'}]:
            with self.subTest(kwargs=kwargs), self.assertRaises(ValueError): gate.verify_response(self.held_packet(), self.held_xml(**kwargs))

    def test_new_correction_or_retraction_requires_review(self):
        for kind in sorted(gate.WARNINGS):
            warning=f'<CommentsCorrections RefType="{kind}"><PMID>999</PMID></CommentsCorrections>'
            for target in ['parent_warning', 'notice_warning']:
                with self.subTest(kind=kind,target=target), self.assertRaises(ValueError): gate.verify_response(self.held_packet(),self.held_xml(**{target:warning}))

    def test_missing_and_duplicate_correction_metadata_rejected(self):
        for changes in [[], [{'pmid':'wrong'}], [self.held_packet()['publicationHolds'][0]['correctionNotices'][0]]*2]:
            p=self.held_packet(); p['publicationHolds'][0]['correctionNotices']=changes
            with self.subTest(changes=changes), self.assertRaises(ValueError): gate.validate_packet(p)

    def test_unsafe_or_unbound_notice_link_and_empty_identity_rejected(self):
        for key,value in [('url','https://example.com/'),('url','javascript:alert(1)'),('doi','broken'),('title',''),('summary',''),('reviewStatus','APPROVED')]:
            p=self.held_packet(); p['publicationHolds'][0]['correctionNotices'][0][key]=value
            with self.subTest(key=key,value=value), self.assertRaises(ValueError): gate.validate_packet(p)

    def test_examined_notice_requires_source_locator_and_bounded_excerpt(self):
        p=self.held_packet(); p['publicationHolds'][0]['correctionNotices'][0]['reviewStatus']='NOTICE_CONTENT_EXAMINED'
        with self.assertRaises(ValueError): gate.validate_packet(p)

    def test_hold_id_cannot_duplicate_accepted_claim(self):
        p=self.held_packet(); p['publicationHolds'][0]['id']='C'
        with self.assertRaises(ValueError): gate.validate_packet(p)


if __name__ == '__main__':
    unittest.main()
