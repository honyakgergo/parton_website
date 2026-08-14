/* PARTON — interakciók
   1) mobil menü  2) fejléc árnyék  3) megjelenítő animáció
   4) görgetéssel vezérelt vízszintes galéria  5) kézírás animáció
   Minden rész opcionális: ha az adott elem nincs az oldalon, kimarad. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- 1. Mobil menü --------------------------------------------------- */
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');

  if (burger && nav) {
    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
      document.body.style.overflow = open && window.innerWidth <= 1080 ? 'hidden' : '';
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
      if (window.innerWidth > 1080) setMenu(false);
    });
  }

  /* --- 2. Fejléc: árnyék + összezárás görgetési irány szerint ---------- */
  var header = document.querySelector('.header');
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
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

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

        item.style.transform =
          'translate3d(0,' + (away * 14).toFixed(1) + 'px,0)' +
          ' scale(' + (0.96 + near * 0.04).toFixed(3) + ')';
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
    if (reduced || !('IntersectionObserver' in window)) {
      pen.style.setProperty('--pen', '110%');
    } else {
      pen.style.setProperty('--pen', '0%');

      var write = function () {
        var start = null;
        var duration = 3600;

        var step = function (now) {
          if (start === null) start = now;
          var t = Math.min((now - start) / duration, 1);
          /* Ease-out: a toll már az első pillanatban teljes tempóval indul,
             és csak a végén lassul le. (A korábbi ease-in-out az első egy
             másodpercben alig haladt – ezért tűnt úgy, hogy késik.) */
          var eased = Math.sin(t * Math.PI / 2);
          pen.style.setProperty('--pen', (eased * 110).toFixed(2) + '%');
          if (t < 1) window.requestAnimationFrame(step);
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
    }
  }
})();
