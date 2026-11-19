/* ==========================================================================
   Tamil Mani — Portfolio Script
   ========================================================================== */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Scroll progress + nav state ---------- */
  const progress = document.getElementById('scrollProgress');
  const nav = document.getElementById('nav');

  function onScroll() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    if (progress) progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  const links = document.querySelectorAll('.nav-link');
  const sections = [...links]
    .map((l) => document.getElementById(l.dataset.section))
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.toggle('active', l.dataset.section === entry.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => sectionObserver.observe(s));
  }

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (toggle && navLinks) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      navLinks.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  }

  /* ---------- Custom cursor (fine pointers only) ---------- */
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (dot && ring && finePointer && !reduceMotion) {
    document.body.classList.add('has-custom-cursor');
    let mx = 0, my = 0, rx = 0, ry = 0;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    });

    (function follow() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(follow);
    })();

    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
    });
  }

  /* ---------- Project media: play video on hover ---------- */
  const hoverThumbs = document.querySelectorAll('[data-hover-video]');
  const canHover = window.matchMedia('(hover: hover)').matches;

  hoverThumbs.forEach((thumb) => {
    const video = thumb.querySelector('video');
    if (!video) return;
    const label = thumb.querySelector('.thumb-label');
    const play = () => {
      thumb.classList.add('is-playing');
      const p = video.play();
      if (p && p.catch) p.catch(() => thumb.classList.remove('is-playing'));
    };
    const stop = () => {
      thumb.classList.remove('is-playing');
      video.pause();
      video.currentTime = 0;               // back to the poster frame
    };

    if (canHover) {
      // Mouse users: hover starts playback (a user action, so it is fine
      // even with reduced motion turned on)
      thumb.addEventListener('mouseenter', play);
      thumb.addEventListener('mouseleave', stop);
    } else if (reduceMotion) {
      // Touch + reduced motion: no autoplay, tap to play / pause
      if (label) label.textContent = 'Tap to play';
      thumb.addEventListener('click', () => (video.paused ? play() : stop()));
    } else {
      // Touch: play while the card is on screen
      if (label) label.remove();
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => (e.isIntersecting ? play() : video.pause()), { threshold: 0.5 }).observe(thumb);
      }
    }
  });

  /* ---------- Hero physics canvas ---------- */
  const canvas = document.getElementById('physicsCanvas');
  if (canvas && canvas.getContext && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const hero = canvas.parentElement;
    let w = 0, h = 0, dpr = 1, particles = [];
    const mouse = { x: -9999, y: -9999 };
    const GRAVITY = 0.012, DAMPING = 0.995, LINK_DIST = 120;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(24, Math.min(70, Math.floor(w / 22)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 1.6 + 0.8
      }));
    }

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', () => { mouse.x = mouse.y = -9999; });

    let running = true;
    new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) tick(); }).observe(hero);

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.vy += GRAVITY;                       // gravity
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 110 * 110 && d2 > 0.01) {     // cursor repulsion
          const d = Math.sqrt(d2), f = (1 - d / 110) * 0.9;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
        }
        p.vx *= DAMPING; p.vy *= DAMPING;
        p.x += p.vx; p.y += p.vy;

        if (p.x < 0) { p.x = 0; p.vx *= -0.9; }
        if (p.x > w) { p.x = w; p.vx *= -0.9; }
        if (p.y < 0) { p.y = 0; p.vy *= -0.9; }
        if (p.y > h) { p.y = h; p.vy *= -0.82; if (Math.abs(p.vy) < 0.3) p.vy = -(Math.random() * 1.2 + 0.6); }
      }

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < LINK_DIST) {
            ctx.strokeStyle = 'rgba(0, 217, 255,' + (0.16 * (1 - d / LINK_DIST)) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(0, 217, 255, 0.7)';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(tick);
    }

    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });
    resize();
    tick();
  }
})();