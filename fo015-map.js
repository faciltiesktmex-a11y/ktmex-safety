/*
 * KTMEX EHS Control — Mapa del formato KQMS-SA-FO-015 Rev. 00 (JRA) y su anexo KQMS-SA-FO-016.
 * ----------------------------------------------------------------------------
 * Aquí vive TODO lo que el sistema sabe del formato oficial: hojas, celdas de entrada, listas de
 * valores (idénticas a las validaciones del formato), casillas y reglas de llenado.
 * El formato NO se reproduce ni se modifica: el sistema escribe estos valores en una copia del maestro.
 *
 * Fuente del mapa: archivo "KQMS-SA-FO-015 … Rev_00 Energías R.xls" (hojas, combinadas, validaciones,
 * controles de formulario y comentarios). Al cambiar la revisión del formato, se actualiza SOLO este archivo.
 */
window.KTMEX_FO015 = (() => {
  const MASTER = {
    file: 'assets/forms/KQMS-SA-FO-015.xlsx',
    // El formato aprobado por Calidad es un .xls (binario, no se puede llenar sin reescribirlo). Este .xlsx es su conversión
    // exacta (verificada con tools/verificar_conversion.py: hojas, contenido, combinadas, alturas y anchos sin diferencias).
    approvedSource: { file: 'KQMS-SA-FO-015_ANÁLISIS_DE_RIESGO_PARA_TRABAJOS_RUTINARIOS-_JRA_Rev_00.xls', sha256: '4706a9ad5bcc08eec63a9e56db935dffc34fac8a1e4351bcf708b68b409d1246' },
    // Huella SHA-256 del .xlsx que el sistema exige usar (cualquier otro archivo se rechaza).
    expectedSha256: 'ce5e05960527a294f745dfeec18b23e592e4456c451d9864aba4ea027dc2a890',
    // Pasar a true cuando Calidad autorice formalmente la versión .xlsx como copia controlada.
    authorizedByQuality: false,
    code: 'KQMS-SA-FO-015', revision: '00', annexCode: 'KQMS-SA-FO-016'
  };
  const SHEET = { main: 'Analisis de riesgos ', annex: 'Anexo hoja sustancias química' };   // el nombre real lleva un espacio final

  // Se comprueba antes de escribir: si algo no coincide, NO se llena (formato distinto al esperado).
  const EXPECT = [
    { sheet: SHEET.main, ref: 'F2', text: 'ANÁLISIS DE RIESGO PARA TRABAJOS RUTINARIOS (JRA)' },
    { sheet: SHEET.main, ref: 'R4', text: 'KQMS-SA-FO-015' },
    { sheet: SHEET.main, ref: 'V2', text: '00' },
    { sheet: SHEET.main, ref: 'B36', text: 'No. Actividad' },
    { sheet: SHEET.main, ref: 'Z36', text: 'NOTAS\n(INCLUIR MEDIDAS DE CONTROL)' },
    { sheet: SHEET.annex, ref: 'G4', text: 'KQMS-SA-FO-016' }
  ];

  // Listas = validaciones de datos del formato (celdas S/T/U/V/W de la tabla y columnas de higiene industrial).
  const LISTS = {
    s: [[2, 'Primeros auxilios'], [3, 'Lesión con tiempo perdido / trabajo modificado / OSHA registrable'], [20, 'Incapacidad permanente'], [40, 'Fatalidad']],
    f: [[1, 'Poco frecuente'], [4, '1–10 veces por semana'], [6, '1–10 veces por turno'], [8, 'Más de 10 veces por turno']],
    p: [[1, 'Posible o probable'], [0.5, 'Improbable']],
    c: [[1, 'Sin control'], [0.9, 'EPP'], [0.5, 'Estandarizado / efectivo'], [0.1, 'Ingeniería muy efectiva']],
    ihFrequency: [[1, 'Poco frecuente: menos de 3 veces al año'], [2, 'Anual: más de 3 veces al año y menos de 1 al mes'], [4, 'Mensual: más de 1 al mes y menos de 1 por semana'], [6, 'Semanal: más de 1 por semana y menos de 1 al día'], [8, 'Diaria: al menos una vez al día']],
    ihDuration: [[1, 'Menos del 5 % del turno'], [2, 'Entre 5 % y 25 % del turno'], [4, 'Entre 25 % y 75 % del turno'], [6, 'Más del 75 % del turno']],
    ihAir: [[0, 'Sin potencial en el aire'], [1, 'Bajo'], [2, 'Medio'], [4, 'Alto']],
    ihDermal: [[0, 'Sin exposición'], [1, 'Ligera'], [2, 'Moderada'], [4, 'Alta']],
    ihControl: [[1, 'Sin control técnico ni de gestión'], [0.75, 'Control técnico sin buen mantenimiento'], [0.5, 'Control técnico implantado']]
  };

  const CATEGORIES = [
    ['A', 'Atrapado en, por o entre la máquina'], ['B', 'Golpe, contacto con objetos pesados'], ['C', 'Contacto con vehículos'],
    ['D', 'Resbalones, tropezones y caídas'], ['E', 'Eléctricos'], ['F', 'Térmicos, incendio, explosión'], ['G', 'Otros riesgos']
  ];
  // Categoría H de cada riesgo del catálogo de seguridad (la misma que ya usaba el JRA).
  const CATEGORY_BY_RISK = {
    H02: 'A', H07: 'A', H19: 'A', H20: 'A', H05: 'B', H06: 'B', H12: 'B', H13: 'B', H14: 'B',
    H15: 'C', H04: 'D', H11: 'D', H01: 'E', H03: 'F', H18: 'F', H08: 'G', H09: 'G', H10: 'G', H16: 'G', H17: 'G'
  };
  // Severidad del catálogo (1–4) → escala del formato (2/3/20/40). Safety debe validar cada riesgo.
  const SEVERITY_FROM_CATALOG = { 1: 2, 2: 3, 3: 20, 4: 40 };

  // Casillas del formato, por el título que tienen en el maestro.
  const CHECKBOX = {
    workCategory: { conveyance: 'Conveyance', production: 'Producción', maintenance: 'Matenimiento', other: 'Otros' },   // «Matenimiento» así está escrito en el maestro
    activityType: { routine: 'Rutinaria', nonRoutine: 'No rutinaria' },
    moe: { yes: 'SI', no: 'NO' },
    noChemicals: 'NO HAY sustancias químicas en el area,  no se  deberá  llenar el anexo hoja sustancia química'
  };
  const WORK_CATEGORY_LABEL = { conveyance: 'Conveyance', production: 'Producción', maintenance: 'Mantenimiento', other: 'Otros' };
  const OTHER_HAZARDS = [
    'Alto nivel de ruido o uso de protección auditiva', 'Lavadora de piezas', 'Moho en el área', 'Trabajos cerca de torre de enfriamiento / Shower test',
    'Rayos X o radioisotopos', 'Ultravioleta', 'Horno eléctrico o electromagneto', 'Laser clase III o IV en área', 'Calor/Frio Excesivo',
    'Corte y soldadura', 'Calentamiento químico', 'Proceso de lijado/aspreado/sanding', 'Fosa de lodos', 'Trabajos cerca del horno de pintura',
    'Maquinado de partes', 'Microondas (No alimentos)', 'Emisiones por vehículos'
  ];

  // Geometría de la hoja principal (de este maestro).
  const LAYOUT = {
    firstRow: 37, lastRow: 66,                                   // 30 renglones de tareas (el maestro aprobado)
    rowHeights: {},                                              // todos miden 24 pt
    defaultRowHeight: 24, linePt: 12.75, maxRowHeight: 409,
    widths: { task: 55.7, risk: 53.1, notes: 42.8 },             // suma de los anchos reales de las columnas combinadas C:J, K:R, Z:AF
    ihFirst: 24, ihLast: 33,                                     // 10 sustancias
    annexFirst: 14, annexLast: 43                                // 30 sustancias en el anexo
  };

  const round2 = v => Math.round((v + Number.EPSILON) * 100) / 100;
  const pad = n => String(n).padStart(2, '0');
  function formatDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso || '');   // B5:D5 está combinada en el maestro aprobado: cabe el año completo
  }

  // Líneas de texto estimadas en una celda combinada (estimación; verificar con una impresión de prueba).
  function estimateLines(text, widthChars) {
    const perLine = Math.max(1, Math.floor(widthChars));   // calibrado contra las alturas que un usuario dio a mano en un ejemplo llenado
    return String(text || '').split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / perLine)), 0);
  }
  function rowHeightOf(r) { return LAYOUT.rowHeights[r] || LAYOUT.defaultRowHeight; }

  // ------------------------------------------------------------------------------------------------
  // form = {
  //   date, consecutive, evaluator, department, lineMachine, process, activity,
  //   moe:'yes'|'no', workCategory:'production'…, activityType:'routine'|'nonRoutine',
  //   noChemicals:boolean, chemicals:[{name,id,frequency,duration,air,dermal,control,ppe:'SI'|'No',ppeText}],
  //   otherHazards:[captions], tasks:[{ text, risks:[{ text, category, s,f,p,c, controls:[] }] }]
  // }
  // opts = { consolidate: fn(controls[])→controls[], adjustRowHeights: boolean }
  // ------------------------------------------------------------------------------------------------
  function build(form, opts = {}) {
    const consolidate = opts.consolidate || (list => list);
    const errors = [], warnings = [], rows = [];

    // 1) Un renglón por (tarea, categoría): peor caso de S, F, P y la menor efectividad de C.
    (form.tasks || []).forEach((task, ti) => {
      const groups = new Map();
      (task.risks || []).forEach(r => {
        const cat = r.category || 'G';
        if (!groups.has(cat)) groups.set(cat, []);
        groups.get(cat).push(r);
      });
      groups.forEach((risks, cat) => {
        const s = Math.max(...risks.map(r => r.s)), f = Math.max(...risks.map(r => r.f));
        const p = Math.max(...risks.map(r => r.p)), c = Math.max(...risks.map(r => r.c));
        const uc = round2(s * f * p), ct = round2(uc * c);
        const controls = consolidate(risks.flatMap(r => r.controls || []));
        rows.push({
          taskNo: ti + 1, taskText: task.text, category: cat,
          risksText: risks.map((r, i) => `${i + 1}.- ${r.text}`).join('\n'),
          s, f, p, c, uc, ct,
          notes: controls.map((t, i) => `${i + 1}. ${t}`).join('\n'),
          merged: risks.length > 1 && new Set(risks.map(r => `${r.s}|${r.f}|${r.p}|${r.c}`)).size > 1
        });
      });
    });

    const capacity = LAYOUT.lastRow - LAYOUT.firstRow + 1;
    if (!rows.length) errors.push('No hay renglones de riesgo para el formato.');
    if (rows.length > capacity) errors.push(`El formato admite ${capacity} renglones y esta evaluación necesita ${rows.length}. Divida la actividad en dos JRA.`);

    // 2) Alto de renglón necesario (el formato trae alturas fijas; se avisa o se ajusta solo la altura).
    const rowHeights = {};
    rows.forEach((row, i) => {
      const r = LAYOUT.firstRow + i;
      row.sheetRow = r;
      const lines = Math.max(estimateLines(row.taskText, LAYOUT.widths.task), estimateLines(row.risksText, LAYOUT.widths.risk), estimateLines(row.notes, LAYOUT.widths.notes));
      row.neededHeight = Math.ceil(lines * LAYOUT.linePt + 4);
      const have = rowHeightOf(r);
      row.fits = row.neededHeight <= have;
      if (!row.fits) {
        if (row.neededHeight > LAYOUT.maxRowHeight) errors.push(`El renglón ${i + 1} (tarea ${row.taskNo}) tiene demasiado texto para una fila de Excel. Resuma la descripción o los controles.`);
        else if (opts.adjustRowHeights) rowHeights[r] = row.neededHeight;
        else warnings.push(`Renglón ${i + 1} (tarea ${row.taskNo}): el texto no cabe en la altura fija del formato (necesita ≈${row.neededHeight} pt y mide ${have} pt); se verá cortado al imprimir.`);
      }
      if (row.merged) warnings.push(`Tarea ${row.taskNo}, categoría ${row.category}: varios riesgos con factores distintos; el renglón usa el peor caso (S, F, P máximos y C menos efectivo).`);
    });

    // 3) Celdas de la hoja principal
    const main = {};
    main.B5 = formatDate(form.date);
    main.E5 = form.consecutive || '';
    main.G5 = [form.evaluator, form.department].filter(Boolean).join(', ');
    main.B7 = form.department || '';
    main.E7 = form.lineMachine || '';
    main.J7 = [form.process, form.activity].filter(Boolean).join(' / ');

    for (let r = LAYOUT.firstRow; r <= LAYOUT.lastRow; r++) {
      const row = rows[r - LAYOUT.firstRow];
      if (row) {
        main['B' + r] = r - LAYOUT.firstRow + 1; main['C' + r] = row.taskText; main['K' + r] = row.risksText; main['S' + r] = row.category;
        main['T' + r] = row.s; main['U' + r] = row.f; main['V' + r] = row.p; main['W' + r] = row.c;
        main['X' + r] = row.uc; main['Y' + r] = row.ct; main['Z' + r] = row.notes;
      } else {   // renglones sin usar: se dejan vacíos (las fórmulas de UC/CT se conservan)
        ['C', 'K', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].forEach(col => { main[col + r] = ''; });
      }
    }

    // 4) Higiene industrial (hoja principal) y anexo FO-016
    const chems = form.noChemicals ? [] : (form.chemicals || []);
    if (chems.length > LAYOUT.ihLast - LAYOUT.ihFirst + 1) warnings.push(`La hoja principal muestra las primeras ${LAYOUT.ihLast - LAYOUT.ihFirst + 1} sustancias; todas van en el anexo ${MASTER.annexCode}.`);
    if (chems.length > LAYOUT.annexLast - LAYOUT.annexFirst + 1) errors.push(`El anexo admite ${LAYOUT.annexLast - LAYOUT.annexFirst + 1} sustancias.`);
    for (let r = LAYOUT.ihFirst; r <= LAYOUT.ihLast; r++) {
      const c = chems[r - LAYOUT.ihFirst];
      main['C' + r] = c ? c.name : ''; main['L' + r] = c ? c.id : '';
      main['Q' + r] = c ? c.frequency : ''; main['R' + r] = c ? c.duration : ''; main['S' + r] = c ? c.air : '';
      main['T' + r] = c ? c.dermal : ''; main['U' + r] = c ? c.control : ''; main['V' + r] = c ? c.ppe : '';
    }
    const annex = { B6: main.B5, E6: main.E5, G6: main.G5, B8: main.B7, E8: main.E7, J8: main.J7 };
    for (let r = LAYOUT.annexFirst; r <= LAYOUT.annexLast; r++) {
      const c = chems[r - LAYOUT.annexFirst];
      annex['C' + r] = c ? c.name : ''; annex['G' + r] = c ? c.id : ''; annex['H' + r] = c ? c.frequency : ''; annex['I' + r] = c ? c.duration : '';
      annex['J' + r] = c ? c.air : ''; annex['K' + r] = c ? c.dermal : ''; annex['L' + r] = c ? c.control : '';
      // El formato valida "SI,No" en la fila 14 y "Yes,No" de la 15 en adelante: se respeta cada lista.
      annex['M' + r] = c ? (r === LAYOUT.annexFirst ? c.ppe : (c.ppe === 'SI' ? 'Yes' : 'No')) : '';
      annex['N' + r] = c ? (c.ppeText || '') : '';
    }

    // 5) Casillas (se fijan TODAS, para que el resultado no dependa de cómo venga el maestro)
    const states = {};
    Object.entries(CHECKBOX.workCategory).forEach(([k, caption]) => { states[caption] = form.workCategory === k; });
    Object.entries(CHECKBOX.activityType).forEach(([k, caption]) => { states[caption] = form.activityType === k; });
    states[CHECKBOX.moe.yes] = form.moe === 'yes';
    states[CHECKBOX.moe.no] = form.moe === 'no';
    states[CHECKBOX.noChemicals] = Boolean(form.noChemicals);
    OTHER_HAZARDS.forEach(h => { states[h] = (form.otherHazards || []).includes(h); });

    return {
      errors, warnings, rows, rowHeights,
      spec: {
        sheets: [
          { name: SHEET.main, cells: main, rowHeights },
          ...(chems.length ? [{ name: SHEET.annex, cells: annex }] : [])
        ],
        checkboxes: { sheet: SHEET.main, states }
      }
    };
  }

  function fileName(form) {
    const d = (form.date || '').replace(/-/g, '');
    return `${MASTER.code}_Rev${MASTER.revision}_${(form.consecutive || 'SIN-FOLIO').replace(/[^\w-]+/g, '_')}_${d}.xlsx`;
  }

  return { MASTER, SHEET, EXPECT, LISTS, CATEGORIES, CATEGORY_BY_RISK, SEVERITY_FROM_CATALOG, CHECKBOX, WORK_CATEGORY_LABEL, OTHER_HAZARDS, LAYOUT, build, estimateLines, formatDate, fileName };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = window.KTMEX_FO015;
