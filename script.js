/* ═══════════════════════════════════════
   SHOOT AT SIGHT — main script
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Lenis smooth scroll ── */
  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.25,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.8,
    });
    const tick = time => { lenis.raf(time); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  /* ── Scroll reveal (IntersectionObserver) ── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  // Stagger children inside containers
  document.querySelectorAll('.reveal, .reveal-img').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 5) * 0.07}s`;
    revealObserver.observe(el);
  });

  /* ── Nav: solid on scroll ── */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    nav.classList.toggle('solid', window.scrollY > 60);
    stickyCta.classList.toggle('show', window.scrollY > window.innerHeight * 0.6);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Sticky CTA ── */
  const stickyCta = document.getElementById('stickyCta');

  /* ── Mobile menu (controlled via inline handlers in HTML) ── */
  // Hook lenis pause into the global menu functions
  const _origOpen = window.openMenu;
  const _origClose = window.closeMenu;
  window.openMenu = () => { _origOpen(); if (lenis) lenis.stop(); };
  window.closeMenu = () => { _origClose(); if (lenis) lenis.start(); };

  /* ── Smooth anchor scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = target.getBoundingClientRect().top + window.scrollY - 72;
      if (lenis) {
        lenis.scrollTo(offset, { duration: 1.4, easing: t => 1 - Math.pow(1 - t, 4) });
      } else {
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  });

  /* ── Parallax quote band ── */
  const parallaxImg = document.getElementById('parallaxImg');
  if (parallaxImg) {
    const band = parallaxImg.closest('.parallax-band');
    const updateParallax = () => {
      if (!band) return;
      const rect = band.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < 0 || rect.top > vh) return;
      const progress = (vh - rect.top) / (vh + rect.height);
      parallaxImg.style.transform = `translateY(${(progress - 0.5) * -18}%)`;
    };
    window.addEventListener('scroll', updateParallax, { passive: true });
    if (lenis) lenis.on('scroll', updateParallax);
    updateParallax();
  }

  /* ── Video play buttons ── */
  document.querySelectorAll('.play-btn').forEach(btn => {
    const card = btn.closest('.film-card');
    if (!card) return;
    const video = card.querySelector('video');
    if (!video) return;

    const meta = card.querySelector('.film-card__meta');
    const overlay = card.querySelector('.film-card__overlay');

    btn.addEventListener('click', () => {
      if (video.paused) {
        video.muted = false;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              card.classList.add('playing');
            })
            .catch(() => {
              // autoplay blocked — try muted
              video.muted = true;
              video.play().then(() => card.classList.add('playing'));
            });
        }
      } else {
        video.pause();
        card.classList.remove('playing');
      }
    });

    // clicking the video itself while playing pauses it
    video.addEventListener('click', () => {
      if (!video.paused) {
        video.pause();
        card.classList.remove('playing');
      }
    });

    // also tapping the overlay area while playing pauses
    card.addEventListener('click', (e) => {
      if (!video.paused && !e.target.closest('.play-btn')) {
        video.pause();
        card.classList.remove('playing');
      }
    });

    video.addEventListener('ended', () => {
      card.classList.remove('playing');
    });
  });

  /* ── Contact form ── */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Message Sent ✓';
        btn.style.background = '#2a7a50';
        form.reset();
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.background = '';
          btn.disabled = false;
        }, 3500);
      }, 1200);
    });
  }

  /* ── Hero desktop slideshow ── */
  const slides = Array.from(document.querySelectorAll('.hero__slide'));
  if (slides.length > 1) {
    let current = 0;

    const goTo = (next) => {
      slides[current].classList.remove('hero__slide--active');
      current = next;
      const slide = slides[current];
      slide.style.animation = 'none';
      slide.offsetHeight; // force reflow to restart animation
      slide.style.animation = 'kenBurns 3.5s ease forwards';
      slide.classList.add('hero__slide--active');
    };

    // kick off only on desktop, but keep checking if window resizes
    let timer = null;
    const startSlideshow = () => {
      if (timer) return;
      timer = setInterval(() => goTo((current + 1) % slides.length), 3000);
    };
    const stopSlideshow = () => {
      clearInterval(timer);
      timer = null;
    };

    const mq = window.matchMedia('(min-width: 768px)');
    if (mq.matches) startSlideshow();
    mq.addEventListener('change', e => e.matches ? startSlideshow() : stopSlideshow());
  }

  /* ── Hero video fallback: show poster if video stalls ── */
  const heroVideo = document.querySelector('.hero__video');
  if (heroVideo) {
    heroVideo.addEventListener('error', () => {
      heroVideo.style.display = 'none';
    });
    // Ken-Burns scale on load
    heroVideo.addEventListener('canplay', () => {
      heroVideo.style.transition = 'transform 12s ease';
      heroVideo.style.transform = 'scale(1.06)';
    }, { once: true });
  }

});
