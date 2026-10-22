/* Fold engine
   Paper is a set of flat convex facets. Each facet keeps its polygon in paper
   coordinates plus an affine matrix (paper -> view). A fold reflects the facets
   on one side of a line; the in-between frames use a partial reflection
   (perpendicular distance scaled by cos θ), which is a projected 3D hinge. */
const Fold = (() => {
  const EPS = 1e-6;
  const BIG = 1e6;

  // SVG-style matrix [a,b,c,d,e,f]: x' = a x + c y + e, y' = b x + d y + f
  const I = [1, 0, 0, 1, 0, 0];
  const mul = (A, B) => [
    A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
    A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
    A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
  ];
  const ap = (M, p) => [M[0] * p[0] + M[2] * p[1] + M[4], M[1] * p[0] + M[3] * p[1] + M[5]];
  const det = (M) => M[0] * M[3] - M[1] * M[2];
  const rot = (deg, cx = 0, cy = 0) => {
    const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    return [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy];
  };
  const scaleX = (k, cx) => [k, 0, 0, 1, cx - k * cx, 0];
  const mirrorX = [-1, 0, 0, 1, 0, 0];

  // Hinge about line p->q at angle θ (θ = π is a full reflection)
  function hinge(p, q, theta) {
    let ux = q[0] - p[0], uy = q[1] - p[1];
    const L = Math.hypot(ux, uy); ux /= L; uy /= L;
    const nx = -uy, ny = ux;
    let k = Math.cos(theta);
    if (Math.abs(k) < 0.004) k = k < 0 ? -0.004 : 0.004; // avoid a singular matrix
    const a = ux * ux + k * nx * nx, b = ux * uy + k * nx * ny, d = uy * uy + k * ny * ny;
    return [a, b, b, d, p[0] - (a * p[0] + b * p[1]), p[1] - (b * p[0] + d * p[1])];
  }
  const reflect = (p, q) => hinge(p, q, Math.PI);
  const cross = (p, q, x) => (q[0] - p[0]) * (x[1] - p[1]) - (q[1] - p[1]) * (x[0] - p[0]);

  function area(poly) {
    let s = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      s += a[0] * b[1] - b[0] * a[1];
    }
    return s / 2;
  }

  // Keep the part of poly where vals * sign > 0
  function clip(poly, vals, sign) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const va = vals[i] * sign, vb = vals[(i + 1) % poly.length] * sign;
      if (va >= -EPS) out.push(a);
      if ((va > EPS && vb < -EPS) || (va < -EPS && vb > EPS)) {
        const t = va / (va - vb);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    // drop near-duplicate points
    return out.filter((p, i) => {
      const n = out[(i + 1) % out.length];
      return out.length < 2 || Math.hypot(p[0] - n[0], p[1] - n[1]) > 1e-7;
    });
  }

  const SHAPES = {
    square: { label: 'Square', w: 240, h: 240 },
    a4: { label: 'A4 rectangle (1:√2)', w: 240 / Math.SQRT2, h: 240 },
    '3x5': { label: '3:5 rectangle', w: 240, h: 144 },
  };

  let uid = 0;
  function initialState(model) {
    const s = SHAPES[model.shape];
    const w = s.w / 2, h = s.h / 2;
    let M = rot(model.orient || 0);
    if (model.start === 'back') M = mul(M, mirrorX);
    return {
      facets: [{ id: ++uid, poly: [[-w, -h], [w, -h], [w, h], [-w, h]], M, z: 0, tags: [] }],
      creases: [],
    };
  }

  const clone = (f, extra) => ({ ...f, tags: f.tags.slice(), ...extra });

  function matches(f, sel) {
    if (!sel || sel === 'all') return true;
    const any = sel.tags ? sel.tags.some((t) => f.tags.includes(t)) : true;
    const none = sel.notTags ? !sel.notTags.some((t) => f.tags.includes(t)) : true;
    return any && none;
  }

  const viewPoly = (f) => f.poly.map((v) => ap(f.M, v));
  // optional box [x0, y0, x1, y1] that a facet's center must fall in
  function inside(f, box) {
    if (!box) return true;
    const vp = viewPoly(f);
    const c = vp.reduce((s, p) => [s[0] + p[0] / vp.length, s[1] + p[1] / vp.length], [0, 0]);
    return c[0] >= box[0] && c[0] <= box[2] && c[1] >= box[1] && c[1] <= box[3];
  }

  function bbox(points, into) {
    const b = into || [Infinity, Infinity, -Infinity, -Infinity];
    for (const p of points) {
      if (p[0] < b[0]) b[0] = p[0];
      if (p[1] < b[1]) b[1] = p[1];
      if (p[0] > b[2]) b[2] = p[0];
      if (p[1] > b[3]) b[3] = p[1];
    }
    return b;
  }
  const stateBox = (st, into) => st.facets.reduce((b, f) => bbox(viewPoly(f), b), into);

  function normalizeZ(facets) {
    facets.slice().sort((a, b) => a.z - b.z).forEach((f, i) => (f.z = i));
    return facets;
  }

  /* Apply the fold/crease ops of one step. Returns the after-state plus the
     animation description (each piece keeps its start matrix and the hinges
     that move it). */
  function foldOps(state, ops) {
    let work = state.facets.map((f) => clone(f, { M0: f.M, z0: f.z, moves: [] }));
    const creases = state.creases.slice();
    const allUnfold = ops.every((o) => o.unfold);

    ops.forEach((op, oi) => {
      const [p, q] = op.line;
      const sgn = Math.sign(cross(p, q, op.move)) || 1;
      const zs = work.map((f) => f.z);
      const maxZ = Math.max(...zs), minZ = Math.min(...zs);
      const next = [], moving = [];
      for (const f of work) {
        if (!matches(f, op.select) || !inside(f, op.within)) { next.push(f); continue; }
        const vals = f.poly.map((v) => cross(p, q, ap(f.M, v)) * sgn);
        const hi = Math.max(...vals), lo = Math.min(...vals);
        if (hi <= 1e-4) { next.push(f); continue; }
        if (lo >= -1e-4) { moving.push(f); continue; }
        const A = clip(f.poly, vals, 1), B = clip(f.poly, vals, -1);
        if (Math.abs(area(A)) < 0.05) { next.push(f); continue; }
        if (Math.abs(area(B)) < 0.05) { moving.push(f); continue; }
        next.push(clone(f, { id: ++uid, poly: B }));
        const piece = clone(f, { id: ++uid, poly: A });
        moving.push(piece);
        // crease = the edge of the moving piece that lies on the line
        const on = A.filter((v) => Math.abs(cross(p, q, ap(f.M, v))) < 1e-3 * Math.hypot(q[0] - p[0], q[1] - p[1]));
        if (on.length >= 2) creases.push({ a: on[0], b: on[on.length - 1], dir: op.dir || 'valley' });
      }
      if (!moving.length) console.warn('fold op moved nothing', op);
      moving.sort((a, b) => a.z - b.z);
      const R = reflect(p, q);
      const n = moving.length;
      moving.forEach((f, i) => {
        f.moves = f.moves.concat([{ p, q, oi }]);
        f.dir = op.dir || 'valley';
        f.keep = op.place === 'keep';
        if (!op.unfold) {
          f.M = mul(R, f.M);
          if (!f.keep) f.z = f.dir === 'valley' ? maxZ + (n - i) : minZ - 1 - i;
        }
        if (op.tag) f.tags.push(op.tag);
      });
      if (op.tagStay) next.forEach((f) => { if (matches(f, op.select)) f.tags.push(op.tagStay); });
            work = next.concat(moving);
    });

    const after = allUnfold
      ? { facets: state.facets.map((f) => clone(f)), creases }
      : { facets: normalizeZ(work.map((f) => ({ id: f.id, poly: f.poly, M: f.M, z: f.z, tags: f.tags }))), creases };
    // final z for the animation pieces
    const zAfter = new Map(after.facets.map((f) => [f.id, f.z]));
    return { after, pieces: work, unfold: allUnfold, zAfter };
  }

  // Build a playable step: before/after states and a frame function
  function compileStep(before, step) {
    const ops = step.ops || [];
    const kind = ops.length ? ops[0].type : 'none';
    if (kind === 'fold' || kind === 'crease') {
      const norm = ops.map((o) => ({ ...o, unfold: o.type === 'crease' }));
      const r = foldOps(before, norm);
      return { kind: r.unfold ? 'crease' : 'fold', before, after: r.after, pieces: r.pieces, ops: norm, zAfter: r.zAfter };
    }
    if (kind === 'flip' || kind === 'rotate') {
      const b = stateBox(before);
      const op = ops[0];
      const cx = op.axis != null ? op.axis : (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
      const T = kind === 'flip' ? mul([1, 0, 0, 1, 2 * cx, 0], mirrorX) : rot(op.angle);
      const after = {
        facets: normalizeZ(before.facets.map((f) => clone(f, { M: mul(T, f.M), z: kind === 'flip' ? -f.z : f.z }))),
        creases: before.creases,
      };
      return { kind, before, after, cx, cy: 0, angle: op.angle || 0 };
    }
    return { kind: step.note ? 'note' : 'none', before, after: before, note: step.note };
  }

  /* Frame at progress θ in [0, π] (crease steps go 0 → π → 0 via `back`).
     Returns draw list sorted bottom to top: {poly, M, shade, front} */
  function frame(cs, theta, back) {
    if (cs.kind === 'fold' || cs.kind === 'crease') {
      const late = back ? true : theta >= Math.PI / 2;
      const list = cs.pieces.map((f) => {
        let M = f.M0, moving = f.moves.length > 0;
        for (const mv of f.moves) M = mul(hinge(mv.p, mv.q, theta), M);
        let key;
        if (!moving) key = f.z0;
        else if (cs.kind === 'fold' && late) key = cs.zAfter.has(f.id) ? cs.zAfter.get(f.id) : f.z;
        else if (f.keep) key = f.z0;
        else if (!late) key = (f.dir === 'valley' ? BIG : -BIG) + f.z0;
        else key = (f.dir === 'valley' ? BIG : -BIG) - f.z0;
        return { id: f.id, poly: f.poly, M, key, shade: moving ? Math.abs(Math.sin(theta)) : 0 };
      });
      if (cs.kind === 'fold' && late) {
        // after the half-way point, stay facets use their final order too
        list.forEach((d) => { if (cs.zAfter.has(d.id)) d.key = cs.zAfter.get(d.id); });
      }
      return list.sort((a, b) => a.key - b.key);
    }
    if (cs.kind === 'flip') {
      const S = scaleX(Math.abs(Math.cos(theta)) < 0.004 ? 0.004 : Math.cos(theta), cs.cx);
      const late = theta >= Math.PI / 2;
      return cs.before.facets
        .map((f) => ({ id: f.id, poly: f.poly, M: mul(S, f.M), key: late ? -f.z : f.z, shade: Math.abs(Math.sin(theta)) * 0.6 }))
        .sort((a, b) => a.key - b.key);
    }
    if (cs.kind === 'rotate') {
      const R = rot((cs.angle * theta) / Math.PI);
      return cs.before.facets
        .map((f) => ({ id: f.id, poly: f.poly, M: mul(R, f.M), key: f.z, shade: 0 }))
        .sort((a, b) => a.key - b.key);
    }
    return staticList(cs.after);
  }

  const staticList = (st) =>
    st.facets.map((f) => ({ id: f.id, poly: f.poly, M: f.M, key: f.z, shade: 0 })).sort((a, b) => a.key - b.key);

  function compileModel(model) {
    let st = initialState(model);
    // Step 1 shows the paper turning over so both faces are visible
    const pre = compileStep(st, { ops: [{ type: 'flip' }] }).after;
    const steps = [];
    model.steps.forEach((step, i) => {
      const cs = i === 0 ? compileStep(pre, { ops: [{ type: 'flip' }] }) : compileStep(st, step);
      cs.step = step;
      steps.push(cs);
      st = cs.after;
    });
    // view box per step: sample the motion
    steps.forEach((cs) => {
      let b = [Infinity, Infinity, -Infinity, -Infinity];
      for (let k = 0; k <= 8; k++) {
        const th = (k / 8) * Math.PI;
        for (const d of frame(cs, th)) bbox(d.poly.map((v) => ap(d.M, v)), b);
      }
      if (cs.kind === 'note') b = [-150, -150, 150, 150];
      cs.box = b;
    });
    return { model, steps, final: st };
  }

  return { compileModel, frame, staticList, ap, det, mul, reflect, viewPoly, stateBox, bbox, cross, SHAPES };
})();
if (typeof module !== 'undefined') module.exports = Fold;
