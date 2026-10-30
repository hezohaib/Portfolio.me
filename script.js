/**
 * Zohaib Portfolio - Core Interactive Features
 * - Fade-in on Scroll using IntersectionObserver
 * - Accessible Glassmorphism Contact Modal (focus trap + focus return)
 */

document.addEventListener('DOMContentLoaded', () => {
  /* Preloader: site load hone par Z fade out */
const preloader = document.getElementById('preloader');
if (preloader) {
  const MIN_SHOW = 1400;   // kam az kam itni der (ms) dikhe, taake Z poora draw ho
  const hidePreloader = () => {
    const wait = Math.max(0, MIN_SHOW - performance.now());
    setTimeout(() => {
      preloader.classList.add('is-done');
      window.dispatchEvent(new Event('preloader-done'));   // the hero name animates in now
      setTimeout(() => preloader.remove(), 600);
    }, wait);
  };
  if (document.readyState === 'complete') hidePreloader();
  else window.addEventListener('load', hidePreloader, { once: true });
}
  /* Smooth scroll (Lenis) */
let lenis = null;
if (window.Lenis && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  lenis = new Lenis({
    lerp: 0.09,                    //smooth/slow glide
  });
  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}
  
  /* Theme toggle: dark is the default, the choice is saved in localStorage */
  const themeToggleBtn = document.getElementById('themeToggle');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'light' ? '#ffffff' : '#000000');
    }
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute(
        'aria-label',
        theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'
      );
    }
  };

  // The script in <head> already set data-theme; sync the meta tag and label with it
  applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked: still works for this visit */ }
      
    });
  }
  /* ==========================================================================
     1. Fade-In on Scroll Animations (IntersectionObserver)
     ========================================================================== */
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('active'));
  }

  /* ==========================================================================
   2. Project Preview Image Fallback
   ========================================================================== */
  const projectPreview = document.querySelector('.browser-screen img');

  if (projectPreview) {
    const showPreviewFallback = () => {
      projectPreview.closest('.browser-screen').classList.add('image-fallback');
    };

    projectPreview.addEventListener('error', showPreviewFallback, { once: true });
    if (projectPreview.complete && projectPreview.naturalWidth === 0) {
      showPreviewFallback();
    }
  }
  /* ==========================================================================
     3. Copy Email Button (with fallback for browsers without Clipboard API)
     ========================================================================== */
  const copyTextFallback = (text) => {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(area);
    return ok;
  };

  const quickEmailButton = document.querySelector('.quick-connect-email');
  if (quickEmailButton) {
    const label = quickEmailButton.querySelector('.quick-connect-label');
    const defaultLabel = label ? label.textContent : '';
    let labelTimer;

    const flashLabel = (text) => {
      if (!label) return;
      label.textContent = text;
      clearTimeout(labelTimer);
      labelTimer = setTimeout(() => { label.textContent = defaultLabel; }, 1600);
    };

    quickEmailButton.addEventListener('click', async () => {
      const email = quickEmailButton.dataset.email;
      if (!email) return;

      let copied = false;
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(email);
          copied = true;
        } catch (e) {
          copied = false;
        }
      }
      if (!copied) copied = copyTextFallback(email);

      flashLabel(copied ? 'Email Copied' : 'Copy Failed');
    });
  }

  /* ==========================================================================
     4. Accessible Popup Contact Modal
     ========================================================================== */
  const contactModal = document.getElementById('contactModal');
  const openModalButtons = document.querySelectorAll('.open-contact-modal, #openContactModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const contactForm = document.getElementById('contactForm');
  const formSuccessMessage = document.getElementById('formSuccessMessage');
  const formErrorMessage = document.getElementById('formErrorMessage');
  const replyToInput = document.getElementById('replyTo');

  const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([type="hidden"]):not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  let lastFocusedElement = null;
  let autoCloseTimer = null;
  let modalFocusTimer = null;
  const pageContent = document.querySelectorAll('body > header, body > .skip-link, body > aside, body > main, body > footer');

  const getFocusable = () =>
    Array.from(contactModal.querySelectorAll(FOCUSABLE))
      .filter(el => el.offsetParent !== null);

  const hideStatusMessages = () => {
    if (formSuccessMessage) formSuccessMessage.hidden = true;
    if (formErrorMessage) formErrorMessage.hidden = true;
  };

  const openModal = () => {
    if (!contactModal) return;
     if (lenis) lenis.stop();

    // Cancel a pending auto-close from a previous successful send
    clearTimeout(autoCloseTimer);
    hideStatusMessages();

    lastFocusedElement = document.activeElement;
    contactModal.classList.add('active');
    contactModal.setAttribute('aria-hidden', 'false');
    pageContent.forEach(element => { element.inert = true; });
    document.body.style.overflow = 'hidden';

    clearTimeout(modalFocusTimer);
    modalFocusTimer = setTimeout(() => {
      const firstInput = contactModal.querySelector('input:not([type="hidden"]):not([tabindex="-1"]), textarea, select');
      if (firstInput) firstInput.focus();
    }, 150);
  };

  const closeModal = () => {
    if (!contactModal) return;
    if (lenis) lenis.start(); 

    clearTimeout(autoCloseTimer);
    clearTimeout(modalFocusTimer);
    contactModal.classList.remove('active');
    contactModal.setAttribute('aria-hidden', 'true');
    pageContent.forEach(element => { element.inert = false; });
    document.body.style.overflow = '';

    // Return focus to the control that opened the modal
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
    lastFocusedElement = null;
  };

  openModalButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  // Close when clicking the blurred backdrop
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!contactModal || !contactModal.classList.contains('active')) return;

    if (e.key === 'Escape') {
      closeModal();
      return;
    }

    // Focus trap: keep Tab / Shift+Tab inside the modal
    if (e.key === 'Tab') {
      const focusable = getFocusable();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !contactModal.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !contactModal.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ==========================================================================
     5. Contact Form Submission
     ========================================================================== */
  const GENERIC_ERROR = 'Something went wrong while sending your message. Please try again.';

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const submitLabel = submitBtn ? submitBtn.querySelector('.submit-label') : null;
      const accessKey = contactForm.querySelector('input[name="access_key"]')?.value.trim();

      hideStatusMessages();

      if (!accessKey || accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY') {
        if (formErrorMessage) {
          formErrorMessage.textContent = 'Contact form is not configured yet. Please add the Web3Forms access key.';
          formErrorMessage.hidden = false;
        }
        return;
      }
      if (replyToInput) {
        replyToInput.value = contactForm.elements.email.value.trim();
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');
        if (submitLabel) submitLabel.textContent = 'Sending';
      }

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
        });

        // The server might return non-JSON (e.g. an HTML error page)
        let result = null;
        try {
          result = await response.json();
        } catch (parseError) {
          result = null;
        }

        if (!response.ok || !result || !result.success) {
          throw new Error(result && result.message ? result.message : GENERIC_ERROR);
        }

        if (formSuccessMessage) formSuccessMessage.hidden = false;
        contactForm.reset();

        // Auto-close after success (cancelled if the modal is reopened or closed manually)
        clearTimeout(autoCloseTimer);
        autoCloseTimer = setTimeout(() => {
          hideStatusMessages();
          closeModal();
        }, 2200);
      } catch (error) {
        // Network failures throw a TypeError with a technical message; show a friendly one instead
        const message = error instanceof Error && error.name !== 'TypeError'
          ? error.message
          : GENERIC_ERROR;

        if (formErrorMessage) {
          formErrorMessage.textContent = message;
          formErrorMessage.hidden = false;
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('is-loading');
          if (submitLabel) submitLabel.textContent = 'Send Message';
        }
      }
    });
  }
   /* Skills: segmented control filter */
  const skCard = document.querySelector('.sk-card');

  if (skCard) {
    const seg = skCard.querySelector('.sk-seg');
    const thumb = skCard.querySelector('.sk-seg-thumb');
    const buttons = Array.from(skCard.querySelectorAll('.sk-seg-btn'));
    const groups = Array.from(skCard.querySelectorAll('.sk-group'));
    const countEl = document.getElementById('skCount');

    const moveThumb = (button) => {
      if (!button || !thumb) return;
      thumb.style.width = button.offsetWidth + 'px';
      thumb.style.transform = 'translateX(' + button.offsetLeft + 'px)';
    };

    const getActive = () => buttons.find((b) => b.classList.contains('is-active')) || buttons[0];

    const applyFilter = (filter, animate) => {
      let visible = 0;
      groups.forEach((group) => {
        const show = filter === 'all' || group.dataset.cat === filter;
        group.hidden = !show;
        group.classList.remove('sk-pop');
        if (show) {
          visible += group.querySelectorAll('.sk-tile').length;
          if (animate) {
            void group.offsetWidth;
            group.classList.add('sk-pop');
            group.addEventListener('animationend', () => group.classList.remove('sk-pop'), { once: true });
          }
        }
      });
      if (countEl) countEl.textContent = visible;
    };

    const select = (button, animate) => {
      buttons.forEach((b) => {
        const on = b === button;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      moveThumb(button);
      applyFilter(button.dataset.filter, animate);
    };

    buttons.forEach((button) => {
      button.addEventListener('click', () => select(button, true));
    });

    if (seg) {
      seg.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const i = buttons.indexOf(document.activeElement);
        if (i === -1) return;
        const next = buttons[(i + (e.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length];
        next.focus();
        select(next, true);
      });
    }

    skCard.classList.add('is-ready');
    select(getActive(), false);

    window.addEventListener('resize', () => moveThumb(getActive()));
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => moveThumb(getActive()));
    }
  }
     /* Hero name: scramble into "Frontend Developer" on hover and every 10 seconds */
  const nameSwap = document.querySelector('.name-swap');

  if (nameSwap) {
    const textEl = nameSwap.querySelector('.name-swap-text');
    const original = textEl.textContent.trim();
    const alt = nameSwap.dataset.alt;
    const glyphs = '!<>-_\\/[]{}=+*^?#01';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // the name starts empty and scrambles in once the preloader is gone
    if (!reduceMotion) textEl.textContent = '';

    let queue = [];
    let running = false;

    const render = (now) => {
      let out = '';
      let done = true;

      queue.forEach((q) => {
        if (now >= q.end) {
          out += q.to;
        } else if (now >= q.start) {
          done = false;
          if (now >= q.nextGlyph) {
            q.glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
            q.nextGlyph = now + 70;
          }
          out += q.glyph;
        } else {
          done = false;
          out += q.from;
        }
      });

      if (out !== textEl.textContent) textEl.textContent = out;
      return done;
    };

    const loop = (now) => {
      if (render(now)) { running = false; return; }
      requestAnimationFrame(loop);
    };

    const scramble = (to) => {
      if (reduceMotion) { textEl.textContent = to; return; }

      const now = performance.now();
      const from = textEl.textContent;
      const len = Math.max(from.length, to.length);

      queue = Array.from({ length: len }, (_, i) => {
        const old = queue[i];
        const inFlight = old && now >= old.start && now < old.end;
        const start = inFlight ? now : now + i * 14 + Math.random() * 50;
        return {
          from: from[i] || '',
          to: to[i] || '',
          start,
          end: start + 240 + Math.random() * 200,
          glyph: inFlight ? old.glyph : '',
          nextGlyph: 0
        };
      });

      if (!running) { running = true; requestAnimationFrame(loop); }
    };

    let isAlt = false;
    let leaveTimer = null;
    let autoTimer = null;
    let hovering = false;

    const AUTO_EVERY = 5000;   // wait before it swaps on its own (ms)
    const AUTO_HOLD = 3000;     // how long "Frontend Developer" stays (ms)

    const setAlt = (on) => {
      if (isAlt === on) return;
      isAlt = on;
      nameSwap.classList.toggle('is-alt', on);
      scramble(on ? alt : original);
    };

    const scheduleAuto = () => {
      clearTimeout(autoTimer);
      if (reduceMotion) return;
      autoTimer = setTimeout(() => {
        if (hovering || document.hidden) { scheduleAuto(); return; }
        setAlt(true);
        autoTimer = setTimeout(() => {
          if (!hovering) setAlt(false);
          scheduleAuto();
        }, AUTO_HOLD);
      }, AUTO_EVERY);
    };

    const toAlt = () => {
      hovering = true;
      clearTimeout(leaveTimer);
      clearTimeout(autoTimer);
      setAlt(true);
    };

    const toName = () => {
      hovering = false;
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        setAlt(false);
        scheduleAuto();
      }, 120);
    };

    nameSwap.addEventListener('mouseenter', toAlt);
    nameSwap.addEventListener('mouseleave', toName);
    nameSwap.addEventListener('focus', toAlt);
    nameSwap.addEventListener('blur', toName);

    let introStarted = false;
    const intro = () => {
      if (introStarted) return;
      introStarted = true;
      scramble(original);   // same scramble effect as on hover
      scheduleAuto();       // the 5-second swap starts only after the name has appeared
    };

    if (!reduceMotion && preloader) {
      window.addEventListener('preloader-done', intro, { once: true });
      setTimeout(intro, 4000);   // safety: never leave the name empty
    } else {
      intro();
    }
  }
  /* Hero: character lines that move around, with a light wave moving down (canvas) */
  (() => {
    const canvas = document.querySelector('.hero-rain');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const hero = canvas.parentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const katakana = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const kanji = '日月火水木金土山空海雨花光影心力四五六七八九十';
    const extra = '0123456789$#=+<>/*{}';   // numbers and symbols mixed into every line
    const sets = [
      katakana + extra,
      katakana + extra,
      kanji + extra,
      'ネ7ミ日ヲ3ク$ヒ水ト0ロ九サユ#ホ木ン5チヨケ光=ス8リワ力ノ+モ土ツ2エハ影テ<フ火ヌレ4ア山マ>セ十ヤ9キ空ラ/コル心オ六ナ{メ月タ6ヘ海ニカ}雨イ四金五花ウ七八' // mix
    ];
    const sizes = [11, 13, 16, 19, 22, 26];   // thin lines to medium lines
    const rand = (s) => s[Math.floor(Math.random() * s.length)];
    const MORPH = 0.2;   // seconds for one symbol to change into the next
    const BASE = 0.18;   // how visible a line is without the wave (0 = only the wave shows)

    let cols = [];
    let w = 0, h = 0;
    let slot = 72, sc = 1, nSlots = 0;
    let zl = -1, zr = -1;   // the centre zone (name, text, buttons) where no lines are allowed
    let rgb = '255,255,255';
    let boost = 1;
    let raf = 0, last = 0, onScreen = false;

    const readTheme = () => {
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      rgb = light ? '0,0,0' : '255,255,255';
      boost = light ? 0.7 : 1;   // light mode: dark glyphs show up strongly, so keep them softer
    };

    const allowed = (i) => {
      const cx = (i + 0.5) * slot;
      return !(zr > 0 && cx > zl && cx < zr);
    };

    // find the area taken by the hero text, so lines stay on the sides
    const measureZone = () => {
      zl = zr = -1;
      const hr = hero.getBoundingClientRect();
      const rects = [];
      const sub = hero.querySelector('.hero-subtitle');
      const btns = hero.querySelector('.hero-buttons');
      const title = hero.querySelector('.hero-title');
      if (sub) rects.push(sub.getBoundingClientRect());
      if (btns) rects.push(btns.getBoundingClientRect());
      if (title) {
        const range = document.createRange();
        range.selectNodeContents(title);
        rects.push(range.getBoundingClientRect());
      }
      if (!rects.length) return;
      const left = Math.min(...rects.map((q) => q.left)) - hr.left - 48;
      const right = Math.max(...rects.map((q) => q.right)) - hr.left + 48;
      // on small screens there is no room on the sides, so keep the old full-width layout
      const sideSlots = Math.floor(Math.max(0, left) / slot) + Math.floor(Math.max(0, w - right) / slot);
      if (sideSlots >= 4) { zl = left; zr = right; }
    };

    // pick a position that no other line is using right now
    const freeSlot = () => {
      const used = new Set(cols.map((c) => c.slot));
      const free = [];
      for (let i = 0; i < nSlots; i++) if (!used.has(i) && allowed(i)) free.push(i);
      return free.length ? free[Math.floor(Math.random() * free.length)] : -1;
    };

    const makeCol = (slotIndex, scattered) => {
      const size = Math.round(sizes[Math.floor(Math.random() * sizes.length)] * sc);
      const lh = Math.round(size * 1.05);   // tight, so the line looks joined
      const set = sets[Math.floor(Math.random() * sets.length)];
      const col = {
        slot: slotIndex,
        x: (slotIndex + 0.5) * slot,
        size,
        lh,
        set,
        wt: size >= 22 ? 500 : size >= 15 ? 400 : 300,        // bigger = a bit heavier, smaller = thin
        spd: 200 + Math.pow(Math.random(), 1.5) * 340,        // slowest line is still fairly quick
        a: 0.08 + Math.random() * 0.07,
        base: 0.5 + Math.random() * 0.5,                      // each line has its own resting visibility
        tail: h * (0.3 + Math.random() * 0.4),                // long wave: covers a big part of the line
        life: scattered ? 1 : 0,                              // 0 = invisible, fades in after moving
        dying: false,
        g: Array.from({ length: Math.ceil(h / lh) + 1 }, () => ({ c: rand(set), p: '', k: 1 }))
      };
      col.speed = col.spd * (0.85 + Math.random() * 0.3);
      col.head = scattered ? Math.random() * (h + col.tail) : -Math.random() * h * 0.4;
      return col;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // the canvas starts at the top of the navbar and runs to the bottom of the hero
      const header = document.querySelector('.header');
      const top = header ? header.offsetHeight : 0;
      w = hero.clientWidth;
      h = hero.clientHeight + top;
      canvas.style.top = -top + 'px';
      canvas.style.bottom = 'auto';
      canvas.style.height = h + 'px';
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      sc = w < 600 ? 0.7 : 1;            // smaller characters on phones
      slot = w < 600 ? 52 : 72;
      nSlots = Math.floor(w / slot);
      measureZone();
      cols = [];
      const chance = zr > 0 ? 0.8 : 0.6;
      for (let i = 0; i < nSlots; i++) {
        if (!allowed(i) || Math.random() > chance) continue;
        cols.push(makeCol(i, true));
      }
      draw(0);
    };

    const draw = (dt) => {
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = 'center';

      cols.forEach((col, ci) => {
        ctx.font = col.wt + ' ' + col.size + 'px "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif';
        const prev = col.head;

        if (dt) {
          col.head += col.speed * dt;
          if (!col.dying && col.head - col.tail > h) col.dying = true;   // wave has left the line

          if (col.dying) {
            col.life -= dt / 0.7;                                         // line fades out...
            if (col.life <= 0) {                                          // ...and comes back somewhere else
              const s = freeSlot();
              cols[ci] = makeCol(s < 0 ? col.slot : s, false);
              return;
            }
          } else if (col.life < 1) {
            col.life = Math.min(1, col.life + dt / 0.8);
          }
        }

        const baseVis = BASE * col.base * col.life;

        col.g.forEach((g, j) => {
          const y = (j + 1) * col.lh;

          if (dt) {
            if (g.k < 1) g.k = Math.min(1, g.k + dt / MORPH);
            // the wave just reached this character: change it
            if (y > prev && y <= col.head) { g.p = g.c; g.c = rand(col.set); g.k = 0; }
          }

          const dist = col.head - y;
          const wave = dist >= 0 && dist < col.tail ? 1 - dist / col.tail : 0;
          const a = col.a * (baseVis + (1 - baseVis) * wave) * boost;

          if (g.k < 1 && g.p) {
            ctx.fillStyle = 'rgba(' + rgb + ',' + (a * (1 - g.k)).toFixed(3) + ')';
            ctx.fillText(g.p, col.x, y);
          }
          ctx.fillStyle = 'rgba(' + rgb + ',' + (a * g.k).toFixed(3) + ')';
          ctx.fillText(g.c, col.x, y);
        });
      });
    };

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      draw(dt);
    };

    const start = () => {
      if (reduceMotion || raf || !onScreen || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    readTheme();
    resize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);

    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      onScreen ? start() : stop();
    }).observe(hero);

    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    new MutationObserver(() => { readTheme(); if (reduceMotion) draw(0); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        let resizeTimer;
    let lastW = window.innerWidth;
    window.addEventListener('resize', () => {
      if (window.innerWidth === lastW) return;   // ignore mobile address-bar height changes
      lastW = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });
  }
)();
/* ==========================================================================
   Section "view mode": nav link click = sirf wahi section dikhao
   ========================================================================== */
