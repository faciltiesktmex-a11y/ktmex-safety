/* ════════════════════════════════════════════════════════════════════
   KTMEX Safety — Board de incidentes (v0.11)
   Versión del «Facilities follow up board» enfocada en incidentes: secciones con gráficas,
   filtros, barra de secciones, modo presentación y editor de gráficas.
     KBD.render(contenedor, datos, {lang, KF, puedeEditar, guardarConfig(cfg), guardarPlantilla(p)})
   · datos = respuesta de boardDatos (eventos, plantilla, config).
   · Solo quien tiene el permiso «board» ve «⚙ Personalizar» (panel lateral como en Facilities), el menú de secciones y la plantilla;
     lo que guardan lo ven todos.
   ════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PALETAS = {
    original: ['#2463EB', '#F59E0B', '#16A34A', '#DC2626', '#7C3AED', '#0EA5E9', '#DB2777', '#65A30D', '#EA580C', '#0F766E', '#64748B', '#A16207'],
    oceano: ['#0EA5E9', '#2563EB', '#06B6D4', '#6366F1', '#0891B2', '#38BDF8', '#1D4ED8', '#14B8A6', '#818CF8', '#0284C7', '#155E75', '#4F46E5'],
    atardecer: ['#F97316', '#EF4444', '#F59E0B', '#EC4899', '#FB7185', '#EAB308', '#DC2626', '#F43F5E', '#FBBF24', '#C2410C', '#9F1239', '#D97706'],
    bosque: ['#16A34A', '#65A30D', '#0D9488', '#15803D', '#84CC16', '#059669', '#4D7C0F', '#22C55E', '#10B981', '#166534', '#A3E635', '#047857'],
    violeta: ['#7C3AED', '#A855F7', '#6366F1', '#D946EF', '#8B5CF6', '#C084FC', '#4F46E5', '#E879F9', '#6D28D9', '#9333EA', '#A78BFA', '#C026D3'],
    neon: ['#22D3EE', '#A3E635', '#F472B6', '#FACC15', '#818CF8', '#FB923C', '#34D399', '#F87171', '#60A5FA', '#C084FC', '#2DD4BF', '#FDE047'],
    pastel: ['#93C5FD', '#FCA5A5', '#86EFAC', '#FDE68A', '#C4B5FD', '#F9A8D4', '#A5F3FC', '#FDBA74', '#BEF264', '#D8B4FE', '#CBD5E1', '#FECACA'],
    daltonico: ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#56B4E9', '#D55E00', '#F0E442', '#000000', '#999999', '#882255', '#44AA99', '#117733'],
    mono: ['#0F172A', '#334155', '#475569', '#64748B', '#94A3B8', '#CBD5E1', '#1E293B', '#52525B', '#71717A', '#A1A1AA', '#D4D4D8', '#3F3F46']
  };
  const PAL_NOM = { original: ['Original', 'Original'], oceano: ['Océano', 'Ocean'], atardecer: ['Atardecer', 'Sunset'], bosque: ['Bosque', 'Forest'], violeta: ['Violeta', 'Violet'], neon: ['Neón', 'Neon'], pastel: ['Pastel', 'Pastel'], daltonico: ['Apto daltonismo', 'Color-blind safe'], mono: ['Monocromo', 'Mono'] };
  const PAL_ANT = { ktmex: 'original', gris: 'mono' };   // nombres de la 0.11.0
  const CLASIF_COLOR = { 'Lesión': '#B91C1C', 'Tratamiento médico': '#EA580C', 'Primer auxilio': '#F59E0B', 'Daño a la propiedad': '#2463EB', 'Casi accidente': '#16A34A' };
  const ICO = inner => `<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">${inner}</svg>`;
  const TIPOS = [
    ['line', 'Líneas', 'Lines', 'cart', ICO('<polyline points="3,18 9,10 14,14 21,5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="10" r="1.8"/><circle cx="14" cy="14" r="1.8"/><circle cx="21" cy="5" r="1.8"/>')],
    ['area', 'Área', 'Area', 'cart', ICO('<path d="M3 20V17L9 10L14 14L21 5V20Z" opacity=".3"/><polyline points="3,17 9,10 14,14 21,5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>')],
    ['stepped', 'Línea escalonada', 'Step line', 'cart', ICO('<polyline points="3,19 8,19 8,13 13,13 13,7 21,7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>')],
    ['bar', 'Barras', 'Bars', 'cart', ICO('<rect x="3.5" y="11" width="4.5" height="9" rx="1"/><rect x="9.8" y="4" width="4.5" height="16" rx="1"/><rect x="16" y="8" width="4.5" height="12" rx="1"/>')],
    ['hbar', 'Barras horizontales', 'Horizontal bars', 'cart', ICO('<rect x="4" y="3.5" width="10" height="4.5" rx="1"/><rect x="4" y="9.8" width="16" height="4.5" rx="1"/><rect x="4" y="16" width="12" height="4.5" rx="1"/>')],
    ['stacked', 'Barras apiladas', 'Stacked bars', 'cart', ICO('<rect x="4" y="12" width="6" height="8" rx="1"/><rect x="4" y="5" width="6" height="6" rx="1" opacity=".45"/><rect x="13" y="8" width="6" height="12" rx="1"/><rect x="13" y="3" width="6" height="4" rx="1" opacity=".45"/>')],
    ['pareto', 'Pareto', 'Pareto', 'cart', ICO('<rect x="3" y="8" width="4" height="12" rx="1"/><rect x="8.5" y="12" width="4" height="8" rx="1"/><rect x="14" y="15" width="4" height="5" rx="1"/><polyline points="4,9 10,5 16,3.5 21,3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>')],
    ['doughnut', 'Dona', 'Doughnut', 'radial', ICO('<path d="M12 3A9 9 0 1 1 3.9 8" fill="none" stroke="currentColor" stroke-width="4.5"/><path d="M3.3 6.5A9 9 0 0 1 10 3.1" fill="none" stroke="currentColor" stroke-width="4.5" opacity=".4"/>')],
    ['pie', 'Pastel', 'Pie', 'radial', ICO('<path d="M12 12V3A9 9 0 1 1 4 16.2Z"/><path d="M12 12 4 16.2A9 9 0 0 1 12 3Z" opacity=".4"/>')],
    ['polar', 'Área polar', 'Polar area', 'radial', ICO('<path d="M12 12V3.5A8.5 8.5 0 0 1 20.5 12Z"/><path d="M12 12H18A6 6 0 0 1 12 18Z" opacity=".6"/><path d="M12 12V17A5 5 0 0 1 7 12Z" opacity=".4"/><path d="M12 12H5.5A6.5 6.5 0 0 1 12 5.5Z" opacity=".8"/>')],
    ['radar', 'Radar', 'Radar', 'radar', ICO('<polygon points="12,3 20.5,9.2 17.3,19.5 6.7,19.5 3.5,9.2" fill="none" stroke="currentColor" stroke-width="1.6"/><polygon points="12,8 16.3,11.1 14.7,16.3 9.3,16.3 7.7,11.1" opacity=".45"/>')]
  ];
  const TIPO = k => TIPOS.find(t => t[0] === k) || TIPOS[3];
  const ALTURAS = { sm: 240, md: 300, lg: 420 }, FUENTES = { sm: 10, md: 12, lg: 14 };
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
  .kcs-gear,.kbd .b-gear{border:1px solid #E2E8F3;background:#fff;color:#4338CA;font:inherit;font-size:12px;font-weight:700;padding:6px 12px;border-radius:999px;cursor:pointer;white-space:nowrap;flex:none;min-height:32px}
  .kcs-gear:hover,.kbd .b-gear:hover{background:#EEF2FF;border-color:#C7D2FE;box-shadow:0 6px 14px -8px rgba(79,70,229,.6)}
  .kbd .b-sec.st-target{outline:2px solid #6366F1;outline-offset:3px}
  @media(min-width:1280px){.kbd.st-open,.kcs-open{margin-right:392px}}
  @media(max-width:520px){.kbd .b-gear .gl,.kcs-gear .gl{display:none}} .kcs-target{outline:2px solid #6366F1;outline-offset:3px}
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
  .kbd-st{position:fixed;top:0;right:0;bottom:0;width:380px;max-width:100vw;z-index:350;display:flex;flex-direction:column;background:rgba(255,255,255,.97);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-left:1px solid #E2E8F0;box-shadow:-24px 0 60px -24px rgba(15,23,42,.35);transform:translateX(104%);transition:transform .32s cubic-bezier(.2,.8,.2,1);color:#172033;font-family:inherit}
  .kbd-st.open{transform:none}
  .kbd-st .st-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px 14px;border-bottom:1px solid #EEF1F6;background:linear-gradient(180deg,#F8FAFF,#fff)}
  .kbd-st .st-eye{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#4F46E5}
  .kbd-st .st-name{font-size:15px;font-weight:800;color:#0F172A;margin-top:2px}
  .kbd-st .st-x{border:none;background:#F1F5F9;width:32px;height:32px;border-radius:10px;font-size:14px;cursor:pointer;color:#475569;flex:none}
  .kbd-st .st-body{flex:1;overflow-y:auto;padding:6px 18px 18px;-webkit-overflow-scrolling:touch}
  .kbd-st .st-foot{display:flex;align-items:center;gap:8px;padding:12px 18px 14px;border-top:1px solid #EEF1F6;background:#fff;flex-wrap:wrap}
  .kbd-st .st-note{flex:1 1 100%;font-size:10.5px;color:#94A3B8;margin-bottom:2px}
  .kbd-st .st-foot button{font:inherit;font-size:12px;font-weight:700;padding:9px 14px;border-radius:11px;cursor:pointer;border:1px solid #E2E8F3;background:#F6F8FC;color:#334155}
  .kbd-st .st-foot .st-done{margin-left:auto;background:linear-gradient(135deg,#4F46E5,#2463EB);color:#fff;border:none}
  .kbd-st .st-sec{padding:14px 0 12px;border-bottom:1px dashed #E8EDF5} .kbd-st .st-sec:last-child{border-bottom:none}
  .kbd-st h5{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#64748B;margin:0 0 10px}
  .kbd-st .st-types,.kbd-st .st-pals{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .kbd-st .st-type{display:flex;flex-direction:column;align-items:center;gap:4px;padding:9px 4px 7px;border:1px solid #E6EBF3;background:#fff;border-radius:12px;cursor:pointer;color:#64748B;font:inherit;font-size:10.5px;font-weight:700;line-height:1.15;text-align:center}
  .kbd-st .st-type:hover{border-color:#C7D2FE;color:#4338CA;background:#F8F9FF}
  .kbd-st .st-type.on{border-color:#4F46E5;background:#EEF2FF;color:#4338CA;box-shadow:0 6px 14px -8px rgba(79,70,229,.7)}
  .kbd-st .st-pal{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 4px;border:1px solid #E6EBF3;background:#fff;border-radius:12px;cursor:pointer;font:inherit}
  .kbd-st .st-pal.on{border-color:#4F46E5;background:#EEF2FF}
  .kbd-st .sws{display:flex} .kbd-st .sws i{width:16px;height:16px;border-radius:50%;margin-left:-4px;box-shadow:0 0 0 2px #fff} .kbd-st .sws i:first-child{margin-left:0}
  .kbd-st .st-pal small{font-size:10.5px;font-weight:700;color:#475569}
  .kbd-st .st-colors{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
  .kbd-st .st-color{display:flex;align-items:center;gap:8px;padding:5px 8px 5px 5px;border:1px solid #E6EBF3;border-radius:10px;font-size:11px;font-weight:600;color:#334155;min-width:0;background:#fff}
  .kbd-st .st-color span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .kbd-st .st-color input{width:26px;height:26px;border:none;padding:0;background:none;cursor:pointer;flex:none}
  .kbd-st .st-link{border:none;background:none;color:#4F46E5;font:inherit;font-size:11.5px;font-weight:700;cursor:pointer;padding:6px 0 0}
  .kbd-st .st-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:7px 0;font-size:12.5px;font-weight:600;color:#334155;cursor:pointer}
  .kbd-st .st-range>span{flex:0 0 118px} .kbd-st .st-range input{flex:1;max-width:150px;accent-color:#4F46E5} .kbd-st .st-range b{min-width:42px;text-align:right;font-size:11.5px;color:#64748B}
  .kbd-st .st-sw{position:relative;width:38px;height:22px;flex:none} .kbd-st .st-sw input{position:absolute;inset:0;opacity:0;cursor:pointer;margin:0;z-index:2}
  .kbd-st .st-sw i{position:absolute;inset:0;background:#CBD5E1;border-radius:999px;transition:background .15s}
  .kbd-st .st-sw i::after{content:'';position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .15s}
  .kbd-st .st-sw input:checked+i{background:linear-gradient(135deg,#4F46E5,#2463EB)} .kbd-st .st-sw input:checked+i::after{transform:translateX(16px)}
  .kbd-st .st-select,.kbd-st .st-in{font:inherit;font-size:11.5px;font-weight:700;color:#334155;border:1px solid #E2E8F3;background:#F6F8FC;border-radius:999px;padding:6px 12px;max-width:170px}
  .kbd-st .st-in{border-radius:10px;max-width:none;width:100%;font-weight:600;font-size:12.5px;padding:8px 10px}
  @media(max-width:760px){.kbd-st{top:auto;width:100%;height:62vh;border-left:none;border-top:1px solid #E2E8F0;border-radius:24px 24px 0 0;transform:translateY(104%)}.kbd-st.open{transform:none}}
  @media print{.kbd-st,.kbd .b-gear,.kcs-gear{display:none!important}}
  .kbd-pres{position:fixed;inset:0;background:#0B1730;z-index:400;display:flex;flex-direction:column;padding:16px}
  .kbd-pres .ph{display:flex;justify-content:space-between;align-items:center;color:#fff;gap:10px;margin-bottom:10px}
  .kbd-pres .pb{flex:1;background:#fff;border-radius:16px;padding:20px;overflow:auto;min-height:0}
  .kbd-pres .pb .b-sec{border:0;padding:0} .kbd-pres .b-btn{background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.25)}`;


  /* ═════════ Personalizar gráfica (KCS): estilo, armado de Chart.js y panel lateral ═════════
     Lo usan el Board de incidentes y el módulo Indicadores (pestañas Indicadores y Tablero). */
  const ESTILO_BASE = { palette: 'original', colors: {}, labels: true, grid: true, legend: 'auto', gradient: false, radius: 4, thick: 80, line: 2.5, point: 3, smooth: true, fill: 20, border: 2, cutout: 58, font: 'md', height: 300, titulo: '' };
  function estiloDe(guardado, defecto) {
    const st = Object.assign({}, ESTILO_BASE, defecto || {}, guardado || {});
    st.palette = PAL_ANT[st.palette] || (PALETAS[st.palette] ? st.palette : 'original');   // compatibilidad con la 0.11.0
    if (st.legend === true) st.legend = 'auto'; if (st.legend === false) st.legend = 'none';
    if (typeof st.height === 'string') st.height = ALTURAS[st.height] || 300;
    st.colors = Object.assign({}, st.colors || {});
    return st;
  }
  function cssKCS() { if (!document.getElementById('kbd-css')) { const x = document.createElement('style'); x.id = 'kbd-css'; x.textContent = CSS; document.head.appendChild(x); } }
  // Números sobre las barras / rebanadas
  const valores = { id: 'kbdValores', afterDatasetsDraw(ch) {
    const op = ch.options.plugins.kbdValores; if (!op || !op.on) return;
    const { ctx } = ch; ctx.save(); ctx.font = '600 ' + (op.size || 11) + 'px Inter,system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const radial = ['doughnut', 'pie', 'polarArea'].includes(ch.config.type), apil = ch.options.scales && ch.options.scales.x && ch.options.scales.x.stacked;
    ch.data.datasets.forEach((ds, di) => { const meta = ch.getDatasetMeta(di); if (meta.hidden || ds._sinValor || ds.type === 'line' && ch.config.type === 'bar') return;
      meta.data.forEach((el, i) => { const v = ds.data[i]; if (!v) return;
        if (radial) { const p = el.tooltipPosition(); ctx.fillStyle = '#fff'; ctx.fillText(v, p.x, p.y); return; }
        if (ch.config.type === 'radar') return;
        const hor = ch.options.indexAxis === 'y';
        if (apil && ch.config.type === 'bar') { if (v < 2) return; const p = el.tooltipPosition(); ctx.fillStyle = '#fff'; ctx.fillText(v, hor ? (el.x + el.base) / 2 : p.x, hor ? p.y : (el.y + el.base) / 2); return; }
        ctx.fillStyle = op.color || '#334155'; if (hor) { ctx.textAlign = 'left'; ctx.fillText(v, el.x + 5, el.y); ctx.textAlign = 'center'; } else ctx.fillText(v, el.x, el.y - 9); }); });
    ctx.restore(); } };
  // Aplica el estilo elegido (cuadrícula, leyenda, texto, degradado) a la configuración de Chart.js
  function aplicarEstilo(cfg, st, fam, canvas) {
    const o = cfg.options, sc = o.scales || {};
    Object.keys(sc).forEach(k => { if (k === 'y1') return; sc[k].grid = Object.assign({}, sc[k].grid, { display: st.grid, color: '#EEF2F7' }); sc[k].ticks = Object.assign({}, sc[k].ticks, { font: { size: FUENTES[st.font] || 12 } }); });
    if (o.scales && o.scales.r) o.scales.r.grid = { display: st.grid };
    if (fam === 'radial' && cfg.type === 'polarArea') o.scales = { r: { grid: { display: st.grid }, ticks: { display: false } } };
    const lg = o.plugins.legend || {}, multi = !!(cfg.data.datasets.filter(d => !d._sinLeyenda).length > 1 || fam !== 'cart' || cfg._pareto);
    lg.display = st.legend === 'none' ? false : st.legend === 'auto' ? multi : true;
    lg.position = st.legend === 'auto' || st.legend === 'none' ? 'bottom' : st.legend;
    lg.labels = Object.assign({}, lg.labels, { font: { size: FUENTES[st.font] || 12 }, boxWidth: 14 });
    o.plugins.legend = lg;
    o.plugins.kbdValores = { on: st.labels, size: (FUENTES[st.font] || 12) - 1 };
    if (st.gradient && canvas) {
      const ctx = canvas.getContext('2d'), h = canvas.parentNode.clientHeight || 300, w = canvas.parentNode.clientWidth || 500;
      cfg.data.datasets.forEach(ds => { if (ds.type === 'line' || cfg.type === 'line' || cfg.type === 'radar' || typeof ds.backgroundColor !== 'string' && !Array.isArray(ds.backgroundColor)) return;
        const grad = c => { if (typeof c !== 'string') return c; const g = cfg.options.indexAxis === 'y' ? ctx.createLinearGradient(0, 0, w, 0) : ctx.createLinearGradient(0, h, 0, 0); g.addColorStop(0, c + 'A6'); g.addColorStop(0.55, c); g.addColorStop(1, c); return g; };
        ds.backgroundColor = Array.isArray(ds.backgroundColor) ? ds.backgroundColor.map(grad) : grad(ds.backgroundColor); });
    }
    return cfg;
  }
  const alfa = a => Math.round(Math.max(0, Math.min(100, a)) * 2.55).toString(16).padStart(2, '0');
  /* Arma una gráfica a partir de datos ya contados.
     spec = { labels, series:[{k, name, data, color}], porCategoria, coloresCat:[...], linea80, numerar, en, textoVacio }
     Devuelve { chart, items } (items = elementos con color, para el panel). */
  function construir(canvas, spec, st) {
    const EN = !!spec.en, T = (es, en) => EN ? en : es, pal = PALETAS[st.palette];
    const type = st.type, fam = TIPO(type)[3];
    const usaOriginal = st.palette === 'original';
    let labels = spec.labels.slice(), series = spec.series.map(x => Object.assign({}, x, { data: x.data.slice() }));
    let cfg, items;
    const colorCat = (l, i) => st.colors[l] || (usaOriginal && spec.coloresCat && spec.coloresCat[i]) || pal[i % pal.length];
    const colorSerie = (sr, i) => st.colors[sr.k] || (usaOriginal && sr.color) || pal[i % pal.length];
    const total = i => series.reduce((a, sr) => a + (Number(sr.data[i]) || 0), 0);
    if (fam === 'radial') {
      const idx = labels.map((_, i) => i).filter(i => total(i) > 0);
      items = idx.map(i => ({ k: labels[i], name: labels[i], color: colorCat(labels[i], i) }));
      cfg = { type: type === 'polar' ? 'polarArea' : type, data: { labels: idx.map(i => labels[i]), datasets: [{ data: idx.map(total), backgroundColor: items.map(x => x.color + (type === 'polar' ? 'CC' : '')), borderColor: '#fff', borderWidth: st.border }] },
        options: { cutout: type === 'doughnut' ? st.cutout + '%' : undefined, plugins: { legend: {} } } };
    } else if (type === 'pareto') {
      const orden = labels.map((_, i) => [total(i), i]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]);
      const suma = orden.reduce((a, x) => a + x[0], 0) || 1; let acc = 0; const cum = orden.map(x => Math.round((acc += x[0]) * 1000 / suma) / 10);
      const unaCat = series.length === 1 && spec.porCategoria;
      items = unaCat ? orden.map(x => ({ k: labels[x[1]], name: labels[x[1]], color: colorCat(labels[x[1]], x[1]) })) : series.map((sr, i) => ({ k: sr.k, name: sr.name, color: colorSerie(sr, i) }));
      const kL = '_acum'; items.push({ k: kL, name: T('% acumulado', 'Cumulative %'), color: st.colors[kL] || (usaOriginal ? '#0F2A4A' : pal[3] || '#DC2626') });
      const ds = series.map((sr, i) => ({ type: 'bar', label: sr.name, data: orden.map(x => sr.data[x[1]]), backgroundColor: unaCat ? items.slice(0, -1).map(x => x.color) : items[i].color, borderRadius: st.radius, categoryPercentage: st.thick / 100, barPercentage: .95, stack: 'p', yAxisID: 'y', order: 2, _sinLeyenda: unaCat }));
      ds.push({ type: 'line', label: items[items.length - 1].name, data: cum, borderColor: items[items.length - 1].color, backgroundColor: items[items.length - 1].color, yAxisID: 'y1', tension: st.smooth ? .3 : 0, borderWidth: st.line, pointRadius: st.point, order: 1 });
      if (spec.linea80) ds.push({ type: 'line', label: '80 %', data: orden.map(() => 80), borderColor: '#DC2626', borderDash: [6, 4], pointRadius: 0, borderWidth: 1.5, yAxisID: 'y1', order: 0, _sinValor: true });
      cfg = { _pareto: true, type: 'bar', data: { labels: orden.map((x, n) => (spec.numerar ? (n + 1) + '. ' : '') + labels[x[1]]), datasets: ds },
        options: { scales: { x: { stacked: true, ticks: { autoSkip: false, maxRotation: 60 } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }, y1: { position: 'right', min: 0, max: 100, grid: { display: false }, ticks: { callback: x => x + '%' } } },
          plugins: { legend: {}, tooltip: { callbacks: { label: c => c.dataset.yAxisID === 'y1' ? `${c.dataset.label}: ${c.raw}%` : `${c.dataset.label}: ${c.raw}` } } } } };
    } else {
      const lineal = ['line', 'area', 'stepped', 'radar'].includes(type), unaCat = series.length === 1 && spec.porCategoria && !lineal;
      items = unaCat ? labels.map((l, j) => ({ k: l, name: l, color: colorCat(l, j) })) : series.map((sr, i) => ({ k: sr.k, name: sr.name, color: colorSerie(sr, i) }));
      const ds = series.map((sr, i) => { const col = unaCat ? null : items[i].color;
        return { label: sr.name, data: sr.data, backgroundColor: col ? col + (type === 'area' || type === 'radar' ? alfa(st.fill) : '') : items.map(x => x.color),
          borderColor: col || items.map(x => x.color), borderWidth: lineal ? st.line : 0, borderRadius: st.radius, categoryPercentage: st.thick / 100, barPercentage: .92, spanGaps: false,
          tension: st.smooth && type !== 'stepped' ? .3 : 0, stepped: type === 'stepped', fill: type === 'area' || type === 'radar', pointRadius: st.point, pointBackgroundColor: col || undefined, _sinLeyenda: unaCat }; });
      const jsType = ['hbar', 'stacked'].includes(type) ? 'bar' : ['area', 'stepped'].includes(type) ? 'line' : type;
      cfg = { type: jsType, data: { labels, datasets: ds }, options: { indexAxis: type === 'hbar' ? 'y' : 'x', plugins: { legend: {} } } };
      if (jsType !== 'radar') cfg.options.scales = type === 'hbar' ? { x: { beginAtZero: true, ticks: { precision: 0 } }, y: { ticks: { autoSkip: false } } }
        : { x: { stacked: type === 'stacked', ticks: { autoSkip: false, maxRotation: 60 } }, y: { stacked: type === 'stacked', beginAtZero: true, ticks: { precision: 0 } } };
      else cfg.options.scales = { r: { beginAtZero: true, ticks: { precision: 0, backdropColor: 'transparent' } } };
    }
    cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false, animation: { duration: 300 }, layout: { padding: { top: 18, right: type === 'hbar' ? 28 : 8 } } }, cfg.options);
    aplicarEstilo(cfg, st, fam, canvas);
    if (spec.colorTexto) { cfg.options.color = spec.colorTexto; Object.values(cfg.options.scales || {}).forEach(x => { x.ticks = Object.assign({}, x.ticks, { color: spec.colorTexto }); }); cfg.options.plugins.kbdValores.color = spec.colorTexto; }
    cfg.plugins = [valores];
    return { chart: new root.Chart(canvas, cfg), items };
  }
  function descargar(canvas, nombre) {
    const out = document.createElement('canvas'); out.width = canvas.width; out.height = canvas.height;
    const x = out.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, out.width, out.height); x.drawImage(canvas, 0, 0);
    const a = document.createElement('a'); a.href = out.toDataURL('image/png'); a.download = String(nombre || 'grafica').replace(/[^\w-]+/g, '-') + '.png'; document.body.appendChild(a); a.click(); a.remove();
  }
  function panelEl() {
    cssKCS();
    let p = document.getElementById('kbd-st');
    if (!p) { p = document.createElement('aside'); p.id = 'kbd-st'; p.className = 'kbd-st no-i18n'; p.setAttribute('role', 'dialog'); document.body.appendChild(p); }
    if (!document.__kcsEscOn) { document.__kcsEscOn = true; document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.__kcsEsc) document.__kcsEsc(); }); }
    return p;
  }
  function cerrarPanel() { const p = document.getElementById('kbd-st'); if (p) p.classList.remove('open'); }
  /* Dibuja el panel «Personalizar gráfica».
     o = { en, titulo, st, items, tipos:[claves] | null, datosHTML, set(cambios), reset(), png(), cerrar(), repintar(), alPintar(p), nota } */
  function panel(o) {
    const p = panelEl(), EN = !!o.en, T = (es, en) => EN ? en : es, st = o.st, fam = TIPO(st.type)[3];
    const isBar = ['bar', 'hbar', 'stacked', 'pareto'].includes(st.type), isLine = ['line', 'area', 'stepped', 'pareto'].includes(st.type) || fam === 'radar';
    const tipos = o.tipos ? TIPOS.filter(t => o.tipos.includes(t[0])) : TIPOS;
    const sec = (t, inner) => `<section class="st-sec"><h5>${esc(t)}</h5>${inner}</section>`;
    const tog = (l, k, v) => `<label class="st-row"><span>${esc(l)}</span><span class="st-sw"><input type="checkbox" data-s="${k}" ${v ? 'checked' : ''}><i></i></span></label>`;
    const rng = (l, k, mn, mx, v, u) => `<label class="st-row st-range"><span>${esc(l)}</span><input type="range" min="${mn}" max="${mx}" step="${k === 'line' ? .5 : 1}" value="${v}" data-r="${k}"><b>${v}${u || ''}</b></label>`;
    const selc = (l, k, ops, v) => `<label class="st-row"><span>${esc(l)}</span><select class="st-select" data-s="${k}">${ops.map(x => `<option value="${x[0]}" ${String(x[0]) === String(v) ? 'selected' : ''}>${esc(T(x[1], x[2]))}</option>`).join('')}</select></label>`;
    let h = sec(T('Tipo de gráfica', 'Chart type'), `<div class="st-types">${tipos.map(t => `<button type="button" class="st-type ${t[0] === st.type ? 'on' : ''}" data-tipo="${t[0]}">${t[4]}<span>${esc(EN ? t[2] : t[1])}</span></button>`).join('')}</div>`);
    h += sec(T('Paleta de colores', 'Color palette'), `<div class="st-pals">${Object.keys(PALETAS).map(n => `<button type="button" class="st-pal ${st.palette === n ? 'on' : ''}" data-pal="${n}"><span class="sws">${PALETAS[n].slice(0, 4).map(c => `<i style="background:${c}"></i>`).join('')}</span><small>${esc(EN ? PAL_NOM[n][1] : PAL_NOM[n][0])}</small></button>`).join('')}</div>`);
    const items = o.items || [];
    h += sec(T('Colores', 'Colors'), (items.length ? `<div class="st-colors">${items.slice(0, 24).map((it, i) => `<label class="st-color" title="${esc(it.name)}"><input type="color" value="${esc(/^#[0-9a-f]{6}$/i.test(it.color) ? it.color : '#2463EB')}" data-col="${i}"><span>${esc(it.name)}</span></label>`).join('')}</div>` : `<p style="font-size:11.5px;color:#94A3B8;margin:0">${esc(T('Sin elementos con los filtros actuales.', 'No items with the current filters.'))}</p>`)
      + `<button type="button" class="st-link" data-x="rcol">↺ ${esc(T('Restablecer colores', 'Reset colors'))}</button>`);
    let e = tog(T('Etiquetas de datos', 'Data labels'), 'labels', st.labels);
    if (fam !== 'radial' || st.type === 'polar') e += tog(T('Líneas de cuadrícula', 'Grid lines'), 'grid', st.grid);
    e += selc(T('Leyenda', 'Legend'), 'legend', [['auto', 'Auto', 'Auto'], ['top', 'Arriba', 'Top'], ['bottom', 'Abajo', 'Bottom'], ['right', 'Derecha', 'Right'], ['none', 'Oculta', 'Hidden']], st.legend);
    if (isBar) e += tog(T('Relleno degradado', 'Gradient fill'), 'gradient', st.gradient) + rng(T('Esquinas redondeadas', 'Corner radius'), 'radius', 0, 20, st.radius, 'px') + rng(T('Grosor de barras', 'Bar thickness'), 'thick', 20, 100, st.thick, '%');
    if (isLine) e += rng(T('Grosor de línea', 'Line width'), 'line', 1, 7, st.line, 'px') + rng(T('Tamaño de punto', 'Point size'), 'point', 0, 9, st.point, 'px');
    if (['line', 'area', 'pareto'].includes(st.type)) e += tog(T('Curvas suaves', 'Smooth curves'), 'smooth', st.smooth);
    if (st.type === 'area' || fam === 'radar') e += rng(T('Opacidad del relleno', 'Fill opacity'), 'fill', 2, 70, st.fill, '%');
    if (fam === 'radial') e += rng(T('Grosor del borde', 'Border width'), 'border', 0, 8, st.border, 'px');
    if (st.type === 'doughnut') e += rng(T('Hueco de la dona', 'Donut hole'), 'cutout', 20, 85, st.cutout, '%');
    e += selc(T('Tamaño de texto', 'Text size'), 'font', [['sm', 'Pequeño', 'Small'], ['md', 'Normal', 'Normal'], ['lg', 'Grande', 'Large']], st.font);
    e += rng(T('Alto de la gráfica', 'Chart height'), 'height', 200, 700, st.height, 'px');
    h += sec(T('Estilo', 'Style'), e);
    h += sec(T('Datos', 'Data'), o.datosHTML != null ? o.datosHTML : `<label class="st-row" style="display:block"><span style="display:block;margin-bottom:6px">${esc(T('Título', 'Title'))}</span><input class="st-in" type="text" data-t="titulo" value="${esc(st.titulo || '')}" placeholder="${esc(o.tituloBase || o.titulo)}"></label>`);
    const prev = p.querySelector('.st-body') ? p.querySelector('.st-body').scrollTop : 0;
    p.innerHTML = `<div class="st-head"><div><div class="st-eye">${esc(T('Personalizar gráfica', 'Customize chart'))}</div><div class="st-name">${esc(o.titulo)}</div></div><button type="button" class="st-x" data-x="cerrar" aria-label="${esc(T('Cerrar', 'Close'))}">✕</button></div>
      <div class="st-body">${h}</div>
      <div class="st-foot"><div class="st-note">${esc(o.nota || T('Los cambios se aplican al instante y los ve todo el equipo de Safety.', 'Changes apply instantly and the whole Safety team sees them.'))}</div><button type="button" data-x="reset">↺ ${esc(T('Restablecer', 'Reset'))}</button><button type="button" data-x="png">⬇ PNG</button><button type="button" class="st-done" data-x="cerrar2">${esc(T('Listo', 'Done'))}</button></div>`;
    p.querySelector('.st-body').scrollTop = prev;
    const set = (c, rep) => { o.set(c); if (rep) o.repintar(); };
    p.querySelectorAll('[data-tipo]').forEach(b => b.onclick = () => set({ type: b.dataset.tipo }, true));
    p.querySelectorAll('[data-pal]').forEach(b => b.onclick = () => set({ palette: b.dataset.pal, colors: {} }, true));
    p.querySelectorAll('[data-col]').forEach(inp => { inp.oninput = () => { const it = items[+inp.dataset.col]; set({ colors: Object.assign({}, st.colors, { [it.k]: inp.value }) }); st.colors[it.k] = inp.value; }; inp.onchange = () => o.repintar(); });
    p.querySelectorAll('input[type=checkbox][data-s]').forEach(x => x.onchange = () => set({ [x.dataset.s]: x.checked }, true));
    p.querySelectorAll('select[data-s]').forEach(x => x.onchange = () => set({ [x.dataset.s]: x.dataset.s === 'top' ? Number(x.value) : x.value }, x.dataset.s === 'serie'));
    p.querySelectorAll('[data-r]').forEach(x => { x.oninput = () => { x.nextElementSibling.textContent = x.value + (['thick', 'fill', 'cutout'].includes(x.dataset.r) ? '%' : 'px'); clearTimeout(x._t); x._t = setTimeout(() => set({ [x.dataset.r]: Number(x.value) }), 120); }; });
    const ti = p.querySelector('[data-t="titulo"]'); if (ti && o.datosHTML == null) ti.onchange = () => { set({ titulo: ti.value.trim() }); p.querySelector('.st-name').textContent = ti.value.trim() || o.tituloBase || o.titulo; };
    p.querySelector('[data-x="rcol"]').onclick = () => set({ palette: 'original', colors: {} }, true);
    p.querySelector('[data-x="reset"]').onclick = () => { o.reset(); o.repintar(); };
    p.querySelector('[data-x="png"]').onclick = () => o.png();
    p.querySelectorAll('[data-x="cerrar"],[data-x="cerrar2"]').forEach(b => b.onclick = o.cerrar);
    if (o.alPintar) o.alPintar(p);
    requestAnimationFrame(() => p.classList.add('open'));
    return p;
  }
  const BOTON = (en, attrs) => `<button class="kcs-gear" type="button" ${attrs} title="${esc(en ? 'Customize chart' : 'Personalizar gráfica')}">⚙<span class="gl"> ${esc(en ? 'Customize' : 'Personalizar')}</span></button>`;

  function render(host, data, opts) {
    opts = opts || {};
    const EN = opts.lang === 'en';
    const T = (es, en) => EN && en ? en : es;
    const tt = s => { if (!EN) return s; const m = { 'Sin área': 'No area', 'Sin turno': 'No shift', 'Sin grupo': 'No group', 'Sin línea': 'No line', 'Sin dato': 'No data', 'Sin hora': 'No time', 'Sin parte del cuerpo': 'No body part', 'Sin clasificación': 'Unclassified',
      'Verde': 'Green', 'Azul': 'Blue', 'Mixto': 'Mixed', '1.er turno': '1st shift', '2.º turno': '2nd shift', 'Acto': 'Act', 'Condición': 'Condition', 'Hombre': 'Male', 'Mujer': 'Female',
      'Lesión': 'Injury (lost time)', 'Tratamiento médico': 'Medical treatment', 'Primer auxilio': 'First aid', 'Daño a la propiedad': 'Property damage', 'Casi accidente': 'Near miss', 'Más de 48': 'Over 48' };
      if (m[s]) return m[s]; const i = MESES.indexOf(s); if (i >= 0) return MESES_EN[i]; const j = DIAS.indexOf(s); if (j >= 0) return DIAS_EN[j]; return s; };
    const KF = opts.KF || root.KF;
    cssKCS();
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
    const estilo = s => estiloDe(S.cfg.charts[s.id], { type: s.type || 'bar', top: s.top || 0, serie: s.serie || '' });
    const ULTIMO = {};   // elementos dibujados en cada gráfica (para el panel de colores)
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

    function chart(canvas, s, lista) {
      if (!root.Chart) { canvas.parentNode.innerHTML = `<div class="b-empty">${esc(T('No se cargó la librería de gráficas (Chart.js).', 'The chart library (Chart.js) did not load.'))}</div>`; return; }
      const st = estilo(s), pal = PALETAS[st.palette];
      const type = st.type, fam = TIPO(type)[3];
      const serie = type === 'pareto' || fam === 'radial' ? '' : st.serie;
      const c = contar(lista, s.dim, serie, st.top || (s.dim === 'linea' ? 15 : 0));
      if (!c.labels.length) { canvas.parentNode.innerHTML = `<div class="b-empty">${esc(T('Sin datos con estos filtros.', 'No data with these filters.'))}</div>`; ULTIMO[s.id] = []; return; }
      const lab = c.labels.map(tt);
      const porClasif = serie === 'clasificacion' || (!serie && s.dim === 'clasificacion');
      const colorDe = (k, i) => st.colors[k] || (st.palette === 'original' && porClasif && CLASIF_COLOR[k] ? CLASIF_COLOR[k] : pal[i % pal.length]);
      let cfg, items;
      if (fam === 'radial') {
        items = c.labels.map((l, i) => ({ k: l, name: tt(l), color: colorDe(l, i) }));
        cfg = { type: type === 'polar' ? 'polarArea' : type, data: { labels: lab, datasets: [{ data: c.labels.map(l => c.tot(l)), backgroundColor: items.map(x => x.color + (type === 'polar' ? 'CC' : '')), borderColor: '#fff', borderWidth: st.border }] },
          options: { cutout: type === 'doughnut' ? st.cutout + '%' : undefined, plugins: { legend: {} } } };
      } else if (type === 'pareto') {
        const v = c.labels.map(l => c.tot(l)), t = v.reduce((a, b) => a + b, 0) || 1; let acc = 0; const cum = v.map(x => Math.round((acc += x) / t * 1000) / 10);
        const kB = '_barras', kL = '_acum';
        items = [{ k: kB, name: T('Incidentes', 'Incidents'), color: st.colors[kB] || pal[0] }, { k: kL, name: T('% acumulado', 'Cumulative %'), color: st.colors[kL] || pal[3] || '#DC2626' }];
        cfg = { _pareto: true, type: 'bar', data: { labels: lab, datasets: [{ type: 'bar', label: items[0].name, data: v, backgroundColor: items[0].color, borderRadius: st.radius, categoryPercentage: st.thick / 100, barPercentage: .95, yAxisID: 'y', order: 2 },
          { type: 'line', label: items[1].name, data: cum, borderColor: items[1].color, backgroundColor: items[1].color, yAxisID: 'y1', tension: st.smooth ? .3 : 0, borderWidth: st.line, pointRadius: st.point, order: 1 }] },
          options: { scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, y1: { position: 'right', min: 0, max: 100, grid: { display: false }, ticks: { callback: x => x + '%' } }, x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 60 } } }, plugins: { legend: {} } } };
      } else {
        const lineal = ['line', 'area', 'stepped', 'radar'].includes(type), unaSerie = c.series.length === 1 && !serie;
        items = unaSerie && !lineal ? c.labels.map((l, j) => ({ k: l, name: tt(l), color: colorDe(l, j) })) : c.series.map((sk, i) => ({ k: sk, name: sk === '_' ? T('Incidentes', 'Incidents') : tt(sk), color: colorDe(sk, i) }));
        const ds = c.series.map((sk, i) => { const col = unaSerie ? (lineal ? items[0].color : null) : items[i].color;
          return { label: sk === '_' ? T('Incidentes', 'Incidents') : tt(sk), data: c.labels.map(l => c.val(l, sk)),
            backgroundColor: col ? col + (type === 'area' || type === 'radar' ? alfa(st.fill) : '') : items.map(x => x.color),
            borderColor: col || items.map(x => x.color), borderWidth: lineal ? st.line : 0, borderRadius: st.radius, categoryPercentage: st.thick / 100, barPercentage: .92,
            tension: st.smooth && type !== 'stepped' ? .3 : 0, stepped: type === 'stepped', fill: type === 'area' || type === 'radar', pointRadius: st.point, pointBackgroundColor: col || undefined }; });
        const jsType = ['hbar', 'stacked'].includes(type) ? 'bar' : ['area', 'stepped'].includes(type) ? 'line' : type;
        cfg = { type: jsType, data: { labels: lab, datasets: ds }, options: { indexAxis: type === 'hbar' ? 'y' : 'x', plugins: { legend: {} } } };
        if (jsType !== 'radar') cfg.options.scales = type === 'hbar' ? { x: { beginAtZero: true, ticks: { precision: 0 } }, y: { ticks: { autoSkip: false } } }
          : { x: { stacked: type === 'stacked', ticks: { autoSkip: false, maxRotation: 60 } }, y: { stacked: type === 'stacked', beginAtZero: true, ticks: { precision: 0 } } };
        else cfg.options.scales = { r: { beginAtZero: true, ticks: { precision: 0, backdropColor: 'transparent' } } };
      }
      ULTIMO[s.id] = items;
      cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false, animation: { duration: 300 }, layout: { padding: { top: 18, right: type === 'hbar' ? 28 : 8 } } }, cfg.options);
      aplicarEstilo(cfg, st, fam, canvas);
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
      const lista = filtrar(EV, true), pl = data.plantilla || {}, st = estilo(s), pal = PALETAS[st.palette];
      const ys = S.f.anio ? [S.f.anio] : anios.slice(-3); const labels = MESES.map(tt);
      const type = ['line', 'area', 'stepped', 'bar'].includes(st.type) ? st.type : 'line';
      const items = ys.map((y, i) => ({ k: y, name: y, color: st.colors[y] || pal[i % pal.length] })); ULTIMO[s.id] = items;
      const ds = ys.map((y, i) => ({ label: y, data: MESES.map((_, m) => { const k = y + '-' + String(m + 1).padStart(2, '0'), p = pl[k] || pl[y]; const n = lista.filter(e => e.fecha.startsWith(k)).length; return p ? Math.round(n / p * 1000) / 10 : null; }),
        borderColor: items[i].color, backgroundColor: items[i].color + (type === 'area' ? Math.round(st.fill * 2.55).toString(16).padStart(2, '0') : ''), fill: type === 'area', tension: st.smooth && type !== 'stepped' ? .3 : 0, stepped: type === 'stepped',
        borderWidth: type === 'bar' ? 0 : st.line, pointRadius: st.point, borderRadius: st.radius, categoryPercentage: st.thick / 100 }));
      const cfg = { type: type === 'bar' ? 'bar' : 'line', data: { labels, datasets: ds }, plugins: [valores], options: { responsive: true, maintainAspectRatio: false, layout: { padding: { top: 18 } }, plugins: { legend: {} }, scales: { y: { beginAtZero: true }, x: {} } } };
      aplicarEstilo(cfg, st, 'cart', canvas); cfg.options.plugins.legend.display = st.legend !== 'none';
      const ch = new root.Chart(canvas, cfg); host.__kbdCharts.push(ch);
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
      dibujarSecciones(host, vis, lista); if (ST.id) setTimeout(pintarStudio, 0);
      host.querySelectorAll('[data-f]').forEach(x => x.onchange = () => { S.f[x.dataset.f] = x.value; pintar(); });
      host.querySelectorAll('[data-go]').forEach(a => a.onclick = (ev) => { ev.preventDefault(); const el = host.querySelector('#kbd-' + a.dataset.go); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      const b = k => host.querySelector(`[data-k="${k}"]`);
      b('pres').onclick = () => presentar(0);
      if (opts.puedeEditar) { b('secs').onclick = menuSecciones; b('nueva').onclick = () => editorPropia(null); b('pl').onclick = editorPlantilla; }
      host.querySelectorAll('[data-gear]').forEach(g => g.onclick = () => studio(g.dataset.gear));
      if (ST.id) { const el = host.querySelector(`[data-sec="${CSS_ESC(ST.id)}"]`); if (el) el.classList.add('st-target'); host.classList.add('st-open'); }
    }
    const nombre = s => (S.cfg.charts[s.id] && S.cfg.charts[s.id].titulo) || (EN && s.en ? s.en : s.t);
    function seccionHTML(s, i, pres) {
      const full = s.esp === 'resumen' || s.esp === 'cuerpo' || s.esp === 'calor' || s.id === 'linea' || s.id === 'tendencia';
      const gear = opts.puedeEditar && s.esp !== 'resumen' && s.esp !== 'calor' && !pres ? `<button class="b-gear" type="button" data-gear="${esc(s.id)}" title="${esc(T('Personalizar gráfica', 'Customize chart'))}">⚙<span class="gl"> ${esc(T('Personalizar', 'Customize'))}</span></button>` : '';
      const st = estilo(s);
      const cuerpo = s.esp === 'cuerpo' ? `<div class="b-body"><div data-cuerpo></div><div class="b-cv" style="height:${pres ? 'calc(100vh - 220px)' : st.height + 'px'}"><canvas></canvas></div></div>`
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
    // Panel lateral «Personalizar gráfica» (como en el Facilities board). Los cambios se aplican al instante
    // y se guardan en el servidor para todo Safety.
    const ST = { id: null };
    function refrescarSeccion(id) {
      const vis = visibles(), i = vis.findIndex(x => x.id === id), s = vis[i]; if (!s) return;
      const el = host.querySelector(`[data-sec="${CSS_ESC(id)}"]`); if (!el) return;
      host.__kbdCharts = host.__kbdCharts.filter(c => { if (el.contains(c.canvas)) { try { c.destroy(); } catch (e) {} return false; } return true; });
      const t = document.createElement('div'); t.innerHTML = seccionHTML(s, i); const nuevo = t.firstElementChild; el.replaceWith(nuevo);
      if (ST.id === id) nuevo.classList.add('st-target');
      const g = nuevo.querySelector('[data-gear]'); if (g) g.onclick = () => studio(id);
      dibujarSecciones(host, [s], filtrar(EV));
      const a = host.querySelector(`[data-go="${CSS_ESC(id)}"]`); if (a) a.innerHTML = `<b>${i + 1}</b>${esc(nombre(s))}`;
    }
    function cerrarStudio() {
      ST.id = null; const p = document.getElementById('kbd-st'); if (p) p.classList.remove('open');
      host.classList.remove('st-open'); host.querySelectorAll('.st-target').forEach(x => x.classList.remove('st-target'));
    }
    function studio(id) {
      ST.id = id;
      const p = panelEl();
      host.querySelectorAll('.st-target').forEach(x => x.classList.remove('st-target'));
      const card = host.querySelector(`[data-sec="${CSS_ESC(id)}"]`); if (card) card.classList.add('st-target');
      host.classList.add('st-open');
      pintarStudio(); requestAnimationFrame(() => p.classList.add('open'));
      setTimeout(() => { if (!card) return; const r = card.getBoundingClientRect(); if (window.innerWidth <= 760 || r.top > window.innerHeight * .6 || r.bottom < 120) card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
      document.__kcsEsc = () => { if (ST.id && !document.getElementById('kbd-pres')) cerrarStudio(); };
    }
    function pintarStudio() {
      const id = ST.id; if (!id) return;
      const s = todas().find(x => x.id === id); if (!s) return cerrarStudio();
      const st = estilo(s), fam = TIPO(st.type)[3], especial = s.esp === 'tasa' || s.esp === 'cuerpo';
      const selc = (l, k, ops, v) => `<label class="st-row"><span>${esc(l)}</span><select class="st-select" data-s="${k}">${ops.map(o => `<option value="${o[0]}" ${String(o[0]) === String(v) ? 'selected' : ''}>${esc(T(o[1], o[2]))}</option>`).join('')}</select></label>`;
      let dts = `<label class="st-row" style="display:block"><span style="display:block;margin-bottom:6px">${esc(T('Título', 'Title'))}</span><input class="st-in" type="text" data-t="titulo" value="${esc(st.titulo || '')}" placeholder="${esc(EN && s.en ? s.en : s.t)}"></label>`;
      if (!especial) {
        dts += fam === 'radial' || st.type === 'pareto' ? '' : selc(T('Dividir por', 'Split by'), 'serie', [['', 'Sin dividir', 'No split']].concat(Object.keys(DIMS).filter(k => k !== s.dim).map(k => [k, DIMS[k].t, DIMS[k].en])), st.serie);
        if (!Array.isArray(DIMS[s.dim].orden)) dts += selc(T('Mostrar', 'Show'), 'top', [[0, 'Todos', 'All'], [5, 'Los primeros 5', 'Top 5'], [8, 'Los primeros 8', 'Top 8'], [10, 'Los primeros 10', 'Top 10'], [15, 'Los primeros 15', 'Top 15'], [20, 'Los primeros 20', 'Top 20']], st.top || (s.dim === 'linea' ? 15 : 0));
      }
      panel({ en: EN, titulo: nombre(s), st, items: ULTIMO[id] || [], tipos: s.esp === 'tasa' ? ['line', 'area', 'stepped', 'bar'] : null,
        datosHTML: dts, repintar: pintarStudio, cerrar: cerrarStudio, png: () => descargarPNG(id),
        set: (cambios) => { S.cfg.charts[id] = Object.assign({}, S.cfg.charts[id] || {}, cambios); guardar(); refrescarSeccion(id); },
        reset: () => { delete S.cfg.charts[id]; guardar(); refrescarSeccion(id); },
        alPintar: p => { const ti = p.querySelector('[data-t="titulo"]'); ti.onchange = () => { S.cfg.charts[id] = Object.assign({}, S.cfg.charts[id] || {}, { titulo: ti.value.trim() }); guardar(); refrescarSeccion(id); p.querySelector('.st-name').textContent = nombre(s); }; } });
    }
    function descargarPNG(id) {
      const el = host.querySelector(`[data-sec="${CSS_ESC(id)}"] canvas`); if (!el) return;
      descargar(el, 'board-incidentes-' + id);
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
          <label>${esc(T('Tipo', 'Type'))}<select data-p="type">${TIPOS.map(t => `<option value="${t[0]}" ${p.type === t[0] ? 'selected' : ''}>${esc(EN ? t[2] : t[1])}</option>`).join('')}</select></label></div>
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
  root.KBD = { render, VERSION: '0.14.0', SECCIONES, DIMS };
  root.KCS = { estilo: estiloDe, construir, panel, cerrarPanel, descargar, boton: BOTON, css: cssKCS, TIPOS: TIPOS.map(t => t[0]) };
})(typeof window !== 'undefined' ? window : this);
