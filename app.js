/* ============================================================
   Z22 - interactions: scroll reveal, count-ups, nav,
   strategy filter + accordion, mobile menu, legal modal
   ============================================================ */
(function () {
  /* ---- nav stuck state ---- */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('is-stuck', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- mobile menu ---- */
  const burger = document.querySelector('.nav__burger');
  const menu = document.querySelector('.mobile-menu');
  if (burger && menu) {
    const toggle = (open) => {
      menu.classList.toggle('open', open);
      burger.textContent = open ? 'Close' : 'Menu';
    };
    burger.addEventListener('click', () => toggle(!menu.classList.contains('open')));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggle(false)));
  }

  /* ---- scroll reveal ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---- count-ups ---- */
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const dur = 1300, start = performance.now();
    const dec = (el.dataset.count.split('.')[1] || '').length;
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(dec);
    }
    requestAnimationFrame(step);
  }
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

  /* ---- strategy accordion ---- */
  document.querySelectorAll('.strat').forEach(card => {
    const head = card.querySelector('.strat__row');
    head.addEventListener('click', () => {
      const open = card.classList.contains('is-open');
      // close siblings for a tidy single-open feel within a group
      card.closest('.strat-list').querySelectorAll('.strat.is-open').forEach(s => { if (s !== card) s.classList.remove('is-open'); });
      card.classList.toggle('is-open', !open);
    });
  });

  /* ---- strategy filters ---- */
  const chips = document.querySelectorAll('.chip[data-filter]');
  const cards = document.querySelectorAll('.strat');
  let active = 'all';
  function applyFilter() {
    cards.forEach(c => {
      const types = (c.dataset.types || '').split(' ');
      const show = active === 'all' || types.includes(active);
      c.classList.toggle('is-hidden', !show);
      if (!show) c.classList.remove('is-open');
    });
    // hide empty groups + update counts
    document.querySelectorAll('.strat-group').forEach(g => {
      const visible = g.querySelectorAll('.strat:not(.is-hidden)').length;
      g.style.display = visible ? '' : 'none';
      const cEl = g.querySelector('.count');
      if (cEl) cEl.textContent = String(visible).padStart(2, '0');
    });
  }
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    active = chip.dataset.filter;
    applyFilter();
  }));
  applyFilter();

  /* ---- reveal contact email only on "Contact us" click (legacy, guarded) ---- */
  const contactReveal = document.getElementById('contact-reveal');
  const contactEmail = document.getElementById('contact-email');
  if (contactReveal && contactEmail) {
    contactReveal.addEventListener('click', (e) => {
      e.preventDefault();
      contactEmail.classList.add('is-visible');
    });
  }

  /* ---- contact form -> prefilled mailto (no backend needed) ---- */
  const cform = document.getElementById('contact-form');
  if (cform) {
    cform.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
      const name = val('cf-name'), email = val('cf-email'), role = val('cf-role'), msg = val('cf-msg');
      const de = (document.documentElement.lang || 'en').toLowerCase().startsWith('de');
      const subject = (de ? 'Anfrage über die Website' : 'Website enquiry') + (name ? ' - ' + name : '');
      const body = de
        ? 'Name: ' + name + '\nE-Mail: ' + email + '\nIch bin: ' + role + '\n\n' + msg
        : 'Name: ' + name + '\nEmail: ' + email + '\nI am a: ' + role + '\n\n' + msg;
      window.location.href = 'mailto:hello@z22.ch?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }
})();
