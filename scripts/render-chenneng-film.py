"""Render the 24-second Chenneng homepage film from the supplied brand assets.

Requires Pillow, numpy and imageio-ffmpeg. Fonts default to the Windows fonts
used by the website; set --font-dir when running on another workstation.
No remote generation service, stock footage or third-party music is used.
"""
from __future__ import annotations

import argparse
from functools import lru_cache
import json
import math
from pathlib import Path
import subprocess
import tempfile
import wave

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "media/chenneng-film/sources"
WIDTH, HEIGHT, FPS, DURATION = 1280, 720, 30, 24
PAPER = (248, 247, 242)
GREEN = (24, 61, 53)
INK = (32, 61, 52)
SAGE = (188, 204, 154)
GOLD = (185, 148, 98)
MUTED = (101, 113, 106)
FONT_DIR = Path("C:/Windows/Fonts")
CATALOGUE = json.loads(
    (ROOT / "chenneng/products.js").read_text(encoding="utf-8")
    .split("window.CHENNENG_PRODUCTS =", 1)[1].strip().removesuffix(";")
)
COUNTS = {
    "products": len(CATALOGUE),
    "categories": len({product["cat"] for product in CATALOGUE}),
    "topics": len({topic for product in CATALOGUE for topic in product["topics"]}),
    "food": sum(product["cat"] == "food" for product in CATALOGUE),
    "device": sum(product["cat"] == "device" for product in CATALOGUE),
}


@lru_cache(maxsize=64)
def font(size: int, serif: bool = False):
    return ImageFont.truetype(str(FONT_DIR / ("simsun.ttc" if serif else "msyh.ttc")), size)


def ease(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return 1 - (1 - value) ** 3


def opacity(value: float) -> int:
    return int(255 * max(0.0, min(1.0, value)))


def text(image, value, xy, size, color, *, serif=False, align="left", alpha=1):
    layer = Image.new("RGBA", image.size)
    draw = ImageDraw.Draw(layer)
    face = font(size, serif)
    box = draw.textbbox((0, 0), value, font=face)
    width = draw.textlength(value, font=face)
    x, y = xy
    if align == "center":
        x -= width / 2
    elif align == "right":
        x -= width
    draw.text((x, y - box[1]), value, font=face, fill=(*color, opacity(alpha)))
    image.alpha_composite(layer)


def animated_text(image, value, xy, size, color, t, *, delay=0, serif=False, align="left"):
    amount = ease((t - delay) / 0.8)
    text(image, value, (xy[0], xy[1] + (1 - amount) * 24), size, color,
         serif=serif, align=align, alpha=amount)


@lru_cache(maxsize=2)
def background(dark: bool):
    base = np.array(GREEN if dark else PAPER, dtype=np.int16)
    noise = np.random.default_rng(19).integers(-1, 2, (HEIGHT, WIDTH, 1), dtype=np.int16)
    pixels = np.clip(base + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(pixels).convert("RGBA")


def contours(image, t, *, dark=False, side=0):
    layer = Image.new("RGBA", image.size)
    draw = ImageDraw.Draw(layer)
    color = (159, 184, 139, 35) if dark else (123, 150, 104, 32)
    for index in range(10):
        points = []
        for x in range(-20, WIDTH + 20, 8):
            y = 520 + index * 24 + 56 * math.sin(x / 270 + t * 0.065 + side)
            y += 40 * math.cos(x / 150 - t * 0.045)
            points.append((x, y))
        draw.line(points, fill=color, width=1)
    cx = 1040 if not side else 210
    for radius in [195, 225, 255]:
        draw.ellipse((cx - radius, 300 - radius, cx + radius, 300 + radius),
                     outline=color, width=1)
    image.alpha_composite(layer)


def header(image, dark=False, chapter=""):
    fg = PAPER if dark else GREEN
    draw = ImageDraw.Draw(image)
    draw.ellipse((64, 37, 104, 77), outline=(*fg, 100), width=1)
    draw.line([(73, 64), (82, 47), (90, 60), (95, 53), (101, 64)],
              fill=fg, width=2)
    text(image, "臣能", (118, 39), 32, fg, serif=True)
    text(image, "CHENNENG", (204, 48), 15, fg)
    text(image, chapter, (1216, 49), 18, SAGE if dark else MUTED, align="right")


def footer(image, dark=False):
    color = (184, 198, 174) if dark else (109, 121, 100)
    text(image, "保健食品不是药物，不能代替药物治疗疾病。医疗器械请在医务人员指导下使用。",
         (640, 680), 19, color, align="center")


def rounded_paste(destination, source, xy, radius=14):
    source = source.convert("RGBA")
    mask = Image.new("L", source.size)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, source.width, source.height), radius, fill=255)
    source.putalpha(mask)
    destination.alpha_composite(source, (round(xy[0]), round(xy[1])))


