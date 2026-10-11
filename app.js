(() => {
  'use strict';

  const W = 1600;
  const H = 1200;
  const CX = W / 2;
  const CY = H / 2;

  const canvas = document.getElementById('pide');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const FONTS = [
    { id: 'baloo', name: 'Baloo 2', css: (s) => `800 ${s}px "Baloo 2"` },
    { id: 'lobster', name: 'Lobster', css: (s) => `400 ${s}px Lobster` },
    { id: 'pacifico', name: 'Pacifico', css: (s) => `400 ${s}px Pacifico` },
    { id: 'dancing', name: 'Dancing Script', css: (s) => `700 ${s}px "Dancing Script"` },
    { id: 'titan', name: 'Titan One', css: (s) => `400 ${s}px "Titan One"` },
  ];

  const SHAPES = {
    oval: { rx: 700, ry: 490 },
    yuvarlak: { rx: 540, ry: 540 },
    uzun: { rx: 740, ry: 330 },
  };

  // ---------- helpers ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function newCanvas() {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return c;
  }

  function shapePath(g, shape, scale = 1) {
    const s = SHAPES[shape];
    g.beginPath();
    if (shape === 'uzun') {
      const w = s.rx * 2 * scale;
      const h = s.ry * 2 * scale;
      const r = h * 0.48;
      const x = CX - w / 2, y = CY - h / 2;
      g.moveTo(x + r, y);
      g.lineTo(x + w - r, y);
      g.quadraticCurveTo(x + w, y, x + w, y + r);
      g.lineTo(x + w, y + h - r);
      g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      g.lineTo(x + r, y + h);
      g.quadraticCurveTo(x, y + h, x, y + h - r);
      g.lineTo(x, y + r);
      g.quadraticCurveTo(x, y, x + r, y);
      g.closePath();
    } else {
      g.ellipse(CX, CY, s.rx * scale, s.ry * scale, 0, 0, Math.PI * 2);
    }
  }

  // Elliptical radial gradient fill (canvas gradients are circular, so we scale).
  function fillEllipticalGradient(g, rx, ry, stops, ox = 0, oy = 0) {
    g.save();
    g.translate(CX + ox, CY + oy);
    g.scale(1, ry / rx);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    for (const [o, c] of stops) grad.addColorStop(o, c);
    g.fillStyle = grad;
    g.fillRect(-rx * 1.5, -rx * 1.5, rx * 3, rx * 3);
    g.restore();
  }

  // Soft stroke made of layered strokes (avoids ctx.filter, which Safari lacks).
  function softStroke(g, pathFn, color, maxWidth, layers, alpha) {
    for (let i = layers; i >= 1; i--) {
      pathFn();
      g.lineWidth = (maxWidth * i) / layers;
      g.strokeStyle = color.replace('A', (alpha / layers * 1.6).toFixed(3));
      g.stroke();
    }
  }

  // ---------- pide base ----------
  function drawBase(opts) {
    const c = newCanvas();
    const g = c.getContext('2d');
    const rnd = mulberry32(opts.baseSeed);
    const s = SHAPES[opts.shape];

    // Shadow under the bread
    g.save();
    g.shadowColor = 'rgba(0,0,0,.6)';
    g.shadowBlur = 70;
    g.shadowOffsetY = 30;
    shapePath(g, opts.shape);
    g.fillStyle = '#7d3c12';
    g.fill();
    g.restore();

    g.save();
    shapePath(g, opts.shape);
    g.clip();

    // Crust colour
    fillEllipticalGradient(g, s.rx * 1.05, s.ry * 1.05, [
      [0, '#e8b064'],
      [0.5, '#d9953f'],
      [0.8, '#c0732b'],
      [0.94, '#9d531c'],
      [1, '#7a3a12'],
    ], -40, -30);

    // Darker toasted edge
    softStroke(g, () => shapePath(g, opts.shape), 'rgba(95,40,10,A)', 90, 10, 0.5);

    // Pressed centre (slightly flatter & darker)
    g.save();
    shapePath(g, opts.shape, 0.84);
    g.fillStyle = 'rgba(140,70,20,.10)';
    g.fill();
    g.restore();

    // Groove around the centre
    softStroke(g, () => shapePath(g, opts.shape, 0.84), 'rgba(90,40,10,A)', 34, 6, 0.55);
    g.save();
    g.translate(-3, -5);
    shapePath(g, opts.shape, 0.855);
    g.lineWidth = 6;
    g.strokeStyle = 'rgba(255,214,150,.35)';
    g.stroke();
    g.restore();

    // Lattice (kafes) pattern
    if (opts.lattice) {
      g.save();
      shapePath(g, opts.shape, 0.8);
      g.clip();
      const gap = 82;
      const span = Math.hypot(W, H);
      for (const ang of [0.6, -0.6]) {
        g.save();
        g.translate(CX, CY);
        g.rotate(ang);
        for (let k = -span / 2; k <= span / 2; k += gap) {
          const wob = () => {
            g.beginPath();
            const steps = 24;
            for (let i = 0; i <= steps; i++) {
              const x = -span / 2 + (span * i) / steps;
              const y = k + Math.sin(i * 0.9 + k) * 2.2;
              i ? g.lineTo(x, y) : g.moveTo(x, y);
            }
          };
          softStroke(g, wob, 'rgba(110,50,12,A)', 20, 4, 0.32);
          g.save();
          g.translate(0, 7);
          wob();
          g.lineWidth = 4;
          g.strokeStyle = 'rgba(255,220,160,.22)';
          g.stroke();
          g.restore();
        }
        g.restore();
      }
      g.restore();
    }

    // Toasted blisters
    for (let i = 0; i < 70; i++) {
      const a = rnd() * Math.PI * 2;
      const rr = 0.35 + Math.sqrt(rnd()) * 0.65;
      const x = CX + Math.cos(a) * s.rx * rr;
      const y = CY + Math.sin(a) * s.ry * rr;
      const r = 8 + rnd() * 30;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(120,55,15,${0.12 + rnd() * 0.18})`);
      grad.addColorStop(1, 'rgba(120,55,15,0)');
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Fine dough texture
    for (let i = 0; i < 9000; i++) {
      const x = CX + (rnd() * 2 - 1) * s.rx;
      const y = CY + (rnd() * 2 - 1) * s.ry;
      const light = rnd() < 0.5;
      g.fillStyle = light
        ? `rgba(255,232,180,${0.03 + rnd() * 0.07})`
        : `rgba(90,40,10,${0.03 + rnd() * 0.07})`;
      g.beginPath();
      g.arc(x, y, 0.8 + rnd() * 3, 0, Math.PI * 2);
      g.fill();
    }

    // Egg-wash gloss
    fillEllipticalGradient(g, s.rx * 0.75, s.ry * 0.55, [
      [0, 'rgba(255,245,220,.28)'],
      [0.5, 'rgba(255,240,210,.10)'],
      [1, 'rgba(255,240,210,0)'],
    ], -s.rx * 0.25, -s.ry * 0.3);

    g.restore();
    return c;
  }

  // ---------- seeds ----------
  function makeNigellaShapes(rnd, n) {
    const shapes = [];
    for (let k = 0; k < n; k++) {
      const j = () => (rnd() - 0.5) * 0.3;
      const pts = [
        [1 + j(), 0 + j()],
        [-0.35 + j(), 0.62 + j()],
        [-0.85 + j(), 0.1 + j()],
        [-0.5 + j(), -0.6 + j()],
      ].map(([x, y]) => [x, y * 0.78]);
      const body = new Path2D();
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const m0 = mid(pts[3], pts[0]);
      body.moveTo(m0[0], m0[1]);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const m = mid(p, pts[(i + 1) % pts.length]);
        body.quadraticCurveTo(p[0], p[1], m[0], m[1]);
      }
      body.closePath();
      const facet = new Path2D();
      facet.moveTo(pts[0][0] * 0.8, pts[0][1] * 0.8);
      facet.lineTo(pts[3][0] * 0.7, pts[3][1] * 0.7);
      facet.lineTo(-0.1, -0.05);
      facet.closePath();
      shapes.push({ body, facet });
    }
    return shapes;
  }

  const sesameBody = (() => {
    const p = new Path2D();
    p.moveTo(1, 0);
    p.bezierCurveTo(0.7, 0.62, -0.7, 0.6, -1, 0.05);
    p.bezierCurveTo(-0.8, -0.55, 0.6, -0.62, 1, 0);
    p.closePath();
    return p;
  })();

  function drawNigella(g, seed, shapes, extra) {
    const { x, y, size, rot, v } = seed;
    const sc = size * (extra ? extra.scale : 1);
    const cos = Math.cos(rot) * sc, sin = Math.sin(rot) * sc;
    const sh = shapes[v];
    // shadow on the crust
    g.setTransform(cos, sin, -sin, cos, x + size * 0.28, y + size * 0.38);
    g.fillStyle = 'rgba(80,32,6,.38)';
    g.fill(sh.body);
    g.setTransform(cos, sin, -sin, cos, x, y);
    g.fillStyle = '#17120f';
    g.fill(sh.body);
    g.fillStyle = 'rgba(120,112,105,.32)';
    g.fill(sh.facet);
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  function drawSesame(g, s) {
    const cos = Math.cos(s.rot) * s.size, sin = Math.sin(s.rot) * s.size;
    g.setTransform(cos, sin, -sin, cos, s.x + s.size * 0.25, s.y + s.size * 0.35);
    g.fillStyle = 'rgba(80,32,6,.3)';
    g.fill(sesameBody);
    g.setTransform(cos, sin, -sin, cos, s.x, s.y);
    g.fillStyle = s.toast;
    g.fill(sesameBody);
    g.lineWidth = 0.09;
    g.strokeStyle = 'rgba(140,95,40,.55)';
    g.stroke(sesameBody);
    g.fillStyle = 'rgba(255,255,240,.45)';
    g.beginPath();
    g.ellipse(0.15, -0.18, 0.45, 0.13, -0.1, 0, Math.PI * 2);
    g.fill();
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  // ---------- text mask & sampling ----------
  function layoutText(text, font, shape, sizePct) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return null;
    const m = newCanvas().getContext('2d');
    const probe = 200;
    m.font = font.css(probe);
    let maxW = 0;
    for (const l of lines) maxW = Math.max(maxW, m.measureText(l).width);
    const lh = 1.12;
    const s = SHAPES[shape];
    const boxW = s.rx * 2 * 0.7;
    const boxH = s.ry * 2 * 0.6;
    const fit = Math.min(boxW / maxW, boxH / (lines.length * lh));
    const size = Math.min(probe * fit, 380) * (sizePct / 100);
    return { lines, size, lh };
  }

  function buildMask(layout, font, opts, seedSpacing) {
    const c = newCanvas();
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.strokeStyle = '#fff';
    if (layout) {
      g.font = font.css(layout.size);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const total = layout.lines.length * layout.size * layout.lh;
      layout.lines.forEach((l, i) => {
        const y = CY - total / 2 + layout.size * layout.lh * (i + 0.5);
        g.fillText(l, CX, y);
      });
    }
    return c;
  }

  function buildBorderMask(opts, seedSpacing) {
    const c = newCanvas();
    const g = c.getContext('2d');
    shapePath(g, opts.shape, 0.92);
    g.lineWidth = seedSpacing * 1.6;
    g.strokeStyle = '#fff';
    g.stroke();
    return c;
  }

  function samplePoints(maskCanvas, spacing, rnd, outline) {
    const data = maskCanvas.getContext('2d', { willReadFrequently: true })
      .getImageData(0, 0, W, H).data;
    const inside = (x, y) => {
      x |= 0; y |= 0;
      return x >= 0 && y >= 0 && x < W && y < H && data[(y * W + x) * 4 + 3] > 127;
    };
    const step = spacing / 2.3;
    const ring = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ring.push([Math.cos(a) * spacing * 0.8, Math.sin(a) * spacing * 0.8]);
    }
    const cand = [];
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const px = x + rnd() * step;
        const py = y + rnd() * step;
        if (!inside(px, py)) continue;
        if (outline && ring.every(([dx, dy]) => inside(px + dx, py + dy))) continue;
        cand.push([px, py]);
      }
    }
    for (let i = cand.length - 1; i > 0; i--) {
      const j = (rnd() * (i + 1)) | 0;
      [cand[i], cand[j]] = [cand[j], cand[i]];
    }
    const cell = spacing;
    const gw = Math.ceil(W / cell);
    const grid = new Map();
    const out = [];
    const sp2 = spacing * spacing;
    for (const [x, y] of cand) {
      const gx = (x / cell) | 0, gy = (y / cell) | 0;
      let ok = true;
      for (let yy = gy - 1; yy <= gy + 1 && ok; yy++) {
        for (let xx = gx - 1; xx <= gx + 1 && ok; xx++) {
          const b = grid.get(yy * gw + xx);
          if (!b) continue;
          for (const p of b) {
            const dx = p[0] - x, dy = p[1] - y;
            if (dx * dx + dy * dy < sp2) { ok = false; break; }
          }
        }
      }
      if (!ok) continue;
      const key = gy * gw + gx;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push([x, y]);
      out.push([x, y]);
    }
    return out;
  }

  function scatterSesame(opts, rnd, avoid, count) {
    const s = SHAPES[opts.shape];
    const probe = newCanvas().getContext('2d');
    shapePath(probe, opts.shape, 0.95);
    const out = [];
    const tones = ['#f2dfae', '#ecd29a', '#f6e6bd', '#e3c27f'];
    let tries = 0;
    while (out.length < count && tries < count * 20) {
      tries++;
      const x = CX + (rnd() * 2 - 1) * s.rx;
      const y = CY + (rnd() * 2 - 1) * s.ry;
      if (!probe.isPointInPath(x, y)) continue;
      if (avoid(x, y)) continue;
      out.push({ x, y, size: 8 + rnd() * 3, rot: rnd() * Math.PI * 2, toast: tones[(rnd() * tones.length) | 0] });
    }
    return out;
  }

  // ---------- state & UI ----------
  const els = {
    text: document.getElementById('text'),
    fonts: document.getElementById('fonts'),
    density: document.getElementById('density'),
    seedSize: document.getElementById('seedSize'),
    textSize: document.getElementById('textSize'),
    outline: document.getElementById('outline'),
    border: document.getElementById('border'),
    lattice: document.getElementById('lattice'),
    sesame: document.getElementById('sesame'),
    animate: document.getElementById('animate'),
    reroll: document.getElementById('reroll'),
    download: document.getElementById('download'),
    share: document.getElementById('share'),
    toast: document.getElementById('toast'),
  };

  const state = { font: FONTS[0], scatterSeed: 1234, baseSeed: 77 };

  FONTS.forEach((f, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = 'Pide';
    b.title = f.name;
    b.style.font = f.css(20);
    b.setAttribute('aria-label', f.name);
    b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    b.addEventListener('click', () => {
      state.font = f;
      els.fonts.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      schedule(0);
    });
    els.fonts.appendChild(b);
  });

  function readOpts() {
    const d = +els.density.value / 100;
    const z = +els.seedSize.value / 100;
    const size = 5 + z * 6;
    return {
      text: els.text.value,
      shape: document.querySelector('input[name="shape"]:checked').value,
      spacing: size * (2.3 - d * 1.3),
      size,
      textSize: +els.textSize.value,
      outline: els.outline.checked,
      border: els.border.checked,
      lattice: els.lattice.checked,
      sesame: els.sesame.checked,
      animate: els.animate.checked,
      baseSeed: state.baseSeed,
    };
  }

  let baseCache = { key: '', canvas: null };
  function getBase(opts) {
    const key = `${opts.shape}|${opts.lattice}|${opts.baseSeed}`;
    if (baseCache.key !== key) baseCache = { key, canvas: drawBase(opts) };
    return baseCache.canvas;
  }

  let rafId = 0;
  let renderToken = 0;
  const nigellaShapes = makeNigellaShapes(mulberry32(9), 14);

  async function render(animate) {
    const token = ++renderToken;
    const opts = readOpts();
    try { await document.fonts.load(state.font.css(100), opts.text || 'a'); } catch (_) {}
    if (token !== renderToken) return;

    const rnd = mulberry32(state.scatterSeed);
    const layout = layoutText(opts.text, state.font, opts.shape, opts.textSize);
    const textPts = layout
      ? samplePoints(buildMask(layout, state.font, opts, opts.spacing), opts.spacing, rnd, opts.outline)
      : [];
    const borderPts = opts.border
      ? samplePoints(buildBorderMask(opts, opts.spacing), opts.spacing * 1.05, rnd, false)
      : [];

    const all = [];
    const jitterSize = () => opts.size * (0.8 + rnd() * 0.4);
    const lineCount = layout ? layout.lines.length : 1;
    const lineH = layout ? layout.size * layout.lh : 1;
    const top = layout ? CY - (lineCount * lineH) / 2 : 0;
    for (const [x, y] of textPts) {
      const line = Math.max(0, Math.min(lineCount - 1, Math.floor((y - top) / lineH)));
      all.push({ x, y, size: jitterSize(), rot: rnd() * Math.PI * 2, v: (rnd() * nigellaShapes.length) | 0, order: line * W + x + rnd() * 40 });
    }
    for (const [x, y] of borderPts) {
      const a = Math.atan2(y - CY, x - CX);
      all.push({ x, y, size: jitterSize(), rot: rnd() * Math.PI * 2, v: (rnd() * nigellaShapes.length) | 0, order: 1e6 + ((a + Math.PI * 1.5) % (Math.PI * 2)) * 1000 });
    }
    all.sort((a, b) => a.order - b.order);

    // Background layer: crust + sesame (sesame keeps clear of the writing)
    const layer = newCanvas();
    const lg = layer.getContext('2d');
    lg.drawImage(getBase(opts), 0, 0);
    if (opts.sesame) {
      const cell = 40;
      const occ = new Set();
      for (const p of all) occ.add(((p.y / cell) | 0) * 1000 + ((p.x / cell) | 0));
      const avoid = (x, y) => {
        const gx = (x / cell) | 0, gy = (y / cell) | 0;
        for (let yy = gy - 1; yy <= gy + 1; yy++)
          for (let xx = gx - 1; xx <= gx + 1; xx++)
            if (occ.has(yy * 1000 + xx)) return true;
        return false;
      };
      const area = SHAPES[opts.shape].rx * SHAPES[opts.shape].ry;
      for (const s of scatterSesame(opts, rnd, avoid, Math.round(area / 2600))) drawSesame(lg, s);
    }

    cancelAnimationFrame(rafId);
    if (!animate || !all.length) {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(layer, 0, 0);
      for (const s of all) drawNigella(ctx, s, nigellaShapes);
      return;
    }

    const total = Math.min(3200, Math.max(1100, all.length * 1.6));
    const fall = 380;
    all.forEach((s, i) => { s.delay = (i / all.length) * total + rnd() * 90; });
    let settled = 0;
    const start = performance.now();
    const frame = (now) => {
      const t = now - start;
      while (settled < all.length && t - all[settled].delay >= fall) {
        drawNigella(lg, all[settled], nigellaShapes);
        settled++;
      }
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(layer, 0, 0);
      for (let i = settled; i < all.length; i++) {
        const s = all[i];
        const p = (t - s.delay) / fall;
        if (p <= 0) break;
        const e = 1 - Math.pow(1 - p, 3);
        ctx.globalAlpha = Math.min(1, p * 2.5);
        drawNigella(ctx, { ...s, y: s.y - (1 - e) * 70, rot: s.rot - (1 - e) * 2 }, nigellaShapes, { scale: 1 + (1 - e) * 0.9 });
        ctx.globalAlpha = 1;
      }
      if (settled < all.length) rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);
  }

  let timer = 0;
  function schedule(delay = 220) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      render(els.animate.checked);
      saveHash();
    }, delay);
  }

  // ---------- URL share state ----------
  function saveHash() {
    const p = new URLSearchParams();
    p.set('y', els.text.value);
    p.set('f', state.font.id);
    p.set('p', document.querySelector('input[name="shape"]:checked').value);
    history.replaceState(null, '', '#' + p.toString());
  }

  function loadHash() {
    if (!location.hash) return;
    const p = new URLSearchParams(location.hash.slice(1));
    if (p.has('y')) els.text.value = p.get('y').slice(0, 60);
    const f = FONTS.find((x) => x.id === p.get('f'));
    if (f) {
      state.font = f;
      els.fonts.querySelectorAll('.chip').forEach((c, i) => c.setAttribute('aria-pressed', FONTS[i] === f ? 'true' : 'false'));
    }
    const sh = document.querySelector(`input[name="shape"][value="${CSS.escape(p.get('p') || '')}"]`);
    if (sh) sh.checked = true;
  }

  // ---------- export ----------
  function exportBlob() {
    // Finish any running animation instantly before exporting
    cancelAnimationFrame(rafId);
    return render(false).then(() => new Promise((res) => {
      const out = newCanvas();
      const g = out.getContext('2d');
      const grad = g.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#3a291d');
      grad.addColorStop(1, '#22170f');
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);
      g.drawImage(canvas, 0, 0);
      out.toBlob(res, 'image/png');
    }));
  }

  function fileName() {
    const slug = els.text.value.trim().toLocaleLowerCase('tr').replace(/\s+/g, '-').replace(/[^a-z0-9çğıöşü-]/g, '').slice(0, 30);
    return `pide-${slug || 'corek-otu'}.png`;
  }

  function toast(msg) {
    els.toast.textContent = msg;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (els.toast.textContent = ''), 2600);
  }

  els.download.addEventListener('click', async () => {
    const blob = await exportBlob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName();
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  els.share.addEventListener('click', async () => {
    saveHash();
    const url = location.href;
    try {
      const blob = await exportBlob();
      const file = new File([blob], fileName(), { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Çörek Otu Yazı', text: url });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: 'Çörek Otu Yazı', url });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Bağlantı kopyalandı.');
    } catch (_) {
      toast('Bağlantıyı adres çubuğundan kopyalayabilirsin.');
    }
  });

  els.reroll.addEventListener('click', () => {
    state.scatterSeed = (Math.random() * 1e9) | 0;
    state.baseSeed = (Math.random() * 1e9) | 0;
    schedule(0);
  });

  els.text.addEventListener('input', () => schedule());
  for (const el of [els.density, els.seedSize, els.textSize]) el.addEventListener('input', () => schedule(120));
  for (const el of [els.outline, els.border, els.lattice, els.sesame]) el.addEventListener('change', () => schedule(0));
  document.getElementById('shapes').addEventListener('change', () => schedule(0));

  loadHash();
  render(els.animate.checked);
})();
