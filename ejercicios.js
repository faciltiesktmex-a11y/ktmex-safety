/* ════════════════════════════════════════════════════════════════════
   KTMEX Safety — Ejercicios interactivos del curso (v0.10)
   KEJ.render(contenedor, ejercicio, {imagen, onDone, audio})
   Tipos: clasificar · ordenar · seleccionar · opcion · hotspots (encontrar riesgos en una imagen)
   KEJ.hablar(texto): lee en voz alta con la voz en español del dispositivo.
   El ejercicio se da por terminado cuando todo está correcto (se puede reintentar sin límite).
   ════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const revolver = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- Voz ---------- */
  let VOZ = null, AUDIO = null;
  function vozEs() {
    if (VOZ || !root.speechSynthesis) return VOZ;
    const vs = root.speechSynthesis.getVoices() || [];
    VOZ = vs.find(v => /^es[-_]MX/i.test(v.lang)) || vs.find(v => /^es[-_](US|419)/i.test(v.lang)) || vs.find(v => /^es/i.test(v.lang)) || null;
    return VOZ;
  }
  if (root.speechSynthesis) root.speechSynthesis.onvoiceschanged = () => { VOZ = null; vozEs(); };
  function callar() { try { root.speechSynthesis && root.speechSynthesis.cancel(); } catch (e) {} if (AUDIO) { try { AUDIO.pause(); } catch (e) {} AUDIO = null; } }
  // Reproduce el audio grabado (dataUrl) si existe; si no, lee el texto con la voz del dispositivo.
  function hablar(texto, dataUrl) {
    callar();
    if (dataUrl) { AUDIO = new Audio(dataUrl); AUDIO.play().catch(() => {}); return true; }
    if (!root.speechSynthesis || !texto) return false;
    const u = new SpeechSynthesisUtterance(String(texto)); u.lang = 'es-MX'; u.rate = 0.95; const v = vozEs(); if (v) u.voice = v;
    root.speechSynthesis.speak(u); return true;
  }
  const hayVoz = () => !!root.speechSynthesis;

  const CSS = `.kej{border:1px solid var(--border,#DDE5EF);border-radius:14px;padding:16px;margin-top:12px;background:#FBFDFF}
  .kej h4{margin:0 0 4px;font-size:.95rem;color:var(--navy,#0B1730)} .kej .kej-ins{font-size:.86rem;color:#334155;margin:0 0 10px;line-height:1.5}
  .kej .kej-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap}
  .kej .kej-btn{font:inherit;font-size:.8rem;font-weight:600;border:1px solid var(--border,#DDE5EF);background:#fff;border-radius:10px;padding:7px 12px;cursor:pointer;min-height:36px;color:#172033}
  .kej .kej-btn.p{background:var(--blue,#2463EB);color:#fff;border-color:transparent} .kej .kej-btn:disabled{opacity:.5;cursor:default}
  .kej .kej-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}
  .kej .kej-item{border:1px solid var(--border,#DDE5EF);border-radius:12px;padding:10px 12px;margin:8px 0;background:#fff}
  .kej .kej-item.ok{border-color:#16A34A;background:#F0FDF4} .kej .kej-item.mal{border-color:#DC2626;background:#FEF2F2}
  .kej .kej-t{font-size:.88rem;font-weight:600;color:#172033;margin-bottom:6px}
  .kej .kej-chips{display:flex;gap:6px;flex-wrap:wrap} .kej .kej-chip{font:inherit;font-size:.78rem;border:1px solid #CBD5E1;background:#fff;border-radius:999px;padding:6px 12px;cursor:pointer;min-height:34px}
  .kej .kej-chip.on{background:#0B1730;color:#fff;border-color:#0B1730}
  .kej .kej-ord{display:flex;align-items:center;gap:8px} .kej .kej-ord b{min-width:26px;height:26px;border-radius:50%;background:#E2E8F0;display:inline-flex;align-items:center;justify-content:center;font-size:.8rem}
  .kej .kej-ord span{flex:1;font-size:.88rem} .kej .kej-mv{font:inherit;border:1px solid #CBD5E1;background:#fff;border-radius:8px;width:36px;height:34px;cursor:pointer}
  .kej .kej-fb{font-size:.84rem;margin-top:10px;padding:10px 12px;border-radius:10px} .kej .kej-fb.ok{background:#DCFCE7;color:#14532D} .kej .kej-fb.mal{background:#FEE2E2;color:#7F1D1D}
  .kej .kej-done{display:inline-flex;gap:6px;align-items:center;background:#DCFCE7;color:#14532D;border-radius:999px;padding:4px 10px;font-size:.76rem;font-weight:700}
  .kej .kej-sel{display:flex;gap:10px;align-items:center;border:1px solid var(--border,#DDE5EF);border-radius:12px;padding:10px 12px;margin:6px 0;background:#fff;cursor:pointer;font-size:.88rem}
  .kej .kej-sel input{width:20px;height:20px} .kej .kej-sel.ok{border-color:#16A34A;background:#F0FDF4} .kej .kej-sel.mal{border-color:#DC2626;background:#FEF2F2}
  .kej .kej-img{position:relative;border-radius:12px;overflow:hidden;background:#0B1730;touch-action:manipulation;user-select:none}
  .kej .kej-img img{width:100%;display:block} .kej .kej-hit{position:absolute;inset:0;cursor:crosshair}
  .kej .kej-mark{position:absolute;border:3px solid;border-radius:10px;pointer-events:none;box-shadow:0 0 0 2px #fff}
  .kej .kej-mark.acto{border-color:#DC2626;background:rgba(220,38,38,.12)} .kej .kej-mark.condicion{border-color:#D97706;background:rgba(217,119,6,.14)} .kej .kej-mark.pend{border-color:#2563EB;background:rgba(37,99,235,.15)}
  .kej .kej-mark i{position:absolute;top:-12px;left:-12px;width:24px;height:24px;border-radius:50%;color:#fff;font-style:normal;font-size:.72rem;font-weight:800;display:flex;align-items:center;justify-content:center}
  .kej .kej-mark.acto i{background:#DC2626} .kej .kej-mark.condicion i{background:#D97706} .kej .kej-mark.pend i{background:#2563EB}
  .kej .kej-miss{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:3px solid #94A3B8;pointer-events:none;animation:kejf 1.1s forwards}
  @keyframes kejf{to{opacity:0;transform:scale(1.6)}}
  .kej .kej-cnt{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0} .kej .kej-cnt span{font-size:.8rem;font-weight:700;border-radius:999px;padding:5px 11px}
  .kej .kej-lista{margin:10px 0 0;padding:0;list-style:none} .kej .kej-lista li{font-size:.84rem;padding:8px 10px;border-radius:10px;margin:6px 0;background:#fff;border:1px solid var(--border,#DDE5EF)}
  .kej .kej-lista li b{display:block} .kej .kej-q{margin:10px 0;padding:12px;border-radius:12px;background:#F1F5F9;border:1px solid #CBD5E1}`;
  function css() { if (!document.getElementById('kej-css')) { const s = document.createElement('style'); s.id = 'kej-css'; s.textContent = CSS; document.head.appendChild(s); } }

  function render(host, ej, opts) {
    css(); opts = opts || {};
    // el estado vive en opts.estado (lo guarda el curso) para que no se pierda al redibujar la página
    const st = opts.estado || (host.__kej = host.__kej && host.__kej.id === ej.id ? host.__kej : { id: ej.id });
    const terminar = () => { if (!st.done) { st.done = true; opts.onDone && opts.onDone(ej.id); } };
    const voz = (texto) => hablar(texto);
    const cab = `<div class="kej-top"><div><h4>${esc(ej.titulo || '')}</h4></div><div style="display:flex;gap:6px;align-items:center">${st.done ? '<span class="kej-done">✓ Completado</span>' : ''}${(hayVoz() || opts.audio) ? `<button class="kej-btn" type="button" data-k="oir">🔊 Escuchar</button>` : ''}</div></div><p class="kej-ins">${esc(ej.instrucciones || '')}</p>`;
    const pinta = (cuerpo) => {
      host.innerHTML = `<div class="kej">${cab}${cuerpo}</div>`;
      const b = host.querySelector('[data-k="oir"]'); if (b) b.onclick = () => hablar(ej.instrucciones, opts.audio && opts.audio());
    };
    const fb = (ok, txt) => `<div class="kej-fb ${ok ? 'ok' : 'mal'}" role="status">${esc(txt)}</div>`;

    if (ej.tipo === 'clasificar') {
      st.orden = st.orden || revolver(ej.items.map((_, i) => i)); st.r = st.r || {};
      const dibuja = (rev) => {
        pinta(st.orden.map(i => { const it = ej.items[i], r = st.r[i], cls = rev ? (r === it.grupo ? 'ok' : 'mal') : '';
          return `<div class="kej-item ${cls}"><div class="kej-t">${esc(it.texto)}</div><div class="kej-chips">${ej.grupos.map(g => `<button type="button" class="kej-chip ${r === g ? 'on' : ''}" data-i="${i}" data-g="${esc(g)}">${esc(g)}</button>`).join('')}</div></div>`; }).join('')
          + `<div class="kej-row"><button class="kej-btn p" type="button" data-k="rev">Revisar</button></div>` + (rev ? (rev.ok ? fb(true, '¡Correcto! Todo quedó bien clasificado.') : fb(false, 'Hay ' + rev.mal + ' por corregir (en rojo). Cámbialos y revisa de nuevo.')) : ''));
        host.querySelectorAll('.kej-chip').forEach(c => c.onclick = () => { st.r[c.dataset.i] = c.dataset.g; dibuja(null); });
        host.querySelector('[data-k="rev"]').onclick = () => { const mal = ej.items.filter((it, i) => st.r[i] !== it.grupo).length; const r = { ok: !mal, mal }; if (!mal) terminar(); dibuja(r); voz(mal ? 'Hay ' + mal + ' por corregir.' : 'Correcto.'); };
      };
      return dibuja(st.done ? { ok: true } : null);
    }
    if (ej.tipo === 'ordenar') {
      if (!st.orden) { let o = revolver(ej.pasos.map((_, i) => i)); if (o.every((v, i) => v === i) && o.length > 1) o = o.reverse(); st.orden = o; }
      const dibuja = (rev) => {
        pinta(st.orden.map((p, k) => `<div class="kej-item ${rev ? (p === k ? 'ok' : 'mal') : ''}"><div class="kej-ord"><b>${k + 1}</b><span>${esc(ej.pasos[p])}</span><button class="kej-mv" type="button" data-k="up" data-p="${k}" aria-label="Subir" ${k ? '' : 'disabled'}>▲</button><button class="kej-mv" type="button" data-k="dn" data-p="${k}" aria-label="Bajar" ${k < st.orden.length - 1 ? '' : 'disabled'}>▼</button></div></div>`).join('')
          + `<div class="kej-row"><button class="kej-btn p" type="button" data-k="rev">Revisar el orden</button></div>` + (rev ? (rev.ok ? fb(true, '¡Correcto! Ese es el orden.') : fb(false, 'Todavía no. Los pasos en rojo no están en su lugar.')) : ''));
        host.querySelectorAll('[data-k="up"],[data-k="dn"]').forEach(b => b.onclick = () => { const k = +b.dataset.p, j = b.dataset.k === 'up' ? k - 1 : k + 1; [st.orden[k], st.orden[j]] = [st.orden[j], st.orden[k]]; dibuja(null); });
        host.querySelector('[data-k="rev"]').onclick = () => { const ok = st.orden.every((p, k) => p === k); if (ok) terminar(); dibuja({ ok }); voz(ok ? 'Correcto.' : 'Todavía no es el orden correcto.'); };
      };
      return dibuja(st.done ? { ok: true } : null);
    }
    if (ej.tipo === 'seleccionar') {
      st.orden = st.orden || revolver(ej.items.map((_, i) => i)); st.r = st.r || {};
      const dibuja = (rev) => {
        pinta(st.orden.map(i => { const it = ej.items[i], on = !!st.r[i], cls = rev ? (on === !!it.correcto ? 'ok' : 'mal') : '';
          return `<label class="kej-sel ${cls}"><input type="checkbox" data-i="${i}" ${on ? 'checked' : ''}><span>${esc(it.texto)}</span></label>`; }).join('')
          + `<div class="kej-row"><button class="kej-btn p" type="button" data-k="rev">Revisar</button></div>` + (rev ? (rev.ok ? fb(true, '¡Correcto!') : fb(false, 'Revisa los marcados en rojo: sobran o faltan opciones.')) : ''));
        host.querySelectorAll('input[type=checkbox]').forEach(c => c.onchange = () => { st.r[c.dataset.i] = c.checked; });
        host.querySelector('[data-k="rev"]').onclick = () => { const ok = ej.items.every((it, i) => !!st.r[i] === !!it.correcto); if (ok) terminar(); dibuja({ ok }); voz(ok ? 'Correcto.' : 'Revisa los marcados en rojo.'); };
      };
      return dibuja(st.done ? { ok: true } : null);
    }
    if (ej.tipo === 'opcion') {
      st.k = st.k || 0; st.res = st.res || {};
      const dibuja = () => {
        const q = ej.preguntas[Math.min(st.k, ej.preguntas.length - 1)], r = st.res[st.k], fin = st.done && st.k >= ej.preguntas.length - 1 && r && r.ok;
        pinta(`<div class="kej-q"><div class="kej-t">${st.k + 1} / ${ej.preguntas.length}. ${esc(q.texto)}</div>${q.opciones.map((o, i) => `<label class="kej-sel ${r && r.sel === i ? (r.ok ? 'ok' : 'mal') : ''}"><input type="radio" name="kq-${esc(ej.id)}" data-i="${i}" ${r && r.sel === i ? 'checked' : ''} ${r && r.ok ? 'disabled' : ''}><span>${esc(o)}</span></label>`).join('')}
          ${r ? (r.ok ? fb(true, '¡Correcto! ' + (q.explicacion || '')) : fb(false, 'Intenta otra vez.')) : ''}</div>
          <div class="kej-row">${r && r.ok && st.k < ej.preguntas.length - 1 ? `<button class="kej-btn p" type="button" data-k="sig">Siguiente pregunta</button>` : ''}${fin ? '' : ''}</div>`);
        host.querySelectorAll('input[type=radio]').forEach(c => c.onchange = () => { const i = +c.dataset.i, ok = i === Number(q.correcta); st.res[st.k] = { sel: i, ok }; if (ok && st.k >= ej.preguntas.length - 1) terminar(); voz(ok ? 'Correcto. ' + (q.explicacion || '') : 'Intenta otra vez.'); dibuja(); });
        const s = host.querySelector('[data-k="sig"]'); if (s) s.onclick = () => { st.k++; dibuja(); };
      };
      return dibuja();
    }
    if (ej.tipo === 'hotspots') {
      st.hall = st.hall || {}; st.pend = st.pend == null ? null : st.pend; st.fallos = st.fallos || 0;
      const A = ej.area || { x: 0, y: 0, w: 100, h: 100 }, meta = ej.meta || { acto: 5, condicion: 5 };
      const cuenta = t => Object.keys(st.hall).filter(i => st.hall[i] && st.hall[i].tipo === t && st.hall[i].ok).length;   // solo cuenta lo bien clasificado
      // la imagen se recorta a la escena (area, en % de la diapositiva 16:9); los puntos vienen en % de la escena
      const pos = p => ({ left: p.x, top: p.y, width: p.w, height: p.h });
      const recorte = `aspect-ratio:${(A.w * 16 / (A.h * 9)).toFixed(4)}`, imgSt = `position:absolute;width:${(10000 / A.w).toFixed(3)}%;left:${(-A.x * 100 / A.w).toFixed(3)}%;top:${(-A.y * 100 / A.h).toFixed(3)}%;max-width:none`;
      const dibuja = (msg) => {
        const na = cuenta('acto'), nc = cuenta('condicion'), listo = na >= meta.acto && nc >= meta.condicion;
        if (listo) terminar();
        const marcas = ej.puntos.map((p, i) => { const h = st.hall[i]; if (!h && st.pend !== i && !st.pista) return ''; const c = st.pend === i ? 'pend' : h ? p.tipo : 'pend'; const q = pos(p);
          if (!h && st.pend !== i) return st.pista && !h ? `<div class="kej-mark pend" style="left:${q.left}%;top:${q.top}%;width:${q.width}%;height:${q.height}%;opacity:.55"></div>` : '';
          const n = Object.keys(st.hall).filter(k => st.hall[k]).indexOf(String(i)) + 1;
          return `<div class="kej-mark ${c}" style="left:${q.left}%;top:${q.top}%;width:${q.width}%;height:${q.height}%"><i>${st.pend === i ? '?' : n}</i></div>`; }).join('');
        const p = st.pend != null ? ej.puntos[st.pend] : null;
        pinta(`<div class="kej-cnt"><span style="background:#FEE2E2;color:#7F1D1D">Actos inseguros: ${na} / ${meta.acto}</span><span style="background:#FEF3C7;color:#78350F">Condiciones inseguras: ${nc} / ${meta.condicion}</span><span style="background:#E2E8F0;color:#334155">Encontrados: ${Object.keys(st.hall).length} de ${ej.puntos.length}</span></div>
          <div class="kej-row" style="margin:0 0 8px"><button class="kej-btn" type="button" data-k="zoom">${st.zoom ? '🔍 Ver completa' : '🔍 Ampliar imagen'}</button></div>
          <div style="overflow-x:auto;border-radius:12px"><div class="kej-img" style="${recorte};${st.zoom ? 'width:220%' : ''}"><img src="${opts.imagen || ''}" alt="Imagen del ejercicio" style="${imgSt}"><div class="kej-hit"></div>${marcas}</div></div>
          ${p ? `<div class="kej-q"><div class="kej-t">Encontraste: ${esc(p.texto)}</div><div class="kej-ins" style="margin:0 0 8px">¿Es un acto inseguro o una condición insegura?</div><div class="kej-chips"><button class="kej-chip" type="button" data-t="acto">Acto inseguro</button><button class="kej-chip" type="button" data-t="condicion">Condición insegura</button></div></div>` : ''}
          ${msg || ''}
          ${listo ? fb(true, '¡Muy bien! Encontraste los actos y condiciones inseguras que se pedían. Puedes seguir buscando o continuar.') : ''}
          <div class="kej-row">${!listo && Object.keys(st.hall).length >= ej.puntos.length ? `<button class="kej-btn p" type="button" data-k="otra">Volver a intentar</button>` : ''}${!listo && st.fallos >= 4 ? `<button class="kej-btn" type="button" data-k="pista">${st.pista ? 'Ocultar pistas' : 'Ver pistas'}</button>` : ''}</div>
          <ul class="kej-lista">${Object.keys(st.hall).filter(i => st.hall[i]).map((i, k) => { const q = ej.puntos[i], h = st.hall[i]; return `<li><b>${k + 1}. ${esc(q.texto)} · ${q.tipo === 'acto' ? 'Acto inseguro' : 'Condición insegura'}${h.ok ? '' : ' (lo marcaste como ' + (q.tipo === 'acto' ? 'condición' : 'acto') + ')'}</b>${esc(q.explicacion)}</li>`; }).join('')}</ul>`);
        const hit = host.querySelector('.kej-hit');
        hit.onclick = (e) => {
          if (st.pend != null) return;
          const r = hit.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100;
          const cand = ej.puntos.map((p, i) => ({ i, q: pos(p) })).filter(o => !st.hall[o.i] && x >= o.q.left && x <= o.q.left + o.q.width && y >= o.q.top && y <= o.q.top + o.q.height)
            .sort((a, b) => a.q.width * a.q.height - b.q.width * b.q.height);
          if (cand.length) { st.pend = cand[0].i; dibuja(); voz('Encontraste: ' + ej.puntos[st.pend].texto + '. ¿Es acto o condición insegura?'); }
          else { st.fallos++; const m = document.createElement('div'); m.className = 'kej-miss'; m.style.left = x + '%'; m.style.top = y + '%'; hit.parentNode.appendChild(m); setTimeout(() => m.remove(), 1200); if (st.fallos === 4) dibuja(); }
        };
        host.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const p2 = ej.puntos[st.pend], ok = b.dataset.t === p2.tipo; st.hall[st.pend] = { tipo: p2.tipo, ok: ok };
          const txt = (ok ? 'Correcto. ' : 'No exactamente: es ' + (p2.tipo === 'acto' ? 'un acto inseguro. ' : 'una condición insegura. ')) + p2.explicacion; st.pend = null; dibuja(fb(ok, txt)); voz(txt); });
        const zm = host.querySelector('[data-k="zoom"]'); if (zm) zm.onclick = () => { st.zoom = !st.zoom; dibuja(); };
        const ot = host.querySelector('[data-k="otra"]'); if (ot) ot.onclick = () => { st.hall = {}; st.pend = null; st.pista = false; dibuja(); };
        const ps = host.querySelector('[data-k="pista"]'); if (ps) ps.onclick = () => { st.pista = !st.pista; dibuja(); };
      };
      return dibuja();
    }
    host.innerHTML = '';
  }
  root.KEJ = { render, hablar, callar, hayVoz, VERSION: '0.10.0' };
})(typeof window !== 'undefined' ? window : this);
