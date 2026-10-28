"""Download covers for the 书影音 page into source/images/shelf/.

Douban refuses images requested from other sites, so the covers are fetched
once (with a Douban referer) and stored in the repo as small WebP files.
Run by .github/workflows/shelf-covers.yml whenever source/_data/shelf.yml changes.
"""

import io
import sys
import time
import urllib.request
from pathlib import Path

import yaml
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "source" / "_data" / "shelf.yml"
OUT = ROOT / "source" / "images" / "shelf"
AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"


def fetch(urls, referer):
    for url in urls:
        request = urllib.request.Request(url, headers={"User-Agent": AGENT, "Referer": referer})
        try:
            with urllib.request.urlopen(request, timeout=8) as response:
                body = response.read()
            Image.open(io.BytesIO(body)).verify()
            return body
        except Exception as error:  # try the next size or host
            print(f"  skip {url}: {error}", flush=True)
    return None


def save(body, target, width):
    image = Image.open(io.BytesIO(body)).convert("RGB")
    if image.width > width:
        image = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, "WEBP", quality=80, method=6)


def main():
    data = yaml.safe_load(DATA.read_text(encoding="utf-8"))
    jobs = []
    for film in data.get("films") or []:
        poster = film["poster"]
        jobs.append((
            OUT / "films" / f"{film['id']}.webp",
            [f"https://img{n}.doubanio.com/view/photo/m_ratio_poster/public/{poster}.jpg" for n in (9, 1, 2, 3)],
            "https://movie.douban.com/",
            480,
        ))
    for book in data.get("books") or []:
        cover = book["cover"]
        jobs.append((
            OUT / "books" / f"{book['id']}.webp",
            [f"https://img{n}.doubanio.com/view/subject/l/public/{cover}.jpg" for n in (9, 1, 2, 3)],
            "https://book.douban.com/",
            480,
        ))
    for track in (data.get("music") or {}).get("tracks") or []:
        jobs.append((
            OUT / "music" / f"{track['id']}.webp",
            [f"https://p{n}.music.126.net/{track['cover']}?param=480y480" for n in (2, 1)],
            "https://music.163.com/",
            480,
        ))

    wanted = {target for target, *_ in jobs}
    for stale in OUT.glob("*/*.webp"):
        if stale not in wanted:
            stale.unlink()
            print(f"removed {stale.relative_to(ROOT)}")

    fetched = failed = 0
    for target, urls, referer, width in jobs:
        if target.exists():
            continue
        body = fetch(urls[:2], referer)
        if body is None:
            failed += 1
            print(f"FAILED {target.relative_to(ROOT)}", flush=True)
            if failed >= 5 and not fetched:
                print("::warning::Giving up: the image hosts refuse this machine.", flush=True)
                break
            continue
        save(body, target, width)
        fetched += 1
        time.sleep(0.4)
        print(f"saved {target.relative_to(ROOT)}", flush=True)
    print(f"::notice::covers: {fetched} fetched, {failed} failed, {len(jobs)} total")
    return 1 if failed and not fetched and not any(t.exists() for t in wanted) else 0


if __name__ == "__main__":
    sys.exit(main())
