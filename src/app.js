/* UI: stage player + catalog */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LEVELS = { 1: ['Beginner', '初級'], 2: ['Intermediate', '中級'], 3: ['Advanced', '上級'] };
  const CATS = { animals: ['Animals', '動物'], nature: ['Nature', '自然'], object: ['Objects', '物'], multi: ['Multi-component', '組'] };
  const SIDES = { one: ['One-sided', 'color + white'], two: ['Two-sided', 'both faces colored'] };
  const SHAPES_SHORT = { square: 'Square', a4: 'A4', '3x5': '3:5' };

  const compiled = new Map(MODELS.map((m) => [m.id, Fold.compileModel(m)]));

  /* ---------- drawing ---------- */
  function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function shadeHex(h, k) { const [r, g, b] = hexToRgb(h); const f = 1 - k; return `rgb(${(r * f) | 0},${(g * f) | 0},${(b * f) | 0})`; }
  const pathD = (poly) => 'M' + poly.map((p) => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('L') + 'Z';
  const mStr = (M) => `matrix(${M.map((n) => +n.toFixed(5)).join(' ')})`;

  function polyBox(poly) { return Fold.bbox(poly); }
  function boxesOverlap(a, b) { return a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3]; }

  function drawPaper(list, model, creases, pfx) {
    let s = '';
    list.forEach((d, i) => {
      const front = Fold.det(d.M) > 0;
      const base = front ? model.colors[0] : model.colors[1];
      const fill = d.shade ? shadeHex(base, 0.22 * d.shade) : base;
      const pb = polyBox(d.poly);
      const cs = creases.filter((c) => boxesOverlap(pb, Fold.bbox([c.a, c.b])));
      const id = `${pfx}c${i}`;
      s += `<g transform="${mStr(d.M)}">`;
      s += `<path d="${pathD(d.poly)}" fill="${fill}" class="facet"/>`;
      if (cs.length) {
        s += `<clipPath id="${id}"><path d="${pathD(d.poly)}"/></clipPath><g clip-path="url(#${id})">`;
        for (const c of cs) s += `<line x1="${c.a[0].toFixed(2)}" y1="${c.a[1].toFixed(2)}" x2="${c.b[0].toFixed(2)}" y2="${c.b[1].toFixed(2)}" class="crease"/>`;
        s += '</g>';
      }
      s += `<path d="${pathD(d.poly)}" fill="none" class="edge"/></g>`;
    });
    return s;
  }

  function drawMarks(marks, opacity = 1) {
    if (!marks) return '';
    return marks.map((k) => `<circle cx="${k.x}" cy="${k.y}" r="${k.r}" fill="#1b1a18" opacity="${opacity}"/>`).join('');
  }

  // Assembled Sonobe cube, isometric
  function drawCube(t = 1) {
    const s = 92, c30 = Math.cos(Math.PI / 6) * s, h = s / 2;
    const top = [[0, -s], [c30, -h], [0, 0], [-c30, -h]];
    const left = [[-c30, -h], [0, 0], [0, s], [-c30, h]];
    const right = [[0, 0], [c30, -h], [c30, h], [0, s]];
    const pal = ['#4f8f68', '#d9a441', '#3e5b82'];
    const tri = (pts, fill) => `<path d="${pathD(pts)}" fill="${fill}" class="facet"/>`;
    const face = (q, a, b, dark) =>
      tri([q[0], q[1], q[2]], shadeHex(a, dark)) + tri([q[0], q[2], q[3]], shadeHex(b, dark)) +
      `<path d="${pathD(q)}" fill="none" class="edge"/><line x1="${q[0][0]}" y1="${q[0][1]}" x2="${q[2][0]}" y2="${q[2][1]}" class="edge"/>`;
    const sc = 0.86 + 0.14 * t;
    return `<g transform="scale(${sc})" opacity="${t}">` + face(top, pal[0], pal[1], 0) + face(left, pal[1], pal[2], 0.12) + face(right, pal[2], pal[0], 0.24) + '</g>';
  }

  function svgFor(list, model, creases, box, pfx, marks) {
    const pad = Math.max(box[2] - box[0], box[3] - box[1]) * 0.1;
    return `<svg viewBox="${box[0] - pad} ${box[1] - pad} ${box[2] - box[0] + 2 * pad} ${box[3] - box[1] + 2 * pad}" aria-hidden="true"><g class="paper">${drawPaper(list, model, creases, pfx)}${drawMarks(marks)}</g></svg>`;
  }

  function thumb(c, i) {
    const last = c.steps[c.steps.length - 1];
    if (last.kind === 'note') return `<svg viewBox="-120 -120 240 240" aria-hidden="true"><g class="paper">${drawCube(1)}</g></svg>`;
    const marks = c.steps.map((s) => s.step.marks).filter(Boolean).pop();
    return svgFor(Fold.staticList(c.final), c.model, c.final.creases, Fold.stateBox(c.final), 't' + i, marks);
  }

  /* ---------- guides (fold line + arrow) ---------- */
  function clipLine(p, q, b) {
    // extend line p-q to the box b
    const dx = q[0] - p[0], dy = q[1] - p[1];
    let t0 = -1e9, t1 = 1e9;
    const chk = (num, den) => {
      if (Math.abs(den) < 1e-9) return num >= 0;
      const t = num / den;
      if (den > 0) t1 = Math.min(t1, t); else t0 = Math.max(t0, t);
      return true;
    };
    if (!chk(b[2] - p[0], dx) || !chk(p[0] - b[0], -dx) || !chk(b[3] - p[1], dy) || !chk(p[1] - b[1], -dy) || t0 > t1) return null;
    return [[p[0] + dx * t0, p[1] + dy * t0], [p[0] + dx * t1, p[1] + dy * t1]];
  }

  function arrowPath(from, to, bend, size, open) {
    const mx = (from[0] + to[0]) / 2, my = (from[1] + to[1]) / 2;
    const c = [mx + bend[0], my + bend[1]];
    const ang = Math.atan2(to[1] - c[1], to[0] - c[0]);
    const head = (pt, a) => {
      const l = [pt[0] - size * Math.cos(a - 0.42), pt[1] - size * Math.sin(a - 0.42)];
      const r = [pt[0] - size * Math.cos(a + 0.42), pt[1] - size * Math.sin(a + 0.42)];
      return `<path d="M${l[0]} ${l[1]}L${pt[0]} ${pt[1]}L${r[0]} ${r[1]}${open ? '' : 'Z'}" class="${open ? 'ahead open' : 'ahead'}"/>`;
    };
    return { body: `M${from[0]} ${from[1]}Q${c[0]} ${c[1]} ${to[0]} ${to[1]}`, head: head(to, ang), c, headAt: head };
  }

  function guidesFor(cs) {
    const b = Fold.stateBox(cs.before);
    const size = Math.max(b[2] - b[0], b[3] - b[1]);
    const out = [];
    if (cs.kind === 'fold' || cs.kind === 'crease') {
      const eb = [b[0] - size * 0.06, b[1] - size * 0.06, b[2] + size * 0.06, b[3] + size * 0.06];
      cs.ops.forEach((op, oi) => {
        const seg = clipLine(op.line[0], op.line[1], eb);
        const moved = cs.pieces.filter((f) => f.moves.length && f.moves[0].oi === oi);
        let ax = 0, ay = 0, aw = 0;
        for (const f of moved) {
          const vp = f.poly.map((v) => Fold.ap(f.M0, v));
          const a = Math.abs(vp.reduce((s, p, i) => { const n = vp[(i + 1) % vp.length]; return s + p[0] * n[1] - n[0] * p[1]; }, 0)) / 2;
          const c = vp.reduce((s, p) => [s[0] + p[0] / vp.length, s[1] + p[1] / vp.length], [0, 0]);
          ax += c[0] * a; ay += c[1] * a; aw += a;
        }
        let arrow = null;
        if (aw > 0) {
          const from = [ax / aw, ay / aw];
          const to = Fold.ap(Fold.reflect(op.line[0], op.line[1]), from);
          const dist = Math.hypot(to[0] - from[0], to[1] - from[1]);
          if (dist > size * 0.04) {
            let ux = op.line[1][0] - op.line[0][0], uy = op.line[1][1] - op.line[0][1];
            const L = Math.hypot(ux, uy); ux /= L; uy /= L;
            // bend toward the outside of the paper
            const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
            const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
            const sgn = (mid[0] - cx) * ux + (mid[1] - cy) * uy >= 0 ? 1 : -1;
            const k = Math.min(dist * 0.32, size * 0.22);
            arrow = arrowPath(from, to, [ux * k * sgn, uy * k * sgn], size * 0.045, op.dir === 'mountain');
            arrow.from = from;
          }
        }
        out.push({ seg, dir: op.dir, arrow, unfold: op.unfold });
      });
    } else if (cs.kind === 'flip' || cs.kind === 'rotate') {
      const cx = (b[0] + b[2]) / 2, w = b[2] - b[0];
      const y = b[3] + size * 0.1;
      const from = [cx - Math.max(w, size * 0.5) * 0.32, y], to = [cx + Math.max(w, size * 0.5) * 0.32, y];
      const arrow = arrowPath(from, to, [0, size * 0.14], size * 0.045, false);
      out.push({ seg: null, arrow, flip: true });
    }
    return out;
  }

  function drawGuides(guides, op) {
    if (!guides.length || op <= 0) return '';
    let s = `<g opacity="${op.toFixed(3)}">`;
    for (const g of guides) {
      if (g.seg) s += `<line x1="${g.seg[0][0]}" y1="${g.seg[0][1]}" x2="${g.seg[1][0]}" y2="${g.seg[1][1]}" class="gline ${g.dir}"/>`;
      if (g.arrow) {
        s += `<path d="${g.arrow.body}" class="abody"/>` + g.arrow.head;
        if (g.unfold) {
          const a = Math.atan2(g.arrow.from[1] - g.arrow.c[1], g.arrow.from[0] - g.arrow.c[0]);
          s += g.arrow.headAt(g.arrow.from, a);
        }
      }
    }
    return s + '</g>';
  }

  /* ---------- player ---------- */
  const stageSvg = $('#stage-svg');
  const player = { c: null, i: 0, t0: 0, raf: 0, loop: false, slow: false, box: null, fromBox: null, guides: [], done: false, holdUntil: 0 };

  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  function timing(cs) {
    switch (cs.kind) {
      case 'fold': return { pre: 550, move: 1500, hold: 0, back: 0, post: 450 };
      case 'crease': return { pre: 550, move: 1050, hold: 200, back: 1000, post: 300 };
      case 'flip': return { pre: 400, move: 1350, hold: 0, back: 0, post: 300 };
      case 'rotate': return { pre: 300, move: 1000, hold: 0, back: 0, post: 250 };
      default: return { pre: 0, move: 800, hold: 0, back: 0, post: 200 };
    }
  }

  function padBox(b, cs) {
    const w = b[2] - b[0], h = b[3] - b[1], s = Math.max(w, h, 60);
    const extra = cs.kind === 'flip' || cs.kind === 'rotate' ? 0.28 : 0.16;
    return [b[0] - s * 0.16, b[1] - s * 0.16, b[2] + s * 0.16, b[3] + s * extra];
  }

  function pillText(cs, i) {
    if (i === 0) return cs.step && player.c.model.sides === 'two' ? 'Both faces colored' : 'One face colored, one white';
    const op = cs.ops && cs.ops[0];
    if (cs.kind === 'fold') return op.dir === 'mountain' ? 'Mountain fold' : 'Valley fold';
    if (cs.kind === 'crease') return 'Fold and unfold';
    if (cs.kind === 'flip') return 'Turn over';
    if (cs.kind === 'rotate') return 'Rotate';
    if (cs.kind === 'note') return 'Assemble';
    return '';
  }

  function render(now) {
    const c = player.c, cs = c.steps[player.i], T = timing(cs);
    const sp = player.slow ? 1.8 : 1;
    let t = (now - player.t0) / sp;
    if (reduced) t = 1e9;
    const total = T.pre + T.move + T.hold + T.back + T.post;
    let theta, gOp, markOp = 0;
    if (t < T.pre) { theta = 0; gOp = t / T.pre; }
    else if (t < T.pre + T.move) { theta = Math.PI * ease((t - T.pre) / T.move); gOp = 1; }
    else if (t < T.pre + T.move + T.hold) { theta = Math.PI; gOp = 1; }
    else if (t < T.pre + T.move + T.hold + T.back) { theta = Math.PI * (1 - ease((t - T.pre - T.move - T.hold) / T.back)); gOp = 1; }
    else { theta = cs.kind === 'crease' ? 0 : Math.PI; gOp = 1 - clamp01((t - (total - T.post)) / T.post); markOp = clamp01((t - (total - T.post)) / T.post); }

    // camera
    const k = reduced ? 1 : ease(clamp01((now - player.t0) / 500));
    const vb = player.box.map((v, j) => player.fromBox[j] + (v - player.fromBox[j]) * k);
    player.view = vb;
    stageSvg.setAttribute('viewBox', [vb[0], vb[1], vb[2] - vb[0], vb[3] - vb[1]].map((n) => n.toFixed(2)).join(' '));

    let body;
    if (cs.kind === 'note') {
      body = drawCube(ease(clamp01(t / T.move)));
    } else {
      const ended = t >= total;
      const list = ended ? Fold.staticList(cs.after) : Fold.frame(cs, theta);
      const creases = ended || (cs.kind !== 'crease' && theta >= Math.PI) ? cs.after.creases : cs.before.creases;
      body = drawPaper(list, c.model, creases, 's') + drawMarks(cs.step.marks, ended ? 1 : markOp);
    }
    $('#stage-paper').innerHTML = body;
    $('#stage-guides').innerHTML = reduced ? drawGuides(player.guides, 0.85) : drawGuides(player.guides, gOp * 0.95);

    $('#anim-fill').style.transform = `scaleX(${clamp01(t / total).toFixed(4)})`;
    if (t < total) { player.raf = requestAnimationFrame(render); return; }
    player.done = true;
    if (!player.advanced && player.i < player.c.steps.length - 1) $('#next').classList.add('ready');
    if (player.loop && !reduced) {
      if (!player.holdUntil) player.holdUntil = now + 900;
      if (now >= player.holdUntil) { playStep(player.i); return; }
      player.raf = requestAnimationFrame(render);
    }
  }

  function playStep(i) {
    const c = player.c;
    cancelAnimationFrame(player.raf);
    player.i = Math.max(0, Math.min(c.steps.length - 1, i));
    const cs = c.steps[player.i];
    player.fromBox = player.view || padBox(cs.box, cs);
    player.box = padBox(cs.box, cs);
    if (cs.kind === 'note') player.box = [-150, -150, 150, 150];
    player.guides = cs.kind === 'note' ? [] : guidesFor(cs);
    player.done = false;
    player.holdUntil = 0;
    player.t0 = performance.now();
    $('#next').classList.remove('ready');
    updatePanel();
    player.raf = requestAnimationFrame(render);
  }

  function loadModel(id, step = 0) {
    const c = compiled.get(id) || compiled.values().next().value;
    player.c = c;
    player.view = null;
    const m = c.model;
    $('#m-name').textContent = m.name;
    $('#m-jp').textContent = m.jp;
    $('#p-name').textContent = m.name;
    $('#p-blurb').textContent = m.blurb;
    const lv = LEVELS[m.difficulty];
    $('#p-meta').innerHTML = [
      `<span class="tag"><span class="lvl" data-l="${m.difficulty}" aria-hidden="true"><i></i><i></i><i></i></span>${lv[0]}</span>`,
      `<span class="tag">${Fold.SHAPES[m.shape].label}</span>`,
      `<span class="tag"><span class="sw" style="background:${m.colors[0]}"></span><span class="sw" style="background:${m.colors[1]}"></span>${SIDES[m.sides][0]}</span>`,
      m.sheets ? `<span class="tag">${m.sheets} sheets</span>` : '',
    ].join('');
    player.page = 0;
    $$('.card').forEach((el) => el.setAttribute('aria-current', el.dataset.id === m.id ? 'true' : 'false'));
    try { if (location.hash.slice(1) !== m.id) history.replaceState(null, '', '#' + m.id); } catch (e) { /* hash is a convenience */ }
    playStep(step);
  }

  function updatePanel() {
    const c = player.c, n = c.steps.length, cs = c.steps[player.i];
    $('#s-num').textContent = player.i + 1;
    $('#s-total').textContent = n;
    $('#s-text').textContent = cs.step.text;
    $('#pill').textContent = pillText(cs, player.i);
    $('#prev').disabled = player.i === 0;
    $('#next-lbl').textContent = player.i === n - 1 ? 'Start over' : 'Next step';
    player.page = Math.floor(player.i / pageSize());
    renderSteps();
  }

  // Step numbers are shown a page at a time so long models stay on one line
  const narrow = matchMedia('(max-width: 820px)');
  const pageSize = () => (narrow.matches ? 7 : 10);
  function renderSteps() {
    const n = player.c.steps.length, size = pageSize();
    const pages = Math.ceil(n / size);
    player.page = Math.max(0, Math.min(pages - 1, player.page));
    const from = player.page * size, to = Math.min(n, from + size);
    let s = '';
    if (pages > 1) s += `<button type="button" class="pg" data-pg="-1" aria-label="Show steps ${Math.max(1, from - size + 1)}–${from}"${player.page === 0 ? ' disabled' : ''}>‹</button><span class="pg-gap"></span>`;
    for (let k = from; k < to; k++) {
      s += `<button type="button" class="sn${k < player.i ? ' past' : ''}" data-k="${k}" aria-label="Go to step ${k + 1}" aria-current="${k === player.i ? 'step' : 'false'}">${k + 1}</button>`;
    }
    if (pages > 1) s += `<span class="pg-gap"></span><button type="button" class="pg" data-pg="1" aria-label="Show steps ${to + 1}–${Math.min(n, to + size)}"${player.page === pages - 1 ? ' disabled' : ''}>›</button>`;
    $('#dots').innerHTML = s;
  }
  narrow.addEventListener('change', () => { if (player.c) { player.page = Math.floor(player.i / pageSize()); renderSteps(); } });

  /* ---------- catalog ---------- */
  const filters = { difficulty: new Set(), shape: new Set(), sides: new Set(), category: new Set() };
  const groups = [
    ['difficulty', 'Difficulty', Object.entries(LEVELS).map(([k, v]) => [k, v[0], v[1]])],
    ['shape', 'Paper shape', Object.keys(Fold.SHAPES).map((k) => [k, Fold.SHAPES[k].label, ''])],
    ['sides', 'Paper color', Object.entries(SIDES).map(([k, v]) => [k, v[0], v[1]])],
    ['category', 'Category', Object.entries(CATS).map(([k, v]) => [k, v[0], v[1]])],
  ];

  function buildFilters() {
    $('#filters').innerHTML = groups.map(([key, label, opts]) => `
      <div class="fgroup" role="group" aria-label="${label}">
        <span class="flabel">${label}</span>
        <div class="chips">${opts.map(([v, l, sub]) => {
          const count = MODELS.filter((m) => String(m[key]) === v).length;
          return `<button type="button" class="chip" data-key="${key}" data-v="${v}" aria-pressed="false"${count ? '' : ' disabled'}>${l}${sub ? `<small>${sub}</small>` : ''}<span class="cnt">${count}</span></button>`;
        }).join('')}</div>
      </div>`).join('');
  }

  function matchesModel(m, q) {
    for (const [key] of groups) if (filters[key].size && !filters[key].has(String(m[key]))) return false;
    if (!q) return true;
    const hay = [m.name, m.jp, m.blurb, m.keywords, CATS[m.category][0], LEVELS[m.difficulty][0], Fold.SHAPES[m.shape].label].join(' ').toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  }

  function buildCards() {
    $('#grid').innerHTML = MODELS.map((m, i) => {
      const c = compiled.get(m.id);
      return `<button type="button" class="card" data-id="${m.id}" aria-current="false">
        <span class="thumb">${thumb(c, i)}</span>
        <span class="card-body">
          <span class="card-title"><span class="cname">${m.name}</span><span class="cjp" lang="ja">${m.jp}</span></span>
          <span class="card-meta">
            <span class="lvl" data-l="${m.difficulty}" title="${LEVELS[m.difficulty][0]}"><i></i><i></i><i></i></span>
            <span>${LEVELS[m.difficulty][0]}</span><span class="sep">·</span>
            <span>${c.steps.length} steps</span><span class="sep">·</span>
            <span>${SHAPES_SHORT[m.shape]}</span>
            ${m.sides === 'two' ? '<span class="two" title="Needs paper colored on both sides">2-sided</span>' : ''}
          </span>
        </span>
      </button>`;
    }).join('');
  }

  function applyFilters() {
    const q = $('#q').value.trim().toLowerCase();
    let n = 0;
    $$('.card').forEach((el) => {
      const ok = matchesModel(MODELS.find((m) => m.id === el.dataset.id), q);
      el.hidden = !ok;
      if (ok) n++;
    });
    const active = q || Object.values(filters).some((s) => s.size);
    $('#count').textContent = `${n} ${n === 1 ? 'model' : 'models'}`;
    $('#clear').hidden = !active;
    $('#empty').hidden = n > 0;
    try { localStorage.setItem('ichimai.filters', JSON.stringify(Object.fromEntries(Object.entries(filters).map(([k, s]) => [k, [...s]])))); } catch (e) { /* optional */ }
  }

  /* ---------- wire up ---------- */
  buildFilters();
  buildCards();
  try {
    const saved = JSON.parse(localStorage.getItem('ichimai.filters') || 'null');
    if (saved) for (const k in saved) if (filters[k]) saved[k].forEach((v) => filters[k].add(v));
  } catch (e) { /* optional */ }
  $$('.chip').forEach((b) => b.setAttribute('aria-pressed', filters[b.dataset.key].has(b.dataset.v)));
  applyFilters();

  $('#filters').addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    const set = filters[b.dataset.key];
    set.has(b.dataset.v) ? set.delete(b.dataset.v) : set.add(b.dataset.v);
    b.setAttribute('aria-pressed', set.has(b.dataset.v));
    applyFilters();
  });
  $('#q').addEventListener('input', applyFilters);
  const clearAll = () => {
    Object.values(filters).forEach((s) => s.clear());
    $$('.chip').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    $('#q').value = '';
    applyFilters();
  };
  $('#clear').addEventListener('click', clearAll);
  $('#empty-clear').addEventListener('click', clearAll);
  $('#grid').addEventListener('click', (e) => {
    const card = e.target.closest('.card'); if (!card) return;
    loadModel(card.dataset.id);
  });
  $('#dots').addEventListener('click', (e) => {
    const p = e.target.closest('.pg');
    if (p) { player.page += +p.dataset.pg; renderSteps(); $(`#dots .pg[data-pg="${p.dataset.pg}"]`)?.focus(); return; }
    const d = e.target.closest('.sn'); if (d) playStep(+d.dataset.k);
  });
  $('#prev').addEventListener('click', () => playStep(player.i - 1));
  $('#next').addEventListener('click', () => { player.advanced = true; playStep(player.i + 1 < player.c.steps.length ? player.i + 1 : 0); });
  $('#replay').addEventListener('click', () => playStep(player.i));
  $('#loop').addEventListener('change', (e) => { player.loop = e.target.checked; if (player.loop && player.done) playStep(player.i); });
  $('#slow').addEventListener('change', (e) => { player.slow = e.target.checked; });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea') && e.target.type !== 'checkbox') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); player.advanced = true; playStep(player.i + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); playStep(player.i - 1); }
    else if (e.key === 'r' || e.key === 'R') playStep(player.i);
    else if (e.key === 'l' || e.key === 'L') { const l = $('#loop'); l.checked = !l.checked; l.dispatchEvent(new Event('change')); }
    else if (e.key === '/') { e.preventDefault(); $('#q').focus(); }
  });

  const fromHash = location.hash.slice(1);
  loadModel(compiled.has(fromHash) ? fromHash : 'dog-face');
})();
