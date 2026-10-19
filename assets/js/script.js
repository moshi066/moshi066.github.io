/* =====================================================================
   Md Moshiur Rahman — Portfolio
   Motion + interactivity. Depends on GSAP + ScrollTrigger (+ Lenis).
   Everything degrades gracefully if a library fails to load.
   ===================================================================== */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  const storage = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } },
  };
  const fmt = (n) => n.toLocaleString('en-US');

  /* ------------------------------------------------------------------
     Smooth scroll (Lenis) + anchor handling
     ------------------------------------------------------------------ */
  let lenis = null;
  if (!reduced && typeof window.Lenis !== 'undefined' && hasGsap) {
    try {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
      lenis.on('scroll', () => { if (hasST) ScrollTrigger.update(); });
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } catch { lenis = null; }
  }

  const navOffset = () => -(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72) - 12;

  function scrollToTarget(target) {
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target, { offset: navOffset(), duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else {
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#') return;
    const target = id === '#top' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (id === '#top') {
      lenis ? lenis.scrollTo(0, { duration: 1.4 }) : window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    } else {
      scrollToTarget(target);
    }
    history.replaceState(null, '', id === '#top' ? ' ' : id);
  });

  /* ------------------------------------------------------------------
     Preloader + hero intro
     ------------------------------------------------------------------ */
  const preloader = $('#preloader');
  const introEls = $$('[data-intro]');
  const introLines = $$('[data-intro-line]');

  function playIntro(instant = false) {
    if (!hasGsap || reduced) {
      introLines.forEach((l) => (l.style.transform = 'none'));
      introEls.forEach((el) => (el.style.opacity = '1'));
      runCounters($$('.hero__stats [data-count]'));
      return;
    }
    gsap.set(introEls, { y: 24 });
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to(introLines, { yPercent: 0, y: 0, duration: instant ? 0.9 : 1.2, stagger: 0.12 }, 0)
      .to(introEls, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }, instant ? 0.2 : 0.5)
      .add(() => runCounters($$('.hero__stats [data-count]')), instant ? 0.6 : 0.9)
      .add(() => introLines.forEach((l) => (l.style.willChange = 'auto')));
  }

  function initPreloader() {
    if (!preloader) { playIntro(true); return; }
    const skip = reduced || !hasGsap || storage.get('mr-seen') === '1';
    if (skip) { preloader.remove(); playIntro(true); return; }

    storage.set('mr-seen', '1');
    const bar = $('#preloaderBar');
    const count = $('#preloaderCount');
    const state = { v: 0 };
    const tl = gsap.timeline();
    tl.to(state, {
      v: 100, duration: 1.1, ease: 'power2.inOut',
      onUpdate() {
        const n = Math.round(state.v);
        if (count) count.textContent = n;
        if (bar) bar.style.width = n + '%';
      },
    })
      .to('.preloader__inner', { opacity: 0, y: -16, duration: 0.35, ease: 'power2.in' }, '-=0.1')
      .to(preloader, { yPercent: -100, duration: 0.85, ease: 'power4.inOut' }, '-=0.15')
      .add(() => preloader.remove());
    tl.add(() => playIntro(false), '-=0.55');
  }

  /* ------------------------------------------------------------------
     Counters
     ------------------------------------------------------------------ */
  function runCounters(els) {
    els.forEach((el) => {
      if (el.dataset.counted) return;
      el.dataset.counted = '1';
      const target = parseFloat(el.dataset.count || '0');
      const suffix = el.dataset.suffix || '';
      // A data-prefix (e.g. "~") is rendered by CSS ::before in the mono font.
      if (!hasGsap || reduced) { el.textContent = fmt(target) + suffix; return; }
      const o = { v: 0 };
      gsap.to(o, {
        v: target, duration: 1.8, ease: 'power3.out',
        onUpdate: () => (el.textContent = fmt(Math.round(o.v)) + suffix),
      });
    });
  }

  /* ------------------------------------------------------------------
     Text splitting
     ------------------------------------------------------------------ */
  function splitWords() {
    $$('[data-words]').forEach((p) => {
      const text = p.textContent.trim().replace(/\s+/g, ' ');
      p.innerHTML = text.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
    });
  }

  function splitChars() {
    $$('[data-split]').forEach((el) => {
      el.innerHTML = el.innerHTML.trim().replace(/\s+/g, ' ');
      const walk = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === 3) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((w) => {
              if (!w) return;
              if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
              // Keep each word unbreakable, but allow a line break after a hyphen.
              w.split(/(?<=-)/).forEach((part) => {
                const wd = document.createElement('span');
                wd.className = 'wd';
                Array.from(part).forEach((c) => {
                  const ch = document.createElement('span');
                  ch.className = 'ch';
                  ch.textContent = c;
                  wd.appendChild(ch);
                });
                frag.appendChild(wd);
              });
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1) {
            walk(child);
          }
        });
      };
      walk(el);
    });
  }

  /* ------------------------------------------------------------------
     Scroll-driven motion
     ------------------------------------------------------------------ */
  function initScroll() {
    const reveals = $$('[data-reveal]').filter((el) => !el.closest('.hero'));
    const groups = $$('[data-reveal-group]');
    const counters = $$('[data-count]').filter((el) => !el.closest('.hero'));
    const splits = $$('[data-split]');

    if (!hasST || reduced) {
      reveals.forEach((el) => (el.style.opacity = '1'));
      groups.forEach((g) => $$(':scope > *', g).forEach((c) => (c.style.opacity = '1')));
      $$('.about__text .w').forEach((w) => (w.style.opacity = '1'));
      $$('.ch').forEach((c) => (c.style.transform = 'none'));
      runCounters(counters);
      return;
    }

    // Scroll progress bar.
    const progress = $('#progress span');
    if (progress) {
      gsap.to(progress, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });
    }

    // Headline characters.
    splits.forEach((el) => {
      const chars = $$('.ch', el);
      if (!chars.length) return;
      gsap.to(chars, {
        yPercent: 0, y: 0, duration: 1, ease: 'power4.out', stagger: 0.016,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    reveals.forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    groups.forEach((g) => {
      const kids = $$(':scope > *', g);
      const cards = g.dataset.revealGroup === 'cards';
      gsap.fromTo(kids,
        cards ? { opacity: 0, y: 56, rotate: -2, scale: 0.96 } : { opacity: 0, y: 18 },
        {
          opacity: 1, y: 0, rotate: 0, scale: 1, duration: cards ? 1.1 : 0.8, ease: cards ? 'power4.out' : 'power3.out',
          stagger: cards ? 0.09 : { each: 0.04, from: 'random' },
          scrollTrigger: { trigger: g, start: 'top 88%', once: true },
        });
    });

    counters.forEach((el) => {
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => runCounters([el]) });
    });

    // Word-by-word highlight on the about paragraph.
    const words = $$('.about__text .w');
    if (words.length) {
      gsap.to(words, {
        opacity: 1, stagger: 0.04, ease: 'none',
        scrollTrigger: { trigger: '.about__text', start: 'top 78%', end: 'bottom 50%', scrub: 0.6 },
      });
    }

    // Ghost section numbers drift as you scroll.
    $$('[data-parallax]').forEach((el) => {
      gsap.fromTo(el, { yPercent: 20 }, {
        yPercent: -30, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // Hero content lifts away as you leave it.
    gsap.to('.hero__inner', {
      yPercent: -8, opacity: 0.3, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    // Active nav link.
    $$('.nav__links a[data-nav]').forEach((link) => {
      const sec = $('#' + link.dataset.nav);
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onToggle: (self) => link.classList.toggle('is-active', self.isActive),
      });
    });
  }

  /* ------------------------------------------------------------------
     Pinned horizontal work gallery
     ------------------------------------------------------------------ */
  function initHorizontal() {
    const pin = $('#workPin');
    const track = $('#workTrack');
    const panels = $$('[data-panel]');
    if (!pin || !track || !panels.length) return;
    if (!hasST || reduced) { panels.forEach((p) => (p.style.opacity = '1')); return; }

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const bar = $('#workBar');
      const idx = $('#workIdx');
      const n = panels.length;

      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: () => '+=' + dist(),
          pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (bar) bar.style.transform = `scaleX(${self.progress})`;
            if (idx) idx.textContent = String(Math.min(n, Math.round(self.progress * (n - 1)) + 1)).padStart(2, '0');
          },
        },
      });

      panels.forEach((p) => {
        gsap.fromTo(p, { opacity: 0, scale: 0.94, x: 80 }, {
          opacity: 1, scale: 1, x: 0, ease: 'power2.out',
          scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 96%', end: 'left 62%', scrub: 0.4 },
        });
      });

      return () => panels.forEach((p) => gsap.set(p, { clearProps: 'all' }));
    });

    mm.add('(max-width: 1023px)', () => {
      panels.forEach((p) => {
        gsap.fromTo(p, { opacity: 0, y: 40 }, {
          opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: p, start: 'top 88%', once: true },
        });
      });
    });
  }

  /* ------------------------------------------------------------------
     Marquee that speeds up with scroll velocity
     ------------------------------------------------------------------ */
  function initMarquee() {
    const track = $('#marqueeTrack');
    if (!track || !hasGsap || reduced) return;
    let x = 0, lastY = window.scrollY, vel = 0;
    gsap.ticker.add((time, dt) => {
      const y = window.scrollY;
      vel += (Math.abs(y - lastY) - vel) * 0.12;
      lastY = y;
      const speed = 55 + Math.min(vel, 80) * 9;
      x -= speed * (dt / 1000);
      const half = track.scrollWidth / 2;
      if (half > 0 && -x >= half) x += half;
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    });
  }

  /* ------------------------------------------------------------------
     Navigation: scrolled state, hide-on-scroll-down, mobile menu
     ------------------------------------------------------------------ */
  const nav = $('#nav');
  const burger = $('#navBurger');
  const menu = $('#menu');
  let lastY = 0;

  function onScrollNav() {
    const y = window.scrollY || document.documentElement.scrollTop;
    nav.classList.toggle('is-scrolled', y > 24);
    if (!document.body.classList.contains('menu-open')) {
      nav.classList.toggle('is-hidden', y > lastY && y > 320);
    }
    lastY = y;
  }

  function openMenu() {
    document.body.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    menu.setAttribute('aria-hidden', 'false');
    nav.classList.remove('is-hidden');
    if (lenis) lenis.stop();
    const links = $$('.menu__links a');
    if (hasGsap && !reduced) {
      gsap.fromTo(links, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, delay: 0.3, ease: 'power3.out' });
    } else {
      links.forEach((l) => { l.style.opacity = '1'; l.style.transform = 'none'; });
    }
  }
  function closeMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    menu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
    if (hasGsap) gsap.set('.menu__links a', { opacity: 0, y: 24, delay: 0.7 });
  }
  if (burger) burger.addEventListener('click', () => (document.body.classList.contains('menu-open') ? closeMenu() : openMenu()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  if (nav) {
    window.addEventListener('scroll', onScrollNav, { passive: true });
    onScrollNav();
  }

  /* ------------------------------------------------------------------
     Custom cursor
     ------------------------------------------------------------------ */
  function initCursor() {
    const cursor = $('#cursor');
    if (!cursor || !finePointer || reduced || !hasGsap) { if (cursor) cursor.remove(); return; }
    const dot = $('.cursor__dot', cursor);
    const ring = $('.cursor__ring', cursor);
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    let shown = false;
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!shown) { shown = true; gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); }
      dotX(e.clientX); dotY(e.clientY); ringX(e.clientX); ringY(e.clientY);
      cursor.classList.remove('is-hidden');
    }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('mousedown', () => cursor.classList.add('is-down'));
    document.addEventListener('mouseup', () => cursor.classList.remove('is-down'));
    const hoverSel = 'a, button, [data-magnetic], .chip, .card';
    document.addEventListener('mouseover', (e) => { if (e.target.closest(hoverSel)) cursor.classList.add('is-hover'); });
    document.addEventListener('mouseout', (e) => { if (e.target.closest(hoverSel)) cursor.classList.remove('is-hover'); });
  }

  /* ------------------------------------------------------------------
     Magnetic buttons
     ------------------------------------------------------------------ */
  function initMagnetic() {
    if (!finePointer || reduced || !hasGsap) return;
    $$('[data-magnetic]').forEach((el) => {
      const strength = 0.28;
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ------------------------------------------------------------------
     Spotlight cards + 3D tilt
     ------------------------------------------------------------------ */
  function initCards() {
    if (!finePointer) return;
    $$('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
    if (reduced || !hasGsap) return;
    $$('[data-tilt]').forEach((el) => {
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
      gsap.set(el, { transformPerspective: 1200 });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rx(-py * 5); ry(px * 5);
      });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  /* ------------------------------------------------------------------
     Hero background: WebGL flow field
     ------------------------------------------------------------------ */
  function initShader() {
    const canvas = $('#heroGL');
    if (!canvas || reduced) return;
    let gl = null;
    try { gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' }); } catch { gl = null; }
    if (!gl) { canvas.remove(); return; }

    const vs = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    const fs = `
      precision mediump float;
      uniform vec2 r; uniform float t; uniform vec2 m;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
        return mix(mix(h(i), h(i+vec2(1.,0.)), f.x), mix(h(i+vec2(0.,1.)), h(i+vec2(1.,1.)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a*n(p); p = p*2.03 + vec2(1.7, 9.2); a *= .5; } return v; }
      void main(){
        vec2 uv = gl_FragCoord.xy / r;
        vec2 p = uv; p.x *= r.x / r.y;
        float tt = t * .055;
        vec2 q = vec2(fbm(p*1.5 + tt), fbm(p*1.5 + vec2(5.2, 1.3) - tt));
        float f = fbm(p*1.5 + 2.2*q + vec2(tt*.7, -tt*.4));
        vec3 bg = vec3(.027, .027, .035);
        vec3 vi = vec3(.545, .486, 1.0);
        vec3 li = vec3(.84, 1.0, .29);
        vec3 c = mix(bg, vi, smoothstep(.38, .95, f) * .40);
        c = mix(c, li, smoothstep(.62, 1.0, q.x * f * 1.45) * .26);
        vec2 asp = vec2(r.x / r.y, 1.);
        float d = distance(uv * asp, m * asp);
        c += li * .05 * smoothstep(.55, 0., d);
        c *= 1. - .55 * length(uv - vec2(.5, .45));
        gl_FragColor = vec4(c, 1.);
      }`;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
      return s;
    };
    const v = compile(gl.VERTEX_SHADER, vs), f = compile(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) { canvas.remove(); return; }
    const prog = gl.createProgram();
    gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const aLoc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't'), uM = gl.getUniformLocation(prog, 'm');

    let w = 1, h = 1, raf = 0, running = false;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const start = performance.now();

    function resize() {
      const scale = 0.5;
      w = Math.max(1, Math.round(canvas.clientWidth * scale));
      h = Math.max(1, Math.round(canvas.clientHeight * scale));
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    function frame(now) {
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      gl.uniform2f(uR, w, h);
      gl.uniform1f(uT, (now - start) / 1000);
      gl.uniform2f(uM, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (running) raf = requestAnimationFrame(frame);
    }
    const run = () => { if (running) return; running = true; raf = requestAnimationFrame(frame); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    window.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = 1 - (e.clientY - r.top) / r.height;
    }, { passive: true });
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
    resize();
    const io = new IntersectionObserver((es) => es.forEach((en) => (en.isIntersecting ? run() : stop())), { threshold: 0.02 });
    io.observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : run()));
  }

  /* ------------------------------------------------------------------
     Hero foreground: dot field that reacts to the cursor
     ------------------------------------------------------------------ */
  function initHeroCanvas() {
    const canvas = $('#heroCanvas');
    if (!canvas || reduced) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1, pts = [], raf = 0, running = false;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    const isMobile = window.matchMedia('(max-width: 860px)').matches;
    const GAP = isMobile ? 30 : 38;
    const RADIUS = isMobile ? 120 : 200;

    function build() {
      pts = [];
      const cols = Math.ceil(w / GAP) + 2, rows = Math.ceil(h / GAP) + 2;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const ox = i * GAP - GAP / 2, oy = j * GAP - GAP / 2;
          pts.push({ ox, oy, x: ox, y: oy });
        }
      }
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.14;
      mouse.y += (mouse.ty - mouse.y) * 0.14;
      const time = t * 0.001;
      for (let k = 0; k < pts.length; k++) {
        const p = pts[k];
        const dx = p.ox - mouse.x, dy = p.oy - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const near = d < RADIUS ? 1 - d / RADIUS : 0;
        const push = near * near * 48;
        const wave = Math.sin(p.ox * 0.018 + time * 0.9) * Math.cos(p.oy * 0.02 + time * 0.7);
        const tx = p.ox + (dx / d) * push;
        const ty = p.oy + (dy / d) * push + wave * 4;
        p.x += (tx - p.x) * 0.16;
        p.y += (ty - p.y) * 0.16;
        const alpha = 0.08 + near * 0.75 + (wave + 1) * 0.04;
        const size = 1 + near * 1.8;
        ctx.fillStyle = near > 0.02 ? `rgba(214,255,75,${alpha.toFixed(3)})` : `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      if (running) raf = requestAnimationFrame(draw);
    }
    function start() { if (running) return; running = true; raf = requestAnimationFrame(draw); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    window.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top;
    }, { passive: true });
    document.addEventListener('mouseleave', () => { mouse.tx = -9999; mouse.ty = -9999; });

    let resizeT;
    window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(resize, 120); });
    resize();

    const io = new IntersectionObserver((entries) => entries.forEach((en) => (en.isIntersecting ? start() : stop())), { threshold: 0.02 });
    io.observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  }

  /* ------------------------------------------------------------------
     Hero system card: rotating request log
     ------------------------------------------------------------------ */
  function initSysLog() {
    const log = $('#sysLog');
    if (!log || reduced) return;
    const LINES = [
      '<b>GET</b> /api/inventory/sku <i>tenant=zen</i> rbac=cached 18ms <b>200</b>',
      '<b>MIGRATE</b> 20240418_add_bom <i>zero-downtime</i> ok',
      '<b>PUT</b> /api/roles/42 <i>tenant=zen</i> cache=invalidated 9ms <b>204</b>',
      '<b>GET</b> /api/reports/yield <i>tenant=acme</i> rbac=cached 63ms <b>200</b>',
      '<b>SES</b> batch#513 rate=14/s <i>bounded pool</i> ok',
      '<b>POST</b> /api/orders <i>tenant=acme</i> rbac=cached 41ms <b>201</b>',
      '<b>HOOK</b> stripe.invoice.paid sig=ok <i>idempotent</i> 12ms <b>200</b>',
      '<b>JOB</b> verify-batch#512 workers=8 <i>8,000/day</i> done 2.1s',
      '<b>POST</b> /api/auth/refresh <i>tenant=acme</i> 7ms <b>200</b>',
      '<b>DEPLOY</b> api@3f2c1 <i>rolling</i> 0 dropped requests',
    ];
    let i = 0;
    const push = () => {
      if (document.hidden) return;
      const div = document.createElement('div');
      div.className = 'sys__line';
      div.innerHTML = LINES[i++ % LINES.length];
      log.appendChild(div);
      while (log.children.length > 3) log.removeChild(log.firstElementChild);
      if (hasGsap) gsap.from(div, { opacity: 0, y: 8, duration: 0.45, ease: 'power2.out' });
    };
    setInterval(push, 1800);
  }

  /* ------------------------------------------------------------------
     Live Codeforces rating + sparkline
     ------------------------------------------------------------------ */
  const CF_HANDLE = 'Moshiur_';
  const rankColor = (r) => {
    if (r < 1200) return '#8c8c8c';
    if (r < 1400) return '#3fbf3f';
    if (r < 1600) return '#22c7bb';
    if (r < 1900) return '#4a7cff';
    if (r < 2100) return '#c34ad6';
    if (r < 2400) return '#ff9a33';
    return '#ff4d4d';
  };

  async function initCodeforces() {
    const sparkEl = $('#cfSpark');
    const curEl = $('#cfCurrent');
    const peakEl = $('#cfPeak');
    const rankEl = $('#cfRank');
    const contestsEl = $('#cfContests');
    const liveEl = $('#cfLive');
    if (!sparkEl) return;

    const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
    const get = (url) => Promise.race([fetch(url).then((r) => r.json()), timeout(7000)]);

    try {
      const [info, hist] = await Promise.all([
        get(`https://codeforces.com/api/user.info?handles=${CF_HANDLE}`),
        get(`https://codeforces.com/api/user.rating?handle=${CF_HANDLE}`),
      ]);

      if (info && info.status === 'OK' && info.result && info.result[0]) {
        const u = info.result[0];
        if (curEl && typeof u.rating === 'number') curEl.textContent = fmt(u.rating);
        if (peakEl && typeof u.maxRating === 'number' && u.maxRating > 1864) { peakEl.dataset.count = String(u.maxRating); peakEl.dataset.counted = ''; runCounters([peakEl]); }
        if (rankEl && u.maxRank) {
          const label = u.maxRank.replace(/\b\w/g, (c) => c.toUpperCase());
          rankEl.innerHTML = `<span class="cp__rank-dot"></span>${label}`;
          rankEl.style.color = rankColor(u.maxRating || u.rating || 1864);
        }
      }

      if (hist && hist.status === 'OK' && Array.isArray(hist.result) && hist.result.length > 1) {
        drawSparkline(sparkEl, hist.result.map((c) => c.newRating));
        if (contestsEl) contestsEl.textContent = `${hist.result.length} rated contests`;
        const last = hist.result[hist.result.length - 1];
        if (liveEl && last && last.ratingUpdateTimeSeconds) {
          const d = new Date(last.ratingUpdateTimeSeconds * 1000);
          liveEl.textContent = `Live from Codeforces · last rated ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
        }
      } else {
        throw new Error('no history');
      }
    } catch {
      drawSparkline(sparkEl, [1200, 1260, 1330, 1290, 1410, 1480, 1450, 1560, 1620, 1700, 1664, 1790, 1864, 1800, 1740, 1690, 1617]);
      if (contestsEl) contestsEl.textContent = 'Rating history';
      if (liveEl) liveEl.textContent = 'Codeforces · Expert';
    }
  }

  function drawSparkline(svg, values) {
    const W = 600, H = 160, padX = 6, padT = 12, padB = 14;
    const min = Math.min(...values) - 40, max = Math.max(...values) + 40;
    const x = (i) => padX + (i / (values.length - 1)) * (W - padX * 2);
    const y = (v) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);

    const bands = [1200, 1400, 1600, 1900, 2100].filter((b) => b > min && b < max);
    const guides = bands.map((b) => `<line x1="0" x2="${W}" y1="${y(b).toFixed(1)}" y2="${y(b).toFixed(1)}" stroke="${rankColor(b)}" stroke-opacity="0.22" stroke-width="1" stroke-dasharray="3 5"/>` +
      `<text x="${W - 6}" y="${(y(b) - 4).toFixed(1)}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="9" fill="${rankColor(b)}" fill-opacity="0.7">${b}</text>`).join('');

    const pts = values.map((v, i) => [x(i), y(v)]);
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    const area = `${d} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;

    const peakIdx = values.indexOf(Math.max(...values));
    const [px, py] = pts[peakIdx];
    const [lx, ly] = pts[pts.length - 1];

    svg.innerHTML = `
      <defs>
        <linearGradient id="cfFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#d6ff4b" stop-opacity="0.35"/>
          <stop offset="1" stop-color="#d6ff4b" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${guides}
      <path class="cf-area" d="${area}" fill="url(#cfFill)" opacity="0"/>
      <path class="cf-line" d="${d}" fill="none" stroke="#d6ff4b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      <circle class="cf-peak" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="#ffc857" opacity="0"/>
      <text class="cf-peak" x="${(px + (peakIdx > values.length * 0.7 ? -8 : 8)).toFixed(1)}" y="${(py - 8).toFixed(1)}" text-anchor="${peakIdx > values.length * 0.7 ? 'end' : 'start'}" font-family="JetBrains Mono, monospace" font-size="10" fill="#ffc857" opacity="0">peak ${values[peakIdx]}</text>
      <circle class="cf-last" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="4" fill="#d6ff4b" opacity="0"/>
    `;

    const line = $('.cf-line', svg);
    const len = line.getTotalLength ? line.getTotalLength() : 2000;
    if (!hasGsap || reduced) {
      $$('.cf-area, .cf-peak, .cf-last', svg).forEach((n) => n.setAttribute('opacity', '1'));
      return;
    }
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
    const play = () => {
      gsap.timeline()
        .to(line, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut' })
        .to($('.cf-area', svg), { opacity: 1, duration: 0.8 }, '-=1.2')
        .to($$('.cf-peak, .cf-last', svg), { opacity: 1, duration: 0.5, stagger: 0.1 }, '-=0.6');
    };
    if (hasST) ScrollTrigger.create({ trigger: svg, start: 'top 85%', once: true, onEnter: play });
    else play();
  }

  /* ------------------------------------------------------------------
     Copy email, local time, year
     ------------------------------------------------------------------ */
  function initMisc() {
    const copyBtn = $('#copyEmail');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const email = copyBtn.dataset.email;
        try {
          await navigator.clipboard.writeText(email);
          copyBtn.classList.add('is-copied');
          $('.copy__text', copyBtn).textContent = 'Copied';
          setTimeout(() => { copyBtn.classList.remove('is-copied'); $('.copy__text', copyBtn).textContent = 'Copy'; }, 2000);
        } catch {
          window.location.href = `mailto:${email}`;
        }
      });
    }

    const timeEl = $('#localTime');
    if (timeEl) {
      const f = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: false });
      const tick = () => (timeEl.textContent = f.format(new Date()));
      tick(); setInterval(tick, 15000);
    }

    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function boot() {
    splitWords();
    splitChars();
    initCursor();
    initMagnetic();
    initCards();
    initShader();
    initHeroCanvas();
    initSysLog();
    initMarquee();
    initMisc();
    initScroll();
    initHorizontal();
    initCodeforces();
    initPreloader();
    if (hasST) {
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
      window.addEventListener('load', () => ScrollTrigger.refresh());
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