(() => {
  const sections = Array.from(document.querySelectorAll('main > section.section'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let savedScroll = 0;
  let typeTimer = null;
  const homeTitle = document.title;   // index.html wala <title> yahan save ho jata hai

const titles = {
  about: 'About',
  problem: 'Problem',
  Expertise: 'Expertise',
  journey: 'Journey',
  projects: 'Work',
  contact: 'Contact',
  reach: 'Reach out'
};

const setTitle = (id) => {
  document.title = id && titles[id] ? titles[id] + ' | Zohaib' : homeTitle;
};

  const jumpTo = (y) => {
    if (typeof lenis !== 'undefined' && lenis) lenis.scrollTo(y, { immediate: true });
    else window.scrollTo({ top: y, behavior: 'instant' });
  };

  const getHeading = (section) => section.querySelector('.section-title, .pb-title, .ab-title');

  // Heading ko wapas poora text dena (typing beech mein ruk jaye to bhi)
  const resetHeadings = () => {
    cancelAnimationFrame(typeTimer);
    sections.forEach((s) => {
      const h = getHeading(s);
      if (h && h.dataset.full) {
        h.textContent = h.dataset.full;
        h.classList.remove('is-typing');
      }
    });
  };

 const GLYPHS = '!<>-_\\/[]{}=+*^?#01';
const randGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

const typeHeading = (section) => {
  const h = getHeading(section);
  if (!h) return;                      // Contact mein ye heading nahi hoti
  const full = h.dataset.full || (h.dataset.full = h.textContent.trim());
  h.setAttribute('aria-label', full);  // screen reader ko poora text mile

  cancelAnimationFrame(typeTimer);
  if (reduceMotion) { h.textContent = full; return; }

  h.classList.add('is-typing');

  // Har letter ka apna start/end time, left se right ek ek karke
  const chars = Array.from(full).map((ch, i) => {
    const start = 300 + i * 130 + Math.random() * 150;
    return { ch, start, end: start + 900 + Math.random() * 600, glyph: '', next: 0 };
  });
// Har letter ki asli width pehle napo, taake symbol aane par kuch na hile
const widths = chars.map((c) => {
  const m = document.createElement('span');
  m.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;';
  m.textContent = c.ch;
  h.append(m);
  const w = m.getBoundingClientRect().width;
  m.remove();
  return w;
});
  const t0 = performance.now();

  const frame = (now) => {
    const t = now - t0;
    let done = true;
    h.textContent = '';

    chars.forEach((c, idx) => {
      if (c.ch === ' ' || t >= c.end) {
        h.append(c.ch);                              // letter apni asli shakal mein
        return;
      }
      done = false;
      const span = document.createElement('span');
      if (t >= c.start) {
        if (t >= c.next) { c.glyph = randGlyph(); c.next = t + 140; }
        span.className = 'scr-glyph';                // symbol dikhao
        span.style.width = widths[idx] + 'px'; 
        span.textContent = c.glyph;
      } else {
        span.className = 'scr-hide';                 // abhi chhupa hai, par jagah ghera hua
        span.textContent = c.ch;
      }
      h.append(span);
    });

    if (done) h.classList.remove('is-typing');
    else typeTimer = requestAnimationFrame(frame);
  };

  typeTimer = requestAnimationFrame(frame);
};
const showSection = (id, push) => {
  const target = document.getElementById(id);
  if (!target || !sections.includes(target)) return;

  if (!document.body.classList.contains('view-mode')) savedScroll = window.scrollY;
  resetHeadings();
  document.body.classList.add('view-mode');
  sections.forEach((s) => s.classList.toggle('is-current', s === target));
  document.querySelectorAll('.nav-links a').forEach((a) => {
  a.classList.toggle('is-current', a.getAttribute('href') === '#' + id);
});
  target.classList.add('active');
  jumpTo(0);
  window.dispatchEvent(new Event('resize'));
  typeHeading(target);
  setTitle(id);   
  if (push) history.pushState({ view: id }, '', '#' + id);
};

const showHome = (push) => {
  if (!document.body.classList.contains('view-mode')) return;
  resetHeadings();
  document.body.classList.remove('view-mode');
  document.querySelectorAll('.nav-links a').forEach((a) => a.classList.remove('is-current'));
  jumpTo(savedScroll);
  setTitle();
  if (push) history.pushState(null, '', location.pathname);
};

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const href = link.getAttribute('href');

  if (href === '#') {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showHome(true);
    });
    return;
  }

  const id = href.slice(1);
  if (!sections.some((s) => s.id === id)) return;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(id, true);
  });
});