def shadowed(layer, padding=24):
    shadow = Image.new("RGBA", (layer.width + padding * 2, layer.height + padding * 2))
    shadow.putalpha(Image.new("L", shadow.size))
    alpha = Image.new("L", shadow.size)
    alpha.paste(layer.getchannel("A"), (padding, padding + 10))
    alpha = alpha.filter(ImageFilter.GaussianBlur(12)).point(lambda pixel: int(pixel * 0.14))
    shadow.paste((20, 45, 31, 255), (0, 0, *shadow.size), alpha)
    shadow.alpha_composite(layer, (padding, padding))
    return shadow


@lru_cache(maxsize=8)
def product_card(name, crop, title, label, angle):
    original = Image.open(SOURCES / name).convert("RGB")
    # Camera framing preserves the supplied packaging; no packaging is generated.
    shot = original.crop(crop)
    frame = Image.new("RGBA", (290, 378), "white")
    fitted = ImageOps.contain(shot, (266, 275), method=Image.Resampling.LANCZOS)
    photo = Image.new("RGB", (266, 275), PAPER)
    photo.paste(fitted, ((266 - fitted.width) // 2, (275 - fitted.height) // 2))
    rounded_paste(frame, photo, (12, 12), 6)
    text(frame, label, (18, 306), 16, MUTED)
    text(frame, title, (18, 333), 21, GREEN)
    mask = Image.new("L", frame.size)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 289, 377), 12, fill=255)
    frame.putalpha(mask)
    frame = frame.rotate(angle, Image.Resampling.BICUBIC, expand=True)
    return shadowed(frame)


@lru_cache(maxsize=2)
def phone(name):
    shot = Image.open(SOURCES / name).convert("RGB")
    shot = shot.resize((292, 554), Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (314, 576), GREEN)
    rounded_paste(frame, shot, (11, 11), 17)
    mask = Image.new("L", frame.size)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 313, 575), 27, fill=255)
    frame.putalpha(mask)
    return shadowed(frame)


