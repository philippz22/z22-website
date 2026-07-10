/* ============================================================
   Z22 hero - three toggleable animated directions
   "signal"  : systematic trend signals (smooth multi-line field)
   "lattice" : connected particle lattice with a propagating wave
   "grid"    : Swiss grid with a scanning column + node pulses
   Reads --ink / --accent live so it follows theme + accent tweaks.
   ============================================================ */
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1;
  let mode = document.documentElement.getAttribute('data-hero') || 'signal';
  let t = 0, raf = null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cssColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#111';
  }
  function withAlpha(c, a) {
    // c is oklch(...) or hex; wrap via color-mix to apply alpha reliably
    return `color-mix(in oklab, ${c} ${Math.round(a * 100)}%, transparent)`;
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  /* ---------- mode: signal ---------- */
  const lines = [];
  function initSignal() {
    lines.length = 0;
    const N = 7;
    for (let i = 0; i < N; i++) {
      lines.push({
        baseY: 0.18 + (i / (N - 1)) * 0.64,
        amp: 0.03 + Math.random() * 0.06,
        freq: 1.1 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.12 + Math.random() * 0.22,
        drift: (Math.random() - 0.5) * 0.04,
        accent: i === Math.floor(N / 2)
      });
    }
  }
  function drawSignal() {
    const ink = cssColor('--ink'), accent = cssColor('--accent');
    const steps = 80;
    lines.forEach((ln, li) => {
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const x = (s / steps) * W;
        const u = s / steps;
        const y = (ln.baseY
          + Math.sin(u * ln.freq * Math.PI * 2 + ln.phase + t * ln.speed) * ln.amp
          + Math.sin(u * ln.freq * 0.5 * Math.PI * 2 - t * ln.speed * 0.6) * ln.amp * 0.5
          + ln.drift * Math.sin(t * 0.1 + li)) * H;
        s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineWidth = ln.accent ? 1.6 : 1;
      ctx.strokeStyle = ln.accent ? withAlpha(accent, 0.9) : withAlpha(ink, 0.16);
      ctx.stroke();
      // moving probe dot on accent line
      if (ln.accent) {
        const u = (t * 0.06) % 1;
        const x = u * W;
        const y = (ln.baseY
          + Math.sin(u * ln.freq * Math.PI * 2 + ln.phase + t * ln.speed) * ln.amp
          + Math.sin(u * ln.freq * 0.5 * Math.PI * 2 - t * ln.speed * 0.6) * ln.amp * 0.5) * H;
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = accent; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = withAlpha(accent, 0.4); ctx.lineWidth = 1; ctx.stroke();
      }
    });
  }

  /* ---------- mode: lattice ---------- */
  let pts = [];
  function initLattice() {
    pts = [];
    const gap = 64;
    const cols = Math.ceil(W / gap) + 1;
    const rows = Math.ceil(H / gap) + 1;
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++)
        pts.push({ ox: i * gap, oy: j * gap, x: 0, y: 0 });
  }
  function drawLattice() {
    const ink = cssColor('--ink'), accent = cssColor('--accent');
    const cx = W * (0.5 + 0.32 * Math.sin(t * 0.18));
    const cy = H * (0.5 + 0.28 * Math.cos(t * 0.13));
    for (const p of pts) {
      const dx = p.ox - cx, dy = p.oy - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      const wave = Math.sin(d * 0.012 - t * 0.9) * 9;
      p.x = p.ox + (dx / (d + 1)) * wave;
      p.y = p.oy + (dy / (d + 1)) * wave;
    }
    // connections
    const gap = 64, maxd = gap * 1.5;
    ctx.lineWidth = 1;
    for (let a = 0; a < pts.length; a++) {
      for (let b = a + 1; b < pts.length; b++) {
        const A = pts[a], B = pts[b];
        const ddx = A.x - B.x, ddy = A.y - B.y;
        const dd = ddx * ddx + ddy * ddy;
        if (dd < maxd * maxd) {
          const al = (1 - Math.sqrt(dd) / maxd) * 0.14;
          ctx.strokeStyle = withAlpha(ink, al);
          ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
        }
      }
    }
    // nodes
    for (const p of pts) {
      const dd = Math.hypot(p.ox - cx, p.oy - cy);
      const near = dd < 130;
      ctx.beginPath(); ctx.arc(p.x, p.y, near ? 2.4 : 1.3, 0, Math.PI * 2);
      ctx.fillStyle = near ? withAlpha(accent, 0.95) : withAlpha(ink, 0.32);
      ctx.fill();
    }
  }

  /* ---------- mode: grid ---------- */
  function drawGrid() {
    const ink = cssColor('--ink'), accent = cssColor('--accent');
    const cols = 14;
    const cw = W / cols;
    // vertical hairlines
    ctx.lineWidth = 1;
    for (let i = 0; i <= cols; i++) {
      ctx.strokeStyle = withAlpha(ink, 0.07);
      ctx.beginPath(); ctx.moveTo(i * cw, 0); ctx.lineTo(i * cw, H); ctx.stroke();
    }
    const rows = Math.round(H / cw);
    const rh = H / rows;
    for (let j = 0; j <= rows; j++) {
      ctx.strokeStyle = withAlpha(ink, 0.05);
      ctx.beginPath(); ctx.moveTo(0, j * rh); ctx.lineTo(W, j * rh); ctx.stroke();
    }
    // scanning column highlight
    const scan = (t * 0.05) % 1;
    const sc = Math.floor(scan * cols);
    ctx.fillStyle = withAlpha(accent, 0.06);
    ctx.fillRect(sc * cw, 0, cw, H);
    // node pulses on a few intersections
    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        const seed = (i * 13 + j * 7) % 11;
        const pulse = Math.sin(t * 0.8 + seed * 1.3);
        if (pulse > 0.86) {
          const r = (pulse - 0.86) / 0.14;
          ctx.beginPath(); ctx.arc(i * cw, j * rh, 2 + r * 2, 0, Math.PI * 2);
          ctx.fillStyle = withAlpha(accent, 0.5 + r * 0.4); ctx.fill();
        } else if (i === sc) {
          ctx.beginPath(); ctx.arc(i * cw, j * rh, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = withAlpha(accent, 0.6); ctx.fill();
        }
      }
    }
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    if (mode === 'lattice') drawLattice();
    else if (mode === 'grid') drawGrid();
    else drawSignal();
    t += 0.16;
    raf = requestAnimationFrame(frame);
  }

  function rebuild() {
    if (mode === 'lattice') initLattice();
    else if (mode === 'signal') initSignal();
  }

  function start() {
    resize(); rebuild();
    if (reduce) { ctx.clearRect(0, 0, W, H); t = 30; (mode === 'lattice' ? drawLattice : mode === 'grid' ? drawGrid : drawSignal)(); return; }
    if (raf) cancelAnimationFrame(raf);
    frame();
  }

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(start, 150); });

  window.heroSetPaused = function (paused) {
    if (paused) { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    else if (!raf && !reduce) frame();
  };

  // react to tweak changes
  window.setHeroMode = function (m) {
    mode = m;
    document.documentElement.setAttribute('data-hero', m);
    rebuild();
    if (reduce) { ctx.clearRect(0, 0, W, H); (mode === 'lattice' ? drawLattice : mode === 'grid' ? drawGrid : drawSignal)(); }
  };

  start();
})();
