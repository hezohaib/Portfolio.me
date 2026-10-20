/**
 * Zohaib Portfolio - Core Interactive Features
 * - Dark / Light Theme Toggle with LocalStorage persistence
 * - Fade-in on Scroll using IntersectionObserver
 * - Glassmorphism Contact Modal with smooth transitions
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================================
     1. Dark / Light Mode Toggle
     ========================================================================== */
  const themeToggleBtn = document.getElementById('themeToggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  // Determine initial theme: saved preference -> system preference -> light
  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme ? savedTheme : (prefersDarkScheme.matches ? 'dark' : 'light');

  // Apply initial theme
  document.documentElement.setAttribute('data-theme', initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  // Listen for system theme changes if user has no manual override
  prefersDarkScheme.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newSystemTheme);
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
    // Fallback if IntersectionObserver is unsupported
    revealElements.forEach(el => el.classList.add('active'));
  }

  /* ==========================================================================
     3. Featured Project Interactions
     ========================================================================== */
  const featuredCard = document.querySelector('.project-card-featured');
  const projectPreview = featuredCard?.querySelector('.browser-screen img');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopPointer = window.matchMedia('(min-width: 769px) and (pointer: fine)');

  if (featuredCard) {
    if (projectPreview) {
      const showPreviewFallback = () => {
        projectPreview.closest('.browser-screen').classList.add('image-fallback');
      };

      projectPreview.addEventListener('error', showPreviewFallback, { once: true });
      if (projectPreview.complete && projectPreview.naturalWidth === 0) {
        showPreviewFallback();
      }
    }

    if ('IntersectionObserver' in window) {
      const chipObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            featuredCard.classList.add('tech-chips-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });

      chipObserver.observe(featuredCard);
    } else {
      featuredCard.classList.add('tech-chips-visible');
    }

    if (!reducedMotion.matches && desktopPointer.matches) {
      const updateTilt = (event) => {
        const bounds = featuredCard.getBoundingClientRect();
        const rotateX = ((event.clientY - bounds.top) / bounds.height - 0.5) * -4;
        const rotateY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 5;
        featuredCard.style.setProperty('--tilt-x', `${rotateX}deg`);
        featuredCard.style.setProperty('--tilt-y', `${rotateY}deg`);
      };

      featuredCard.addEventListener('mousemove', updateTilt);
      featuredCard.addEventListener('mouseleave', () => {
        featuredCard.style.setProperty('--tilt-x', '0deg');
        featuredCard.style.setProperty('--tilt-y', '0deg');
      });
    }
  }

  const quickEmailButton = document.querySelector('.quick-connect-email');
  if (quickEmailButton) {
    quickEmailButton.addEventListener('click', async () => {
      const email = quickEmailButton.dataset.email;
      if (!email || !navigator.clipboard) return;

      const label = quickEmailButton.querySelector('.quick-connect-label');
      navigator.clipboard.writeText(email)
        .then(() => {
          if (!label) return;
          label.textContent = 'Email Copied';
          setTimeout(() => {
            label.textContent = 'Copy Email to Clipboard';
          }, 1600);
        })
        .catch(() => {
          if (label) label.textContent = 'Copy Failed';
        });
    });
  }


  /* ==========================================================================
     4. Smooth Popup Contact Modal
     ========================================================================== */
  const contactModal = document.getElementById('contactModal');
  const openModalButtons = document.querySelectorAll('.open-contact-modal, #openContactModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const contactForm = document.getElementById('contactForm');
  const formSuccessMessage = document.getElementById('formSuccessMessage');
  const formErrorMessage = document.getElementById('formErrorMessage');
  const replyToInput = document.getElementById('replyTo');

  const openModal = () => {
    if (!contactModal) return;
    contactModal.classList.add('active');
    contactModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus first input for accessibility
    setTimeout(() => {
      const firstInput = contactModal.querySelector('input:not([type="hidden"]), textarea, select');
      if (firstInput) firstInput.focus();
    }, 150);
  };

  const closeModal = () => {
    if (!contactModal) return;
    contactModal.classList.remove('active');
    contactModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
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

  // Close when clicking on the blurred backdrop overlay
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) {
        closeModal();
      }
    });
  }

  // Close on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactModal && contactModal.classList.contains('active')) {
      closeModal();
    }
  });

  // Handle contact form submission
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const submitLabel = submitBtn ? submitBtn.querySelector('.submit-label') : null;
      const accessKey = contactForm.querySelector('input[name="access_key"]')?.value.trim();

      if (formSuccessMessage) formSuccessMessage.hidden = true;
      if (formErrorMessage) formErrorMessage.hidden = true;

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
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to send your message.');
        }

        if (formSuccessMessage) {
          formSuccessMessage.hidden = false;
        }
        contactForm.reset();

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('is-loading');
          if (submitLabel) submitLabel.textContent = 'Send Message';
        }

        // Auto close modal after successful submission
        setTimeout(() => {
          if (formSuccessMessage) {
            formSuccessMessage.hidden = true;
          }
          closeModal();
        }, 2200);
      } catch (error) {
        if (formErrorMessage) {
          formErrorMessage.textContent = error instanceof Error
            ? error.message
            : 'Something went wrong while sending your message. Please try again.';
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
