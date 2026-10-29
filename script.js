/**
 * Zohaib Portfolio - Core Interactive Features
 * - Fade-in on Scroll using IntersectionObserver
 * - Accessible Glassmorphism Contact Modal (focus trap + focus return)
 */

document.addEventListener('DOMContentLoaded', () => {
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

    scheduleAuto();
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

  const jumpTo = (y) => {
    if (typeof lenis !== 'undefined' && lenis) lenis.scrollTo(y, { immediate: true });
    else window.scrollTo({ top: y, behavior: 'instant' });
  };

  const getHeading = (section) => section.querySelector('.section-title, .pb-title');

  // Heading ko wapas poora text dena (typing beech mein ruk jaye to bhi)
  const resetHeadings = () => {
    clearInterval(typeTimer);
    sections.forEach((s) => {
      const h = getHeading(s);
      if (h && h.dataset.full) {
        h.textContent = h.dataset.full;
        h.classList.remove('is-typing');
      }
    });
  };

  const typeHeading = (section) => {
    const h = getHeading(section);
    if (!h) return;                      // Contact mein ye heading nahi hoti
    const full = h.dataset.full || (h.dataset.full = h.textContent.trim());
    h.setAttribute('aria-label', full);  // screen reader ko poora text mile

    clearInterval(typeTimer);
    if (reduceMotion) { h.textContent = full; return; }

    h.textContent = '';
    h.classList.add('is-typing');
    let i = 0;
    typeTimer = setInterval(() => {
      i++;
      h.textContent = full.slice(0, i);
      if (i >= full.length) {
        clearInterval(typeTimer);
        setTimeout(() => h.classList.remove('is-typing'), 1500);
      }
    }, 55);
  };

  const showSection = (id, push) => {
    const target = document.getElementById(id);
    if (!target || !sections.includes(target)) return;

    if (!document.body.classList.contains('view-mode')) savedScroll = window.scrollY;
    resetHeadings();
    document.body.classList.add('view-mode');
    sections.forEach((s) => s.classList.toggle('is-current', s === target));
    target.classList.add('active');      // fade-in wali class
    jumpTo(0);
    window.dispatchEvent(new Event('resize')); // Expertise filter ka thumb dobara set
    typeHeading(target);
    if (push) history.pushState({ view: id }, '', '#' + id);
  };

  const showHome = (push) => {
    if (!document.body.classList.contains('view-mode')) return;
    resetHeadings();
    document.body.classList.remove('view-mode');
    sections.forEach((s) => s.classList.remove('is-current'));
    jumpTo(savedScroll);
    if (push) history.pushState(null, '', location.pathname);
  };

  // Har link jo kisi section ki taraf jata ho (nav + hero button), aur logo
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const href = link.getAttribute('href');

    if (href === '#') {                  // logo = home
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

  // Browser ka back / forward button
  window.addEventListener('popstate', () => {
    const id = location.hash.slice(1);
    if (sections.some((s) => s.id === id)) showSection(id, false);
    else showHome(false);
  });
})();
});