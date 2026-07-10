"""Convert personal photos into lightweight WebP files for the record wall."""

from __future__ import annotations

import argparse
import hashlib
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "source" / "images" / "gallery"
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
CROPS = {"portrait": (900, 1200), "square": (1100, 1100), "landscape": (1600, 900)}


def source_files(paths: list[Path]) -> list[Path]:
    files: list[Path] = []
    for path in paths:
        if path.is_dir():
            files.extend(file for file in path.iterdir() if file.suffix.lower() in EXTENSIONS)
        elif path.is_file() and path.suffix.lower() in EXTENSIONS:
            files.append(path)
        else:
            print(f"Skipping unsupported path: {path}", file=sys.stderr)
    return files


def safe_stem(path: Path) -> str:
    stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", path.stem).strip("-").lower()
    if stem:
        return stem
    digest = hashlib.sha1(path.name.encode("utf-8")).hexdigest()[:8]
    return f"photo-{digest}"


def resize(image: Image.Image, crop: str) -> Image.Image:
    if crop == "keep":
        image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        return image
    width, height = CROPS[crop]
    scale = max(width / image.width, height / image.height)
    resized = image.resize(
        (round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS
    )
    left = (resized.width - width) // 2
    top = (resized.height - height) // 2
    return resized.crop((left, top, left + width, top + height))


def convert(source: Path, output: Path, crop: str, quality: int) -> None:
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
        image = resize(image, crop)
        image.save(output, "WEBP", quality=quality, method=6)
    print(f"{source.name} -> {output.relative_to(ROOT)}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create WebP images for source/images/gallery."
    )
    parser.add_argument("sources", nargs="+", type=Path, help="Image files or one folder")
    parser.add_argument("--crop", choices=["keep", *CROPS], default="keep")
    parser.add_argument("--quality", type=int, default=82)
    parser.add_argument("--name", help="Output filename when converting one image")
    args = parser.parse_args()

    if not 1 <= args.quality <= 100:
        parser.error("--quality must be between 1 and 100")
    files = source_files(args.sources)
    if not files:
        parser.error("No supported images found")
    if args.name and len(files) != 1:
        parser.error("--name can only be used with one image")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for source in files:
        name = args.name or safe_stem(source)
        output = OUTPUT_DIR / f"{name.removesuffix('.webp')}.webp"
        convert(source, output, args.crop, args.quality)


if __name__ == "__main__":
    main()