def scene(index, t):
    dark = index in [0, 2, 5]
    image = background(dark).copy()
    contours(image, t + index * 4, dark=dark, side=index % 2)
    chapter = ["湖湘一人一方 · AI 健康驿站", "日常养护 / DAILY CARE",
               "产品总览 / COLLECTION", "从关注出发 / DISCOVER",
               "认真了解 / KNOW MORE", "湖湘一人一方 · AI 健康驿站"][index]
    header(image, dark, chapter)
    if index == 0:
        # Broad type and restrained movement remain readable inside a mobile player.
        animated_text(image, "一人一方。", (640, 210), 108, PAPER, t, serif=True, align="center")
        animated_text(image, "关照你的日常。", (640, 359), 58, SAGE, t, delay=.3, serif=True, align="center")
        animated_text(image, "从了解开始，让养护更有方。", (640, 471), 28, PAPER, t, delay=.6, align="center")
        line = ImageDraw.Draw(image)
        width = 110 * ease(t / 1.3)
        line.line((640 - width, 551, 640 + width, 551), fill=GOLD, width=2)
    elif index == 1:
        animated_text(image, "日常养护，各有所需。", (640, 124), 54, GREEN, t, serif=True, align="center")
        cards = [
            ("tianma.jpg", (200, 645, 1075, 1475), "天麻酸枣仁泽泻杜仲胶囊", "保健食品", 4),
            ("protein.jpg", (55, 125, 475, 745), "臣能蛋白粉", "保健食品", -2),
            ("patch.jpg", (205, 80, 1075, 1200), "远红外磁疗镇痛贴", "二类医疗器械", -4),
        ]
        for i, spec in enumerate(cards):
            card = product_card(*spec)
            amount = ease((t - .15 * i) / .9)
            x = 136 + 344 * i - (card.width - 290) / 2
            y = 216 + (1 - amount) * 90 + math.sin(t * .7 + i) * 4
            if amount < 1:
                card = card.copy()
                card.putalpha(card.getchannel("A").point(lambda p: int(p * amount)))
            image.alpha_composite(card, (round(x), round(y)))
    elif index == 2:
        animated_text(image, "一份清晰的产品目录。", (640, 133), 54, PAPER, t, serif=True, align="center")
        draw = ImageDraw.Draw(image)
        for i, (number, label) in enumerate([(COUNTS["products"], "款全系产品"),
                                             (COUNTS["categories"], "类产品资料"),
                                             (COUNTS["topics"], "个关注主题")]):
            cx = 280 + 360 * i
            if i:
                draw.line((cx - 180, 277, cx - 180, 425), fill=(66, 97, 76), width=1)
            animated_text(image, str(number), (cx, 254), 126, SAGE, t, delay=.12 * i, serif=True, align="center")
            animated_text(image, label, (cx, 424), 29, PAPER, t, delay=.22 + i * .12, align="center")
        animated_text(image, f"保健食品 {COUNTS['food']} 款   ·   医疗器械 {COUNTS['device']} 款",
                      (640, 549), 27, PAPER, t, delay=.55, align="center")
    elif index == 3:
        x = 136
        animated_text(image, "从你关心的", (x, 193), 61, GREEN, t, serif=True)
        animated_text(image, "主题开始。", (x, 283), 68, (104, 129, 94), t, delay=.17, serif=True)
        animated_text(image, "按名称、原料或文号搜索", (x, 410), 29, MUTED, t, delay=.42)
        animated_text(image, "让所需信息，更容易找到。", (x, 462), 29, MUTED, t, delay=.57)
        card = phone("catalogue.png")
        image.alpha_composite(card, (round(810 - 30 * ease(t / 1.1)), round(76 + math.sin(t * .5) * 4)))
        amount = ease((t - 1.3) / .65)
        draw = ImageDraw.Draw(image)
        draw.line((136, 554, 136 + 380 * amount, 554), fill=GOLD, width=3)
    elif index == 4:
        card = phone("detail.png")
        image.alpha_composite(card, (round(147 + 25 * ease(t)), round(77 + math.sin(t * .6) * 3)))
        animated_text(image, "看清资料。", (614, 202), 65, GREEN, t, serif=True)
        animated_text(image, "认真选用。", (614, 294), 65, (104, 129, 94), t, delay=.2, serif=True)
        animated_text(image, "规格 · 原料 · 批准文号", (614, 425), 29, MUTED, t, delay=.4)
        animated_text(image, "用法 · 人群 · 注意事项", (614, 479), 29, MUTED, t, delay=.58)
        animated_text(image, "结合自身情况与专业指导", (614, 552), 23, GREEN, t, delay=.7)
    else:
        animated_text(image, "臣能", (640, 151), 67, SAGE, t, serif=True, align="center")
        animated_text(image, "湖湘一人一方", (640, 271), 85, PAPER, t, delay=.15, serif=True, align="center")
        animated_text(image, "AI 健康驿站", (640, 393), 41, SAGE, t, delay=.35, align="center")
        amount = ease((t - .6) / .8)
        draw = ImageDraw.Draw(image)
        draw.rounded_rectangle((440, 511, 840, 579), 5, outline=(*SAGE, opacity(amount)), width=1)
        animated_text(image, "探索产品总览  →", (640, 528), 28, PAPER, t, delay=.6, align="center")
    footer(image, dark)
    return image.convert("RGB")


