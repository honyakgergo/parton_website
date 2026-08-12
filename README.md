# Parton Rendezvényterem — weboldal

Statikus, több oldalas weboldal. Nincs build lépés, nincs framework, nincs
függőség: sima HTML, CSS és vanilla JS, relatív útvonalakkal. Bármelyik
statikus hostingra feltölthető változtatás nélkül (Cloudflare Pages, Netlify,
GitHub Pages).

## Fájlszerkezet

```
parton_website/
├── index.html              Főoldal
├── rolunk.html             Rólunk – a családi történet
├── helyszin.html           Helyszín, teremelrendezések, felszereltség
├── szolgaltatasok.html     Mit tartalmaz a helyszínbérlés
├── rendezvenyek.html       5 alkalomtípus (horgonyokkal: #eskuvok stb.)
├── arak.html               Árak és ajánlatkérés
├── kapcsolat.html          Elérhetőségek
├── adatkezeles.html        Jogi oldal (kitöltésre vár)
├── aszf.html               Jogi oldal (kitöltésre vár)
├── 404.html                Hibaoldal
├── robots.txt
├── sitemap.xml
├── assets/
│   ├── css/style.css       Teljes stíluslap, tokenekkel a tetején
│   ├── js/main.js          Menü, scroll animációk, galéria, kézírás
│   ├── svg/                Elválasztó, nyíl, 3 teremelrendezés rajz
│   └── img/                Optimalizált webes képek (generált – lásd lentebb)
├── images/                 Eredeti, nagy felbontású képek (NEM kerül fel élesbe)
├── instructions/           Kliens leírás
└── tools/optimize_images.py
```

## Képek előkészítése

Az `images/` mappa eredetijei nagyok (~128 MB), ezek nem mennek élesbe.
Az `assets/img/` tartalmát a szkript állítja elő (~5 MB, WebP + JPEG tartalék,
több méretben a `srcset`-hez):

```bash
pip install pillow
python tools/optimize_images.py
```

Új fotó esetén elég felvenni a fájlnevet a szkript `PHOTOS` szótárába
(kimeneti név, oldalarány, méretek), majd újra lefuttatni.

## Design tokenek

A `style.css` tetején, egy helyen:

| Token | Érték | Használat |
|---|---|---|
| `--cream` | `#fff6e0` | alap háttér |
| `--cream-dim` | `#f8eed6` | váltakozó sávok |
| `--green` | `#6c7d58` | kiemelés, ikonok, kézírás |
| `--green-dark` | `#4e5b3f` | gombok, lábléc |

Betűk: **Cormorant Garamond** (címek), **Open Sans** (szöveg),
**Allison** (kézírásos kiemelések). Google Fontsról töltődnek.

## Animációk

Visszafogottan, és `prefers-reduced-motion` esetén mind kikapcsol:

- hero kép lassú beúszása oldalbetöltéskor
- görgetésre megjelenő blokkok (`.reveal`, késleltetés a `--d` változóval)
- képek finom nagyítása hoverre
- vízszintes galéria: a középre kerülő kép nagyobb és élesebb
- a záró kézírásos sor balról jobbra „megíródik” egyszer

## Deploy — Cloudflare Pages

1. Repo összekötése a Pages projekttel.
2. Build command: **nincs**. Build output directory: **`/`** (gyökér).
3. A `404.html` automatikusan kiszolgálódik hibás útvonalnál.

Az `images/`, `instructions/` és `tools/` mappák feltöltése nem szükséges;
ha ki akarod zárni őket, tegyél egy `.cfignore` fájlt a gyökérbe.

## Mielőtt élesbe megy — cserélni kell

- [ ] **E-mail cím:** minden oldalon `info@parton.hu` szerepel placeholderként
      (a leírásban „folyamatban”). Keresés és csere mind a 10 HTML fájlban.
- [ ] **Domain:** a `canonical`, `og:image`, `og:url` és a `sitemap.xml`
      `https://parton.hu/` címre mutat — a végleges domainre kell állítani.
- [ ] **Adatkezelési tájékoztató és ÁSZF** szövege.
- [ ] **Tópartról és a ház külsejéről készült fotók** — a szövegek erősen
      épitenek a vízpartra, de jelenleg csak belső képek vannak.

## Tartalmi megjegyzések

- A leírás a 6660-as képet jelölte hosszú borítóképnek, de az egy közeli
  asztalfotó. A hero a 6664-es (tágas termi kép), ami a kliens saját
  layout tervével egyezik; a 6660 a galériába került.
- A „3 kép a 3 elrendezésről” helyére fotók helyett három vonalas SVG
  alaprajz készült (`assets/svg/elrendezes-*.svg`), a logó stílusához
  illő zöld vonalakkal.
- A Rendezvények oldal bevezetőjében a leírás szövege
  („hogy nektek kelljen alkalmazkodnotok”) az ellenkezőjét jelentette a
  szándékoltnak, ezért „hogy **ne** nektek kelljen alkalmazkodnotok”
  formában szerepel.
- A Galéria menüpont egyelőre kimaradt: hét, hasonló belső fotó nem tesz ki
  önálló galériaoldalt. A főoldali vízszintes galéria tölti be ezt a szerepet,
  amíg nem lesz több kép.
