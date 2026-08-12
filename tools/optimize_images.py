#!/usr/bin/env python3
"""
Parton – webes képek előkészítése.

Az images/ mappában lévő nagy felbontású eredetiket alakítja át
a weboldal által használt, optimalizált változatokra az assets/img/ mappába.

Futtatás a projekt gyökeréből:
    pip install pillow
    python tools/optimize_images.py

Az eredeti fájlokat nem módosítja, csak az assets/img/ tartalmát írja újra.
Ha később új fotó érkezik, elég a PHOTOS szótárba felvenni és újra lefuttatni.

Méretlépcsők: minden fotóból több szélesség készül, a HTML srcset/sizes
párja alapján a böngésző maga választja a képernyőhöz illőt. A nagy felső
lépcsők a 4K és a nagy pixelsűrűségű (DPR 2-3) kijelzők miatt kellenek.
"""

from pathlib import Path
from PIL import Image, ImageChops, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "images"
OUT = ROOT / "assets" / "img"

# eredeti fájl -> (kimeneti név, vágási arány, webp szélességek, jpeg tartalék)
PHOTOS = {
    # A hero a legnagyobb megjelenítési terület (kb. 86vw), ezért kap extra lépcsőket.
    "DSC_6660.jpg": ("hero-terem",  3 / 2, [800, 1200, 1600, 2200, 2800, 3200], 1600),

    "DSC_6633.jpg": ("bemutato-1",  2 / 3, [600, 900, 1200, 1600], 900),
    "DSC_6446.jpg": ("bemutato-2",  2 / 3, [600, 900, 1200, 1600], 900),
    "DSC_6454.jpg": ("bemutato-3",  2 / 3, [600, 900, 1200, 1600], 900),

    "DSC_6664.jpg": ("galeria-1",   4 / 3, [800, 1200, 1600, 2200], 1200),
    "DSC_6624.jpg": ("galeria-2",   4 / 3, [800, 1200, 1600, 2200], 1200),
    "DSC_6444.jpg": ("galeria-3",   4 / 3, [800, 1200, 1600, 2200], 1200),
    "DSC_6613.jpg": ("galeria-4",   4 / 3, [800, 1200, 1600, 2200], 1200),
    "DSC_6524.jpg": ("galeria-5",   4 / 3, [800, 1200, 1600, 2200], 1200),
}

# eredeti fájl -> (kimeneti név, méret px)
ICONS = {
    "family.png":           ("ikon-vendegek",    160),
    "celebate.png":         ("ikon-pohar",       160),
    "place.png":            ("ikon-vizpart",     160),
    "birthday.png":         ("ikon-szuletesnap", 160),
    "family_celebrate.png": ("ikon-csaladi",     160),
    "wedding.png":          ("ikon-eskuvo",      160),
    "work.png":             ("ikon-ceges",       160),
    "13.png":               ("ornament-branch",  900),
}

LOGOS = {
    "parton_icon_green.png":  ("logo-jel-zold", [200, 400]),
    "parton_icone_baige.png": ("logo-jel-bezs", [200, 400]),
}

JPEG_Q = 88
WEBP_Q = 86


def crop_to_ratio(im: Image.Image, ratio: float) -> Image.Image:
    """Középre igazított vágás a kért oldalarányra."""
    w, h = im.size
    if w / h > ratio:                  # túl széles -> oldalt vágunk
        new_w = int(round(h * ratio))
        left = (w - new_w) // 2
        return im.crop((left, 0, left + new_w, h))
    new_h = int(round(w / ratio))      # túl magas -> fent/lent vágunk
    top = (h - new_h) // 2
    return im.crop((0, top, w, top + new_h))


def save_photo(path: Path, name: str, ratio: float, widths: list, jpg_width: int) -> None:
    im = Image.open(path).convert("RGB")
    im = crop_to_ratio(im, ratio)
    source_w = im.size[0]

    for width in widths:
        if width > source_w:           # az eredetinél nagyobbra soha nem nagyítunk
            print(f"  ! {name}-{width}: az eredeti csak {source_w}px, kihagyva")
            continue
        height = int(round(width / ratio))
        resized = im.resize((width, height), Image.LANCZOS)
        resized.save(OUT / f"{name}-{width}.webp", "WEBP", quality=WEBP_Q, method=6)
        print(f"  {name}-{width}.webp")

    height = int(round(jpg_width / ratio))
    im.resize((jpg_width, height), Image.LANCZOS).save(
        OUT / f"{name}-{jpg_width}.jpg", "JPEG",
        quality=JPEG_Q, optimize=True, progressive=True
    )
    print(f"  {name}-{jpg_width}.jpg (tartalék)")


