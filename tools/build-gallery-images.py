"""Create the square and full-size WebP variants used by the record wall."""

from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parent.parent
ORIGINALS = ROOT / "source" / "images" / "gallery" / "originals"
THUMBS = ROOT / "source" / "images" / "gallery" / "thumbs"
FULL = ROOT / "source" / "images" / "gallery" / "full"
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def rgb_image(source: Path) -> Image.Image:
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        if image.mode in {"RGBA", "LA"}:
            canvas = Image.new("RGB", image.size, "white")
            canvas.paste(image, mask=image.getchannel("A"))
            return canvas
        return image.convert("RGB")


def write_variants(source: Path) -> None:
    image = rgb_image(source)
    thumbnail = ImageOps.fit(
        image, (640, 640), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5)
    )
    full = image.copy()
    full.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
    name = f"{source.stem}.webp"
    thumbnail.save(THUMBS / name, "WEBP", quality=82, method=6)
    full.save(FULL / name, "WEBP", quality=84, method=6)
    print(f"Prepared {source.name}")


def main() -> None:
    THUMBS.mkdir(parents=True, exist_ok=True)
    FULL.mkdir(parents=True, exist_ok=True)
    originals = (
        sorted(path for path in ORIGINALS.iterdir() if path.suffix.lower() in EXTENSIONS)
        if ORIGINALS.exists()
        else []
    )
    for source in originals:
        write_variants(source)
    print(f"Gallery build complete: {len(originals)} image(s)")


if __name__ == "__main__":
    main()
