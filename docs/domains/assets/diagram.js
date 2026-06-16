/* ============================================================
   상태머신 다이어그램 렌더러 (의존성 없음, 순수 SVG)

   사용:
     renderStateMachine(svgElement, {
       states: [{ key, label, sub?, color, x, y }],   // x,y = viewBox 좌표(중심)
       transitions: [{ from, to, label, kind, curve? }],
       initial: { to, label }                          // (옵션) 진입 화살표
     });

   - kind: 'auto' | 'manual'  (선 색상)
   - curve: 곡률(수직 변위, px). +/- 로 방향. from===to 면 self-loop.
   ============================================================ */
(function (global) {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const NW = 150; // 노드 폭
  const NH = 62; // 노드 높이
  const COLOR = { auto: '#2563eb', manual: '#ea580c' };

  function el(name, attrs, text) {
    const n = document.createElementNS(SVGNS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  // 노드 사각형 경계에서 (tx,ty) 방향으로 나가는 점
  function borderPoint(node, tx, ty) {
    const dx = tx - node.x;
    const dy = ty - node.y;
    const hw = NW / 2;
    const hh = NH / 2;
    const sx = Math.abs(dx) < 1e-6 ? Infinity : hw / Math.abs(dx);
    const sy = Math.abs(dy) < 1e-6 ? Infinity : hh / Math.abs(dy);
    const s = Math.min(sx, sy);
    return { x: node.x + dx * s, y: node.y + dy * s };
  }

  function renderStateMachine(svg, model) {
    const byKey = {};
    model.states.forEach((s) => (byKey[s.key] = s));

    // arrowhead markers (kind 당 1개)
    const defs = el('defs', {});
    ['auto', 'manual'].forEach((t) => {
      const m = el('marker', {
        id: 'ah-' + t,
        viewBox: '0 0 10 10',
        refX: '8.5',
        refY: '5',
        markerWidth: '7',
        markerHeight: '7',
        orient: 'auto-start-reverse',
      });
      m.appendChild(el('path', { d: 'M0,0 L10,5 L0,10 z', fill: COLOR[t] }));
      defs.appendChild(m);
    });
    svg.appendChild(defs);

    // 진입 화살표
    if (model.initial) {
      const n = byKey[model.initial.to];
      const start = { x: n.x - NW / 2 - 54, y: n.y };
      const end = { x: n.x - NW / 2 - 4, y: n.y };
      svg.appendChild(
        el('path', {
          d: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
          fill: 'none',
          stroke: '#94a3b8',
          'stroke-width': '2',
          'marker-end': 'url(#ah-auto)',
        })
      );
      // 진입점 점
      svg.appendChild(el('circle', { cx: start.x, cy: start.y, r: 4, fill: '#94a3b8' }));
      const lbl = el(
        'text',
        {
          x: (start.x + end.x) / 2,
          y: n.y - 12,
          'text-anchor': 'middle',
          'font-size': '11.5',
          'font-weight': '600',
          fill: '#94a3b8',
        },
        model.initial.label
      );
      svg.appendChild(lbl);
    }

    // 전이(엣지)
    model.transitions.forEach((tr) => {
      const a = byKey[tr.from];
      const b = byKey[tr.to];
      const col = COLOR[tr.kind] || COLOR.auto;

      if (tr.from === tr.to) {
        // self-loop (노드 위쪽)
        const topY = a.y - NH / 2;
        const path = el('path', {
          d: `M ${a.x - 16} ${topY} C ${a.x - 58} ${topY - 64}, ${a.x + 58} ${topY - 64}, ${a.x + 16} ${topY}`,
          fill: 'none',
          stroke: col,
          'stroke-width': '2',
          'marker-end': `url(#ah-${tr.kind})`,
        });
        svg.appendChild(path);
        svg.appendChild(
          el(
            'text',
            { x: a.x, y: topY - 52, 'text-anchor': 'middle', 'font-size': '12', 'font-weight': '600', fill: col },
            tr.label
          )
        );
        return;
      }

      const curve = tr.curve || 0;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      // 수직 단위벡터
      let nx = -(b.y - a.y);
      let ny = b.x - a.x;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len;
      ny /= len;
      const ctrl = { x: mid.x + nx * curve, y: mid.y + ny * curve };

      const start = borderPoint(a, ctrl.x, ctrl.y);
      const end = borderPoint(b, ctrl.x, ctrl.y);

      svg.appendChild(
        el('path', {
          d: `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`,
          fill: 'none',
          stroke: col,
          'stroke-width': '2',
          'marker-end': `url(#ah-${tr.kind})`,
        })
      );

      // 라벨 — 곡선 정점 부근, 살짝 더 바깥쪽
      const apex = { x: 0.25 * start.x + 0.5 * ctrl.x + 0.25 * end.x, y: 0.25 * start.y + 0.5 * ctrl.y + 0.25 * end.y };
      const off = curve >= 0 ? 12 : -12;
      svg.appendChild(
        el(
          'text',
          {
            x: apex.x + nx * off,
            y: apex.y + ny * off + 4,
            'text-anchor': 'middle',
            'font-size': '12',
            'font-weight': '600',
            fill: col,
          },
          tr.label
        )
      );
    });

    // 노드
    model.states.forEach((s) => {
      const g = el('g', {});
      g.appendChild(
        el('rect', {
          x: s.x - NW / 2,
          y: s.y - NH / 2,
          width: NW,
          height: NH,
          rx: 12,
          fill: '#fff',
          stroke: s.color,
          'stroke-width': '2.5',
        })
      );
      g.appendChild(el('rect', { x: s.x - NW / 2, y: s.y - NH / 2, width: 6, height: NH, rx: 3, fill: s.color }));
      g.appendChild(
        el(
          'text',
          { x: s.x + 3, y: s.y - 2, 'text-anchor': 'middle', 'font-size': '15.5', 'font-weight': '700', fill: s.color },
          s.label
        )
      );
      g.appendChild(
        el(
          'text',
          {
            x: s.x + 3,
            y: s.y + 15,
            'text-anchor': 'middle',
            'font-size': '10',
            'font-weight': '700',
            fill: '#94a3b8',
            'letter-spacing': '0.5',
          },
          s.key
        )
      );
      svg.appendChild(g);
    });
  }

  global.renderStateMachine = renderStateMachine;
})(window);
