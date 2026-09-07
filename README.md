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
├── szallas.html            Szállás – 4 kétfős szoba, 8 fő részére
├── szolgaltatasok.html     Mit tartalmaz a helyszínbérlés
├── rendezvenyek.html       6 alkalomtípus (horgonyokkal: #eskuvok stb.)
├── arak.html               Árak és ajánlatkérés
├── galeria.html            Galéria – 16 kép mozaikban, nagy nézettel
├── kapcsolat.html          Elérhetőségek
├── impresszum.html         Szolgáltatói adatok (Moltax Kft.)
├── adatkezeles.html        Adatkezelési tájékoztató (11 szakasz)
├── aszf.html               Általános foglalási és szolgáltatási feltételek (25 szakasz)
├── workshop-feltetelek.html  Workshopok – foglalási és lemondási feltételek
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

## Alapadatok — egy helyen

A `instructions/Parton impresszum.docx` az irányadó forrás. Amit onnan
átvettünk, és ami több oldalon is szerepel:

| Adat | Érték |
|---|---|
| Üzemeltető | Moltax Kft. |
| Székhely / telephely | 2336 Dunavarsány, Nagyvarsányi utca 138/5. |
| Adószám | 24760863-2-13 |
| Cégjegyzékszám | 13-09-166951 |
| E-mail | `info@partonrendezveny.hu` |
| Telefon | +36 70 326 2692 |
| Domain | `https://partonrendezveny.hu` |
| Terembérlés | 170 000 Ft / rendezvény, plusz óradíj nélkül |
| Előleg / kaució / takarítás | 30 000 Ft / 50 000 Ft / +20 000 Ft |
| Befogadóképesség | beltéren 48 fő, kültéren 100 fő |
| Szállás | 4 db kétfős szoba, összesen 8 fő |

## Mielőtt élesbe megy — nyitott kérdések

- [ ] **Házszám ellenőrzése:** az impresszum mind a négy helyen
      `Nagyvarsányi utca 138/5.` címet ad (székhely *és* telephely), a korábbi
      leírás viszont `138/57`-et. A weboldalon most a `138/5` szerepel. Ha a
      rendezvényhelyszín valóban a `138/57`-es telken van, a `kapcsolat.html`
      és a láblécek címét vissza kell írni — a Google Maps hivatkozás
      hely-azonosítóval megy, azt nem érinti.
- [ ] **Névhasználat:** az impresszum „Parton Rendezvény**ház**” néven
      hivatkozik a helyszínre, a weboldal viszont mindenhol „Parton
      Rendezvény**terem**”-et használ (logó, fejléc, oldalcímek, og-adatok).
      Egyelőre a weboldal névhasználata maradt. Ha a hivatalos név a
      Rendezvényház, azt egyben, minden oldalon cserélni kell.
- [ ] **Ajánlatkérő űrlap:** a leírás űrlapot kért a Kapcsolat oldalra.
      Jelenleg előre kitöltött `mailto:` gomb van helyette, mert a statikus
      hostinghoz külső űrlapszolgáltató kell (pl. Formspree, Web3Forms,
      Cloudflare Pages Functions). Döntés kérdése, melyik legyen.
- [ ] **A ház külsejéről készült fotó** — a szállás és a helyszín szövege
      épít a házra, de kültéri homlokzatkép még nincs.
- [ ] **`favicon.ico` nincs verziókövetve.** A szkript a gyökérbe írja, de a
      fájl untracked — minden oldal `href="favicon.ico"`-ként hivatkozik rá,
      így élesben 404-et adna. Egy `git add favicon.ico` megoldja.
- [ ] **A négy vonalas rajz PNG-je nagy** (`elrendezes-1..3`,
      `terem-illusztracio`): együtt kb. 6,6 MB, és a Helyszín oldal
      mindegyiket egyszerre tölti be. Az ok, hogy a `save_line_art()` a
      szkennelt fehér háttér zaját is átlátszóságként viszi át, így az alfa és
      az RGB is végig változó marad. A tus egyszínű, tehát elvileg ~80%
      megtakarítás van benne (állandó RGB + tisztított alfa), de a próbáim
      halványabb, hidegebb vonalakat adtak az eredetinél, ezért a rajzok
      egyelőre változatlanok. Ha rámegyünk, a tusszín és az alfa-görbe
      hangolását vizuális összevetéssel kell elvégezni.

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
