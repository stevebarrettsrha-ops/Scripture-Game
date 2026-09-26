#!/usr/bin/env python3
"""Records the voices of the Scripture games.

Reads lines.json (written by extract.js: every line that can be heard in every book, each with
its speaker's part and its recording key), casts every person a natural voice of their own, and
records each line with Kokoro (an open, Apache-licensed neural speech model that runs offline) to
voices/<key[:2]>/<key>.webm (Opus). Each book gets a bank, voices/<book>.js, that voice.js reads.

YAHUAH speaks in a voice of His own, deep, slow and old, and no one else is cast with it.

Resumable: a line already recorded is not recorded again. Casting is kept in voices/cast.json, so
a person keeps their voice from one run to the next; delete a person's entry (and their files)
to recast them.

    pip install kokoro-onnx soundfile imageio-ffmpeg
    # model files, from https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
    #   kokoro-v1.0.onnx  voices-v1.0.bin   (pass their folder with --models)
    python3 tools/voices/build.py --lines lines.json --models /path/to/models [--only book-of-ruth]
"""
import argparse, json, os, subprocess, sys, time, re
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'voices')
SR = 24000

# ---------------------------------------------------------------- the cast
# Kokoro's English voices, the fullest and steadiest first; a blend of two is a new voice of its
# own, which gives the many people of the stories more voices than the model has.
NARRATOR = 'bm_george'
# the Voice of YAHUAH: the deepest of the voices, aged, slow, lowered a little further; the deep
# voices it is made of are kept from everyone else
DIVINE = {'voice': 'am_onyx:.55+am_santa:.45', 'speed': .84, 'pitch': .93}
MALE = ['am_michael', 'am_fenrir', 'am_puck', 'bm_fable',
        'am_michael:.5+bm_george:.5', 'am_fenrir:.6+am_echo:.4', 'am_puck:.6+bm_lewis:.4',
        'bm_lewis', 'am_echo', 'am_eric', 'am_liam', 'bm_daniel',
        'am_michael:.5+am_echo:.5', 'bm_fable:.5+am_liam:.5', 'am_fenrir:.5+bm_daniel:.5',
        'am_puck:.5+am_eric:.5', 'am_michael:.6+am_adam:.4', 'bm_lewis:.5+am_liam:.5',
        'am_echo:.5+bm_daniel:.5', 'am_fenrir:.5+bm_fable:.5', 'am_puck:.5+am_michael:.5',
        'am_eric:.5+bm_fable:.5', 'am_liam:.5+am_puck:.5']
ELDER = ['bm_daniel:.6+am_adam:.4', 'am_michael:.6+bm_daniel:.4', 'bm_fable:.6+am_adam:.4',
         'am_fenrir:.6+bm_daniel:.4', 'am_eric:.5+bm_daniel:.5']
FEMALE = ['af_heart', 'af_bella', 'bf_emma', 'af_nicole', 'af_aoede', 'af_kore', 'af_sarah',
          'bf_isabella', 'af_nova', 'af_alloy', 'af_heart:.5+bf_emma:.5', 'af_bella:.5+af_kore:.5',
          'af_sarah:.5+bf_isabella:.5', 'af_aoede:.5+af_nicole:.5', 'af_sky', 'af_jessica',
          'af_river', 'bf_alice', 'bf_lily', 'af_nova:.5+bf_alice:.5', 'af_alloy:.5+af_sarah:.5']
CHILD = ['af_sky', 'af_sky:.6+af_nicole:.4', 'af_nicole:.5+af_sky:.5']
BOY = ['af_sky:.6+am_puck:.4', 'af_nicole:.6+am_puck:.4', 'af_sky:.55+am_echo:.45']
ANGEL = ['bm_george:.6+am_fenrir:.4', 'am_michael:.6+bm_fable:.4', 'bm_george:.5+am_puck:.5']
DARK = ['bm_lewis:.6+am_echo:.4', 'bm_lewis:.5+am_eric:.5', 'am_liam:.5+bm_lewis:.5']
SERPENT = ['bm_lewis:.5+af_nicole:.5']
GIANT = ['bm_daniel:.5+am_eric:.5']
CROWD = ['am_echo', 'am_liam:.5+am_echo:.5']
CAPTAIN = ['am_fenrir']
POOL = {'man': MALE, 'oldman': MALE[:4] + ELDER + MALE[4:], 'woman': FEMALE, 'oldwoman': FEMALE, 'girl': CHILD,
        'boy': BOY, 'angel': ANGEL, 'dark': DARK, 'serpent': SERPENT, 'giant': GIANT,
        'crowd': CROWD + MALE, 'captain': CAPTAIN}
