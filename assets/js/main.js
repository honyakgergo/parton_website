/* PARTON — interakciók
   1) mobil menü  2) fejléc árnyék  3) megjelenítő animáció
   4) görgetéssel vezérelt vízszintes galéria  5) kézírás animáció
   6) galéria nagy nézet (lightbox)
   Minden rész opcionális: ha az adott elem nincs az oldalon, kimarad. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Ahol a stíluslap a hamburger menüre vált (assets/css/style.css). */
  var NAV_BREAK = 1180;

  /* --- 1. Mobil menü --------------------------------------------------- */
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  var header = document.querySelector('.header');

  if (burger && nav) {
    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
      document.body.style.overflow = open && window.innerWidth <= NAV_BREAK ? 'hidden' : '';
      /* Nyitáskor a fejléc azonnal visszanyílik. (Korábban ez csak görgetéskor
         történt meg, de nyitott menünél a görgetés zárolva van, így a menü
         összezárt fejléc alatt nyílt ki.) */
      if (open && header) header.classList.remove('is-compact');
    };

    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > NAV_BREAK) setMenu(false);
    });
  }

  /* --- 2. Fejléc: árnyék + összezárás görgetési irány szerint ---------- */
  if (header) {
    var lastY = window.scrollY;
    var headerTicking = false;

    var onHeaderScroll = function () {
      headerTicking = false;
      var y = window.scrollY;
      header.classList.toggle('is-stuck', y > 8);

      // a menü nyitva van mobilon? akkor mindig teljes méretben marad
      var menuOpen = nav && nav.classList.contains('is-open');

      if (menuOpen || y < 140) {
        header.classList.remove('is-compact');
      } else if (y > lastY + 4) {
        header.classList.add('is-compact');      // lefelé – összezár
      } else if (y < lastY - 4) {
        header.classList.remove('is-compact');   // felfelé – visszanyílik
      }

      lastY = y;
    };

    onHeaderScroll();
    window.addEventListener('scroll', function () {
      if (!headerTicking) {
        headerTicking = true;
        window.requestAnimationFrame(onHeaderScroll);
      }
    }, { passive: true });
  }

  /* --- 2b. Olajfaág motívum kibontakozása ----------------------------- */
  var leafBands = document.querySelectorAll('.features, .pagehero');
  if (leafBands.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      leafBands.forEach(function (el) { el.classList.add('is-grown'); });
    } else {
      var leafIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-grown');
            leafIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      leafBands.forEach(function (el) { leafIo.observe(el); });
    }
  }

  /* --- 2c. "Szél": az ág csak görgetés közben leng ---------------------- */
  /* A lengés CSS-animáció, itt csak a play-state kapcsolóját adjuk meg:
     amíg görgetés van (fel vagy le), fut; ha megáll, ott áll meg, ahol
     éppen tart – nem ugrik vissza. */
  if (!reduced) {
    var breezeRoot = document.documentElement;
    var breezeTimer = null;

    window.addEventListener('scroll', function () {
      breezeRoot.classList.add('is-scrolling');
      window.clearTimeout(breezeTimer);
      breezeTimer = window.setTimeout(function () {
        breezeRoot.classList.remove('is-scrolling');
      }, 260);
    }, { passive: true });
  }

  /* --- 3. Megjelenítő animáció ---------------------------------------- */
  var reveals = document.querySelectorAll('.reveal');

  if (reveals.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
        /* threshold: 0 — szándékosan nem arányt kérünk. Az arányos küszöb a
           blokk MAGASSÁGÁHOZ mérten számol, így egy magas blokk (pl. a
           Kapcsolat elérhetőség-listája) rejtve maradhat akkor is, amikor
           már látszik a képernyő alján: a 12%-a több száz pixel. A rootMargin
           alsó -12%-a adja a "kissé jöjjön beljebb" hatást, magasságtól
           függetlenül. */
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });

      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* --- 4. Görgetéssel vezérelt vízszintes galéria ---------------------- */
  /* A szakasz magassága = a ragadó rész (100vh) + a vízszintes út hossza.
     Ahogy a látogató lefelé görget, a képsáv oldalra csúszik; amikor a sáv
     végére ér, a ragadás megszűnik és az oldal normálisan folytatódik. */
  var hs = document.querySelector('.hscroll');

  if (hs) {
    var sticky = hs.querySelector('.hscroll__sticky');
    var track = hs.querySelector('.hscroll__track');
    var bar = hs.querySelector('.hscroll__bar span');
    var items = Array.prototype.slice.call(hs.querySelectorAll('.hscroll__item'));
    var metrics = [];
    var travel = 0;
    var current = 0;    // ahol a sáv éppen tart
    var target = 0;     // ahol a görgetés szerint lennie kellene
    var velocity = 0;
    var running = false;
    var visible = false;

    var EASE = 0.085;   // kisebb érték = lassabban követ, áramlóbb

    var isDesktop = function () {
      return window.innerWidth > 900 && !reduced;
    };

    var clamp = function (v, min, max) {
      return v < min ? min : (v > max ? max : v);
    };

    /* A méreteket csak átrendezéskor olvassuk ki, így a képkockán belül
       nincs elrendezés-újraszámolás. */
    var measure = function () {
      metrics = items.map(function (item) {
        return { el: item, mid: item.offsetLeft + item.offsetWidth / 2 };
      });
    };

    var paint = function () {
      var half = window.innerWidth / 2;

      track.style.transform = 'translate3d(' + (-current).toFixed(2) + 'px,0,0)';
      if (bar && travel) {
        bar.style.width = clamp((current / travel) * 100, 0, 100).toFixed(2) + '%';
      }

      // a sebesség finom dőlést és extra csúszt ad – ettől lesz áramló
      var lean = clamp(velocity * 0.018, -2.6, 2.6);
      var drift = clamp(velocity * 0.06, -22, 22);

      for (var i = 0; i < metrics.length; i++) {
        var m = metrics[i];
        var screenMid = m.mid - current;
        var offset = clamp((screenMid - half) / half, -1.6, 1.6);
        var near = 1 - Math.min(1, Math.abs(offset));
        var away = 1 - near;

        m.el.style.transform =
          'translate3d(0,' + (away * 30).toFixed(1) + 'px,0)' +
          ' scale(' + (0.95 + near * 0.05).toFixed(3) + ')' +
          ' rotate(' + (offset * 0.9).toFixed(2) + 'deg)' +
          ' skewX(' + lean.toFixed(2) + 'deg)';
        // a szélső képek nem halványulnak el – a sáv maszkja gondoskodik
        // a szélek lágy eltűnéséről
        m.el.style.opacity = (0.94 + near * 0.06).toFixed(3);

        var img = m.el.querySelector('img');
        if (img) {
          img.style.transform =
            'scale(' + (1.24 - near * 0.1).toFixed(3) + ')' +
            ' translate3d(' + (offset * -8 - drift * 0.08).toFixed(2) + '%,0,0)';
        }
      }
    };

    var tick = function () {
      var span = hs.offsetHeight - sticky.offsetHeight;
      if (span > 0) {
        var progress = clamp(-hs.getBoundingClientRect().top / span, 0, 1);
        target = progress * travel;
      }

      var diff = target - current;
      velocity = diff;
      current += diff * EASE;

      // ha már elhanyagolható a különbség, ráillesztjük és megállunk
      if (Math.abs(diff) < 0.08) {
        current = target;
        velocity = 0;
        paint();
        if (!visible) { running = false; return; }
      } else {
        paint();
      }

      window.requestAnimationFrame(tick);
    };

    var start = function () {
      if (running || !travel) return;
      running = true;
      window.requestAnimationFrame(tick);
    };

    /* --- mobil mód: az újjal húzható sáv ugyanazt a középre-érkező
       animációt kapja, csak visszafogottabb értékekkel --- */
    var paintTouch = function () {
      var half = window.innerWidth / 2;
      items.forEach(function (item) {
        var box = item.getBoundingClientRect();
        var offset = clamp((box.left + box.width / 2 - half) / half, -1.4, 1.4);
        var near = 1 - Math.min(1, Math.abs(offset));
        var away = 1 - near;

        // mobilon nincs függőleges elmozdulás – csak méret és átlátszatlanság,
        // különben függőlegesen is "el lehetne húzni" a sávot
        item.style.transform =
          'scale(' + (0.96 + near * 0.04).toFixed(3) + ')';
        item.style.opacity = (0.94 + near * 0.06).toFixed(3);

        var img = item.querySelector('img');
        if (img) {
          img.style.transform =
            'scale(1.1) translate3d(' + (offset * -4).toFixed(2) + '%,0,0)';
        }
      });
    };

    var arrows = Array.prototype.slice.call(hs.querySelectorAll('.hscroll__arrow'));
    var touchTicking = false;

    var syncArrows = function () {
      var max = track.scrollWidth - track.clientWidth - 2;
      arrows.forEach(function (btn) {
        var isNext = btn.classList.contains('hscroll__arrow--next');
        btn.disabled = isNext ? track.scrollLeft >= max : track.scrollLeft <= 2;
      });
    };

    var step = function (dir) {
      var first = items[0];
      if (!first) return;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 16;
      track.scrollBy({
        left: dir * (first.offsetWidth + gap),
        behavior: reduced ? 'auto' : 'smooth'
      });
    };

    arrows.forEach(function (btn) {
      btn.addEventListener('click', function () {
        step(btn.classList.contains('hscroll__arrow--next') ? 1 : -1);
      });
    });

    track.addEventListener('scroll', function () {
      if (isDesktop()) return;
      syncArrows();
      if (!touchTicking) {
        touchTicking = true;
        window.requestAnimationFrame(function () {
          touchTicking = false;
          paintTouch();
        });
      }
    }, { passive: true });

    var layout = function () {
      if (!isDesktop()) {
        hs.style.height = '';
        track.style.transform = '';
        if (bar) bar.style.width = '';
        travel = 0;
        running = false;
        if (reduced) {
          items.forEach(function (item) {
            item.style.transform = '';
            item.style.opacity = '';
            var img = item.querySelector('img');
            if (img) img.style.transform = '';
          });
        } else {
          paintTouch();
        }
        syncArrows();
        return;
      }
      travel = Math.max(0, track.scrollWidth - sticky.clientWidth);
      hs.style.height = (sticky.offsetHeight + travel) + 'px';
      measure();
      start();
    };

    /* A hurok csak akkor forog, amikor a szakasz a képernyő közelében van. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }, { rootMargin: '200px 0px' }).observe(hs);
    } else {
      visible = true;
    }

    window.addEventListener('scroll', start, { passive: true });
    window.addEventListener('resize', layout);
    window.addEventListener('load', layout);
    layout();
  }

  /* --- 5. Kézírás animáció -------------------------------------------- */
  var pen = document.querySelector('.callout__script');

  if (pen) {
    /* A maszk 7%-os átmenettel dolgozik, ezért a toll -7%-tól 107%-ig fut:
       így a sor az elején teljesen rejtett, a végén teljesen kiírt. */
    var PEN_HIDDEN = '-7%';
    var PEN_FULL = '110%';
    var penText = pen.textContent.replace(/\s+/g, ' ').trim();
    var penLines = [];
    var penState = 'idle';   // idle | running | done

    /* A mondatot a saját tördelése szerint sorokra vágjuk: minden szót
       külön elemben megmérünk, és ami egy magasságba esik, egy sor lesz.
       Telefonon így a "kezdődnek." külön sor lesz, külön maszkkal – és
       csak akkor indul el, amikor az előző sor már le van írva. */
    var buildLines = function () {
      var words = penText.split(' ');
      var probes = [];

      pen.textContent = '';
      words.forEach(function (word, i) {
        var probe = document.createElement('span');
        probe.textContent = word;
        pen.appendChild(probe);
        if (i < words.length - 1) pen.appendChild(document.createTextNode(' '));
        probes.push(probe);
      });

      var groups = [];
      var lineTop = null;
      probes.forEach(function (probe) {
        var top = probe.getBoundingClientRect().top;
        if (lineTop === null || Math.abs(top - lineTop) > 2) {
          groups.push([]);
          lineTop = top;
        }
        groups[groups.length - 1].push(probe.textContent);
      });

      pen.textContent = '';
      penLines = groups.map(function (group) {
        var line = document.createElement('span');
        line.className = 'callout__line';
        line.textContent = group.join(' ');
        pen.appendChild(line);
        return line;
      });
    };

    var setPen = function (value) {
      penLines.forEach(function (line) { line.style.setProperty('--pen', value); });
    };

    buildLines();

    if (reduced || !('IntersectionObserver' in window)) {
      penState = 'done';
      setPen(PEN_FULL);
    } else {
      setPen(PEN_HIDDEN);

      var write = function () {
        // a betűtípus betöltése után változhat a tördelés
        buildLines();
        setPen(PEN_HIDDEN);
        penState = 'running';

        var widths = penLines.map(function (line) {
          return line.getBoundingClientRect().width || 1;
        });
        var total = widths.reduce(function (a, b) { return a + b; }, 0);
        var start = null;
        var duration = 3600;

        var step = function (now) {
          if (start === null) start = now;
          var t = Math.min((now - start) / duration, 1);
          /* Ease-out: a toll már az első pillanatban teljes tempóval indul,
             és csak a végén lassul le. (A korábbi ease-in-out az első egy
             másodpercben alig haladt – ezért tűnt úgy, hogy késik.) */
          var eased = Math.sin(t * Math.PI / 2);
          /* A megtett utat a sorok szélessége szerint osztjuk szét: a toll
             egyenletes tempóban olvassa végig a sorokat, és a következő sor
             csak az előző befejezése után indul. */
          var travelled = eased * total;
          var before = 0;

          penLines.forEach(function (line, i) {
            var frac = (travelled - before) / widths[i];
            frac = frac < 0 ? 0 : (frac > 1 ? 1 : frac);
            line.style.setProperty('--pen', (frac * 114 - 7).toFixed(2) + '%');
            before += widths[i];
          });

          if (t < 1) window.requestAnimationFrame(step);
          else penState = 'done';
        };

        window.requestAnimationFrame(step);
      };

      var penIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            penIo.unobserve(entry.target);
            // megvárjuk, hogy a kézírás betűtípus betöltődjön
            if (document.fonts && document.fonts.ready) {
              document.fonts.ready.then(write);
            } else {
              write();
            }
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });

      penIo.observe(pen);

      /* Átméretezésnél (pl. elfordított telefon) újra kell tördelni – de
         csak akkor, ha épp nem fut az animáció. */
      var penResizeTimer = null;
      window.addEventListener('resize', function () {
        if (penState === 'running') return;
        window.clearTimeout(penResizeTimer);
        penResizeTimer = window.setTimeout(function () {
          if (penState === 'running') return;
          buildLines();
          setPen(penState === 'done' ? PEN_FULL : PEN_HIDDEN);
        }, 150);
      });
    }
  }

  /* --- 6. Galéria nagy nézet ------------------------------------------ */
  /* A nagy nézet a mozaik csempéiből dolgozik: a rákattintott kép srcset-jét
     és alt szövegét emeli át, így nincs külön képlista, amit karban kellene
     tartani. Lapozás: nyilak, billentyű (← →), húzás. */
  var lightbox = document.getElementById('lightbox');
  var mosaic = document.getElementById('mosaic');

  if (lightbox && mosaic) {
    var tiles = Array.prototype.slice.call(mosaic.querySelectorAll('.mosaic__btn'));
    var lbSource = document.getElementById('lightbox-source');
    var lbImg = document.getElementById('lightbox-img');
    var lbCount = document.getElementById('lightbox-count');
    var lbPrev = lightbox.querySelector('[data-lightbox-prev]');
    var lbNext = lightbox.querySelector('[data-lightbox-next]');
    var lbClose = lightbox.querySelector('.lightbox__close');
    var lbIndex = -1;
    var lastFocus = null;
    var closeTimer = null;

    lbImg.addEventListener('load', function () {
      lbImg.classList.add('is-shown');
    });

    var showImage = function (i) {
      if (!tiles.length) return;
      lbIndex = (i + tiles.length) % tiles.length;

      var tile = tiles[lbIndex];
      var tileSource = tile.querySelector('source');
      var tileImg = tile.querySelector('img');
      var text = tileImg.getAttribute('alt') || '';

      lbImg.classList.remove('is-shown');
      lbSource.srcset = tileSource ? tileSource.getAttribute('srcset') || '' : '';
      lbImg.src = tileImg.getAttribute('src');
      lbImg.alt = text;
      lbCount.textContent = (lbIndex + 1) + ' / ' + tiles.length;
    };

    var openLightbox = function (i) {
      if (closeTimer) { window.clearTimeout(closeTimer); closeTimer = null; }
      lastFocus = document.activeElement;
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      showImage(i);
      /* két képkocka, hogy a hidden levétele után induljon az áttűnés */
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { lightbox.classList.add('is-open'); });
      });
      lbClose.focus();
    };

    var closeLightbox = function () {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';

      var finish = function () {
        closeTimer = null;
        lightbox.hidden = true;
        lbImg.classList.remove('is-shown');
        lbImg.removeAttribute('src');
        lbSource.removeAttribute('srcset');
      };

      if (reduced) finish();
      else closeTimer = window.setTimeout(finish, 340);

      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    /* A nagy nézet a megnyitásakor átveszi a fókuszt: a Tab a három
       vezérlő között körbe jár, nem szökik ki a mögötte lévő oldalra. */
    var trapFocus = function (e) {
      var stops = [lbClose, lbPrev, lbNext];
      var at = stops.indexOf(document.activeElement);

      if (at === -1) { e.preventDefault(); stops[0].focus(); return; }
      if (e.shiftKey && at === 0) { e.preventDefault(); stops[stops.length - 1].focus(); }
      else if (!e.shiftKey && at === stops.length - 1) { e.preventDefault(); stops[0].focus(); }
    };

    tiles.forEach(function (btn, i) {
      btn.addEventListener('click', function () { openLightbox(i); });
    });

    lbPrev.addEventListener('click', function () { showImage(lbIndex - 1); });
    lbNext.addEventListener('click', function () { showImage(lbIndex + 1); });

    Array.prototype.slice.call(lightbox.querySelectorAll('[data-lightbox-close]'))
      .forEach(function (el) { el.addEventListener('click', closeLightbox); });

    document.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;

      if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); showImage(lbIndex + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); showImage(lbIndex - 1); }
      else if (e.key === 'Tab') { trapFocus(e); }
    });

    /* Érintésre húzással is lehet lapozni. */
    var swipeFrom = null;

    lightbox.addEventListener('touchstart', function (e) {
      swipeFrom = e.changedTouches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener('touchend', function (e) {
      if (swipeFrom === null) return;
      var dx = e.changedTouches[0].clientX - swipeFrom;
      swipeFrom = null;
      if (Math.abs(dx) > 45) showImage(lbIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }
})();
