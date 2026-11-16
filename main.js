/* Іван Бойко — landing interactions (vanilla, no deps) */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover)').matches;

  /* ---------- Reveal on scroll (y:60 → 0, fade) ---------- */
  const revealEls = [...document.querySelectorAll('[data-reveal]')];
  // stagger siblings that share a parent
  const groups = new Map();
  revealEls.forEach(el => {
    const g = groups.get(el.parentElement) || [];
    g.push(el); groups.set(el.parentElement, g);
  });
  groups.forEach(g => g.forEach((el, i) => el.style.setProperty('--d', `${Math.min(i, 4) * 0.08}s`)));

  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------- Letter-by-letter scroll fill ---------- */
  const fills = [...document.querySelectorAll('[data-fill]')].map(el => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    const frag = document.createDocumentFragment();
    // keep words together so wrapping stays natural
    text.split(/(\s+)/).forEach(part => {
      if (/^\s+$/.test(part)) { frag.append(document.createTextNode(part)); return; }
      const w = document.createElement('span');
      w.style.whiteSpace = 'nowrap';
      w.setAttribute('aria-hidden', 'true');
      [...part].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; w.append(s); });
      frag.append(w);
    });
    el.append(frag);
    return { el, chars: [...el.querySelectorAll('.ch')], lit: -1 };
  });

  const updateFills = () => {
    const vh = innerHeight;
    fills.forEach(f => {
      const r = f.el.getBoundingClientRect();
      // 0 when the block's top hits 85% of viewport, 1 when its bottom reaches 40%
      const start = vh * 0.85, end = vh * 0.4;
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height)));
      const n = reduce ? f.chars.length : Math.round(p * f.chars.length);
      if (n === f.lit) return;
      f.chars.forEach((c, i) => c.classList.toggle('on', i < n));
      f.lit = n;
    });
  };

  /* ---------- Marquees (ticker) ---------- */
  const marquees = [...document.querySelectorAll('.marquee')];
  const buildMarquee = m => {
    const track = m.querySelector('.marquee__track');
    if (!track.dataset.base) track.dataset.base = track.innerHTML;
    track.innerHTML = track.dataset.base;
    const base = [...track.children];
    let guard = 0;
    while (track.scrollWidth < m.clientWidth + 200 && guard++ < 20) base.forEach(n => track.append(n.cloneNode(true)));
    const setW = track.scrollWidth;
    [...track.children].forEach(n => { const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.append(c); });
    const speed = Number(m.dataset.speed || 50); // px / second
    track.style.setProperty('--dur', `${setW / speed}s`);
  };
  marquees.forEach(buildMarquee);

  /* ---------- Services: hover to expand ---------- */
  const svcs = [...document.querySelectorAll('.svc')];
  const openSvc = s => { if (s.classList.contains('is-open')) return; svcs.forEach(x => x.classList.toggle('is-open', x === s)); };
  svcs.forEach(s => {
    if (!s.querySelector('.svc__details')) return; // only rows with expanded content
    if (canHover) s.addEventListener('mouseenter', () => openSvc(s));
  });

  /* ---------- Testimonials: tap to flip on touch ---------- */
  document.querySelectorAll('.tcard').forEach(c => {
    c.addEventListener('click', () => { if (!canHover) c.classList.toggle('is-flipped'); });
    c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.classList.toggle('is-flipped'); } });
  });

  /* ---------- Pricing switch ---------- */
  const sw = document.querySelector('.switch');
  if (sw) {
    const opts = document.querySelectorAll('.billing__opt');
    const prices = document.querySelectorAll('[data-price]');
    const set = yearly => {
      sw.setAttribute('aria-checked', String(yearly));
      opts.forEach(o => o.classList.toggle('is-active', (o.dataset.opt === 'year') === yearly));
      prices.forEach(p => {
        const base = Number(p.dataset.price);
        p.textContent = yearly ? Math.round(base * 0.8) : base;
        p.classList.remove('tick'); void p.offsetWidth; p.classList.add('tick');
      });
    };
    sw.addEventListener('click', () => set(sw.getAttribute('aria-checked') !== 'true'));
    opts.forEach(o => { o.style.cursor = 'pointer'; o.addEventListener('click', () => set(o.dataset.opt === 'year')); });
  }

  /* ---------- FAQ: tabs + animated accordion ---------- */
  const tabs = [...document.querySelectorAll('.faq__tabs [role="tab"]')];
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.setAttribute('aria-selected', String(x === t)));
    document.querySelectorAll('.faq__panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === t.dataset.tab));
  }));
  document.querySelectorAll('.qa').forEach(d => {
    d.querySelector('summary').addEventListener('click', e => {
      e.preventDefault();
      if (d.open) {
        d.classList.remove('is-expanded');
        setTimeout(() => { if (!d.classList.contains('is-expanded')) d.open = false; }, reduce ? 0 : 450);
      } else {
        d.open = true;
        void d.offsetHeight; setTimeout(() => d.classList.add('is-expanded'), 16);
      }
    });
  });

  /* ---------- Mobile menu ---------- */
  const nav = document.querySelector('.nav');
  const burger = document.querySelector('.nav__burger');
  const menu = document.getElementById('mobile-menu');
  const closeMenu = () => { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); menu.hidden = true; };
  burger.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });

  /* ---------- Scroll / resize loop ---------- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { updateFills(); ticking = false; });
  };
  addEventListener('scroll', onScroll, { passive: true });
  let rw = innerWidth;
  addEventListener('resize', () => {
    onScroll();
    if (innerWidth !== rw) { rw = innerWidth; marquees.forEach(buildMarquee); }
  });
  updateFills();
})();
