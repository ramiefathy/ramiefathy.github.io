#!/usr/bin/env python3
"""Generate Egypt AI podcast narration with Gemini TTS.

Reads docs/egypt-ai-podcast-scripts.md, generates one WAV and MP3 per episode,
and writes a JSON manifest consumed by the unlisted podcast page.

The Gemini API key is read only from GEMINI_API_KEY/GOOGLE_API_KEY and is never
written to disk.
"""

from __future__ import annotations

import base64
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_MD = REPO_ROOT / "docs" / "egypt-ai-podcast-scripts.md"
OUT_DIR = REPO_ROOT / "site" / "public" / "strategy" / "egypt-ai-portfolio" / "podcast"
MANIFEST = REPO_ROOT / "site" / "src" / "data" / "strategy" / "egypt-podcast.js"

MODEL_PRIMARY = "gemini-2.5-pro-preview-tts"
MODEL_FALLBACK = "gemini-3.1-flash-tts-preview"
VOICE_NAME = "Sadaltager"  # Knowledgeable. Strong fit for policy/strategy narration.
SAMPLE_RATE = 24_000


@dataclass(frozen=True)
class Episode:
    number: int
    title: str
    slug: str
    transcript: str


def slugify(title: str) -> str:
    value = title.lower()
    value = value.replace("&", "and")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def parse_scripts(markdown: str) -> list[Episode]:
    pattern = re.compile(r"^## Episode (\d+) — (.+?)\n\n(.*?)(?=\n---\n\n## Episode |\Z)", re.M | re.S)
    episodes: list[Episode] = []
    for match in pattern.finditer(markdown):
        number = int(match.group(1))
        title = match.group(2).strip()
        transcript = match.group(3).strip()
        if not transcript:
            raise ValueError(f"Episode {number} has an empty transcript")
        episodes.append(Episode(number, title, f"episode-{number:02d}-{slugify(title)}", transcript))
    if len(episodes) != 7:
        raise ValueError(f"Expected 7 episodes; parsed {len(episodes)}")
    return episodes


def tts_prompt(ep: Episode) -> str:
    return f"""# AUDIO PROFILE: Strategic Briefing Narrator
## "The Egypt AI Portfolio Briefing"

## THE SCENE
A private, high-trust briefing for senior operators, investors, policy leaders, and technical partners considering whether to help lead Egypt's AI and technology opportunity portfolio. The listener is intelligent, busy, and potentially influential. The goal is to sound credible, composed, and quietly motivating.

### DIRECTOR'S NOTES
Voice and tone:
* Single speaker only.
* Warm, knowledgeable, strategic, and authoritative without sounding theatrical.
* Sound like a polished long-form podcast host delivering a confidential strategy memo.
* No salesy hype, no radio-announcer energy, no exaggerated enthusiasm.
* Maintain a calm sense of urgency when discussing the time-limited opportunity.

Pacing and articulation:
* Moderate podcast pace, around 145 words per minute.
* Use brief natural pauses after section pivots, numbers, and calls to action.
* Articulate acronyms and institutional terms clearly: GAFI, CBE, NTRA, PDPL, UHI.
* Read dollar amounts and numbers naturally.
* Emphasize contrast pairs gently, for example: "not frontier training, but evaluation" and "not another memo, but an execution portfolio."

Performance tags:
* Use a measured, confident delivery throughout.
* When the transcript says "The call to action," slow slightly and sound direct.
* Keep the final sentence grounded and purposeful.

#### TRANSCRIPT
[measured, confident]
{ep.transcript}
"""


def call_gemini_tts(api_key: str, model: str, prompt: str, timeout: int = 240) -> tuple[bytes, str]:
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload: dict[str, Any] = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {"voiceName": VOICE_NAME}
                }
            },
        },
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        error_text = exc.read().decode("utf-8", "replace")
        raise RuntimeError(f"Gemini TTS HTTP {exc.code} for {model}: {error_text[:800]}") from exc

    try:
        part = body["candidates"][0]["content"]["parts"][0]["inlineData"]
        return base64.b64decode(part["data"]), part.get("mimeType", "audio/L16;codec=pcm;rate=24000")
    except Exception as exc:  # noqa: BLE001 - include compact body for debugging no secrets.
        raise RuntimeError(f"Unexpected Gemini response shape for {model}: {json.dumps(body)[:1000]}") from exc


