"""Compose the Chenneng homepage film around an actual LibTV video.

The opening ten seconds are decoded from the supplied video, frame by frame.
Chinese typography, real website screenshots and the existing original score
are assembled locally. The earlier local-only renderer remains unchanged.

Requires the same Pillow, numpy and imageio-ffmpeg dependencies as
render-chenneng-film.py. Run this script only after downloading the LibTV clip.
"""
from __future__ import annotations

import argparse
from functools import lru_cache
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "media/chenneng-film/sources"
WIDTH, HEIGHT, FPS, DURATION = 1280, 720, 30, 24
GENERATED_SECONDS = 10
FRAME_BYTES = WIDTH * HEIGHT * 3
TRANSITION_SECONDS = 0.5

_spec = importlib.util.spec_from_file_location(
    "chenneng_original_film", Path(__file__).with_name("render-chenneng-film.py")
)
if _spec is None or _spec.loader is None:
    raise RuntimeError("Cannot load the existing Chenneng typography and music helpers")
design = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(design)


@lru_cache(maxsize=1)
def opening_scrim():
    """Reserve readable space without replacing the moving product footage."""
    x = np.arange(WIDTH, dtype=np.float32)[None, :]
    y = np.arange(HEIGHT, dtype=np.float32)[:, None]
    left = np.clip((620 - x) / 320, 0, 1) * 0.45
    top = np.clip((112 - y) / 64, 0, 1) * 0.4
    bottom = np.clip((y - 660) / 30, 0, 1) * 0.88
    alpha = np.maximum(np.maximum(left, top), bottom)
    pixels = np.empty((HEIGHT, WIDTH, 4), dtype=np.uint8)
    pixels[:, :, :3] = design.GREEN
    pixels[:, :, 3] = np.round(alpha * 255).astype(np.uint8)
    return Image.fromarray(pixels, "RGBA")


@lru_cache(maxsize=2)
def opening_copy(second: bool):
    """Local text stays exact; the first frame is also the finished poster."""
    layer = Image.new("RGBA", (WIDTH, HEIGHT))
    design.text(layer, "日常养护 / DAILY CARE", (84, 180), 18, design.SAGE)
    if second:
        design.text(layer, "从了解开始，", (84, 242), 57, design.PAPER, serif=True)
        design.text(layer, "让养护更有方。", (84, 331), 54, design.PAPER, serif=True)
        design.text(layer, "用心了解每一份所需", (86, 447), 25, design.SAGE)
    else:
        design.text(layer, "一人一方。", (84, 236), 76, design.PAPER, serif=True)
        design.text(layer, "关照你的日常。", (84, 343), 49, design.PAPER, serif=True)
        design.text(layer, "本草 · 营养 · 护理", (86, 447), 25, design.SAGE)
    ImageDraw.Draw(layer).line((86, 520, 334, 520), fill=design.GOLD, width=2)
    return layer


def opening_frame(video_frame: Image.Image, t: float):
    image = video_frame.convert("RGBA")
    image.alpha_composite(opening_scrim())
    if t < 4:
        copy = opening_copy(False)
    elif t < 4 + TRANSITION_SECONDS:
        copy = Image.blend(
            opening_copy(False), opening_copy(True),
            design.ease((t - 4) / TRANSITION_SECONDS),
        )
    else:
        copy = opening_copy(True)
    image.alpha_composite(copy)
    design.header(image, dark=True, chapter="湖湘一人一方 · AI 健康驿站")
    design.footer(image, dark=True)
    return image.convert("RGB")


def remaining_frame(t: float, last_opening: Image.Image):
    """Ten to eighteen seconds show the real site; the last six close."""
    if t < 14:
        local = t - 10
        current = design.scene(3, local + 0.35)
        previous = last_opening
    elif t < 18:
        local = t - 14
        current = design.scene(4, local + 0.35)
        previous = design.scene(3, 4.35 + local)
    else:
        local = t - 18
        current = design.scene(5, local + 0.35)
        previous = design.scene(4, 4.35 + local)
    if local < TRANSITION_SECONDS:
        return Image.blend(
            previous, current, design.ease(local / TRANSITION_SECONDS)
        )
    return current


def read_exact_frame(stream):
    data = bytearray()
    while len(data) < FRAME_BYTES:
        part = stream.read(FRAME_BYTES - len(data))
        if not part:
            raise RuntimeError(
                "LibTV video ended before ten seconds of frames could be read. "
                "The existing homepage film has not been replaced."
            )
        data.extend(part)
    return Image.frombytes("RGB", (WIDTH, HEIGHT), bytes(data))


def stop_process(process):
    if process is not None and process.poll() is None:
        process.kill()
        process.wait()