def frame_at(t):
    index = min(5, int(t // 4))
    local = t - index * 4
    current = scene(index, local)
    # Half-second optical dissolves bridge colour states without flashing.
    if index > 0 and local < .45:
        previous = scene(index - 1, 4 + local)
        return Image.blend(previous, current, ease(local / .45))
    return current


def make_music(destination):
    rate = 48000
    length = int(DURATION * rate)
    audio = np.zeros((length, 2), dtype=np.float64)

    def add_note(start, duration, midi, gain, pan=0, pad=False):
        begin = int(start * rate)
        n = min(int(duration * rate), length - begin)
        if n <= 0:
            return
        times = np.arange(n) / rate
        frequency = 440 * 2 ** ((midi - 69) / 12)
        if pad:
            env = np.minimum(times / .75, 1) * np.minimum((duration - times) / 1.4, 1)
            signal = np.sin(2 * np.pi * frequency * times) + .13 * np.sin(4 * np.pi * frequency * times)
        else:
            env = (1 - np.exp(-times * 85)) * np.exp(-times * 2.1)
            env *= np.minimum((duration - times) / .15, 1)
            signal = np.sin(2 * np.pi * frequency * times) + .28 * np.sin(4 * np.pi * frequency * times) * np.exp(-times * 3)
        signal *= np.clip(env, 0, 1) * gain
        audio[begin:begin + n, 0] += signal * math.sqrt((1 - pan) / 2)
        audio[begin:begin + n, 1] += signal * math.sqrt((1 + pan) / 2)

    chords = [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]]
    melody = [[72, 76, 79, 74, 76, 79], [69, 72, 76, 79, 76, 72],
              [69, 72, 77, 79, 77, 72], [67, 71, 74, 79, 74, 72]]
    for bar, chord in enumerate(chords):
        for i, note in enumerate(chord):
            add_note(bar * 6, 6.7, note, .038, (i - 1.5) * .25, True)
        for i, note in enumerate(melody[bar]):
            add_note(bar * 6 + .75 + i * .75, 2.1, note, .085, math.sin(i) * .3)
    # A quiet stereo echo gives the original synthesized score room to breathe.
    dry = audio.copy()
    for delay, gain in [(.23, .14), (.47, .08)]:
        samples = int(delay * rate)
        audio[samples:] += dry[:-samples, ::-1] * gain
    times = np.arange(length) / rate
    fade = np.minimum(times / 1.2, 1) * np.minimum((DURATION - times) / 1.5, 1)
    audio *= np.clip(fade[:, None], 0, 1)
    audio = np.clip(audio, -1, 1)
    with wave.open(str(destination), "wb") as handle:
        handle.setparams((2, 2, rate, 0, "NONE", "not compressed"))
        handle.writeframes((audio * 32767).astype("<i2").tobytes())


def main():
    global FONT_DIR
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "chenneng/assets/chenneng-brand-film.mp4")
    parser.add_argument("--font-dir", type=Path, default=FONT_DIR)
    parser.add_argument("--frames-only", type=Path, help="Render representative frames without encoding a film.")
    args = parser.parse_args()
    FONT_DIR = args.font_dir
    if args.frames_only:
        args.frames_only.mkdir(parents=True, exist_ok=True)
        for index in range(6):
            frame_at(index * 4 + 2).save(args.frames_only / f"scene-{index + 1}.jpg", quality=94)
        print(args.frames_only, flush=True)
        return
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="chenneng-film-") as directory:
        music = Path(directory) / "score.wav"
        make_music(music)
        command = [
            imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-loglevel", "warning", "-y",
            "-f", "rawvideo", "-pixel_format", "rgb24", "-video_size", f"{WIDTH}x{HEIGHT}",
            "-framerate", str(FPS), "-i", "pipe:0", "-i", str(music),
            "-map", "0:v:0", "-map", "1:a:0", "-t", str(DURATION),
            "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p",
            "-profile:v", "high", "-level:v", "3.1", "-maxrate", "2400k", "-bufsize", "4800k",
            "-c:a", "aac", "-b:a", "128k", "-ar", "48000",
            "-af", "loudnorm=I=-21:TP=-2:LRA=7",
            "-movflags", "+faststart", "-metadata", "title=臣能 · 一人一方",
            "-metadata", "comment=Original motion design and synthesized instrumental; supplied product imagery.",
            str(args.output),
        ]
        process = subprocess.Popen(command, stdin=subprocess.PIPE)
        try:
            for frame in range(FPS * DURATION):
                process.stdin.write(frame_at(frame / FPS).tobytes())
                if frame % (FPS * 4) == 0:
                    print(f"Rendering {frame // FPS}/{DURATION}s", flush=True)
        except BaseException:
            process.kill()
            process.wait()
            raise
        finally:
            process.stdin.close()
        if process.wait() != 0:
            raise RuntimeError("FFmpeg failed to encode the film")
    poster = args.output.with_name("chenneng-brand-film-poster.jpg")
    frame_at(2).save(poster, quality=94, subsampling=0)
    print(json.dumps({"video": str(args.output), "poster": str(poster),
                      "seconds": DURATION, "width": WIDTH, "height": HEIGHT,
                      "fps": FPS, "bytes": args.output.stat().st_size}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
