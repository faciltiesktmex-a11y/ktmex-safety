/* ════════════════════════════════════════════════════════════════════
   KTMEX Safety — Board de incidentes (v0.11)
   Versión del «Facilities follow up board» enfocada en incidentes: secciones con gráficas,
   filtros, barra de secciones, modo presentación y editor de gráficas.
     KBD.render(contenedor, datos, {lang, KF, puedeEditar, guardarConfig(cfg), guardarPlantilla(p)})
   · datos = respuesta de boardDatos (eventos, plantilla, config).
   · Solo quien tiene el permiso «board» ve los engranes, el menú de secciones y la plantilla;
     lo que guardan lo ven todos.
   ════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PALETAS = {
    ktmex: ['#2463EB', '#F59E0B', '#16A34A', '#DC2626', '#7C3AED', '#0EA5E9', '#DB2777', '#65A30D', '#EA580C', '#0F766E', '#64748B', '#A16207'],
    oceano: ['#0EA5E9', '#0369A1', '#14B8A6', '#6366F1', '#22D3EE', '#1E40AF', '#2DD4BF', '#818CF8', '#0284C7', '#155E75', '#38BDF8', '#4F46E5'],
    atardecer: ['#F97316', '#E11D48', '#F59E0B', '#DB2777', '#FB7185', '#EA580C', '#FBBF24', '#BE123C', '#FDBA74', '#9F1239', '#F43F5E', '#D97706'],
    bosque: ['#16A34A', '#65A30D', '#0D9488', '#15803D', '#84CC16', '#059669', '#4D7C0F', '#22C55E', '#10B981', '#166534', '#A3E635', '#047857'],
    daltonico: ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#56B4E9', '#D55E00', '#F0E442', '#000000', '#999999', '#882255', '#44AA99', '#117733'],
    pastel: ['#93C5FD', '#FCA5A5', '#86EFAC', '#FDE68A', '#C4B5FD', '#F9A8D4', '#A5F3FC', '#FDBA74', '#BEF264', '#D8B4FE', '#CBD5E1', '#FECACA'],
    gris: ['#0F172A', '#334155', '#475569', '#64748B', '#94A3B8', '#CBD5E1', '#1E293B', '#52525B', '#71717A', '#A1A1AA', '#D4D4D8', '#3F3F46']
  };
  const CLASIF_COLOR = { 'Lesión': '#B91C1C', 'Tratamiento médico': '#EA580C', 'Primer auxilio': '#F59E0B', 'Daño a la propiedad': '#2463EB', 'Casi accidente': '#16A34A' };
  const TIPOS = [['bar', 'Barras'], ['hbar', 'Barras horizontales'], ['stacked', 'Barras apiladas'], ['line', 'Línea'], ['area', 'Área'], ['doughnut', 'Dona'], ['pie', 'Pastel'], ['polar', 'Polar'], ['radar', 'Radar'], ['pareto', 'Pareto']];
  const TIPO_EN = { Barras: 'Bars', 'Barras horizontales': 'Horizontal bars', 'Barras apiladas': 'Stacked bars', 'Línea': 'Line', 'Área': 'Area', Dona: 'Doughnut', Pastel: 'Pie', Polar: 'Polar', Radar: 'Radar', Pareto: 'Pareto' };
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'], MESES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'], DIAS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const ORDEN_CLASIF = ['Lesión', 'Tratamiento médico', 'Primer auxilio', 'Daño a la propiedad', 'Casi accidente'];
  const ORDEN_STOP = ['A', 'B', 'C', 'D', 'E', 'F', 'α1', 'α2', 'α', 'NA'];
  const STOP_TXT = { A: 'A · Equipo energizado', B: 'B · Objetos pesados', C: 'C · Vehículos', D: 'D · Caída de altura', E: 'E · Descarga eléctrica', F: 'F · Objetos calientes', 'α1': 'α · Cortadura', 'α2': 'α · Caída al caminar', NA: 'Fuera de STOP 6' };
  const LESION = { 'Lesión': 1, 'Tratamiento médico': 1, 'Primer auxilio': 1 };
  const ANTIG = [[0, 3, '0–3'], [3.0001, 6, '4–6'], [6.0001, 12, '7–12'], [12.0001, 24, '13–24'], [24.0001, 48, '25–48'], [48.0001, 1e9, 'Más de 48']];

  // Dimensiones para cruzar: etiqueta, valor de cada evento y orden
  const DIMS = {
    anio: { t: 'Año', en: 'Year', v: e => e.fecha.slice(0, 4), orden: 'alfa' },
    mes: { t: 'Mes', en: 'Month', v: e => MESES[+e.fecha.slice(5, 7) - 1], orden: MESES },
    area: { t: 'Área', en: 'Area', v: e => e.area || 'Sin área' },
    turnoNum: { t: 'Turno (1.º / 2.º)', en: 'Shift (1st / 2nd)', v: e => e.turnoNum === '1' ? '1.er turno' : e.turnoNum === '2' ? '2.º turno' : 'Sin turno', orden: ['1.er turno', '2.º turno', 'Sin turno'] },
    grupo: { t: 'Grupo (verde / azul / mixto)', en: 'Group (green / blue / mixed)', v: e => e.turno || 'Sin grupo', orden: ['Verde', 'Azul', 'Mixto', 'Sin grupo'] },
    clasificacion: { t: 'Clasificación', en: 'Classification', v: e => e.clasificacion || 'Sin clasificación', orden: ORDEN_CLASIF },
    linea: { t: 'Línea / equipo', en: 'Line / equipment', v: e => e.linea || 'Sin línea' },
    acto: { t: 'Acto o condición', en: 'Act or condition', v: e => e.acto || 'Sin dato', orden: ['Acto', 'Condición', 'Sin dato'] },
    stop: { t: 'STOP 6', en: 'STOP 6', v: e => e.stop ? (STOP_TXT[e.stop] || e.stop) : 'Sin dato', orden: ORDEN_STOP.map(k => STOP_TXT[k] || k).concat(['Sin dato']) },
    parte: { t: 'Parte del cuerpo', en: 'Body part', v: e => e._grupos[0] || 'Sin parte del cuerpo', multi: e => e._grupos.length ? e._grupos : ['Sin parte del cuerpo'] },
    lesion: { t: 'Tipo de lesión', en: 'Injury type', v: e => e.tipoLesion || 'Sin dato' },
    evento: { t: 'Tipo de evento', en: 'Event type', v: e => e.tipoEvento || 'Sin dato' },
    genero: { t: 'Género', en: 'Gender', v: e => e.genero || 'Sin dato', orden: ['Hombre', 'Mujer', 'Sin dato'] },
    antig: { t: 'Antigüedad en planta (meses)', en: 'Plant seniority (months)', v: e => { if (e.antig == null || isNaN(e.antig)) return 'Sin dato'; const b = ANTIG.find(a => e.antig >= a[0] && e.antig <= a[1]); return b ? b[2] : 'Sin dato'; }, orden: ANTIG.map(a => a[2]).concat(['Sin dato']) },
    dia: { t: 'Día de la semana', en: 'Weekday', v: e => DIAS[(new Date(e.fecha + 'T12:00:00').getDay() + 6) % 7], orden: DIAS },
    hora: { t: 'Hora (cada 2 h)', en: 'Hour (every 2 h)', v: e => { const h = parseInt(e.hora, 10); if (isNaN(h)) return 'Sin hora'; const a = h - h % 2; return String(a).padStart(2, '0') + '–' + String(a + 2).padStart(2, '0') + ' h'; }, orden: 'alfa' },
    estatus: { t: 'Estatus', en: 'Status', v: e => e.estatus || 'Sin dato' }
  };
  const SECCIONES = [
    { id: 'resumen', t: 'Resumen', en: 'Summary', esp: 'resumen' },
    { id: 'tendencia', t: 'Tendencia por mes', en: 'Monthly trend', dim: 'mes', serie: 'anio', type: 'line', todosAnios: true, d: 'Incidentes de cada mes; una línea por año (no usa el filtro de año).' },
    { id: 'anioClasif', t: 'Por año y clasificación', en: 'By year and classification', dim: 'anio', serie: 'clasificacion', type: 'stacked', todosAnios: true, d: 'Gravedad de los incidentes de cada año (no usa el filtro de año).' },
    { id: 'area', t: 'Por área', en: 'By area', dim: 'area', type: 'hbar', d: 'Áreas que concentran los incidentes.' },
    { id: 'turno', t: 'Por turno', en: 'By shift', dim: 'turnoNum', serie: 'clasificacion', type: 'stacked', d: 'Primer y segundo turno.' },
    { id: 'grupo', t: 'Por grupo', en: 'By group', dim: 'grupo', type: 'doughnut', d: 'Grupos verde, azul y mixto.' },
    { id: 'linea', t: 'Por línea o equipo (Pareto)', en: 'By line or equipment (Pareto)', dim: 'linea', type: 'pareto', top: 15, d: 'Las líneas y equipos con más incidentes y el acumulado.' },
    { id: 'acto', t: 'Acto o condición insegura', en: 'Unsafe act or condition', dim: 'acto', type: 'doughnut', d: 'Origen de los incidentes.' },
    { id: 'stop', t: 'STOP 6', en: 'STOP 6', dim: 'stop', type: 'bar', d: 'Clasificación STOP 6 del riesgo.' },
    { id: 'cuerpo', t: 'Partes del cuerpo', en: 'Body parts', esp: 'cuerpo', dim: 'parte', type: 'hbar', d: 'Lesiones con atención (primer auxilio, tratamiento médico o lesión) por parte del cuerpo.' },
    { id: 'lesion', t: 'Tipo de lesión', en: 'Injury type', dim: 'lesion', type: 'hbar', soloLesion: true, d: 'Diagnóstico de las lesiones con atención.' },
    { id: 'evento', t: 'Tipo de evento', en: 'Event type', dim: 'evento', type: 'bar', d: 'Caídas de material, golpes, choques y otros.' },
    { id: 'antig', t: 'Antigüedad de la persona', en: 'Person seniority', dim: 'antig', type: 'bar', soloLesion: true, d: 'Antigüedad en planta de quien tuvo la lesión, como viene en la base (meses).' },
    { id: 'genero', t: 'Por género', en: 'By gender', dim: 'genero', type: 'pie', soloLesion: true, d: 'Lesiones con atención por género.' },
    { id: 'calor', t: 'Día de la semana y hora', en: 'Weekday and hour', esp: 'calor', d: 'Mapa de calor: en qué día y a qué hora ocurren.' },
    { id: 'tasa', t: 'Tasa por cada 100 personas', en: 'Rate per 100 people', esp: 'tasa', type: 'line', d: 'Incidentes del mes entre la plantilla del mes, por 100.' }
  ];

  const CSS = `.kbd{--b:#DDE5EF;--n:#0B1730;color:#172033}
  .kbd .b-hero{background:linear-gradient(135deg,#0B1730,#1E3A8A);color:#fff;border-radius:18px;padding:20px 22px;display:grid;gap:14px}
  .kbd .b-hero h2{margin:0;font-size:1.3rem} .kbd .b-hero p{margin:0;color:#CBD5E1;font-size:.86rem}
  .kbd .b-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}
  .kbd .b-kpi{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:10px 12px}
  .kbd .b-kpi b{display:block;font-size:1.55rem;line-height:1.1} .kbd .b-kpi span{font-size:.74rem;color:#CBD5E1}
  .kbd .b-nav{position:sticky;top:0;z-index:5;background:#F8FAFC;border-bottom:1px solid var(--b);display:flex;gap:6px;overflow-x:auto;padding:8px 2px;margin:10px 0}
  .kbd .b-nav a{white-space:nowrap;font-size:.76rem;font-weight:600;color:#334155;text-decoration:none;border:1px solid var(--b);background:#fff;border-radius:999px;padding:6px 11px}
  .kbd .b-nav a b{color:#2463EB;margin-right:5px}
  .kbd .b-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:end;margin:10px 0}
  .kbd .b-bar label{display:grid;gap:3px;font-size:.7rem;font-weight:600;color:#475569}
  .kbd .b-bar select{font:inherit;font-size:.82rem;padding:7px 9px;border:1px solid var(--b);border-radius:9px;background:#fff;min-height:36px}
  .kbd .b-btn{font:inherit;font-size:.8rem;font-weight:600;border:1px solid var(--b);background:#fff;border-radius:10px;padding:8px 12px;cursor:pointer;min-height:36px;color:#172033}
  .kbd .b-btn.p{background:#2463EB;border-color:#2463EB;color:#fff} .kbd .b-btn.d{background:#0B1730;border-color:#0B1730;color:#fff}
  .kbd .b-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,520px),1fr));gap:14px}
  .kbd .b-sec{background:#fff;border:1px solid var(--b);border-radius:16px;padding:16px;min-width:0;scroll-margin-top:60px}
  .kbd .b-sec.full{grid-column:1/-1}
  .kbd .b-sh{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px}
  .kbd .b-sh h3{margin:0;font-size:.98rem;color:var(--n)} .kbd .b-sh h3 small{color:#2463EB;font-weight:800;margin-right:6px}
  .kbd .b-sh p{margin:2px 0 0;font-size:.78rem;color:#64748B}
  .kbd .b-gear{border:1px solid var(--b);background:#fff;border-radius:9px;width:36px;height:34px;cursor:pointer;font-size:1rem;flex:none}
  .kbd .b-cv{position:relative;width:100%}
  .kbd .b-heat{border-collapse:collapse;width:100%;font-size:.72rem} .kbd .b-heat th{font-weight:600;color:#475569;padding:4px;text-align:center}
  .kbd .b-heat td{text-align:center;padding:6px 2px;border:2px solid #fff;border-radius:6px;font-weight:700}
  .kbd .b-empty{color:#64748B;font-size:.85rem;padding:20px 0;text-align:center}
  .kbd .b-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:12px;align-items:center} @media(max-width:700px){.kbd .b-body{grid-template-columns:1fr}}
  .kbd-modal{position:fixed;inset:0;background:rgba(11,23,48,.55);z-index:300;display:flex;align-items:center;justify-content:center;padding:14px}
  .kbd-modal .m{background:#fff;border-radius:16px;max-width:720px;width:100%;max-height:92vh;overflow:auto;padding:18px;color:#172033}
  .kbd-modal h3{margin:0 0 10px;font-size:1.05rem} .kbd-modal .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}
  .kbd-modal label{font-size:.78rem;font-weight:600;color:#475569;display:grid;gap:4px}
  .kbd-modal select,.kbd-modal input[type=text],.kbd-modal input[type=number]{font:inherit;font-size:.85rem;padding:7px 9px;border:1px solid #DDE5EF;border-radius:9px;min-height:36px}
  .kbd-modal .tipos{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px}
  .kbd-modal .tipo{border:1px solid #DDE5EF;background:#fff;border-radius:10px;padding:9px;font:inherit;font-size:.78rem;cursor:pointer}
  .kbd-modal .tipo.on{background:#0B1730;color:#fff;border-color:#0B1730}
  .kbd-modal .pal{display:flex;gap:2px;border:2px solid transparent;border-radius:8px;padding:3px;cursor:pointer;background:#fff} .kbd-modal .pal.on{border-color:#2463EB} .kbd-modal .pal i{width:14px;height:18px;border-radius:3px;display:block}
  .kbd-modal .lst{border:1px solid #DDE5EF;border-radius:12px;padding:6px 10px;margin:4px 0;display:flex;gap:8px;align-items:center;font-size:.84rem}
  .kbd-modal .lst span{flex:1} .kbd-modal .mini{border:1px solid #DDE5EF;background:#fff;border-radius:8px;width:34px;height:32px;cursor:pointer}
  .kbd-modal table{border-collapse:collapse;font-size:.78rem} .kbd-modal td,.kbd-modal th{padding:3px 4px;text-align:center} .kbd-modal td input{width:64px}
  .kbd-pres{position:fixed;inset:0;background:#0B1730;z-index:400;display:flex;flex-direction:column;padding:16px}
  .kbd-pres .ph{display:flex;justify-content:space-between;align-items:center;color:#fff;gap:10px;margin-bottom:10px}
  .kbd-pres .pb{flex:1;background:#fff;border-radius:16px;padding:20px;overflow:auto;min-height:0}
  .kbd-pres .pb .b-sec{border:0;padding:0} .kbd-pres .b-btn{background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.25)}`;

  function render(host, data, opts) {
    opts = opts || {};
    const EN = opts.lang === 'en';
    const T = (es, en) => EN && en ? en : es;
    const tt = s => { if (!EN) return s; const m = { 'Sin área': 'No area', 'Sin turno': 'No shift', 'Sin grupo': 'No group', 'Sin línea': 'No line', 'Sin dato': 'No data', 'Sin hora': 'No time', 'Sin parte del cuerpo': 'No body part', 'Sin clasificación': 'Unclassified',
      'Verde': 'Green', 'Azul': 'Blue', 'Mixto': 'Mixed', '1.er turno': '1st shift', '2.º turno': '2nd shift', 'Acto': 'Act', 'Condición': 'Condition', 'Hombre': 'Male', 'Mujer': 'Female',
      'Lesión': 'Injury (lost time)', 'Tratamiento médico': 'Medical treatment', 'Primer auxilio': 'First aid', 'Daño a la propiedad': 'Property damage', 'Casi accidente': 'Near miss', 'Más de 48': 'Over 48' };
      if (m[s]) return m[s]; const i = MESES.indexOf(s); if (i >= 0) return MESES_EN[i]; const j = DIAS.indexOf(s); if (j >= 0) return DIAS_EN[j]; return s; };
    const KF = opts.KF || root.KF;
    if (!document.getElementById('kbd-css')) { const st = document.createElement('style'); st.id = 'kbd-css'; st.textContent = CSS; document.head.appendChild(st); }
    (host.__kbdCharts || []).forEach(c => { try { c.destroy(); } catch (e) {} }); host.__kbdCharts = [];

    // ---------- datos ----------
    const EV = (data.eventos || []).filter(e => /^\d{4}-\d{2}-\d{2}/.test(e.fecha)).map(e => Object.assign({}, e, { _grupos: KF && KF.gruposDeEvento ? KF.gruposDeEvento(e) : (e.parteRE ? [e.parteRE] : []), _zonas: KF && KF.zonasDeEvento ? KF.zonasDeEvento(e) : [] }));
    const cfg0 = data.config || {};
    const S = host.__kbdS || (host.__kbdS = { f: { anio: String(new Date().getFullYear()), area: '', turnoNum: '', grupo: '', clasificacion: '' }, cfg: JSON.parse(JSON.stringify(cfg0)) });
    if (!S.cfg.charts) S.cfg.charts = {}; if (!S.cfg.ocultas) S.cfg.ocultas = []; if (!S.cfg.propias) S.cfg.propias = []; if (!S.cfg.orden) S.cfg.orden = [];
    const anios = [...new Set(EV.map(e => e.fecha.slice(0, 4)))].sort();
    if (S.f.anio && !anios.includes(S.f.anio)) S.f.anio = anios[anios.length - 1] || '';
    const filtrar = (lista, sinAnio) => lista.filter(e => (sinAnio || !S.f.anio || e.fecha.startsWith(S.f.anio)) && (!S.f.area || e.area === S.f.area) && (!S.f.turnoNum || e.turnoNum === S.f.turnoNum)
      && (!S.f.grupo || e.turno === S.f.grupo) && (!S.f.clasificacion || e.clasificacion === S.f.clasificacion));
    const todas = () => SECCIONES.concat(S.cfg.propias.map(p => Object.assign({ propia: true }, p)));
    const seccionesOrden = () => { const t = todas(), ids = t.map(s => s.id); const o = S.cfg.orden.filter(id => ids.includes(id)).concat(ids.filter(id => !S.cfg.orden.includes(id))); return o.map(id => t.find(s => s.id === id)); };
    const visibles = () => seccionesOrden().filter(s => !S.cfg.ocultas.includes(s.id));
    const estilo = s => Object.assign({ type: s.type || 'bar', palette: 'ktmex', labels: true, legend: true, height: 300, top: s.top || 0, serie: s.serie || '', titulo: '' }, S.cfg.charts[s.id] || {});
    let guardarT = null;
    const guardar = () => { if (!opts.puedeEditar) return; clearTimeout(guardarT); guardarT = setTimeout(() => opts.guardarConfig && opts.guardarConfig(S.cfg), 600); };

    // ---------- conteos ----------
    function contar(lista, dim, serie, top) {
      const D = DIMS[dim], SD = serie ? DIMS[serie] : null, M = {}, tot = {};
      lista.forEach(e => { (D.multi ? D.multi(e) : [D.v(e)]).forEach(k => { const sk = SD ? SD.v(e) : '_'; M[k] = M[k] || {}; M[k][sk] = (M[k][sk] || 0) + 1; tot[k] = (tot[k] || 0) + 1; }); });
      let labels = Object.keys(M);
      if (Array.isArray(D.orden)) labels.sort((a, b) => (D.orden.indexOf(a) < 0 ? 99 : D.orden.indexOf(a)) - (D.orden.indexOf(b) < 0 ? 99 : D.orden.indexOf(b)) || a.localeCompare(b));
      else if (D.orden === 'alfa') labels.sort();
      else labels.sort((a, b) => tot[b] - tot[a]);
      if (top && labels.length > top && !Array.isArray(D.orden)) { const resto = labels.slice(top); labels = labels.slice(0, top); const o = {}; resto.forEach(k => Object.keys(M[k]).forEach(s => o[s] = (o[s] || 0) + M[k][s])); if (resto.length) { const R = (EN ? 'Rest' : 'Resto') + ' (' + resto.length + ')'; labels.push(R); M[R] = o; tot[R] = resto.reduce((a, k) => a + tot[k], 0); } }
      let series = SD ? [...new Set(lista.map(e => SD.v(e)))] : ['_'];
      if (SD && Array.isArray(SD.orden)) series.sort((a, b) => (SD.orden.indexOf(a) < 0 ? 99 : SD.orden.indexOf(a)) - (SD.orden.indexOf(b) < 0 ? 99 : SD.orden.indexOf(b)));
      else if (SD) series.sort();
      return { labels, series, val: (l, s) => (M[l] && M[l][s]) || 0, tot: l => tot[l] || 0 };
    }

    // ---------- etiquetas con el valor ----------
    const valores = { id: 'kbdValores', afterDatasetsDraw(ch, a, o) {
      if (!ch.options.plugins.kbdValores || !ch.options.plugins.kbdValores.on) return;
      const { ctx } = ch; ctx.save(); ctx.font = '600 11px Inter,system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const radial = ['doughnut', 'pie', 'polarArea'].includes(ch.config.type), apil = ch.options.scales && ch.options.scales.x && ch.options.scales.x.stacked;
      ch.data.datasets.forEach((ds, di) => { const meta = ch.getDatasetMeta(di); if (meta.hidden || ds.type === 'line' && ch.config.type === 'bar') return;
        meta.data.forEach((el, i) => { const v = ds.data[i]; if (!v) return;
          if (radial) { const p = el.tooltipPosition(); ctx.fillStyle = '#fff'; ctx.fillText(v, p.x, p.y); return; }
          if (ch.config.type === 'radar') return;
          const hor = ch.options.indexAxis === 'y';
          if (apil) { if (v < 2) return; const p = el.tooltipPosition(); ctx.fillStyle = '#fff'; ctx.fillText(v, hor ? (el.x + el.base) / 2 : p.x, hor ? p.y : (el.y + el.base) / 2); return; }
          ctx.fillStyle = '#334155'; if (hor) { ctx.textAlign = 'left'; ctx.fillText(v, el.x + 5, el.y); ctx.textAlign = 'center'; } else ctx.fillText(v, el.x, el.y - 9); }); });
      ctx.restore(); } };

    function chart(canvas, s, lista) {
      if (!root.Chart) { canvas.parentNode.innerHTML = `<div class="b-empty">${esc(T('No se cargó la librería de gráficas (Chart.js).', 'The chart library (Chart.js) did not load.'))}</div>`; return; }
      const st = estilo(s), pal = PALETAS[st.palette] || PALETAS.ktmex;
      const serie = st.type === 'pareto' || ['doughnut', 'pie', 'polar'].includes(st.type) ? '' : st.serie;
      const c = contar(lista, s.dim, serie, st.top || (s.dim === 'linea' ? 15 : 0));
      if (!c.labels.length) { canvas.parentNode.innerHTML = `<div class="b-empty">${esc(T('Sin datos con estos filtros.', 'No data with these filters.'))}</div>`; return; }
      const lab = c.labels.map(tt);
      const colorDe = (k, i) => (serie === 'clasificacion' || (!serie && s.dim === 'clasificacion')) && CLASIF_COLOR[k] ? CLASIF_COLOR[k] : pal[i % pal.length];
      let type = st.type, cfg;
      const radial = ['doughnut', 'pie', 'polar'].includes(type);
      if (radial) {
        cfg = { type: type === 'polar' ? 'polarArea' : type, data: { labels: lab, datasets: [{ data: c.labels.map(l => c.tot(l)), backgroundColor: c.labels.map((l, i) => colorDe(l, i) + (type === 'polar' ? 'CC' : '')), borderColor: '#fff', borderWidth: 2 }] },
          options: { cutout: type === 'doughnut' ? '58%' : undefined, plugins: { legend: { display: st.legend, position: 'bottom' } } } };
      } else if (type === 'pareto') {
        const v = c.labels.map(l => c.tot(l)), t = v.reduce((a, b) => a + b, 0) || 1; let acc = 0; const cum = v.map(x => Math.round((acc += x) / t * 1000) / 10);
        cfg = { type: 'bar', data: { labels: lab, datasets: [{ type: 'bar', label: T('Incidentes', 'Incidents'), data: v, backgroundColor: pal[0], borderRadius: 4, yAxisID: 'y', order: 2 },
          { type: 'line', label: T('% acumulado', 'Cumulative %'), data: cum, borderColor: pal[3] || '#DC2626', backgroundColor: pal[3] || '#DC2626', yAxisID: 'y1', tension: .25, pointRadius: 3, order: 1 }] },
          options: { scales: { y: { beginAtZero: true, grid: { color: '#EEF2F7' } }, y1: { position: 'right', min: 0, max: 100, grid: { display: false }, ticks: { callback: x => x + '%' } }, x: { grid: { display: false } } }, plugins: { legend: { display: st.legend } } } };
      } else {
        const ds = c.series.map((sk, i) => ({ label: sk === '_' ? T('Incidentes', 'Incidents') : tt(sk), data: c.labels.map(l => c.val(l, sk)),
          backgroundColor: c.series.length === 1 && !serie ? c.labels.map((l, j) => type === 'line' || type === 'area' || type === 'radar' ? pal[0] : colorDe(l, j)) : colorDe(sk, i) + (type === 'area' || type === 'radar' ? '33' : ''),
          borderColor: c.series.length === 1 && !serie ? pal[0] : colorDe(sk, i), borderWidth: type === 'line' || type === 'area' || type === 'radar' ? 2.5 : 0, borderRadius: 4, tension: .3, fill: type === 'area' || type === 'radar', pointRadius: 3 }));
        const jsType = type === 'hbar' || type === 'stacked' ? 'bar' : type === 'area' ? 'line' : type;
        cfg = { type: jsType, data: { labels: lab, datasets: ds }, options: { indexAxis: type === 'hbar' ? 'y' : 'x', plugins: { legend: { display: st.legend && (ds.length > 1 || type === 'radar'), position: 'bottom' } } } };
        if (jsType !== 'radar') cfg.options.scales = { x: { stacked: type === 'stacked', grid: { display: type === 'hbar' }, ticks: { autoSkip: false, maxRotation: 60 } }, y: { stacked: type === 'stacked', beginAtZero: true, grid: { color: '#EEF2F7' }, ticks: { precision: 0 } } };
        if (type === 'hbar') cfg.options.scales = { x: { beginAtZero: true, grid: { color: '#EEF2F7' }, ticks: { precision: 0 } }, y: { grid: { display: false }, ticks: { autoSkip: false } } };
      }
      cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false, animation: { duration: 300 }, layout: { padding: { top: 18, right: type === 'hbar' ? 28 : 8 } } }, cfg.options);
      cfg.options.plugins = Object.assign({ kbdValores: { on: st.labels } }, cfg.options.plugins);
      cfg.plugins = [valores];
      const ch = new root.Chart(canvas, cfg); host.__kbdCharts.push(ch); return ch;
    }

    // ---------- secciones especiales ----------
    function resumen(lista) {
      const n = k => lista.filter(e => e.clasificacion === k).length, les = lista.filter(e => LESION[e.clasificacion]).length;
      const actos = lista.filter(e => e.acto === 'Acto').length, conAc = lista.filter(e => e.acto).length;
      const hoy = new Date(); hoy.setHours(12, 0, 0, 0);
      const ult = EV.filter(e => e.clasificacion === 'Lesión' || e.diasPerdidos > 0).map(e => e.fecha).sort().pop();
      const dias = ult ? Math.max(0, Math.round((hoy - new Date(ult + 'T12:00:00')) / 864e5)) : '—';
      const pl = data.plantilla || {}, y = S.f.anio, meses = y ? Object.keys(pl).filter(k => k.startsWith(y + '-')) : [];
      const prom = meses.length ? meses.reduce((a, k) => a + pl[k], 0) / meses.length : (pl[y] || 0);
      const tasa = prom ? (lista.length / prom * 100).toFixed(1) : '—';
      const k = [[lista.length, T('Incidentes', 'Incidents')], [les, T('Lesiones con atención', 'Injuries with treatment')], [n('Lesión'), T('Con tiempo perdido', 'Lost time')], [n('Daño a la propiedad'), T('Daños a la propiedad', 'Property damage')],
        [n('Casi accidente'), T('Casi accidentes', 'Near misses')], [dias, T('Días sin tiempo perdido', 'Days without lost time')], [conAc ? Math.round(actos / conAc * 100) + '%' : '—', T('Por actos inseguros', 'From unsafe acts')], [tasa, T('Por cada 100 personas', 'Per 100 people') + (y ? ' · ' + y : '')]];
      return `<div class="b-kpis" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))">${k.map(x => `<div class="b-kpi" style="background:#F1F5F9;border-color:#E2E8F0"><b style="color:#0B1730">${esc(x[0])}</b><span style="color:#475569">${esc(x[1])}</span></div>`).join('')}</div>`;
    }
    function calor(lista) {
      const M = {}; let max = 0; const horas = Array.from({ length: 12 }, (_, i) => i * 2);
      lista.forEach(e => { const h = parseInt(e.hora, 10); if (isNaN(h)) return; const d = (new Date(e.fecha + 'T12:00:00').getDay() + 6) % 7, k = d + '-' + (h - h % 2); M[k] = (M[k] || 0) + 1; max = Math.max(max, M[k]); });
      if (!max) return `<div class="b-empty">${esc(T('Sin datos de hora con estos filtros.', 'No time data with these filters.'))}</div>`;
      return `<div style="overflow-x:auto"><table class="b-heat"><thead><tr><th></th>${horas.map(h => `<th>${String(h).padStart(2, '0')}</th>`).join('')}</tr></thead><tbody>${DIAS.map((d, i) => `<tr><th style="text-align:left">${esc(tt(d).slice(0, 3))}</th>${horas.map(h => { const v = M[i + '-' + h] || 0, a = v / max;
        return `<td title="${esc(tt(d))} ${h}–${h + 2} h: ${v}" style="background:${v ? `rgba(220,38,38,${(0.12 + a * 0.78).toFixed(2)})` : '#F1F5F9'};color:${a > .5 ? '#fff' : '#334155'}">${v || ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    function tasa(canvas, s) {
      if (!root.Chart) return;
      const lista = filtrar(EV, true), pl = data.plantilla || {}, st = estilo(s), pal = PALETAS[st.palette] || PALETAS.ktmex;
      const ys = S.f.anio ? [S.f.anio] : anios.slice(-3); const labels = MESES.map(tt);
      const ds = ys.map((y, i) => ({ label: y, data: MESES.map((_, m) => { const k = y + '-' + String(m + 1).padStart(2, '0'), p = pl[k] || pl[y]; const n = lista.filter(e => e.fecha.startsWith(k)).length; return p ? Math.round(n / p * 1000) / 10 : null; }),
        borderColor: pal[i % pal.length], backgroundColor: pal[i % pal.length] + (st.type === 'area' ? '33' : ''), fill: st.type === 'area', tension: .3, borderWidth: 2.5, pointRadius: 3, borderRadius: 4 }));
      const type = st.type === 'area' ? 'line' : (['line', 'bar'].includes(st.type) ? st.type : 'line');
      const ch = new root.Chart(canvas, { type, data: { labels, datasets: ds }, plugins: [valores], options: { responsive: true, maintainAspectRatio: false, layout: { padding: { top: 18 } }, plugins: { kbdValores: { on: st.labels }, legend: { display: st.legend, position: 'bottom' } }, scales: { y: { beginAtZero: true, grid: { color: '#EEF2F7' } }, x: { grid: { display: false } } } } });
      host.__kbdCharts.push(ch);
    }

    // ---------- pantalla ----------
    function opcionesFiltro(k, lista) { return [...new Set(lista.map(e => k === 'turnoNum' ? e.turnoNum : k === 'grupo' ? e.turno : e[k]).filter(Boolean))].sort((a, b) => k === 'clasificacion' ? ORDEN_CLASIF.indexOf(a) - ORDEN_CLASIF.indexOf(b) : String(a).localeCompare(String(b))); }
    function pintar() {
      (host.__kbdCharts || []).forEach(c => { try { c.destroy(); } catch (e) {} }); host.__kbdCharts = [];
      const lista = filtrar(EV), vis = visibles();
      const totAll = EV.length;
      const fsel = (k, lbl, ops, f) => `<label>${esc(lbl)}<select data-f="${k}"><option value="">${esc(T('Todos', 'All'))}</option>${ops.map(o => `<option value="${esc(o)}" ${S.f[k] === o ? 'selected' : ''}>${esc(f ? f(o) : tt(o))}</option>`).join('')}</select></label>`;
      host.classList.add('kbd', 'no-i18n');
      host.innerHTML = `<header class="b-hero" style="padding:12px 18px"><div><p style="color:#E2E8F0">${esc(T('Comunicados del sistema y base de incidentes de Safety desde 2022.', 'System communications and Safety incident base since 2022.'))} ${esc(lista.length)} ${esc(T('de', 'of'))} ${totAll} ${esc(T('incidentes con los filtros actuales.', 'incidents with the current filters.'))}</p></div></header>
        <div class="b-bar">${fsel('anio', T('Año', 'Year'), anios, x => x)}${fsel('area', T('Área', 'Area'), opcionesFiltro('area', EV))}${fsel('turnoNum', T('Turno', 'Shift'), ['1', '2'], x => tt(x === '1' ? '1.er turno' : '2.º turno'))}${fsel('grupo', T('Grupo', 'Group'), opcionesFiltro('grupo', EV))}${fsel('clasificacion', T('Clasificación', 'Classification'), opcionesFiltro('clasificacion', EV))}
          <button class="b-btn d" type="button" data-k="pres">▶ ${esc(T('Presentar', 'Present'))}</button>${opts.puedeEditar ? `<button class="b-btn" type="button" data-k="secs">☰ ${esc(T('Secciones', 'Sections'))} (${vis.length}/${todas().length})</button><button class="b-btn" type="button" data-k="nueva">＋ ${esc(T('Nueva gráfica', 'New chart'))}</button><button class="b-btn" type="button" data-k="pl">👥 ${esc(T('Plantilla', 'Headcount'))}</button>` : ''}</div>
        <nav class="b-nav">${vis.map((s, i) => `<a href="#kbd-${esc(s.id)}" data-go="${esc(s.id)}"><b>${i + 1}</b>${esc(nombre(s))}</a>`).join('')}</nav>
        <div class="b-grid">${vis.map((s, i) => seccionHTML(s, i)).join('')}</div>`;
      dibujarSecciones(host, vis, lista);
      host.querySelectorAll('[data-f]').forEach(x => x.onchange = () => { S.f[x.dataset.f] = x.value; pintar(); });
      host.querySelectorAll('[data-go]').forEach(a => a.onclick = (ev) => { ev.preventDefault(); const el = host.querySelector('#kbd-' + a.dataset.go); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      const b = k => host.querySelector(`[data-k="${k}"]`);
      b('pres').onclick = () => presentar(0);
      if (opts.puedeEditar) { b('secs').onclick = menuSecciones; b('nueva').onclick = () => editorPropia(null); b('pl').onclick = editorPlantilla; }
      host.querySelectorAll('[data-gear]').forEach(g => g.onclick = () => studio(g.dataset.gear));
    }
    const nombre = s => (S.cfg.charts[s.id] && S.cfg.charts[s.id].titulo) || (EN && s.en ? s.en : s.t);
    function seccionHTML(s, i, pres) {
      const full = s.esp === 'resumen' || s.esp === 'cuerpo' || s.esp === 'calor' || s.id === 'linea' || s.id === 'tendencia';
      const gear = opts.puedeEditar && s.esp !== 'resumen' && s.esp !== 'calor' && !pres ? `<button class="b-gear" type="button" data-gear="${esc(s.id)}" title="${esc(T('Editar gráfica', 'Edit chart'))}">⚙</button>` : '';
      const st = estilo(s);
      const cuerpo = s.esp === 'cuerpo' ? `<div class="b-body"><div data-cuerpo></div><div class="b-cv" style="height:${st.height}px"><canvas></canvas></div></div>`
        : s.esp === 'resumen' || s.esp === 'calor' ? `<div data-esp="${s.esp}"></div>` : `<div class="b-cv" style="height:${pres ? 'calc(100vh - 220px)' : st.height + 'px'}"><canvas></canvas></div>`;
      return `<section class="b-sec ${full ? 'full' : ''}" id="kbd-${esc(s.id)}" data-sec="${esc(s.id)}"><div class="b-sh"><div><h3><small>${i + 1}</small>${esc(nombre(s))}</h3>${s.d || s.desc ? `<p>${esc(s.d || s.desc)}${s.soloLesion ? '' : ''}</p>` : ''}</div>${gear}</div>${cuerpo}</section>`;
    }
    function dibujarSecciones(box, secs, lista) {
      secs.forEach(s => {
        const el = box.querySelector(`[data-sec="${CSS_ESC(s.id)}"]`); if (!el) return;
        const base = s.todosAnios ? filtrar(EV, true) : lista, l = s.soloLesion || s.esp === 'cuerpo' ? base.filter(e => LESION[e.clasificacion]) : base;
        if (s.esp === 'resumen') { el.querySelector('[data-esp]').innerHTML = resumen(lista); return; }
        if (s.esp === 'calor') { el.querySelector('[data-esp]').innerHTML = calor(lista); return; }
        if (s.esp === 'tasa') { tasa(el.querySelector('canvas'), s); return; }
        if (s.esp === 'cuerpo') {
          const z = {}; l.forEach(e => e._zonas.forEach(k => z[k] = (z[k] || 0) + 1));
          const c = el.querySelector('[data-cuerpo]'); c.innerHTML = KF && KF.cuerpoSVG ? KF.cuerpoSVG([], z, false) : '';
        }
        const cv = el.querySelector('canvas'); if (cv) chart(cv, s, l);
      });
    }
    const CSS_ESC = s => String(s).replace(/["\\]/g, '\\$&');

    // ---------- modo presentación ----------
    function presentar(i) {
      const vis = visibles(); if (!vis.length) return;
      i = (i + vis.length) % vis.length;
      let ov = document.getElementById('kbd-pres'); if (!ov) { ov = document.createElement('div'); ov.id = 'kbd-pres'; ov.className = 'kbd-pres kbd no-i18n'; document.body.appendChild(ov); }
      const s = vis[i];
      ov.innerHTML = `<div class="ph"><b>${esc(T('Board de incidentes', 'Incident board'))} · ${i + 1} / ${vis.length}${S.f.anio ? ' · ' + esc(S.f.anio) : ''}</b><span style="display:flex;gap:6px"><button class="b-btn" type="button" data-p="-1">◀</button><button class="b-btn" type="button" data-p="1">▶</button><button class="b-btn" type="button" data-p="x">✕ ${esc(T('Salir', 'Exit'))}</button></span></div><div class="pb">${seccionHTML(s, i, true)}</div>`;
      dibujarSecciones(ov, [s], filtrar(EV));
      ov.querySelectorAll('[data-p]').forEach(b => b.onclick = () => b.dataset.p === 'x' ? cerrarPres() : presentar(i + Number(b.dataset.p)));
      document.onkeydown = ev => { if (!document.getElementById('kbd-pres')) return; if (ev.key === 'ArrowRight' || ev.key === ' ') presentar(i + 1); else if (ev.key === 'ArrowLeft') presentar(i - 1); else if (ev.key === 'Escape') cerrarPres(); };
      try { if (ov.requestFullscreen && !document.fullscreenElement) ov.requestFullscreen().catch(() => {}); } catch (e) {}
    }
    function cerrarPres() { const ov = document.getElementById('kbd-pres'); if (ov) ov.remove(); document.onkeydown = null; try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} pintar(); }

    // ---------- editor de gráficas (solo permiso «board») ----------
    function modal(html, alPintar) {
      let m = document.getElementById('kbd-modal'); if (m) m.remove();
      m = document.createElement('div'); m.id = 'kbd-modal'; m.className = 'kbd-modal no-i18n'; m.innerHTML = `<div class="m" role="dialog">${html}</div>`;
      m.onclick = e => { if (e.target === m) m.remove(); }; document.body.appendChild(m); alPintar && alPintar(m); return m;
    }
    function studio(id) {
      const s = todas().find(x => x.id === id); if (!s) return;
      const st = estilo(s), especial = s.esp === 'tasa' || s.esp === 'cuerpo';
      const tipos = s.esp === 'tasa' ? TIPOS.filter(t => ['line', 'area', 'bar'].includes(t[0])) : TIPOS;
      modal(`<h3>⚙ ${esc(T('Editar gráfica', 'Edit chart'))}: ${esc(nombre(s))}</h3>
        <label>${esc(T('Título', 'Title'))}<input type="text" data-c="titulo" value="${esc(st.titulo || '')}" placeholder="${esc(EN && s.en ? s.en : s.t)}"></label>
        <div style="margin-top:10px;font-size:.78rem;font-weight:600;color:#475569">${esc(T('Tipo de gráfica', 'Chart type'))}</div>
        <div class="tipos" style="margin-top:4px">${tipos.map(t => `<button type="button" class="tipo ${st.type === t[0] ? 'on' : ''}" data-tipo="${t[0]}">${esc(EN ? TIPO_EN[t[1]] : t[1])}</button>`).join('')}</div>
        <div class="row">${especial ? '' : `<label>${esc(T('Dividir por (series)', 'Split by (series)'))}<select data-c="serie"><option value="">${esc(T('Sin dividir', 'No split'))}</option>${Object.keys(DIMS).filter(k => k !== s.dim).map(k => `<option value="${k}" ${st.serie === k ? 'selected' : ''}>${esc(EN ? DIMS[k].en : DIMS[k].t)}</option>`).join('')}</select></label>
          <label>${esc(T('Mostrar los primeros (0 = todos)', 'Show top (0 = all)'))}<input type="number" min="0" max="50" data-c="top" value="${st.top || 0}"></label>`}
          <label>${esc(T('Altura (px)', 'Height (px)'))}<input type="number" min="180" max="700" step="20" data-c="height" value="${st.height}"></label></div>
        <div class="row"><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-c="labels" ${st.labels ? 'checked' : ''}>${esc(T('Mostrar valores', 'Show values'))}</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-c="legend" ${st.legend ? 'checked' : ''}>${esc(T('Mostrar leyenda', 'Show legend'))}</label></div>
        <div style="font-size:.78rem;font-weight:600;color:#475569">${esc(T('Colores', 'Colors'))}</div>
        <div class="row">${Object.keys(PALETAS).map(p => `<button type="button" class="pal ${st.palette === p ? 'on' : ''}" data-pal="${p}" title="${p}">${PALETAS[p].slice(0, 6).map(c => `<i style="background:${c}"></i>`).join('')}</button>`).join('')}</div>
        <p style="font-size:.76rem;color:#64748B">${esc(T('Los cambios se guardan solos y los ve todo el equipo.', 'Changes save automatically and the whole team sees them.'))}</p>
        <div class="row" style="justify-content:space-between"><button type="button" class="b-btn" data-x="reset" style="font:inherit;border:1px solid #DDE5EF;border-radius:10px;padding:8px 12px;background:#fff;cursor:pointer">${esc(T('Restablecer', 'Reset'))}</button><button type="button" data-x="ok" style="font:inherit;border:0;border-radius:10px;padding:8px 16px;background:#2463EB;color:#fff;cursor:pointer;font-weight:600">${esc(T('Listo', 'Done'))}</button></div>`,
        m => {
          const set = (k, v) => { S.cfg.charts[id] = Object.assign({}, S.cfg.charts[id] || {}, { [k]: v }); guardar(); pintar(); };
          m.querySelectorAll('[data-tipo]').forEach(b => b.onclick = () => { m.querySelectorAll('[data-tipo]').forEach(x => x.classList.toggle('on', x === b)); set('type', b.dataset.tipo); });
          m.querySelectorAll('[data-pal]').forEach(b => b.onclick = () => { m.querySelectorAll('[data-pal]').forEach(x => x.classList.toggle('on', x === b)); set('palette', b.dataset.pal); });
          m.querySelectorAll('[data-c]').forEach(i => i.onchange = () => set(i.dataset.c, i.type === 'checkbox' ? i.checked : i.type === 'number' ? Number(i.value) || 0 : i.value));
          m.querySelector('[data-x="reset"]').onclick = () => { delete S.cfg.charts[id]; guardar(); pintar(); m.remove(); };
          m.querySelector('[data-x="ok"]').onclick = () => m.remove();
        });
    }
    function menuSecciones() {
      const dibuja = m => {
        const ord = seccionesOrden();
        m.querySelector('.m').innerHTML = `<h3>☰ ${esc(T('Secciones del board', 'Board sections'))}</h3><p style="font-size:.8rem;color:#64748B;margin:0 0 8px">${esc(T('Muestra u oculta secciones y cambia su orden. Lo ve todo el equipo.', 'Show or hide sections and change their order. The whole team sees it.'))}</p>
          ${ord.map((s, i) => `<div class="lst"><input type="checkbox" data-v="${esc(s.id)}" ${S.cfg.ocultas.includes(s.id) ? '' : 'checked'}><span>${i + 1}. ${esc(nombre(s))}${s.propia ? ` <small style="color:#2463EB">(${esc(T('propia', 'custom'))})</small>` : ''}</span><button class="mini" type="button" data-u="${i}" ${i ? '' : 'disabled'}>▲</button><button class="mini" type="button" data-d="${i}" ${i < ord.length - 1 ? '' : 'disabled'}>▼</button>${s.propia ? `<button class="mini" type="button" data-e="${esc(s.id)}" title="${esc(T('Editar', 'Edit'))}">✎</button><button class="mini" type="button" data-b="${esc(s.id)}" title="${esc(T('Borrar', 'Delete'))}">🗑</button>` : ''}</div>`).join('')}
          <div class="row" style="justify-content:flex-end"><button type="button" data-x="ok" style="font:inherit;border:0;border-radius:10px;padding:8px 16px;background:#2463EB;color:#fff;cursor:pointer;font-weight:600">${esc(T('Listo', 'Done'))}</button></div>`;
        const mover = (i, d) => { const ids = seccionesOrden().map(s => s.id); [ids[i], ids[i + d]] = [ids[i + d], ids[i]]; S.cfg.orden = ids; guardar(); pintar(); dibuja(m); };
        m.querySelectorAll('[data-v]').forEach(c => c.onchange = () => { const id = c.dataset.v; S.cfg.ocultas = S.cfg.ocultas.filter(x => x !== id); if (!c.checked) S.cfg.ocultas.push(id); guardar(); pintar(); });
        m.querySelectorAll('[data-u]').forEach(b => b.onclick = () => mover(+b.dataset.u, -1));
        m.querySelectorAll('[data-d]').forEach(b => b.onclick = () => mover(+b.dataset.d, 1));
        m.querySelectorAll('[data-e]').forEach(b => b.onclick = () => editorPropia(b.dataset.e));
        m.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { S.cfg.propias = S.cfg.propias.filter(p => p.id !== b.dataset.b); delete S.cfg.charts[b.dataset.b]; guardar(); pintar(); dibuja(m); });
        m.querySelector('[data-x="ok"]').onclick = () => m.remove();
      };
      modal('', dibuja);
    }
    function editorPropia(id) {
      const p = id ? S.cfg.propias.find(x => x.id === id) : { id: 'p' + Date.now().toString(36), t: '', dim: 'area', serie: '', type: 'bar', soloLesion: false };
      const opsDim = sel => Object.keys(DIMS).map(k => `<option value="${k}" ${sel === k ? 'selected' : ''}>${esc(EN ? DIMS[k].en : DIMS[k].t)}</option>`).join('');
      modal(`<h3>＋ ${esc(id ? T('Editar gráfica propia', 'Edit custom chart') : T('Nueva gráfica', 'New chart'))}</h3>
        <p style="font-size:.8rem;color:#64748B;margin:0 0 8px">${esc(T('Elige qué dato quieres ver, si lo quieres dividir por otro y el tipo de gráfica. Usa los mismos filtros del board.', 'Choose what to see, whether to split it by another field and the chart type. It uses the board filters.'))}</p>
        <label>${esc(T('Título', 'Title'))}<input type="text" data-p="t" value="${esc(p.t)}" placeholder="${esc(T('Ej. Área contra STOP 6', 'E.g. Area vs STOP 6'))}"></label>
        <div class="row"><label>${esc(T('Dato (eje)', 'Field (axis)'))}<select data-p="dim">${opsDim(p.dim)}</select></label><label>${esc(T('Dividir por', 'Split by'))}<select data-p="serie"><option value="">${esc(T('Sin dividir', 'No split'))}</option>${opsDim(p.serie)}</select></label>
          <label>${esc(T('Tipo', 'Type'))}<select data-p="type">${TIPOS.map(t => `<option value="${t[0]}" ${p.type === t[0] ? 'selected' : ''}>${esc(EN ? TIPO_EN[t[1]] : t[1])}</option>`).join('')}</select></label></div>
        <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-p="soloLesion" ${p.soloLesion ? 'checked' : ''}>${esc(T('Solo lesiones con atención (primer auxilio, tratamiento médico o lesión)', 'Only injuries with treatment'))}</label>
        <div class="row" style="justify-content:flex-end"><button type="button" data-x="no" style="font:inherit;border:1px solid #DDE5EF;border-radius:10px;padding:8px 12px;background:#fff;cursor:pointer">${esc(T('Cancelar', 'Cancel'))}</button><button type="button" data-x="ok" style="font:inherit;border:0;border-radius:10px;padding:8px 16px;background:#2463EB;color:#fff;cursor:pointer;font-weight:600">${esc(T('Guardar', 'Save'))}</button></div>`,
        m => {
          m.querySelector('[data-x="no"]').onclick = () => m.remove();
          m.querySelector('[data-x="ok"]').onclick = () => {
            const v = k => m.querySelector(`[data-p="${k}"]`);
            const n = { id: p.id, t: v('t').value.trim() || (DIMS[v('dim').value].t + (v('serie').value ? ' · ' + DIMS[v('serie').value].t : '')), en: '', dim: v('dim').value, serie: v('serie').value === v('dim').value ? '' : v('serie').value, type: v('type').value, soloLesion: v('soloLesion').checked }; n.todosAnios = n.dim === 'anio' || n.serie === 'anio';
            S.cfg.propias = S.cfg.propias.filter(x => x.id !== n.id).concat([n]); delete S.cfg.charts[n.id];
            guardar(); m.remove(); pintar(); const el = host.querySelector('#kbd-' + n.id); if (el) el.scrollIntoView({ behavior: 'smooth' });
          };
        });
    }
    function editorPlantilla() {
      const pl = Object.assign({}, data.plantilla || {}), hoyY = new Date().getFullYear(), ys = []; for (let y = Math.min(2023, hoyY); y <= hoyY + 1; y++) ys.push(y);
      modal(`<h3>👥 ${esc(T('Plantilla (head count) por mes', 'Monthly headcount'))}</h3><p style="font-size:.8rem;color:#64748B;margin:0 0 8px">${esc(T('Se usa para la tasa por cada 100 personas. Deja vacío un mes para no calcularlo.', 'Used for the rate per 100 people. Leave a month blank to skip it.'))}</p>
        <div style="overflow-x:auto"><table><thead><tr><th></th>${MESES.map(m => `<th>${esc(tt(m))}</th>`).join('')}</tr></thead><tbody>${ys.map(y => `<tr><th>${y}</th>${MESES.map((_, i) => { const k = y + '-' + String(i + 1).padStart(2, '0'); return `<td><input type="number" min="0" data-pl="${k}" value="${pl[k] || ''}"></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="row" style="justify-content:flex-end"><button type="button" data-x="no" style="font:inherit;border:1px solid #DDE5EF;border-radius:10px;padding:8px 12px;background:#fff;cursor:pointer">${esc(T('Cancelar', 'Cancel'))}</button><button type="button" data-x="ok" style="font:inherit;border:0;border-radius:10px;padding:8px 16px;background:#2463EB;color:#fff;cursor:pointer;font-weight:600">${esc(T('Guardar', 'Save'))}</button></div>`,
        m => {
          m.querySelector('[data-x="no"]').onclick = () => m.remove();
          m.querySelector('[data-x="ok"]').onclick = async () => {
            const p = {}; m.querySelectorAll('[data-pl]').forEach(i => { p[i.dataset.pl] = Number(i.value) || 0; });
            const r = opts.guardarPlantilla ? await opts.guardarPlantilla(p) : null;
            if (r && r.plantilla) { data.plantilla = r.plantilla; m.remove(); pintar(); }
          };
        });
    }
    pintar();
    return { refrescar: pintar };
  }
  root.KBD = { render, VERSION: '0.11.0', SECCIONES, DIMS };
})(typeof window !== 'undefined' ? window : this);