def save_wav(path: Path, pcm: bytes, sample_rate: int = SAMPLE_RATE) -> None:
    with wave.open(str(path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm)


def convert_to_mp3(wav_path: Path, mp3_path: Path) -> None:
    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(wav_path),
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "96k",
        "-ar",
        "24000",
        "-ac",
        "1",
        str(mp3_path),
    ]
    subprocess.run(cmd, check=True)


def media_duration_seconds(path: Path) -> float:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(path),
    ]
    result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    return float(result.stdout.strip())


def js_string(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2)


def write_manifest(items: list[dict[str, Any]]) -> None:
    tts_config = {
        "provider": "Gemini API",
        "primaryModel": MODEL_PRIMARY,
        "fallbackModel": MODEL_FALLBACK,
        "voiceName": VOICE_NAME,
        "voiceStyle": "Knowledgeable, warm, strategic, single-speaker briefing narration",
        "audioFormat": "MP3 96 kbps mono, 24 kHz derived from Gemini PCM output",
    }
    content = "// Auto-generated by scripts/generate_egypt_podcast_tts.py.\n"
    content += "// Do not place secrets in this file.\n\n"
    content += f"export const PODCAST_TTS_CONFIG = {js_string(tts_config)}\n\n"
    content += f"export const PODCAST_EPISODES = {js_string(items)}\n"
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(content, encoding="utf-8")


def main() -> int:
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY or GOOGLE_API_KEY must be set", file=sys.stderr)
        return 2

    episodes = parse_scripts(SCRIPT_MD.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest_items: list[dict[str, Any]] = []

    for ep in episodes:
        base = f"episode-{ep.number:02d}"
        wav_path = OUT_DIR / f"{base}.wav"
        mp3_path = OUT_DIR / f"{base}.mp3"
        txt_path = OUT_DIR / f"{base}.txt"
        print(f"Generating episode {ep.number}: {ep.title}", flush=True)
        if mp3_path.exists() and txt_path.exists() and mp3_path.stat().st_size > 100_000:
            print(f"  reusing existing {mp3_path.name}", flush=True)
            duration = media_duration_seconds(mp3_path)
            used_model = MODEL_PRIMARY
        else:
            prompt = tts_prompt(ep)
            last_error: Exception | None = None
            used_model = MODEL_PRIMARY
            for model in (MODEL_PRIMARY, MODEL_FALLBACK):
                try:
                    pcm, mime_type = call_gemini_tts(api_key, model, prompt)
                    used_model = model
                    break
                except Exception as exc:  # noqa: BLE001
                    last_error = exc
                    print(f"  {model} failed; trying fallback if available: {exc}", file=sys.stderr, flush=True)
                    time.sleep(2)
            else:
                raise RuntimeError(f"All TTS models failed for episode {ep.number}") from last_error

            save_wav(wav_path, pcm)
            convert_to_mp3(wav_path, mp3_path)
            txt_path.write_text(ep.transcript + "\n", encoding="utf-8")
            duration = media_duration_seconds(mp3_path)
            wav_path.unlink(missing_ok=True)
        manifest_items.append(
            {
                "number": ep.number,
                "title": ep.title,
                "slug": ep.slug,
                "durationSeconds": round(duration, 1),
                "durationLabel": f"{int(duration // 60)}:{int(duration % 60):02d}",
                "audioSrc": f"/strategy/egypt-ai-portfolio/podcast/{base}.mp3",
                "transcriptSrc": f"/strategy/egypt-ai-portfolio/podcast/{base}.txt",
                "model": used_model,
                "voice": VOICE_NAME,
            }
        )
        print(f"  wrote {mp3_path.name} ({duration:.1f}s) using {used_model}", flush=True)

    write_manifest(manifest_items)
    print(f"Wrote manifest: {MANIFEST}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