window.addEventListener('popstate', () => {
  const id = location.hash.slice(1);
  if (sections.some((s) => s.id === id)) showSection(id, false);
  else showHome(false);
});
})();
  /* Expertise: spotlight + tilt on tiles, count-up on first view */
  (() => {
    const card = document.querySelector('.sk-card');
    if (!card) return;

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (fine && !reduce) {
      let active = null;

      const reset = (tile) => {
        tile.style.setProperty('--rx', '0deg');
        tile.style.setProperty('--ry', '0deg');
        tile.classList.remove('is-hot');
      };

      card.addEventListener('pointermove', (e) => {
        const tile = e.target.closest('.sk-tile');
        if (active && active !== tile) reset(active);
        active = tile;
        if (!tile) return;

        const r = tile.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        tile.style.setProperty('--mx', x + 'px');
        tile.style.setProperty('--my', y + 'px');
        tile.style.setProperty('--ry', ((x / r.width - 0.5) * 10).toFixed(2) + 'deg');
        tile.style.setProperty('--rx', ((0.5 - y / r.height) * 10).toFixed(2) + 'deg');
        tile.classList.add('is-hot');
      });

      card.addEventListener('pointerleave', () => {
        if (active) reset(active);
        active = null;
      });
    }

    // count-up: runs once, when the card first scrolls into view
    const countEl = document.getElementById('skCount');
    if (countEl && !reduce && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();

        const target = parseInt(countEl.textContent, 10) || 0;
        const start = performance.now();
        const DURATION = 900;

        const step = (now) => {
          const p = Math.min((now - start) / DURATION, 1);
          countEl.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: 0.4 });

      io.observe(card);
    }
  })();
  /* About: stats count up once when they scroll into view */
  (() => {
    const stats = document.querySelector('.ab-stats');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!stats || reduce || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();

      stats.querySelectorAll('[data-count]').forEach((el) => {
        const target = parseInt(el.dataset.count, 10);
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / 1000, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });

    io.observe(stats);
  })();
    /* Buttons: nudge slightly toward the mouse while it is over the button */
  (() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    const STRENGTH = 0.2;   // how much the button follows the mouse
    const MAX = 8;          // never moves more than this many px
    const clamp = (v) => Math.max(-MAX, Math.min(MAX, v));

    document.querySelectorAll('.btn-pill:not(.btn-pill-ghost), .ab-btn, .hero-buttons .btn-pill-ghost').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        if (btn.disabled) return;
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.setProperty('--bx', clamp(dx * STRENGTH) + 'px');
        btn.style.setProperty('--by', clamp(dy * STRENGTH) + 'px');
      });

      btn.addEventListener('pointerleave', () => {
        btn.style.removeProperty('--bx');
        btn.style.removeProperty('--by');
      });
    });
  })();
    /* Problem: Minesweeper that plays itself, hits a mine, explodes, clears and restarts */
  const initMines = (sectionId, cfg) => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'problem-mines';
    canvas.setAttribute('aria-hidden', 'true');
    section.prepend(canvas);

    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- tune here ---- */
    const DENSITY = 0.15;       // share of cells that are mines
    const ACT_FAST = 110;       // ms between sure moves
    const ACT_THINK = 650;      // ms it "thinks" before a guess
    const CASCADE_MS = 40;      // speed of the opening cascade
    const SPREAD = 38;          // ms per cell for the explosion to travel
    const BOOM_HOLD = 2600;     // how long the wreck stays before fading
    const WIN_HOLD = 1500;
    const EMPTY_PAUSE = 1100;   // empty page between two games (ms)
    const DOOM_MIN = 9000;      // the bot clicks a mine after this many ms...
    const DOOM_RANGE = 9000;    // ...plus a random amount up to this
    const NUM_GAP = cfg.numGap;     // no other number within this many cells (bigger = fewer numbers)
    const NUM_SIZE = cfg.numSize;   // number size (share of one cell)
    const NUM_ALPHA = cfg.numAlpha; // number brightness (0 = invisible, 1 = full)
    const TILE = cfg.tile;          // opened cells stay as a soft square (0 = no squares)
    const SHOW_FLAGS = cfg.flags;   // true = show the orange * on mines the bot found
    const CLOUD = cfg.cloud || 0;   // soft gray cloud behind the opened area (0 = off)

    // tiny helper canvas: 1 pixel per cell, stretched up so it becomes a soft blur
    const mini = document.createElement('canvas');
    const mctx = mini.getContext('2d');
    const OPEN_FLASH = 0.05;    // brief glow when a cell opens (0 = no tiles at all)

    let cell = 60, cols = 0, rows = 0, w = 0, h = 0;
    let grid = [], nbs = [], queue = [], particles = [];
    let placed = false, mineCount = 0, opened = 0, flags = 0;
    let phase = 'play', master = 0, nextAt = 0, guessReady = false, doomAt = 0;
    let boomStart = 0, blasts = [], winStart = 0;
    let raf = 0, last = 0, onScreen = false;
    let rgb = '255,255,255', orange = '255,107,53', blue = '41,151,255', boost = 1;

    const readTheme = () => {
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      rgb = light ? '0,0,0' : '255,255,255';
      orange = light ? '232,89,12' : '255,107,53';
      blue = light ? '0,113,227' : '41,151,255';
      boost = light ? 0.9 : 1;
    };

    const neighborsOf = (i) => {
      const r = (i / cols) | 0, c = i % cols, out = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push(nr * cols + nc);
        }
      }
      return out;
    };

    // true if another number is already visible close to this cell
    const crowded = (i) => {
      const r = (i / cols) | 0, c = i % cols;
      for (let dr = -NUM_GAP; dr <= NUM_GAP; dr++) {
        const nr = r + dr;
        if (nr < 0 || nr >= rows) continue;
        for (let dc = -NUM_GAP; dc <= NUM_GAP; dc++) {
          const nc = c + dc;
          if (nc < 0 || nc >= cols) continue;
          if (grid[nr * cols + nc].show) return true;
        }
      }
      return false;
    };

    const build = () => {
      const total = cols * rows;
      mineCount = Math.round(total * DENSITY);
      grid = Array.from({ length: total }, () => ({
        mine: false, n: 0, open: false, flag: false, flagAt: 0, show: false, openAt: 0,
        queued: false, exploded: false, expAt: 0, hit: false
      }));
      nbs = grid.map((_, i) => neighborsOf(i));
      placed = false;
      queue = [];
      particles = [];
      opened = 0;
      flags = 0;
      blasts = [];
      guessReady = false;
      doomAt = 0;
      phase = 'play';
      nextAt = performance.now() + EMPTY_PAUSE;
    };

    // mines are placed on the first click, so the first click is always safe
    const placeMines = (first) => {
      const banned = new Set([first, ...nbs[first]]);
      const pool = [];
      for (let i = 0; i < grid.length; i++) if (!banned.has(i)) pool.push(i);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      mineCount = Math.min(mineCount, pool.length);
      for (let k = 0; k < mineCount; k++) grid[pool[k]].mine = true;
      grid.forEach((g, i) => { g.n = nbs[i].filter((j) => grid[j].mine).length; });
      placed = true;
    };

    const burst = (x, y, n) => {
      for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2;
        const s = 60 + Math.random() * 200;
        const life = 0.5 + Math.random() * 0.7;
        particles.push({
          x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life, max: life, amber: Math.random() < 0.4, size: 1.5 + Math.random() * 2.5
        });
      }
      if (particles.length > 400) particles.splice(0, particles.length - 400);
    };

    // cells = list of mines that blow up first (the blast centres). Each one sends its own wave.
    const explode = (cells, now) => {
      phase = 'boom';
      boomStart = now;
      queue = [];
      blasts = cells.map((c, k) => ({
        cell: c,
        x: (c % cols) * cell + cell / 2,
        y: ((c / cols) | 0) * cell + cell / 2,
        at: now + (k ? 350 * k + Math.random() * 200 : 0)   // next blasts start a little later
      }));
      blasts.forEach((b) => { grid[b.cell].open = true; grid[b.cell].hit = true; });
      grid.forEach((m, j) => {
        if (!m.mine) return;
        const c1 = j % cols, r1 = (j / cols) | 0;
        let best = Infinity;
        blasts.forEach((b) => {
          const d = Math.hypot(c1 - (b.cell % cols), r1 - ((b.cell / cols) | 0));
          best = Math.min(best, j === b.cell ? b.at : b.at + 140 + d * SPREAD);
        });
        m.expAt = best;      // every mine blows up when the nearest wave reaches it
        m.exploded = false;
      });
    };

    const win = (now) => {
      phase = 'win';
      winStart = now;
      queue = [];
    };

    const openCell = (i, now) => {
      const g = grid[i];
      if (g.open || g.flag) return;
      if (!placed) placeMines(i);
      if (g.mine) { explode([i], now); return; }
      g.open = true;
      g.openAt = now;
      opened++;
      if (g.n && !crowded(i)) g.show = Math.random() < 0.85;
      if (g.n === 0) {
        nbs[i].forEach((j) => {
          const q = grid[j];
          if (!q.open && !q.flag && !q.queued) { q.queued = true; queue.push(j); }
        });
      }
      if (opened === grid.length - mineCount) win(now);
    };

    // the "mistake": 2 or 3 mines blow up at random places on the whole board
    const doom = (now) => {
      const mines = [];
      for (let i = 0; i < grid.length; i++) if (grid[i].mine && !grid[i].open) mines.push(i);
      if (!mines.length) { phase = 'out'; return; }
      const want = 2 + (Math.random() < 0.5 ? 1 : 0);
      const picks = [];
      for (let tries = 0; tries < 60 && picks.length < want; tries++) {
        const c = mines[(Math.random() * mines.length) | 0];
        const farEnough = picks.every((p) =>
          Math.hypot((c % cols) - (p % cols), ((c / cols) | 0) - ((p / cols) | 0)) >= 6);
        if (farEnough) picks.push(c);          // blasts stay apart from each other
      }
      if (!picks.length) picks.push(mines[0]);
      picks.forEach((c) => { grid[c].flag = false; });
      explode(picks, now);
    };

    // look at every number and work out what is certainly safe / certainly a mine
    const analyse = () => {
      const cons = [], safe = new Set(), mines = new Set();

      for (let i = 0; i < grid.length; i++) {
        const g = grid[i];
        if (!g.open || !g.n) continue;
        let f = 0;
        const u = [];
        for (const j of nbs[i]) {
          const q = grid[j];
          if (q.flag) f++;
          else if (!q.open) u.push(j);
        }
        if (!u.length) continue;
        const r = g.n - f;
        if (r === 0) u.forEach((j) => safe.add(j));
        else if (r === u.length) u.forEach((j) => mines.add(j));
        else cons.push({ u, r, i });
      }
      if (safe.size || mines.size) return { safe, mines, cons };

      // pair rule: if one number's unknown cells sit inside another's, compare them
      for (let a = 0; a < cons.length; a++) {
        for (let b = 0; b < cons.length; b++) {
          const A = cons[a], B = cons[b];
          if (A.u.length >= B.u.length) continue;
          if (Math.abs((A.i % cols) - (B.i % cols)) > 2 ||
              Math.abs(((A.i / cols) | 0) - ((B.i / cols) | 0)) > 2) continue;
          const setB = new Set(B.u);
          if (!A.u.every((j) => setB.has(j))) continue;
          const setA = new Set(A.u);
          const diff = B.u.filter((j) => !setA.has(j));
          const dr = B.r - A.r;
          if (dr === 0) diff.forEach((j) => safe.add(j));
          else if (dr === diff.length) diff.forEach((j) => mines.add(j));
        }
      }
      return { safe, mines, cons };
    };

    // when nothing is certain: pick the cell with the lowest chance of being a mine
    const pickGuess = (cons) => {
      const unknown = [];
      for (let i = 0; i < grid.length; i++) if (!grid[i].open && !grid[i].flag) unknown.push(i);
      if (!unknown.length) return -1;

      const globalP = Math.max(0, mineCount - flags) / unknown.length;
      const prob = new Map();
      cons.forEach((c) => {
        const p = c.r / c.u.length;
        c.u.forEach((j) => { if ((prob.get(j) || 0) < p) prob.set(j, p); });
      });

      let best = -1, bestP = 2;
      unknown.forEach((j) => {
        const p = (prob.has(j) ? prob.get(j) : globalP) + Math.random() * 0.04;
        if (p < bestP) { bestP = p; best = j; }
      });
      return best;
    };

    const act = (now) => {
      if (!grid.length) return;

      if (queue.length) {                       // opening cascade
        for (let k = 0; k < 2 && queue.length && phase === 'play'; k++) {
          const j = queue.shift();
          grid[j].queued = false;
          openCell(j, now);
        }
        nextAt = now + CASCADE_MS;
        return;
      }

      if (!placed) {                            // first click, somewhere near the middle
        const c = Math.floor(cols * (0.25 + Math.random() * 0.5));
        const r = Math.floor(rows * (0.25 + Math.random() * 0.5));
        openCell(r * cols + c, now);
        doomAt = now + DOOM_MIN + Math.random() * DOOM_RANGE;
        nextAt = now + ACT_THINK;
        return;
      }

      if (doomAt && now >= doomAt) { doom(now); return; }

      const { safe, mines, cons } = analyse();

      if (safe.size) {
        guessReady = false;
        const arr = [...safe];
        openCell(arr[(Math.random() * arr.length) | 0], now);
        nextAt = now + ACT_FAST + Math.random() * 60;
        return;
      }

      if (mines.size) {
        guessReady = false;
        const arr = [...mines];
        const j = arr[(Math.random() * arr.length) | 0];
        grid[j].flag = true;                    // always used by the logic, drawn only if SHOW_FLAGS
        grid[j].flagAt = now;
        flags++;
        nextAt = now + ACT_FAST * 0.8;
        return;
      }

      // stuck: think for a moment, then guess
      if (!guessReady) { guessReady = true; nextAt = now + ACT_THINK; return; }
      guessReady = false;
      const g = pickGuess(cons);
      if (g < 0) { phase = 'out'; return; }
      openCell(g, now);
      nextAt = now + ACT_THINK * 0.6;
    };

    const update = (now, dt) => {
      if (phase !== 'out') master = Math.min(1, master + dt / 1.2);

      if (phase === 'play') {
        if (now >= nextAt) act(now);
      } else if (phase === 'boom') {
        grid.forEach((m, j) => {
          if (m.mine && !m.exploded && now >= m.expAt) {
            m.exploded = true;
            burst((j % cols) * cell + cell / 2, ((j / cols) | 0) * cell + cell / 2, blasts.some((b) => b.cell === j) ? 40 : 9);
          }
        });
        if (now - boomStart > BOOM_HOLD) phase = 'out';
      } else if (phase === 'win') {
        if (now - winStart > WIN_HOLD) phase = 'out';
      } else if (phase === 'out') {
        master = Math.max(0, master - dt / 1.2);
        if (master <= 0) build();               // page is empty now, a new game starts after a short pause
      }

      particles.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= dt;
      });
      particles = particles.filter((p) => p.life > 0);
    };

    const draw = (now) => {
      ctx.clearRect(0, 0, w, h);
      if (!grid.length) return;

      ctx.save();
      const t = phase === 'boom' ? now - boomStart : -1;
      let shake = 0;
      if (!reduce && t >= 0) {                            // screen shake: every blast adds a little
        blasts.forEach((b) => {
          const tb = now - b.at;
          if (tb >= 0 && tb < 450) shake += 6 * (1 - tb / 450);
        });
      }
      if (shake > 0) {
        shake = Math.min(shake, 12);
        ctx.translate((Math.random() - 0.5) * 2 * shake, (Math.random() - 0.5) * 2 * shake);
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (CLOUD > 0) {
        if (mini.width !== cols || mini.height !== rows) { mini.width = cols; mini.height = rows; }
        mctx.clearRect(0, 0, cols, rows);
        for (let i = 0; i < grid.length; i++) {
          const g = grid[i];
          if (!g.open || g.mine) continue;
          const p = Math.min(1, (now - g.openAt) / 450);
          mctx.fillStyle = 'rgba(' + rgb + ',' + (CLOUD * p * master).toFixed(3) + ')';
          mctx.fillRect(i % cols, (i / cols) | 0, 1, 1);
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(mini, 0, 0, cols, rows, 0, 0, cols * cell, rows * cell);
      }

      const numFont = '500 ' + Math.round(cell * NUM_SIZE) + 'px "JetBrains Mono", ui-monospace, monospace';
      const mineFont = '500 ' + Math.round(cell * 0.8) + 'px "JetBrains Mono", ui-monospace, monospace';

      for (let i = 0; i < grid.length; i++) {
        const g = grid[i];
        const x = (i % cols) * cell, y = ((i / cols) | 0) * cell;

        if (g.mine && g.exploded) {                       // blown-up mine: only the star
          const a = Math.min(1, (now - g.expAt) / 250) * master;
          ctx.font = mineFont;
          ctx.fillStyle = 'rgba(' + orange + ',' + ((g.hit ? 0.95 : 0.8) * a).toFixed(3) + ')';
          ctx.fillText('*', x + cell / 2, y + cell / 2 + cell * 0.18);
        } else if (g.open && !g.mine) {                   // opened cell: brief glow, then only the number
          const p = Math.min(1, (now - g.openAt) / 450);
          const fa = (OPEN_FLASH * (1 - p) + TILE) * master;
          if (fa > 0.002) {
            ctx.fillStyle = 'rgba(' + rgb + ',' + fa.toFixed(3) + ')';
            ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
          }
          if (t >= 0) {                                   // the wave lights the cells it passes
            const cx = x + cell / 2, cy = y + cell / 2;
            let lit = 0;
            for (const b of blasts) {
              const tb = now - b.at;
              if (tb < 0) continue;
              const delta = Math.abs(Math.hypot(cx - b.x, cy - b.y) - tb * (cell / SPREAD));
              if (delta < cell * 1.5) lit = Math.max(lit, 1 - delta / (cell * 1.5));
            }
            if (lit > 0) {
              ctx.fillStyle = 'rgba(' + orange + ',' + (0.22 * lit * master).toFixed(3) + ')';
              ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
            }
          }
          if (g.n && g.show) {
            const np = Math.min(1, (now - g.openAt) / 300);
            ctx.font = numFont;
            ctx.fillStyle = 'rgba(' + rgb + ',' + (NUM_ALPHA * np * boost * master).toFixed(3) + ')';
            ctx.fillText(g.n, x + cell / 2, y + cell / 2 + 1);
          }
        } else if (SHOW_FLAGS && g.flag && !g.open) {     // closed cell the bot marked as a mine
          const a = Math.max(0, Math.min(1, (now - g.flagAt) / 300)) * master;
          ctx.fillStyle = 'rgba(' + rgb + ',' + (TILE * 0.6 * a).toFixed(3) + ')';
          ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
          ctx.font = '500 ' + Math.round(cell * 0.55) + 'px "JetBrains Mono", ui-monospace, monospace';
          ctx.fillStyle = 'rgba(' + orange + ',' + (0.5 * a).toFixed(3) + ')';
          ctx.fillText('*', x + cell / 2, y + cell / 2 + cell * 0.16);
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(' + orange + ',' + (0.28 * a).toFixed(3) + ')';
          ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
        }
        // other closed cells are never drawn
      }

      if (t >= 0) {
        blasts.forEach((b) => {
          const tb = now - b.at;
          if (tb < 0) return;
          const fade = Math.max(0, 1 - tb / 1900) * master;
          const speed = cell / SPREAD;

          if (tb < 800) {                                     // hot glow at the blast centre
            const gr = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, cell * 3.5);
            const ga = 0.4 * (1 - tb / 800) * master;
            gr.addColorStop(0, 'rgba(255,176,0,' + ga.toFixed(3) + ')');
            gr.addColorStop(0.4, 'rgba(' + orange + ',' + (ga * 0.5).toFixed(3) + ')');
            gr.addColorStop(1, 'rgba(' + orange + ',0)');
            ctx.fillStyle = gr;
            ctx.fillRect(b.x - cell * 3.5, b.y - cell * 3.5, cell * 7, cell * 7);
          }

          [0, 220].forEach((delay, k) => {                    // two rings, the second one follows the first
            const R = (tb - delay) * speed;
            if (R <= 0 || fade <= 0) return;
            ctx.beginPath();
            ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
            ctx.lineWidth = k ? 1.5 : 2.5;
            ctx.strokeStyle = 'rgba(' + orange + ',' + ((k ? 0.3 : 0.6) * fade).toFixed(3) + ')';
            ctx.stroke();
            ctx.lineWidth = k ? 6 : 14;
            ctx.strokeStyle = 'rgba(' + orange + ',' + ((k ? 0.05 : 0.09) * fade).toFixed(3) + ')';
            ctx.stroke();
          });
        });

        const t0 = now - blasts[0].at;                        // one quick soft flash at the very start
        if (t0 >= 0 && t0 < 350) {
          ctx.fillStyle = 'rgba(' + orange + ',' + (0.08 * (1 - t0 / 350) * master).toFixed(3) + ')';
          ctx.fillRect(-20, -20, w + 40, h + 40);
        }
      }

      particles.forEach((p) => {                            // sparks
        const a = Math.max(0, p.life / p.max) * 0.9 * master;
        ctx.fillStyle = 'rgba(' + (p.amber ? '255,176,0' : orange) + ',' + a.toFixed(3) + ')';
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      });

      if (phase === 'win') {                                // soft blue sweep when the game is won
        const k = Math.min(1, (now - winStart) / 1400);
        const sx = k * (w + 300) - 150;
        const gr = ctx.createLinearGradient(sx - 150, 0, sx + 150, 0);
        gr.addColorStop(0, 'rgba(' + blue + ',0)');
        gr.addColorStop(0.5, 'rgba(' + blue + ',' + (0.1 * master).toFixed(3) + ')');
        gr.addColorStop(1, 'rgba(' + blue + ',0)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.restore();
    };

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      update(now, dt);
      draw(now);
    };

    const start = () => {
      if (reduce || raf || !onScreen || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    // reduced motion: no animation, just one half-played static board
    const staticBoard = () => {
      for (let tries = 0; tries < 6; tries++) {
        build();
        master = 1;
        let guard = 0;
        while (phase === 'play' && opened < (grid.length - mineCount) * 0.55 && guard++ < 3000) {
          guessReady = true;
          act(0);
        }
        if (phase === 'play') break;
      }
      if (phase !== 'play') build();
      master = 1;
      draw(1e9);
    };

    const size = () => {
      const nw = section.clientWidth, nh = section.clientHeight;
      if (!nw || !nh) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = nw;
      h = nh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cell = w < 600 ? 44 : 60;
      const nc = Math.ceil(w / cell), nr = Math.ceil(h / cell);
      if (nc !== cols || nr !== rows || !grid.length) {   // new game only if the board size changed
        cols = nc;
        rows = nr;
        master = 0;
        build();
        if (reduce) staticBoard();
      } else if (reduce) {
        draw(1e9);
      }
    };

    readTheme();
    size();
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(section);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        onScreen ? start() : stop();
      }).observe(section);
    }

    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    new MutationObserver(() => { readTheme(); if (reduce) draw(1e9); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  };

  // Minesweeper background. To use it on another section, add one more initMines('section-id', { ... }) line
  initMines('problem', { numGap: 1, numSize: 0.34, numAlpha: 0.22, tile: 0.07, flags: true, cloud: 0.12 });
    /* Dot grid background: shows on every page opened from the navbar (not on Problem).
     Dots stay in the background, drift slowly when you scroll, and hide wherever there is content. */
  (() => {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;' +
      'pointer-events:none;opacity:0;transition:opacity 0.5s ease;';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- tune here ---- */
    const SPACING = 30;    // distance between dots (px)
    const RADIUS = 1.2;    // dot size
    const FACTOR = 0.3;    // how much the dots follow the scroll (0 = they never move)
    const EASE = 0.12;     // smoothness (smaller = slower, softer)
    const PAD = 14;        // empty space kept around text and cards (px)
    const FEATHER = 18;    // dots next to that space are half faded (px)

    // boxes: the whole box hides the dots. text: only the lines of text hide the dots.
    const BOXES = '.sk-card, .jr-card, .pj-card, .ab-box, .reach-terminal, .reach-badge, ' +
      '.cta-info-badge, .btn-pill, .ab-btn';
    const TEXTS = 'h1, h2, h3, p';

    let w = 0, h = 0, cols = 0, rows = 0;
    let cur = 0, target = 0, raf = 0, active = false, until = 0;
    let section = null, boxEls = [], textEls = [], fixedEls = [];
    let color = '255,255,255', alpha = 0.16;
    const rects = [];

    const readTheme = () => {
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      color = light ? '0,0,0' : '255,255,255';
      alpha = light ? 0.2 : 0.16;
    };

    // the page that is open now (null = home, or the Problem page, where there are no dots)
    const getSection = () => {
      if (!document.body.classList.contains('view-mode')) return null;
      const current = document.querySelector('main > section.is-current');
      return current && current.id !== 'problem' ? current : null;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / SPACING) + 1;
      rows = Math.ceil(h / SPACING) + 2;
    };

    // measure everything that should hide the dots (right now, on screen)
    const collect = () => {
      rects.length = 0;
      const add = (r) => {
        if (r.width < 1 || r.height < 1) return;
        if (r.bottom < -50 || r.top > h + 50 || r.right < -50 || r.left > w + 50) return;
        rects.push(r.left, r.top, r.right, r.bottom);
      };
      fixedEls.forEach((el) => add(el.getBoundingClientRect()));
      boxEls.forEach((el) => add(el.getBoundingClientRect()));
      textEls.forEach((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const list = range.getClientRects();
        for (let i = 0; i < list.length; i++) add(list[i]);
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const full = new Path2D();
      const half = new Path2D();
      const shift = ((cur % SPACING) + SPACING) % SPACING;   // the grid repeats, so we only need the remainder
      const n = rects.length;
      const far = PAD + FEATHER;

      for (let r = 0; r < rows; r++) {
        const y = r * SPACING + SPACING / 2 - shift;
        for (let c = 0; c < cols; c++) {
          const x = c * SPACING + SPACING / 2;
          let level = 2;                                        // 2 = full dot, 1 = half, 0 = hidden
          for (let k = 0; k < n; k += 4) {
            const l = rects[k], t = rects[k + 1], rr = rects[k + 2], b = rects[k + 3];
            if (x > l - far && x < rr + far && y > t - far && y < b + far) {
              if (x > l - PAD && x < rr + PAD && y > t - PAD && y < b + PAD) { level = 0; break; }
              level = 1;
            }
          }
          if (level === 2) { full.moveTo(x + RADIUS, y); full.arc(x, y, RADIUS, 0, Math.PI * 2); }
          else if (level === 1) { half.moveTo(x + RADIUS, y); half.arc(x, y, RADIUS, 0, Math.PI * 2); }
        }
      }
      ctx.fillStyle = 'rgba(' + color + ',' + alpha + ')';
      ctx.fill(full);
      ctx.fillStyle = 'rgba(' + color + ',' + (alpha * 0.4).toFixed(3) + ')';
      ctx.fill(half);
    };

    const loop = () => {
      raf = 0;
      cur += (target - cur) * EASE;
      if (Math.abs(target - cur) < 0.1) cur = target;
      collect();
      draw();
      if (active && (cur !== target || performance.now() < until)) raf = requestAnimationFrame(loop);
    };

    // keep redrawing for a while (the page is moving, animating or changing)
    const wake = (ms) => {
      until = Math.max(until, performance.now() + ms);
      if (!raf && active) raf = requestAnimationFrame(loop);
    };

    const update = () => {
      const now = getSection();
      if (now === section) return;
      section = now;

      if (!now) {
        active = false;
        canvas.style.opacity = '0';
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        return;
      }

      // a new page is open: remember what is on it
      boxEls = Array.from(now.querySelectorAll(BOXES));
      textEls = Array.from(now.querySelectorAll(TEXTS)).filter((el) => !el.closest(BOXES));
      fixedEls = Array.from(document.querySelectorAll('.header, .glass-footer'));

      if (!active) {
        active = true;
        readTheme();
        resize();
        cur = target = reduce ? 0 : window.scrollY * FACTOR;   // start in the right place, no jump
        canvas.style.opacity = '1';
      }
      wake(3500);   // the page is still animating in (reveal, typing heading)
    };

    window.addEventListener('scroll', () => {
      if (!active) return;
      if (!reduce) target = window.scrollY * FACTOR;
      wake(350);
    }, { passive: true });

    document.addEventListener('click', () => { if (active) wake(1200); }, { passive: true });

    window.addEventListener('resize', () => {
      if (!active) return;
      resize();
      wake(350);
    });

    new MutationObserver(() => { readTheme(); if (active) { collect(); draw(); } })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // watch the page: body class "view-mode" and the "is-current" class on sections
    new MutationObserver(update)
      .observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });

    update();
  })();
});