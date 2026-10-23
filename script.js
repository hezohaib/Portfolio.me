/**
 * Zohaib Portfolio - Core Interactive Features
 * - Dark / Light Theme Toggle with safe LocalStorage persistence
 * - Fade-in on Scroll using IntersectionObserver
 * - Accessible Glassmorphism Contact Modal (focus trap + focus return)
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================================
     0. Helpers
     ========================================================================== */

  // localStorage can throw (private mode, in-app browsers, blocked cookies).
  // These helpers make sure a storage failure never stops the rest of the script.
  const safeStorage = {
    get(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
    }
  };

  // Older Safari (<14) only supports addListener on MediaQueryList.
  const onMediaChange = (mql, handler) => {
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(handler);
    }
  };

  /* ==========================================================================
     1. Dark / Light Mode Toggle
     ========================================================================== */
  const themeToggleBtn = document.getElementById('themeToggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  // Determine initial theme: saved preference -> system preference -> light
  const savedTheme = safeStorage.get('theme');
  const initialTheme = savedTheme ? savedTheme : (prefersDarkScheme.matches ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', newTheme);
      safeStorage.set('theme', newTheme);
    });
  }

  // Follow system theme changes only if the user has no manual override
  onMediaChange(prefersDarkScheme, (e) => {
    if (!safeStorage.get('theme')) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });


  /* ==========================================================================
     2. Fade-In on Scroll Animations (IntersectionObserver)
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
     3. Project Preview Image Fallback
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
     4. Copy Email Button (with fallback for browsers without Clipboard API)
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
     5. Accessible Popup Contact Modal
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
     6. Contact Form Submission
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
  
});
