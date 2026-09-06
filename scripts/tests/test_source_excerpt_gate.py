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
        p = gate.parse_packet(gate.SOURCE.read_text())
        self.assertEqual(len(p['claims']), 10)
        self.assertEqual(len([c for c in p['claims'] if c.get('trial')]), 5)


class ConnectiveTissueGateTest(unittest.TestCase):
    def test_second_packet_is_nonempty_and_keeps_holds_separate(self):
        p = gate.parse_packet(gate.PACKETS['connective-tissue'].read_text())
        self.assertEqual(len(p['claims']), 7)
        self.assertEqual(len(p['publicationHolds']), 2)
        self.assertTrue(all(c['evidenceAccess'] == 'abstract' for c in p['claims']))

    def test_hold_cannot_silently_become_clinical_approval(self):
        for key, value in [('clinicallyValidated', True), ('automaticGraphPromotion', True),
                           ('humanApproved', True), ('disposition', 'SUPPORTED')]:
            p = gate.parse_packet(gate.PACKETS['connective-tissue'].read_text())
            p['publicationHolds'][0][key] = value
            with self.subTest(key=key), self.assertRaises(ValueError): gate.validate_packet(p)

    def test_held_and_accepted_identities_cannot_overlap(self):
        p = gate.parse_packet(gate.PACKETS['connective-tissue'].read_text())
        p['publicationHolds'][0]['sourcePmid'] = p['references'][0]['pmid']
        with self.assertRaises(ValueError): gate.validate_packet(p)

    def test_pending_corrections_require_exact_nonempty_distinct_identifiers(self):
        for bad in [[], ['broken'], ['123', '123'], [123], ['33971155']]:
            p = gate.parse_packet(gate.PACKETS['connective-tissue'].read_text())
            p['publicationHolds'][0]['correctionPmids'] = bad
            with self.subTest(bad=bad), self.assertRaises(ValueError): gate.validate_packet(p)


if __name__ == '__main__':
    unittest.main()
