/**
 * Angkor Wat - Apple / iOS Interaction Design
 * Vanilla JavaScript (No Frameworks, No Dependencies)
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initScrollAnimations();
  initLightbox();
  initTableOfContents();
});

/* --------------------------------------------------------------------------
 * 1. iOS-Style Full-Width Mobile Navigation Sheet
 * -------------------------------------------------------------------------- */
function initMobileNav() {
  const menuBtn = document.getElementById('menu-btn');
  const mobileSheet = document.getElementById('mobile-menu');

  if (!menuBtn || !mobileSheet) return;

  function toggleMenu(forceState) {
    const isOpen = forceState !== undefined ? forceState : !mobileSheet.classList.contains('open');
    mobileSheet.classList.toggle('open', isOpen);
    menuBtn.setAttribute('aria-expanded', String(isOpen));
    
    // Lock body scroll when mobile sheet is open
    document.body.style.overflow = isOpen ? 'hidden' : '';

    // Switch icon between hamburger and close (X)
    const icon = menuBtn.querySelector('svg');
    if (icon) {
      if (isOpen) {
        icon.innerHTML = '<path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>';
      } else {
        icon.innerHTML = '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>';
      }
    }
  }

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close when clicking any nav link
  mobileSheet.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggleMenu(false);
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileSheet.classList.contains('open')) {
      toggleMenu(false);
      menuBtn.focus();
    }
  });

  // Close on window resize if crossing above mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && mobileSheet.classList.contains('open')) {
      toggleMenu(false);
    }
  }, { passive: true });
}

/* --------------------------------------------------------------------------
 * 2. Subtle Fade-and-Rise Staggered Scroll Animations
 * -------------------------------------------------------------------------- */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-rise');
  if (!elements.length) return;

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('revealed'));
    return;
  }

  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Stagger entrance if multiple elements appear together
        const target = entry.target;
        const delay = target.dataset.delay ? parseInt(target.dataset.delay, 10) : 0;
        if (delay > 0) {
          setTimeout(() => {
            target.classList.add('revealed');
          }, delay);
        } else {
          target.classList.add('revealed');
        }
        obs.unobserve(target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach((el, index) => {
    // Apply automatic 60ms stagger to siblings
    const parent = el.parentElement;
    if (parent && parent.children.length > 1) {
      const siblingIndex = Array.prototype.indexOf.call(parent.children, el);
      if (siblingIndex > 0) {
        el.dataset.delay = String(siblingIndex * 60);
      }
    }
    observer.observe(el);
  });
}

/* --------------------------------------------------------------------------
 * 3. iOS-Style Image Lightbox Modal
 * -------------------------------------------------------------------------- */
function initLightbox() {
  const lightbox = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');

  if (!lightbox || !lightboxImg || !lightboxClose) return;

  let lastActiveElement = null;
  let touchStartY = 0;

  function openLightbox(src, alt) {
    lastActiveElement = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || 'រូបភាពពង្រីក';
    if (lightboxCaption) {
      lightboxCaption.textContent = alt || '';
    }
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
    document.body.style.overflow = '';
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  }

  // Register lightbox trigger targets
  document.querySelectorAll('[data-lightbox]').forEach(target => {
    target.setAttribute('role', 'button');
    target.setAttribute('tabindex', '0');
    target.setAttribute('aria-label', 'ចុចដើម្បីមើលរូបភាពធំ');

    function handleTrigger() {
      const img = target.tagName.toLowerCase() === 'img' ? target : target.querySelector('img');
      if (img) {
        openLightbox(img.src, img.alt);
      }
    }

    target.addEventListener('click', handleTrigger);
    target.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleTrigger();
      }
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);

  // Close when clicking blurred backdrop
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Keyboard navigation: Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  // Touch swipe-down to dismiss (iOS physical gesture)
  lightbox.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    if (touchEndY - touchStartY > 80) {
      closeLightbox();
    }
  }, { passive: true });
}

/* --------------------------------------------------------------------------
 * 4. Sticky Segmented Control TOC Active Tracking (About page)
 * -------------------------------------------------------------------------- */
function initTableOfContents() {
  const tocLinks = document.querySelectorAll('.toc-segment-btn');
  if (!tocLinks.length) return;

  const sections = [];
  tocLinks.forEach(link => {
    const targetId = link.getAttribute('href');
    if (targetId && targetId.startsWith('#')) {
      const el = document.querySelector(targetId);
      if (el) {
        sections.push({ id: targetId, element: el, link: link });
      }
    }
  });

  if (!sections.length) return;

  function onScroll() {
    const scrollPos = window.scrollY + 140;
    let currentId = null;

    for (let i = sections.length - 1; i >= 0; i--) {
      if (sections[i].element.offsetTop <= scrollPos) {
        currentId = sections[i].id;
        break;
      }
    }

    tocLinks.forEach(link => {
      if (link.getAttribute('href') === currentId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