# the pace of each sort of speaker
SPEED = {'narrator': .95, 'man': 1.0, 'woman': 1.0, 'oldman': .92, 'oldwoman': .93, 'boy': 1.05,
         'girl': 1.05, 'angel': .94, 'dark': .9, 'serpent': .9, 'giant': .88, 'crowd': 1.0,
         'captain': 1.08}


def cast_all(lines, cast_path):
    """One person, one voice, in every book and at every age: the voice goes with the name.
    Those who speak most are cast first, each with a voice no one else in their books has."""
    cast = json.load(open(cast_path)) if os.path.exists(cast_path) else {}
    people = {}                                  # name -> {chars, books, kinds}
    for book, d in lines.items():
        for it in d['items']:
            if it['kind'] in ('narrator', 'divine'):
                continue
            p = people.setdefault(it['name'], {'chars': 0, 'books': set(), 'kinds': {}})
            p['chars'] += len(it['kk'])
            p['books'].add(book)
            p['kinds'][it['kind']] = p['kinds'].get(it['kind'], 0) + len(it['kk'])
    users = {}                                   # voice -> [names]
    for name, c in cast.items():
        users.setdefault(c['voice'], []).append(name)
    for name in sorted(people, key=lambda n: -people[n]['chars']):
        if name in cast:
            continue
        p = people[name]
        kind = max(p['kinds'], key=p['kinds'].get)
        # the narrator's voice is the narrator's alone: no one is cast with it, whole or blended
        nar = cast.get('narrator', {}).get('voice', NARRATOR).split(':')[0]
        pool = [v for v in POOL.get(kind, MALE) if nar not in v] or POOL.get(kind, MALE)
        best, score = None, None
        for i, v in enumerate(pool):
            clash = sum(1 for o in users.get(v, []) if o in people and people[o]['books'] & p['books'])
            s = (clash, len(users.get(v, [])), i)
            if score is None or s < score:
                best, score = v, s
        cast[name] = {'voice': best, 'kind': kind}
        users.setdefault(best, []).append(name)
    cast['narrator'] = {'voice': cast.get('narrator', {}).get('voice', NARRATOR), 'kind': 'narrator'}
    cast['divine'] = dict(DIVINE, kind='divine', **{k: v for k, v in cast.get('divine', {}).items() if k != 'kind'})
    os.makedirs(os.path.dirname(cast_path), exist_ok=True)
    tmp = cast_path + '.%d' % os.getpid()
    json.dump(cast, open(tmp, 'w'), indent=1, ensure_ascii=False, sort_keys=True)
    os.replace(tmp, cast_path)                   # whole, never half-written for another worker
    return cast


# ---------------------------------------------------------------- the voice
class Voices:
    def __init__(self, models):
        from kokoro_onnx import Kokoro
        self.k = Kokoro(os.path.join(models, 'kokoro-v1.0.onnx'), os.path.join(models, 'voices-v1.0.bin'))
        self.cache = {}

    def style(self, spec):
        if spec not in self.cache:
            parts = [(p.split(':')[0], float(p.split(':')[1]) if ':' in p else 1.0) for p in spec.split('+')]
            tot = sum(w for _, w in parts)
            self.cache[spec] = sum(self.k.get_voice_style(n) * (w / tot) for n, w in parts).astype(np.float32)
        return self.cache[spec]

    def say(self, text, spec, speed):
        lang = 'en-gb' if spec.split(':')[0].startswith('b') else 'en-us'
        wav, sr = self.k.create(text, voice=self.style(spec), speed=speed, lang=lang)
        assert sr == SR
        return wav


# a word written all in capitals for emphasis is still a word, not letters to be spelled
CAPS = re.compile(r'\b([A-Z]{2,})\b')


def prepare(kk):
    t = CAPS.sub(lambda m: m.group(1) if m.group(1) in ('I',) else m.group(1).lower(), kk)
    return t.strip()


def ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return 'ffmpeg'


def encode(ff, wav, path, pitch=1.0):
    lead, tail = np.zeros(int(SR * .06), np.float32), np.zeros(int(SR * .16), np.float32)
    pcm = np.concatenate([lead, wav.astype(np.float32), tail])
    peak = float(np.max(np.abs(pcm))) or 1.0
    pcm = pcm * min(1.0, .92 / peak)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + '.part'
    # a voice lowered without slowing it: played slower, then brought back to time
    af = ['-af', 'asetrate=%d,aresample=%d,atempo=%.5f' % (round(SR * pitch), SR, 1 / pitch)] if pitch != 1.0 else []
    subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1',
                    '-i', '-'] + af + ['-c:a', 'libopus', '-b:a', '18k', '-vbr', 'on', '-application', 'voip',
                    '-f', 'webm', tmp], input=pcm.tobytes(), check=True)
    os.replace(tmp, path)
    return int(len(pcm) / SR * 1000)