def save_flat(path: Path, name: str, size: int, keep_alpha: bool = True) -> None:
    im = Image.open(path)
    im = im.convert("RGBA" if keep_alpha else "RGB")
    im.thumbnail((size, size), Image.LANCZOS)
    im.save(OUT / f"{name}.png", "PNG", optimize=True)
    print(f"  {name}.png")


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Nem található a képek mappája: {SRC}")
    OUT.mkdir(parents=True, exist_ok=True)

    print("Fotók:")
    for filename, (name, ratio, widths, jpg_width) in PHOTOS.items():
        path = SRC / filename
        if not path.exists():
            print(f"  ! kihagyva (nincs meg): {filename}")
            continue
        save_photo(path, name, ratio, widths, jpg_width)

    print("Ikonok:")
    for filename, (name, size) in ICONS.items():
        path = SRC / filename
        if not path.exists():
            print(f"  ! kihagyva (nincs meg): {filename}")
            continue
        save_flat(path, name, size)

    print("Logó:")
    for filename, (name, sizes) in LOGOS.items():
        path = SRC / filename
        if not path.exists():
            print(f"  ! kihagyva (nincs meg): {filename}")
            continue
        # két sűrűségben (1x / 2x), hogy a böngészőnek alig kelljen átskáláznia
        for size in sizes:
            im = Image.open(path).convert("RGB")
            im = im.resize((size, size), Image.LANCZOS)
            im.save(OUT / f"{name}-{size}.png", "PNG", optimize=True)
            print(f"  {name}-{size}.png")

    # vonalas illusztráció: a fehér hátteret átlátszóvá tesszük
    illu = SRC / "large_vtable.png"
    if illu.exists():
        print("Illusztráció:")
        im = Image.open(illu).convert("RGB")
        im.thumbnail((1600, 1600), Image.LANCZOS)
        # a legvilágosabb csatorna adja az átlátszatlanságot: fehér -> 0, vonal -> 255
        r, g, b = im.split()
        lightest = ImageChops.lighter(ImageChops.lighter(r, g), b)
        alpha = ImageOps.invert(lightest)
        out = im.convert("RGBA")
        out.putalpha(alpha)
        out.save(OUT / "terem-illusztracio.png", "PNG", optimize=True)
        print("  terem-illusztracio.png (átlátszó háttér)")

    # Favicon: csak a nádas részt használjuk a logóból. A teljes jel (házkeret
    # + PARTON felirat) 16px-en olvashatatlan folttá mosódik.
    logo = SRC / "parton_icon_green.png"
    if logo.exists():
        print("Favicon:")
        full = Image.open(logo).convert("RGB")
        w, h = full.size
        bg = full.getpixel((5, 5))
        reeds = full.crop((int(w * 0.20), int(h * 0.04),
                           int(w * 0.82), int(h * 0.66)))
        side = int(max(reeds.size) * 1.12)
        square = Image.new("RGB", (side, side), bg)
        square.paste(reeds, ((side - reeds.size[0]) // 2,
                             (side - reeds.size[1]) // 2))
        for name, size in (("favicon", 64), ("apple-touch-icon", 180)):
            square.resize((size, size), Image.LANCZOS).save(
                OUT / f"{name}.png", "PNG", optimize=True
            )
            print(f"  {name}.png ({size}px)")

        # A böngészők automatikusan a gyökérben lévő /favicon.ico-t is kérik,
        # ezért oda több méretet tartalmazó ICO fájl is kerül.
        ico = ROOT / "favicon.ico"
        square.resize((64, 64), Image.LANCZOS).save(
            ico, "ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
        )
        print(f"  favicon.ico (16/32/48/64px) -> {ico}")

    hero = SRC / "DSC_6660.jpg"
    if hero.exists():
        print("Megosztási kép:")
        im = crop_to_ratio(Image.open(hero).convert("RGB"), 1200 / 630)
        im.resize((1200, 630), Image.LANCZOS).save(
            OUT / "og-parton.jpg", "JPEG", quality=88, optimize=True, progressive=True
        )
        print("  og-parton.jpg")

    total = sum(f.stat().st_size for f in OUT.glob("*") if f.is_file())
    print(f"\nKész. {len(list(OUT.glob('*')))} fájl, összesen {total/1048576:.1f} MB")
    print("Helye:", OUT)


if __name__ == "__main__":
    main()
