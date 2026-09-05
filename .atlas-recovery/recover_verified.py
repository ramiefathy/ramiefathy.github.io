"""Recover complete, independently hashed file records from the interrupted transfer.
The transfer as a whole is incomplete. Only its 62 complete file records are accepted;
the separate compact ledger must reproduce the original 659 records exactly.
"""
import argparse
import base64
import codecs
import hashlib
import json
import lzma
import pathlib
import subprocess
import zipfile

BASE = 'fe42b9d2ae5695f853d0f360ac60f665bed1e5f4'
FILE_HASH = 'add798faa198ff9a7219726230d7f1b76415b95bfde6291e76ada57e3f4d8798'
INDEX_HASH = '9981ea3fccacc571cdc64eb553cb42e8f329a8d4caea7b258f962a1eb2294d9e'
LEDGER_HASH = '5100d625184e311c9b5aac2e805efe6e4b00ac81d8d06542d9f2690cc09ce250'
ARCHIVES = {
    'identity': '23cf5c7978b8d654be62acb39c088351f1bf49897a712934a06194b1b15175e6',
    'ontology': 'fdbdb4a82e65d51abbf1b8217b6deb9c834a8294168e62685bb17ef5be80fb74',
    'atopic': '3351642c47958cc019d167892f3b9c8d1766396efd7b0ff22af33f6154ffcef5',
}

def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def safe_path(root, name):
    rel = pathlib.PurePosixPath(name)
    if (not isinstance(name, str) or '\\' in name or '\n' in name or '\r' in name
        or rel.is_absolute() or '..' in rel.parts or str(rel) != name or not rel.parts
        or rel.parts[0] not in {'site', 'scripts', 'docs'}
        or any(p in {'.git', 'node_modules', '.env'} for p in rel.parts)):
        raise ValueError(f'Unsafe source path: {name}')
    path = root / rel
    if any(p.is_symlink() for p in [path, *path.parents]):
        raise ValueError(f'Symlink in source path: {name}')
    return path

def recover(staged, root, archives, receipt):
    encoded = ''.join((staged / '.atlas-recovery' / f'part{i}.b64').read_text().strip() for i in range(9))
    raw = base64.b64decode(encoded, validate=True)
    assert digest(raw) == '39c2fea2c4869da3bbe9a1283d325fd9f2a547466c8ab48f12a619979d65342a'
    decoder = lzma.LZMADecompressor(memlimit=128 * 1024 * 1024)
    partial = decoder.decompress(raw, max_length=2 * 1024 * 1024)
    text = codecs.getincrementaldecoder('utf-8')().decode(partial, final=False)
    prefix = '{"base":"' + BASE + '","files":['
    assert text.startswith(prefix)
    position = len(prefix)
    parser, entries = json.JSONDecoder(), []
    while True:
        while position < len(text) and text[position] in ', \t\r\n': position += 1
        if text[position] == ']': break
        item, position = parser.raw_decode(text, position)
        entries.append(item)
    assert text[position:].startswith('],"corrections":[')
    assert len(entries) == 62 and digest(canonical(entries)) == FILE_HASH
    before, after, seen = {}, {}, set()
    for entry in entries:
        name = entry['path']
        path = safe_path(root, name)
        assert name not in seen
        seen.add(name)
        old = path.read_bytes() if path.exists() else b''
        assert (digest(old) if path.exists() else None) == entry['before'], f'Base mismatch: {name}'
        original = old.decode('utf-8')
        content, end = original, 0
        for a, b, new in entry['ops']:
            assert type(a) is int and type(b) is int and isinstance(new, str) and end <= a <= b <= len(content)
            end = b
        for a, b, new in reversed(entry['ops']): content = content[:a] + new + content[b:]
        assert digest(content.encode()) == entry['after'], f'Result mismatch: {name}'
        before[name], after[name] = original, content
    # All files are checked before writing any of them.
    for name, content in after.items():
        path = safe_path(root, name)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content.encode())
    encoded_index = ''.join((staged / '.atlas-recovery' / f'ledger-index-{i}.b64').read_text().strip() for i in range(2))
    index_raw = lzma.decompress(base64.b64decode(encoded_index, validate=True), memlimit=128 * 1024 * 1024)
    assert digest(index_raw) == INDEX_HASH
    records = []
    for item in json.loads(index_raw):
        out = {k: v for k, v in item.items() if k not in ('before', 'after')}
        assert item['path'] in before
        for kind, source in [('before', before), ('after', after)]:
            spec, text = item[kind], source[item['path']]
            if 'value' in spec:
                value = spec['value']
            elif 'slice' in spec:
                a, b = spec['slice']
                assert type(a) is int and type(b) is int and 0 <= a <= b <= len(text)
                value = json.loads(text[a:b])
            else:
                value = json.loads(text)
                for key in spec['pointer'].strip('/').split('/'):
                    key = key.replace('~1', '/').replace('~0', '~')
                    value = value[int(key)] if isinstance(value, list) else value.get(key)
            out[kind], out[kind + '_sha256'] = value, digest(canonical(value))
        records.append(out)
    assert len(records) == 659 and digest(canonical(records)) == LEDGER_HASH
    ledger = root / 'site/public/clinical-source-review/corrections.json'
    ledger.parent.mkdir(parents=True, exist_ok=True)
    ledger.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
    generated = [ledger.relative_to(root).as_posix()]
    for folder, expected in ARCHIVES.items():
        archive = archives / (folder + '.zip')
        assert digest(archive.read_bytes()) == expected, f'Artifact mismatch: {folder}'
        with zipfile.ZipFile(archive) as z:
            assert len({i.filename for i in z.infolist()}) == len(z.infolist())
            for info in z.infolist():
                if info.is_dir(): continue
                rel = pathlib.PurePosixPath(info.filename)
                assert len(rel.parts) == 1 and rel.suffix == '.json' and info.file_size < 5 * 1024 * 1024
                name = f'site/public/apps/dermatotarget-atlas/data/source-evidence/{folder}/{rel}'
                path = safe_path(root, name)
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(z.read(info))
                generated.append(name)
    for script, output in [
        ('build-atlas-evidence.py', 'site/public/apps/dermatotarget-atlas/data/association-review.json'),
        ('build-clinical-review-status.py', 'site/public/clinical-source-review/review-status.json')]:
        subprocess.run(['python3', 'scripts/' + script], cwd=root, check=True)
        generated.append(output)
    names = sorted(seen | set(generated))
    receipt.mkdir(parents=True, exist_ok=True)
    manifest = {'base': BASE, 'recovery': '62 complete individually hash-verified file records; incomplete transfer tail not applied',
                'file_record_sha256': FILE_HASH, 'original_ledger_canonical_sha256': LEDGER_HASH,
                'files': [{'path': name, 'sha256': digest((root / name).read_bytes()), 'bytes': (root / name).stat().st_size} for name in names]}
    (receipt / 'source-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    (receipt / 'source-paths.txt').write_text('\n'.join(names) + '\n')
    print(f'Recovered {len(entries)} source files and all {len(records)} exact correction records; {len(names)} publication paths.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    for arg in ('staged', 'root', 'archives', 'receipt'): parser.add_argument('--' + arg, required=True, type=pathlib.Path)
    args = parser.parse_args()
    recover(args.staged.resolve(), args.root.resolve(), args.archives.resolve(), args.receipt.resolve())