def durations():
    """every recording's length, from the merged file and any worker's own"""
    d = {}
    for f in sorted(os.listdir(OUT)) if os.path.isdir(OUT) else []:
        if f == 'durations.json' or (f.startswith('.dur-') and f.endswith('.json')):
            try:
                d.update(json.load(open(os.path.join(OUT, f))))
            except Exception:
                pass
    return d


def write_bank(book, keys, durs):
    name = os.path.splitext(book)[0]
    k = {key: durs[key] for key in sorted(set(keys)) if key in durs and os.path.exists(os.path.join(OUT, key[:2], key + '.webm'))}
    js = ('/* the recorded voices of ' + book + ' — written by tools/voices/build.py */\n'
          'window.VOICE_BANK={base:"voices/",ext:"webm",shard:2,k:' + json.dumps(k, separators=(',', ':')) + '};\n')
    open(os.path.join(OUT, name + '.js'), 'w').write(js)
    return len(k)


def banks(lines):
    durs = durations()
    json.dump(durs, open(os.path.join(OUT, 'durations.json'), 'w'), sort_keys=True, separators=(',', ':'))
    for book in lines:
        n = write_bank(book, [it['key'] for it in lines[book]['items']], durs)
        print('%-34s %5d of %5d lines recorded' % (book, n, len(lines[book]['items'])), flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--lines', required=True)
    ap.add_argument('--models', default='')
    ap.add_argument('--only', default='', help='books to record (a pattern)')
    ap.add_argument('--who', default='people,narrator,divine', help='any of: people, narrator, divine')
    ap.add_argument('--workers', type=int, default=1)
    ap.add_argument('--worker', type=int, default=0)
    ap.add_argument('--threads', type=int, default=0)
    ap.add_argument('--banks', action='store_true', help='only write the banks')
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--tag', default='', help='a name for this run\'s progress file, when runs overlap')
    a = ap.parse_args()
    lines = json.load(open(a.lines))
    os.makedirs(OUT, exist_ok=True)
    if a.banks:
        banks(lines)
        return
    cast = cast_all(lines, os.path.join(OUT, 'cast.json'))
    if a.threads:
        import onnxruntime as ort
        from kokoro_onnx import Kokoro
        so = ort.SessionOptions(); so.intra_op_num_threads = a.threads; so.inter_op_num_threads = 1
        vo = Voices.__new__(Voices); vo.cache = {}
        vo.k = Kokoro.from_session(ort.InferenceSession(os.path.join(a.models, 'kokoro-v1.0.onnx'), sess_options=so,
                                                         providers=['CPUExecutionProvider']), os.path.join(a.models, 'voices-v1.0.bin'))
    else:
        vo = Voices(a.models)
    ff = ffmpeg()
    have = durations()
    mine_path = os.path.join(OUT, '.dur-%d%s.json' % (a.worker, a.tag))
    mine = json.load(open(mine_path)) if os.path.exists(mine_path) else {}
    todo, seen = [], set()
    for book in lines:
        if a.only and not re.search(a.only, book):
            continue
        for it in lines[book]['items']:
            key = it['key']
            if key in seen or int(key[:8], 16) % a.workers != a.worker:
                continue
            group = it['kind'] if it['kind'] in ('narrator', 'divine') else 'people'
            if group not in a.who.split(','):
                continue
            seen.add(key)
            if key in have and os.path.exists(os.path.join(OUT, key[:2], key + '.webm')):
                continue
            todo.append(it)
    print('worker %d: %d lines to record' % (a.worker, len(todo)), flush=True)
    t0, done, said = time.time(), 0, 0.0
    for it in todo:
        key = it['key']
        text = prepare(it['kk'])
        if not re.search(r'[A-Za-z]', text):
            continue
        c = cast[it['kind']] if it['kind'] in ('narrator', 'divine') else cast.get(it['name'])
        if not c:
            continue
        try:
            wav = vo.say(text, c['voice'], c.get('speed', SPEED.get(it['kind'], 1.0)))
        except Exception as e:
            print('  !! could not record', key, repr(text[:60]), e, flush=True)
            continue
        mine[key] = encode(ff, wav, os.path.join(OUT, key[:2], key + '.webm'), c.get('pitch', 1.0))
        done += 1
        said += mine[key] / 1000
        if done % 25 == 0:
            json.dump(mine, open(mine_path + '.tmp', 'w')); os.replace(mine_path + '.tmp', mine_path)
            print('  worker %d: %d of %d recorded, %.0f min of speech in %.0f min' % (a.worker, done, len(todo), said / 60, (time.time() - t0) / 60), flush=True)
        if a.limit and done >= a.limit:
            break
    json.dump(mine, open(mine_path, 'w'))
    print('worker %d finished: %d recorded' % (a.worker, done), flush=True)


if __name__ == '__main__':
    main()
