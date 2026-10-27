/**
 * Angkor Wat - Apple / iOS Interaction Design
 * Vanilla JavaScript (No Frameworks, No Dependencies)
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initScrollAnimations();
  initImageLoading();
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

  elements.forEach((el) => {
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
 * 3. Unified Image Card Load & Error State Handling
 * -------------------------------------------------------------------------- */
function initImageLoading() {
  const cardImages = document.querySelectorAll('.img-card__frame img');
  cardImages.forEach(img => {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('is-loaded');
    } else {
      img.addEventListener('load', () => {
        img.classList.add('is-loaded');
      }, { once: true });

      img.addEventListener('error', () => {
        const frame = img.closest('.img-card__frame');
        if (frame) {
          frame.classList.add('is-error');
          img.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = 'img-card-fallback';
          fallback.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>${img.alt || 'មិនអាចផ្ទុករូបភាពបាន'}</span>
          `;
          frame.appendChild(fallback);
        }
      }, { once: true });
    }
  });
}

/* --------------------------------------------------------------------------
 * 4. iOS Photos-Style Lightbox Modal (Multi-image, Arrow Nav & Swipe)
 * -------------------------------------------------------------------------- */
function initLightbox() {
  const lightbox = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');

  if (!lightbox || !lightboxImg || !lightboxClose) return;

  let currentGroup = [];
  let currentIndex = 0;
  let lastActiveElement = null;
  let touchStartX = 0;
  let touchStartY = 0;

  // Create Prev / Next Buttons if not already present
  let prevBtn = lightbox.querySelector('.ios-lightbox-nav-prev');
  let nextBtn = lightbox.querySelector('.ios-lightbox-nav-next');
  let counterEl = lightbox.querySelector('.ios-lightbox-counter');

  const dialog = lightbox.querySelector('.ios-lightbox-dialog');
  if (dialog) {
    if (!prevBtn) {
      prevBtn = document.createElement('button');
      prevBtn.className = 'ios-lightbox-nav-btn ios-lightbox-nav-prev';
      prevBtn.setAttribute('aria-label', 'រូបភាពមុន');
      prevBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><polyline points="15 18 9 12 15 6"/></svg>';
      dialog.appendChild(prevBtn);
    }
    if (!nextBtn) {
      nextBtn = document.createElement('button');
      nextBtn.className = 'ios-lightbox-nav-btn ios-lightbox-nav-next';
      nextBtn.setAttribute('aria-label', 'រូបភាពបន្ទាប់');
      nextBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><polyline points="9 18 15 12 9 6"/></svg>';
      dialog.appendChild(nextBtn);
    }
    const metaWrap = lightbox.querySelector('.ios-lightbox-meta');
    if (metaWrap && !counterEl) {
      counterEl = document.createElement('span');
      counterEl.className = 'ios-lightbox-counter';
      metaWrap.insertBefore(counterEl, metaWrap.firstChild);
    }
  }

  function updateImage() {
    if (currentIndex < 0 || currentIndex >= currentGroup.length) return;
    const item = currentGroup[currentIndex];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt || 'រូបភាពពង្រីក';
    if (lightboxCaption) {
      lightboxCaption.textContent = item.alt || '';
    }
    if (counterEl) {
      const khmerNumerals = ['០','១','២','៣','៤','៥','៦','៧','៨','៩'];
      const toKhmer = n => String(n).split('').map(d => khmerNumerals[parseInt(d, 10)] || d).join('');
      counterEl.textContent = `${toKhmer(currentIndex + 1)} / ${toKhmer(currentGroup.length)}`;
      counterEl.style.display = currentGroup.length > 1 ? 'inline-block' : 'none';
    }
    if (prevBtn) {
      prevBtn.style.display = currentGroup.length > 1 ? 'flex' : 'none';
    }
    if (nextBtn) {
      nextBtn.style.display = currentGroup.length > 1 ? 'flex' : 'none';
    }
  }

  function openLightbox(groupName, index) {
    lastActiveElement = document.activeElement;
    
    // Collect all elements belonging to this group
    const targets = Array.from(document.querySelectorAll(`[data-lightbox][data-lightbox-group="${groupName}"]`));
    currentGroup = targets.map(target => {
      const img = target.tagName.toLowerCase() === 'img' ? target : target.querySelector('img');
      return {
        src: img ? img.src : '',
        alt: img ? img.alt : ''
      };
    }).filter(item => item.src);

    if (!currentGroup.length) return;
    currentIndex = Math.max(0, Math.min(index, currentGroup.length - 1));

    updateImage();
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

  function showNext() {
    if (currentGroup.length <= 1) return;
    currentIndex = (currentIndex + 1) % currentGroup.length;
    updateImage();
  }

  function showPrev() {
    if (currentGroup.length <= 1) return;
    currentIndex = (currentIndex - 1 + currentGroup.length) % currentGroup.length;
    updateImage();
  }

  // Bind trigger click on all [data-lightbox] cards
  document.querySelectorAll('[data-lightbox]').forEach(card => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'ចុចដើម្បីមើលរូបភាពធំ');

    function trigger() {
      const group = card.dataset.lightboxGroup || 'default';
      const siblings = Array.from(document.querySelectorAll(`[data-lightbox][data-lightbox-group="${group}"]`));
      const idx = siblings.indexOf(card);
      openLightbox(group, idx >= 0 ? idx : 0);
    }

    card.addEventListener('click', trigger);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger();
      }
    });
  });

  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
  lightboxClose.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('ios-lightbox-img-wrap')) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      showNext();
    } else if (e.key === 'ArrowLeft') {
      showPrev();
    }
  });

  // Touch Swipe (Left/Right to navigate, Down to dismiss)
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(deltaY) > 80 && Math.abs(deltaY) > Math.abs(deltaX)) {
      closeLightbox();
    } else if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        showNext();
      } else {
        showPrev();
      }
    }
  }, { passive: true });
}

/* --------------------------------------------------------------------------
 * 5. Sticky Segmented Control TOC Active Tracking (About page)
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