def error_log(path):
    return path.read_text(encoding="utf-8", errors="replace")[-6000:]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--video", type=Path, default=SOURCE_DIR / "libtv-product-v1.mp4",
        help="Downloaded LibTV clip; its first ten seconds supply the opening.",
    )
    parser.add_argument(
        "--output", type=Path,
        default=ROOT / "chenneng/assets/chenneng-brand-film.mp4",
    )
    parser.add_argument(
        "--poster", type=Path,
        help="Poster path; defaults to chenneng-brand-film-poster.jpg beside output.",
    )
    parser.add_argument("--font-dir", type=Path, default=design.FONT_DIR)
    args = parser.parse_args()
    video = args.video.resolve()
    output = args.output.resolve()
    poster = (args.poster or output.with_name("chenneng-brand-film-poster.jpg")).resolve()
    if not video.is_file():
        parser.error(f"Download the LibTV source video first: {video}")
    if video == output or video == poster or output == poster:
        parser.error("Source video, output video and poster must have different paths.")
    for name in ("catalogue.png", "detail.png"):
        if not (SOURCE_DIR / name).is_file():
            parser.error(f"Required real website screenshot is missing: {SOURCE_DIR / name}")
    for name in ("simsun.ttc", "msyh.ttc"):
        if not (args.font_dir / name).is_file():
            parser.error(f"Required font is missing: {args.font_dir / name}")
    design.FONT_DIR = args.font_dir
    design.font.cache_clear()
    output.parent.mkdir(parents=True, exist_ok=True)
    poster.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    # Stage beside the destination so replacement is on the same filesystem.
    # Failed decoding or encoding leaves the current homepage assets intact.
    with tempfile.TemporaryDirectory(prefix=".chenneng-libtv-", dir=output.parent) as directory:
        staging = Path(directory)
        music = staging / "score.wav"
        staged_video = staging / "film.mp4"
        staged_poster = staging / "poster.jpg"
        decoder_log = staging / "decoder.log"
        encoder_log = staging / "encoder.log"
        design.make_music(music)
        decoder_command = [
            ffmpeg, "-hide_banner", "-loglevel", "warning", "-nostdin",
            "-i", str(video), "-map", "0:v:0", "-an", "-sn", "-dn",
            "-vf",
            (
                f"fps={FPS},"
                f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease,"
                f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=0x183d35,"
                "setsar=1,tpad=stop_mode=clone:stop_duration=0.1"
            ),
            "-frames:v", str(FPS * GENERATED_SECONDS),
            "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1",
        ]
        encoder_command = [
            ffmpeg, "-hide_banner", "-loglevel", "warning", "-y",
            "-f", "rawvideo", "-pixel_format", "rgb24",
            "-video_size", f"{WIDTH}x{HEIGHT}", "-framerate", str(FPS),
            "-i", "pipe:0", "-i", str(music),
            "-map", "0:v:0", "-map", "1:a:0", "-t", str(DURATION),
            "-c:v", "libx264", "-preset", "medium", "-crf", "22",
            "-pix_fmt", "yuv420p", "-profile:v", "high", "-level:v", "3.1",
            "-maxrate", "2400k", "-bufsize", "4800k",
            "-c:a", "aac", "-b:a", "128k", "-ar", "48000",
            "-af", "loudnorm=I=-21:TP=-2:LRA=7",
            "-movflags", "+faststart", "-metadata", "title=臣能 · 一人一方",
            "-metadata",
            "comment=LibTV-generated opening footage; supplied product reference; "
            "real website screenshots; local Chinese typography and original synthesized music.",
            str(staged_video),
        ]
        decoder = encoder = None
        first_frame = last_opening = None
        try:
            with decoder_log.open("wb") as decode_errors, encoder_log.open("wb") as encode_errors:
                decoder = subprocess.Popen(
                    decoder_command, stdout=subprocess.PIPE, stderr=decode_errors,
                )
                encoder = subprocess.Popen(
                    encoder_command, stdin=subprocess.PIPE, stderr=encode_errors,
                )
                for number in range(FPS * DURATION):
                    t = number / FPS
                    if number < FPS * GENERATED_SECONDS:
                        frame = opening_frame(read_exact_frame(decoder.stdout), t)
                        last_opening = frame
                    else:
                        frame = remaining_frame(t, last_opening)
                    if first_frame is None:
                        first_frame = frame.copy()
                    encoder.stdin.write(frame.tobytes())
                    if number % (FPS * 2) == 0:
                        print(f"Composing {number // FPS}/{DURATION}s", flush=True)
                encoder.stdin.close()
                encoder.stdin = None
                decoder.stdout.close()
                if decoder.wait() != 0:
                    raise RuntimeError("FFmpeg failed to decode the LibTV source clip")
                if encoder.wait() != 0:
                    raise RuntimeError("FFmpeg failed to encode the finished film")
        except BaseException as exc:
            stop_process(decoder)
            stop_process(encoder)
            if isinstance(exc, Exception):
                details = "\n".join(filter(None, [
                    error_log(decoder_log), error_log(encoder_log)
                ]))
                raise RuntimeError(f"{exc}\n{details}".strip()) from exc
            raise
        finally:
            if decoder is not None and decoder.stdout is not None:
                decoder.stdout.close()
            if encoder is not None and encoder.stdin is not None:
                encoder.stdin.close()
            stop_process(decoder)
            stop_process(encoder)
        first_frame.save(staged_poster, quality=94, subsampling=0)
        # Copy the poster through a sibling temporary file if its directory differs.
        with tempfile.NamedTemporaryFile(
            prefix=".chenneng-poster-", suffix=".jpg", dir=poster.parent, delete=False,
        ) as handle:
            temporary_poster = Path(handle.name)
            handle.write(staged_poster.read_bytes())
        video_backup = staging / "previous-video.mp4"
        if output.exists():
            shutil.copy2(output, video_backup)
        try:
            staged_video.replace(output)
            try:
                temporary_poster.replace(poster)
            except OSError:
                if video_backup.exists():
                    video_backup.replace(output)
                else:
                    output.unlink(missing_ok=True)
                raise
        finally:
            temporary_poster.unlink(missing_ok=True)
    print(json.dumps({
        "video": str(output), "poster": str(poster), "source_video": str(video),
        "generated_opening_seconds": GENERATED_SECONDS,
        "seconds": DURATION, "width": WIDTH, "height": HEIGHT, "fps": FPS,
        "bytes": output.stat().st_size,
        "provenance": "LibTV footage with local typography, website screenshots and original score",
    }, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
