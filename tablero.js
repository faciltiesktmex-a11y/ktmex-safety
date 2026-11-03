/* ════════════════════════════════════════════════════════════════════
   KTMEX Safety — Tablero de incidentes (v0.8)
   Adaptación del tablero «Incidentes de seguridad» (registro KQMS-SA-RE-001)
   a los comunicados del sistema. Se dibuja dentro de Indicadores con:
     KTB.render(contenedor, eventos, {lang, KF})
   · eventos: lo que entrega kpiDatos (solo se usan los comunicados).
   · La figura del cuerpo es la imagen del sistema (cuerpo.jpg) como mapa de calor.
   · Tiene su propio selector de idioma: español, inglés y japonés.
   ════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', DAY = 864e5;
  var hoy = new Date(), T = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  var parse = function (s) { if (!s || !/^\d{4}-\d{2}-\d{2}/.test(String(s))) return null; var p = String(s).slice(0, 10).split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); };
  var PALETA = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#7b5ce0', '#6b6a65'];

  /* ---------- Textos ---------- */
  var L = {
    es: {
      title: 'Tablero de incidentes', all: 'Todos', total: 'Total', area: 'Área', lesiones: 'lesiones', year: 'Año',
      lead: function (n, i, o, y) { return '<b>' + n + '</b> incidentes registrados ' + (y === 'all' ? 'en todos los años' : 'en ' + y) + '; <b>' + i + '</b> con lesión y <b>' + o + '</b> con problem solving abierto.'; },
      k1: 'Días sin tiempo perdido', k1s: 'último: ', k2: 'Días sin lesión', k2s: 'último: ', k3: 'Incidentes', k3s: 'en el periodo',
      k4: 'Con lesión', k4s: 'primer auxilio, tratamiento médico o lesión', k5: 'Casi accidentes', k5s: 'sin lesión ni daño',
      k6: 'Problem solving cerrado', k6s: 'de los incidentes del periodo', k7: 'Avance promedio', k7s: 'de las contramedidas', none: 'sin registros',
      byMonth: 'Por mes', byMonthD: 'Meses con más y menos incidentes', byArea: 'Por área', byAreaD: 'Áreas que concentran los incidentes',
      byCat: 'Por clasificación', byCatD: 'Gravedad del evento', byShift: 'Por turno', byShiftD: 'Verde, azul y mixto',
      byType: 'Por tipo de evento', byTypeD: 'Caídas, golpes, atrapamientos y otros, según el tipo de evento del comunicado',
      openClosed: 'Abiertos y cerrados por área', openClosedD: 'Problem solving abierto o cerrado (estatus del comunicado); la línea es el acumulado de los abiertos',
      compl: 'Cumplimiento de contramedidas', complD: 'Problem solving cerrado en el año elegido y estatus de las contramedidas (CMS)',
      distr: 'Distribución por turno y clasificación', distrD: 'Porcentaje de cada clasificación dentro de cada turno',
      body: 'Partes del cuerpo afectadas', bodyD: 'Lesiones con atención (primer auxilio, tratamiento médico o lesión) por parte del cuerpo y tipo de herida. Pasa el cursor por la figura para ver cada zona.',
      byPart: 'Por parte del cuerpo', byWound: 'Por tipo de herida', less: 'Menos', more: 'Más',
      psClosed: 'Problem solving cerrado', psCl: 'Cerrado', psOp: 'Abierto', cmsOk: 'Contramedidas OK', cmsOkS: 'OK', cmsGo: 'En proceso', cmsNo: 'Sin iniciar', cmsNa: 'Sin CMS',
      opened: 'Abiertos', closed: 'Cerrados', cumOpen: 'Acumulado de abiertos',
      cmT: 'Seguimiento de contramedidas', cmD: 'De todos los eventos del año a lo que sigue abierto, y qué tan urgente es cada pendiente.',
      gT: 'Cronograma de contramedidas abiertas', gD: 'Cada barra va del evento a su fecha compromiso. El relleno es el avance real y la línea vertical es hoy; si el relleno queda detrás de la línea, la contramedida va atrasada contra el tiempo.',
      tT: 'Detalle de contramedidas', tab1: 'PS abiertos', tab2: 'CMS por confirmar', tab3: 'Todos',
      tdesc1: 'Problem solving abierto, ordenado por urgencia.', tdesc2: 'Contramedidas cuyo seguimiento a 3 meses aún no está en OK.', tdesc3: 'Todos los eventos del año, del más reciente al más antiguo.', regs: 'registros',
      sLate: 'Vencido', sSoon: 'Vence en 30 días', sOk: 'En plazo', sReady: 'CM al 100%, falta cerrar PS', sReadyS: 'Falta cerrar', sNone: 'Sin contramedida',
      fEv: 'Eventos', fCl: 'PS cerrado', fOp: 'PS abierto', diamond: '◆ Fecha compromiso original (si se extendió)', today: 'Hoy',
      th: ['#', 'Área', 'Evento', 'Responsable', 'Vence', 'Avance', 'PS', 'CMS', 'Seguimiento', 'Contramedida'],
      dLate: ' d de atraso', dIn: 'en ', dD: ' d', dToday: 'hoy', noDate: 'sin fecha', cm100: 'CM al 100%', avance: 'Avance', comp: 'Compromiso', ext: 'Extendida a', vence: 'Vence', resp: 'Responsable',
      foot: 'Fuente: comunicados del sistema. Los eventos de 2024 a 2026 con folio RE-AAAA-NNN vienen del registro KQMS-SA-RE-001 Rev. 02 (descripciones cortadas a unos 100 caracteres; su parte del cuerpo se pinta en ambos lados). Vencido: fecha compromiso (o extendida) anterior a hoy con avance menor a 100%.',
      months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
      mshort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
      cat: { LT: 'Lesión', MR: 'Tratamiento médico', FA: 'Primer auxilio', PD: 'Daño a la propiedad', NM: 'Casi accidente', XX: 'Sin clasificación' },
      empty: 'Todavía no hay comunicados para este tablero.',
      x: {}
    },
    en: {
      title: 'Incident dashboard', all: 'All', total: 'Total', area: 'Area', lesiones: 'injuries', year: 'Year',
      lead: function (n, i, o, y) { return '<b>' + n + '</b> incidents recorded ' + (y === 'all' ? 'across all years' : 'in ' + y) + '; <b>' + i + '</b> with injury and <b>' + o + '</b> with open problem solving.'; },
      k1: 'Days without lost time', k1s: 'last: ', k2: 'Days without injury', k2s: 'last: ', k3: 'Incidents', k3s: 'in the period',
      k4: 'With injury', k4s: 'first aid, medical treatment or injury', k5: 'Near misses', k5s: 'no injury or damage',
      k6: 'Problem solving closed', k6s: 'of the period\'s incidents', k7: 'Average progress', k7s: 'of countermeasures', none: 'no records',
      byMonth: 'By month', byMonthD: 'Months with the most and fewest incidents', byArea: 'By area', byAreaD: 'Areas where incidents concentrate',
      byCat: 'By classification', byCatD: 'Event severity', byShift: 'By shift', byShiftD: 'Green, blue and mixed',
      byType: 'By event type', byTypeD: 'Falls, hits, entrapments and others, from the event type of the communication',
      openClosed: 'Open and closed by area', openClosedD: 'Open or closed problem solving (communication status); the line is the cumulative of open ones',
      compl: 'Countermeasure compliance', complD: 'Problem solving closed in the selected year and countermeasure status (CMS)',
      distr: 'Distribution by shift and classification', distrD: 'Share of each classification within each shift',
      body: 'Body parts affected', bodyD: 'Injuries with treatment (first aid, medical treatment or injury) by body part and wound type. Hover the figure to see each area.',
      byPart: 'By body part', byWound: 'By wound type', less: 'Less', more: 'More',
      psClosed: 'Problem solving closed', psCl: 'Closed', psOp: 'Open', cmsOk: 'Countermeasures OK', cmsOkS: 'OK', cmsGo: 'In progress', cmsNo: 'Not started', cmsNa: 'No CMS',
      opened: 'Open', closed: 'Closed', cumOpen: 'Cumulative open',
      cmT: 'Countermeasure tracking', cmD: 'From all events of the year to what is still open, and how urgent each pending item is.',
      gT: 'Open countermeasure timeline', gD: 'Each bar runs from the event to its commitment date. The fill is actual progress and the vertical line is today; if the fill is behind the line, the countermeasure is late against time.',
      tT: 'Countermeasure detail', tab1: 'Open PS', tab2: 'CMS to confirm', tab3: 'All',
      tdesc1: 'Open problem solving, sorted by urgency.', tdesc2: 'Countermeasures whose 3-month follow-up is not yet OK.', tdesc3: 'All events of the year, newest first.', regs: 'records',
      sLate: 'Overdue', sSoon: 'Due in 30 days', sOk: 'On time', sReady: 'CM at 100%, PS to close', sReadyS: 'To close', sNone: 'No countermeasure',
      fEv: 'Events', fCl: 'PS closed', fOp: 'PS open', diamond: '◆ Original commitment date (if extended)', today: 'Today',
      th: ['#', 'Area', 'Event', 'Owner', 'Due', 'Progress', 'PS', 'CMS', 'Follow-up', 'Countermeasure'],
      dLate: ' d overdue', dIn: 'in ', dD: ' d', dToday: 'today', noDate: 'no date', cm100: 'CM at 100%', avance: 'Progress', comp: 'Commitment', ext: 'Extended to', vence: 'Due', resp: 'Owner',
      foot: 'Source: system communications. Events from 2024 to 2026 with ID RE-YYYY-NNN come from record KQMS-SA-RE-001 Rev. 02 (descriptions cut to about 100 characters, kept in Spanish; their body part is shown on both sides). Overdue: commitment (or extended) date before today with progress under 100%.',
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      mshort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      cat: { LT: 'Injury', MR: 'Medical treatment', FA: 'First aid', PD: 'Property damage', NM: 'Near miss', XX: 'Unclassified' },
      empty: 'There are no communications for this dashboard yet.',
      x: { 'Verde': 'Green', 'Azul': 'Blue', 'Mixto': 'Mixed', 'Sin turno': 'No shift', 'Sin área': 'No area', 'Sin clasificar': 'Unclassified',
        'Logística Interna': 'Internal Logistics', 'Estampado': 'Stamping', 'Soldadura': 'Welding', 'Blanking': 'Blanking', 'Mto. Troqueles': 'Die Maintenance', 'Calidad': 'Quality',
        'Mantenimiento': 'Maintenance', 'Facilities': 'Facilities', 'Control de Producción': 'Production Control', 'Comedor': 'Dining room',
        'Mto. Soldadura': 'Welding Maint.', 'Mto. Estampado': 'Stamping Maint.', 'Mto. Blanking': 'Blanking Maint.',
        'Caída de material': 'Falling material', 'Golpe / contusión': 'Hit / contusion', 'Choque / equipo móvil': 'Collision / mobile equipment', 'Corte / laceración': 'Cut / laceration', 'Otros': 'Other', 'Daño a instalaciones': 'Facility damage', 'Atrapamiento / aplastamiento': 'Entrapment / crushing', 'Quemadura / eléctrico': 'Burn / electrical', 'Caída de persona': 'Person fall',
        'Mano y dedos': 'Hand and fingers', 'Pierna y rodilla': 'Leg and knee', 'Cabeza y cara': 'Head and face', 'Brazo y codo': 'Arm and elbow', 'Tórax y espalda': 'Chest and back', 'Hombro': 'Shoulder', 'Pie y tobillo': 'Foot and ankle', 'Cuello': 'Neck', 'Abdomen y cadera': 'Abdomen and hip', 'No especificada': 'Unspecified',
        'Otro': 'Other', 'Caída': 'Fall', 'Cuerpo extraño': 'Foreign body', 'Esguince / torsión': 'Sprain / twist', 'Quemadura': 'Burn', 'Sin especificar': 'Unspecified' }
    },
    ja: {
      title: 'インシデント・ダッシュボード', all: 'すべて', total: '合計', area: '部署', lesiones: '件の負傷', year: '年',
      lead: function (n, i, o, y) { return (y === 'all' ? '全期間' : y + '年') + 'に記録されたインシデントは<b>' + n + '</b>件、うち負傷<b>' + i + '</b>件、問題解決が未完了<b>' + o + '</b>件。'; },
      k1: '休業災害なしの日数', k1s: '最終: ', k2: '無災害日数', k2s: '最終: ', k3: 'インシデント', k3s: '期間内',
      k4: '負傷あり', k4s: '応急処置、医療処置、負傷', k5: 'ヒヤリハット', k5s: '負傷・損害なし',
      k6: '問題解決 完了', k6s: '期間内インシデントのうち', k7: '平均進捗', k7s: '対策の進捗', none: '記録なし',
      byMonth: '月別', byMonthD: 'インシデントが多い月と少ない月', byArea: '部署別', byAreaD: 'インシデントが集中する部署',
      byCat: '分類別', byCatD: '事象の重大度', byShift: '班別', byShiftD: '緑班・青班・混合',
      byType: '事象タイプ別', byTypeD: '転落、打撲、挟まれなど(通報の事象タイプ)',
      openClosed: '部署別 未完了と完了', openClosedD: '問題解決の未完了・完了(通報のステータス)。線は未完了の累計',
      compl: '対策の実施状況', complD: '選択した年の問題解決の完了と対策(CMS)の状況',
      distr: '班と分類の分布', distrD: '各班内での各分類の割合',
      body: '負傷した身体部位', bodyD: '処置を伴う負傷(応急処置、医療処置、負傷)の部位と傷の種類。図にカーソルを合わせると部位ごとに表示。',
      byPart: '身体部位別', byWound: '傷の種類別', less: '少', more: '多',
      psClosed: '問題解決 完了', psCl: '完了', psOp: '未完了', cmsOk: '対策OK', cmsOkS: 'OK', cmsGo: '進行中', cmsNo: '未着手', cmsNa: 'CMSなし',
      opened: '未完了', closed: '完了', cumOpen: '未完了の累計',
      cmT: '対策フォローアップ', cmD: '年間の全事象から未完了まで、そして各案件の緊急度。',
      gT: '未完了の対策タイムライン', gD: '各バーは事象発生から約束日まで。塗りは実際の進捗、縦線は今日。塗りが線より手前なら遅れ。',
      tT: '対策の詳細', tab1: '未完了PS', tab2: 'CMS要確認', tab3: 'すべて',
      tdesc1: '未完了の問題解決(緊急度順)', tdesc2: '3か月フォローがまだOKでない対策', tdesc3: 'その年の全事象(新しい順)', regs: '件',
      sLate: '期限超過', sSoon: '30日以内に期限', sOk: '期限内', sReady: '対策100%・PS未完了', sReadyS: 'クローズ待ち', sNone: '対策なし',
      fEv: '事象', fCl: 'PS完了', fOp: 'PS未完了', diamond: '◆ 当初の約束日(延長された場合)', today: '今日',
      th: ['#', '部署', '事象', '担当', '期限', '進捗', 'PS', 'CMS', 'フォロー', '対策'],
      dLate: '日超過', dIn: 'あと', dD: '日', dToday: '本日', noDate: '日付なし', cm100: '対策100%', avance: '進捗', comp: '約束日', ext: '延長日', vence: '期限', resp: '担当',
      foot: '出典: システムの安全通報。RE-YYYY-NNN の2024〜2026年の事象は記録 KQMS-SA-RE-001 Rev. 02 から(記述は約100文字で切れており、スペイン語のまま。身体部位は左右両方に表示)。期限超過: 約束日(または延長日)が今日より前で進捗100%未満。',
      months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      mshort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      cat: { LT: '負傷', MR: '医療処置', FA: '応急処置', PD: '物的損害', NM: 'ヒヤリハット', XX: '未分類' },
      empty: 'このダッシュボードの通報はまだありません。',
      x: { 'Verde': '緑', 'Azul': '青', 'Mixto': '混合', 'Sin turno': '班なし', 'Sin área': '部署なし', 'Sin clasificar': '未分類',
        'Logística Interna': '構内物流', 'Estampado': 'プレス', 'Soldadura': '溶接', 'Blanking': 'ブランキング', 'Mto. Troqueles': '金型保全', 'Calidad': '品質',
        'Mantenimiento': '保全', 'Facilities': '設備', 'Control de Producción': '生産管理', 'Comedor': '食堂',
        'Mto. Soldadura': '溶接保全', 'Mto. Estampado': 'プレス保全', 'Mto. Blanking': 'ブランキング保全',
        'Caída de material': '資材の落下', 'Golpe / contusión': '打撲・衝突', 'Choque / equipo móvil': '衝突・移動機器', 'Corte / laceración': '切創・裂傷', 'Otros': 'その他', 'Daño a instalaciones': '設備損傷', 'Atrapamiento / aplastamiento': '挟まれ・圧迫', 'Quemadura / eléctrico': '火傷・電気', 'Caída de persona': '人の転倒',
        'Mano y dedos': '手・指', 'Pierna y rodilla': '脚・膝', 'Cabeza y cara': '頭・顔', 'Brazo y codo': '腕・肘', 'Tórax y espalda': '胸・背中', 'Hombro': '肩', 'Pie y tobillo': '足・足首', 'Cuello': '首', 'Abdomen y cadera': '腹部・腰', 'No especificada': '不明',
        'Otro': 'その他', 'Caída': '転倒', 'Cuerpo extraño': '異物', 'Esguince / torsión': '捻挫', 'Quemadura': '火傷', 'Sin especificar': '不明' }
    }
  };
  var CAT_DE = { 'Lesión': 'LT', 'Tratamiento médico': 'MR', 'Primer auxilio': 'FA', 'Daño a la propiedad': 'PD', 'Casi accidente': 'NM' };
  var LESION = { LT: 1, MR: 1, FA: 1 };
  var CATS = ['PD', 'FA', 'NM', 'LT', 'MR'], CATORD = ['LT', 'MR', 'FA', 'PD', 'NM'];
  var CATCOL = { LT: 'var(--k-s1)', MR: 'var(--k-s2)', FA: 'var(--k-s3)', PD: 'var(--k-s4)', NM: 'var(--k-s5)', XX: 'var(--k-hn)' };
  var ETYPES = ['Caída de material', 'Golpe / contusión', 'Choque / equipo móvil', 'Corte / laceración', 'Otros', 'Daño a instalaciones', 'Atrapamiento / aplastamiento', 'Quemadura / eléctrico', 'Caída de persona'];
  var PARTS = ['Mano y dedos', 'Pierna y rodilla', 'Cabeza y cara', 'Brazo y codo', 'Tórax y espalda', 'Hombro', 'Pie y tobillo', 'Cuello', 'Abdomen y cadera', 'No especificada'];
  var WOUNDS = ['Golpe / contusión', 'Corte / laceración', 'Atrapamiento / aplastamiento', 'Otro', 'Caída', 'Cuerpo extraño', 'Esguince / torsión', 'Quemadura'];
  var ST = { late: ['!', 'sLate', 'var(--k-crit)', '#fff'], soon: ['▲', 'sSoon', 'var(--k-warn)', '#0b0b0b'], ok: ['●', 'sOk', 'var(--k-s1)', '#fff'], ready: ['✓', 'sReady', 'var(--k-good)', '#fff'] };
  var ORDER = ['late', 'soon', 'ok', 'ready'];
  var CMSL = { 3: ['✓', 'cmsOkS', 'var(--k-good)'], 2: ['●', 'cmsGo', 'var(--k-s1)'], 1: ['!', 'cmsNo', 'var(--k-crit)'] };

  var CSS = '.ktb{--k-page:#f9f9f7;--k-surface:#fff;--k-ink:#0b0b0b;--k-ink2:#52514e;--k-muted:#898781;--k-grid:#e1e0d9;--k-axis:#c3c2b7;--k-ring:rgba(11,11,11,.10);' +
    '--k-s1:#2a78d6;--k-s2:#eb6834;--k-s3:#1baf7a;--k-s4:#eda100;--k-s5:#e87ba4;--k-blue-wash:rgba(42,120,214,.10);--k-good:#0ca30c;--k-dgreen:#006300;--k-warn:#fab219;--k-crit:#d03b3b;--k-brown:#7a4300;' +
    '--k-base:#6b6a65;--k-track:#e9e8e2;--k-h0:#2f9e58;--k-h1:#e6c23a;--k-h2:#f08a24;--k-h3:#d84b4b;--k-hn:#b9b8ae;color:var(--k-ink);font-size:14px;line-height:1.45;container-type:inline-size}' +
    '.ktb *{box-sizing:border-box}.ktb .k-stack{display:grid;gap:14px}.ktb h1{font-weight:700;font-size:22px;margin:0 0 4px;color:var(--navy,#0B1730)}.ktb .k-lead{color:var(--k-ink2);margin:0;max-width:70ch}.ktb .k-lead b{color:var(--k-ink)}' +
    '.ktb .k-seg{display:inline-flex;border:1px solid var(--k-ring);border-radius:8px;overflow:hidden;background:var(--k-surface);max-width:100%;flex-wrap:wrap}' +
    '.ktb .k-seg button{font:inherit;font-size:13px;color:var(--k-ink2);background:transparent;border:0;border-right:1px solid var(--k-ring);padding:7px 14px;cursor:pointer;display:inline-flex;gap:7px;align-items:center;white-space:nowrap;min-height:34px}' +
    '.ktb .k-seg button:last-child{border-right:0}.ktb .k-seg button[aria-pressed="true"]{background:var(--k-ink);color:#fff}.ktb .k-seg button:focus-visible{outline:2px solid var(--k-s1);outline-offset:-2px}.ktb .k-seg.sm button{padding:5px 11px;font-size:12.5px;min-height:30px}' +
    '.ktb .k-controls{display:flex;flex-wrap:wrap;gap:8px 12px}.ktb .k-flag{width:20px;height:14px;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.15);flex:none}' +
    '.ktb .k-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}@container (min-width:900px){.ktb .k-kpis{grid-template-columns:repeat(4,1fr)}}' +
    '.ktb .k-kpi{background:var(--k-surface);border:1px solid var(--k-ring);border-radius:12px;padding:14px 16px;min-width:0}.ktb .k-kpi span{color:var(--k-ink2);font-size:13px}.ktb .k-kpi b{display:block;font-weight:700;font-size:clamp(28px,7cqw,40px);line-height:1.1;margin:4px 0 2px}.ktb .k-kpi small{color:var(--k-ink2);font-size:12px;display:block}' +
    '.ktb .k-grid{display:grid;gap:14px;grid-template-columns:1fr}@container (min-width:720px){.ktb .k-grid{grid-template-columns:1fr 1fr}}' +
    '.ktb .k-card{background:var(--k-surface);border:1px solid var(--k-ring);border-radius:12px;padding:16px;min-width:0}.ktb .k-card.full{grid-column:1/-1}' +
    '.ktb .k-head{display:flex;flex-wrap:wrap;gap:8px 12px;justify-content:space-between;align-items:flex-start;margin-bottom:8px}.ktb .k-head>div{min-width:0}' +
    '.ktb h2{font-size:15px;margin:0 0 2px;font-weight:650;color:var(--k-ink)}.ktb .k-desc{margin:0;color:var(--k-ink2);font-size:13px;max-width:64ch}' +
    '.ktb .k-legend{display:flex;flex-wrap:wrap;gap:4px 14px;margin:8px 0 6px;font-size:12.5px;color:var(--k-ink2)}.ktb .k-legend i{display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:6px;vertical-align:-2px}.ktb .k-legend i.ring{background:var(--k-surface);border:2.5px solid;border-radius:50%}' +
    '.ktb .k-chart{position:relative;min-width:0}.ktb svg{display:block;width:100%;height:auto;overflow:visible}.ktb svg text{font-family:inherit;fill:var(--k-ink)}.ktb svg .t2{fill:var(--k-ink2)}.ktb svg .tm{fill:var(--k-muted)}' +
    '.ktb svg .halo{paint-order:stroke;stroke:var(--k-surface);stroke-width:3px;stroke-linejoin:round}.ktb .row .hit{fill:transparent}.ktb .row:hover .hit,.ktb .row:focus .hit{fill:var(--k-blue-wash)}.ktb .row:focus{outline:none}' +
    '#ktb-tip{position:fixed;z-index:200;pointer-events:none;opacity:0;transition:opacity .08s;background:#fff;color:#0b0b0b;border:1px solid rgba(11,11,11,.1);box-shadow:0 6px 24px rgba(0,0,0,.18);font-size:13px;line-height:1.5;padding:8px 11px;border-radius:8px;max-width:320px}#ktb-tip .ttl{color:#52514e;display:block}' +
    '.ktb .k-donuts{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-top:10px}.ktb .k-donut{text-align:center;min-width:0}.ktb .k-donut svg{max-width:200px;margin:0 auto}.ktb .k-donut .nm{font-weight:650;font-size:13px;margin-top:8px}' +
    '.ktb .k-donut .lg{display:flex;flex-wrap:wrap;gap:2px 10px;justify-content:center;font-size:12px;color:var(--k-ink2);margin-top:4px}.ktb .k-donut .lg i{display:inline-block;width:11px;height:11px;border-radius:2px;margin-right:5px;vertical-align:-1px}' +
    '.ktb .k-dist h3{font-size:14px;margin:14px 0 6px;font-weight:650}.ktb .drow{display:grid;grid-template-columns:70px 1fr 32px;gap:10px;align-items:center;margin:5px 0;font-size:13px}.ktb .drow .bar{display:flex;gap:2px;height:28px}' +
    '.ktb .drow .bar>div{display:grid;place-items:center;color:#fff;font-size:12px;font-weight:600;border-radius:3px;min-width:0;overflow:hidden}.ktb .drow .n{text-align:right;color:var(--k-ink2);font-variant-numeric:tabular-nums}' +
    '.ktb .k-bodywrap{display:grid;gap:18px;grid-template-columns:1fr;margin-top:6px}@container (min-width:720px){.ktb .k-bodywrap{grid-template-columns:1.15fr 1fr;align-items:start}}.ktb .k-bodywrap h3{font-size:14px;margin:0 0 8px;font-weight:650}' +
    '.ktb .hr{display:grid;grid-template-columns:minmax(90px,175px) 1fr auto;gap:10px;align-items:center;margin:7px 0;font-size:13px}.ktb .hr .t{height:12px;background:var(--k-grid);border-radius:6px;overflow:hidden}.ktb .hr .t i{display:block;height:100%;border-radius:6px}' +
    '.ktb .hr .v{color:var(--k-ink2);font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}.ktb .hr:hover{background:var(--k-blue-wash)}' +
    '.ktb .k-scale{display:flex;align-items:center;gap:8px;justify-content:center;font-size:12px;color:var(--k-ink2);margin-top:6px}.ktb .k-scale i{width:26px;height:12px;border-radius:6px;display:inline-block}' +
    '.ktb .k-sel{font:inherit;font-size:13px;padding:6px 10px;border:1px solid var(--k-ring);border-radius:8px;background:var(--k-surface);color:var(--k-ink);min-height:34px}' +
    '.ktb .c-late{background:var(--k-crit)}.ktb .c-soon{background:var(--k-warn)}.ktb .c-ok{background:var(--k-s1)}.ktb .c-ready{background:var(--k-good)}' +
    '.ktb .k-tablewrap{overflow-x:auto}.ktb table{border-collapse:collapse;width:100%;min-width:1120px;font-size:13px}.ktb th,.ktb td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--k-grid);vertical-align:top}' +
    '.ktb th{font-weight:600;color:var(--k-ink2);font-size:12px;white-space:nowrap;background:transparent;text-transform:none;letter-spacing:0}.ktb td.nw{white-space:nowrap}.ktb td.n,.ktb th.n{text-align:right;font-variant-numeric:tabular-nums}' +
    '.ktb td.cm{min-width:300px;max-width:420px;color:var(--k-ink2)}.ktb .pl{display:inline-flex;gap:5px;align-items:center;white-space:nowrap}.ktb .pl b{font-weight:700}' +
    '.ktb .mbar{display:inline-block;width:48px;height:6px;background:var(--k-track);border-radius:3px;vertical-align:middle;margin-right:6px;overflow:hidden}.ktb .mbar i{display:block;height:100%;background:var(--k-s1)}' +
    '.ktb .k-empty{color:var(--k-ink2);padding:16px 0}.ktb .k-note{font-size:12px;color:var(--k-ink2);margin:0}.ktb .sub2{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}' +
    '.ktb .k-body [data-zona]{transition:filter .1s}.ktb .k-body [data-zona]:hover{filter:brightness(.9)}';

  var FLAGS = {
    es: '<svg class="k-flag" viewBox="0 0 20 14"><rect width="7" height="14" fill="#006847"/><rect x="7" width="6" height="14" fill="#fff"/><rect x="13" width="7" height="14" fill="#ce1126"/><circle cx="10" cy="7" r="1.6" fill="#8a6d2f"/></svg>',
    en: '<svg class="k-flag" viewBox="0 0 20 14"><rect width="20" height="14" fill="#fff"/><g fill="#b22234"><rect width="20" height="2"/><rect y="4" width="20" height="2"/><rect y="8" width="20" height="2"/><rect y="12" width="20" height="2"/></g><rect width="9" height="7.5" fill="#3c3b6e"/></svg>',
    ja: '<svg class="k-flag" viewBox="0 0 20 14"><rect width="20" height="14" fill="#fff"/><circle cx="10" cy="7" r="4" fill="#bc002d"/></svg>'
  };

  function render(host, eventos, opts) {
    opts = opts || {};
    var KF = opts.KF || root.KF;
    if (!document.getElementById('ktb-css')) { var st = document.createElement('style'); st.id = 'ktb-css'; st.textContent = CSS; document.head.appendChild(st); }
    var tip = document.getElementById('ktb-tip');
    if (!tip) { tip = document.createElement('div'); tip.id = 'ktb-tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); }
    if (host.__ktbRO) { try { host.__ktbRO.disconnect(); } catch (e) {} }

    /* ---------- Datos: un renglón por comunicado ---------- */
    var DATA = (eventos || []).filter(function (e) { return e.clase === 'COMUNICADO' && /^\d{4}-\d{2}-\d{2}/.test(String(e.fecha || '')); }).map(function (e) {
      var f = String(e.fecha).slice(0, 10), c = CAT_DE[e.clasificacion] || 'XX';
      var acts = e.acciones || [], grupos = KF && KF.gruposDeEvento ? KF.gruposDeEvento(e) : (e.parteRE ? [e.parteRE] : []);
      var r = { y: +f.slice(0, 4), m: +f.slice(5, 7), f: f, n: e.numero || e.folio, folio: e.folio, c: c, tu: e.turno || 'Sin turno', ar: e.area || 'Sin área',
        desc: e.desc || { es: '', en: '' }, ps: e.estatus === 'Cerrado' ? 'Closed' : 'Opened', et: e.tipoEvento || 'Sin clasificar', inj: !!LESION[c],
        bp: grupos, zonas: KF && KF.zonasDeEvento ? KF.zonasDeEvento(e) : [], wd: e.tipoLesion || '', dp: Number(e.diasPerdidos) || 0, acts: acts };
      // contramedidas del evento resumidas en un solo renglón (el más urgente manda)
      r.hasCM = acts.length > 0;
      r.av = acts.length ? acts.reduce(function (a, x) { return a + (Number(x.av) || 0); }, 0) / acts.length / 100 : 0;
      var abiertas = acts.filter(function (x) { return x.estatus !== 'Cerrada'; }), base = abiertas.length ? abiertas : acts;
      var dues = base.map(function (x) { return { tc: parse(x.comp), te: parse(x.ext) }; }).map(function (x) { return { tc: x.tc, te: x.te, due: x.te != null ? x.te : x.tc }; }).filter(function (x) { return x.due != null; });
      dues.sort(function (a, b) { return a.due - b.due; });
      r.tc = dues.length ? dues[0].tc : null; r.te = dues.length ? dues[0].te : null; r.due = dues.length ? dues[0].due : null;
      var cmsv = acts.map(function (x) { return Number(x.cms) || 0; }).filter(Boolean); r.cms = cmsv.length ? Math.min.apply(null, cmsv) : 0;
      var segs = acts.map(function (x) { return x.seg; }).filter(Boolean).sort(); r.seg = segs[0] || '';
      r.resp = acts.map(function (x) { return x.resp; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).join(', ');
      r.cm = acts.map(function (x) { return x.es || x.en; }).filter(Boolean).join(' · ');
      r.nota = acts.map(function (x) { return x.nota; }).filter(Boolean).join(' · ');
      r.t0 = parse(f); r.open = r.ps === 'Opened'; r.days = r.due != null ? Math.round((r.due - T) / DAY) : null;
      if (r.open) r.status = r.av >= 1 ? 'ready' : (r.days != null && r.days < 0) ? 'late' : (r.days != null && r.days <= 30) ? 'soon' : 'ok';
      return r;
    });
    var YEARS = DATA.map(function (r) { return r.y; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
    if (!YEARS.length) YEARS = [hoy.getFullYear()];
    var YCOL = {}; YEARS.forEach(function (y, i) { YCOL[y] = PALETA[(i + Math.max(0, 3 - YEARS.length)) % PALETA.length]; });
    var S = host.__ktbS || { lang: opts.lang || 'es', year: 'all', cy: {}, area: 'Todas', tab: 'open', cmy: null };
    if (opts.lang && !host.__ktbS) S.lang = opts.lang;
    host.__ktbS = S;
    var CMYEARS = YEARS.slice();
    if (!S.cmy || CMYEARS.indexOf(S.cmy) < 0) {
      var conCM = DATA.filter(function (r) { return r.hasCM; }).map(function (r) { return r.y; });
      S.cmy = conCM.length ? Math.max.apply(null, conCM) : YEARS[YEARS.length - 1];
      if (YEARS.indexOf(hoy.getFullYear()) >= 0 && DATA.some(function (r) { return r.y === hoy.getFullYear() && r.hasCM; })) S.cmy = hoy.getFullYear();
    }

    var t = function (k) { var v = L[S.lang][k]; return v === undefined ? L.es[k] : v; };
    var tx = function (s) { var m = L[S.lang].x; return (m && m[s]) || s; };
    var cname = function (c) { return L[S.lang].cat[c] || c; };
    var fdate = function (ts) { if (ts == null) return '—'; var d = new Date(ts); return S.lang === 'ja' ? (d.getUTCMonth() + 1) + '月' + d.getUTCDate() + '日' : d.getUTCDate() + ' ' + L[S.lang].mshort[d.getUTCMonth()].toLowerCase(); };
    var iso = function (ts) { return ts == null ? '—' : new Date(ts).toISOString().slice(0, 10); };
    var pct = function (v) { return Math.round(v * 100) + '%'; };
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var short = function (s, n) { s = s || ''; return s.length > n ? s.slice(0, n - 1) + '…' : s; };
    var dtext = function (r) { return (S.lang === 'en' && r.desc.en) ? r.desc.en : (r.desc.es || r.desc.en || ''); };
    var $ = function (id) { return host.querySelector('#ktb-' + id); };

    function el(n, a, p, text) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (text != null) e.textContent = text; if (p) p.appendChild(e); return e; }
    function showTip(html, ev) {
      tip.innerHTML = html; tip.style.opacity = 1;
      var x = ev.clientX + 14, y = ev.clientY + 14;
      x = Math.max(6, Math.min(x, window.innerWidth - tip.offsetWidth - 6));
      if (y + tip.offsetHeight > window.innerHeight - 6) y = ev.clientY - tip.offsetHeight - 10;
      tip.style.left = x + 'px'; tip.style.top = Math.max(6, y) + 'px';
    }
    function hideTip() { tip.style.opacity = 0; }
    function bind(g, html) {
      g.addEventListener('mousemove', function (e) { showTip(typeof html === 'function' ? html() : html, e); });
      g.addEventListener('mouseleave', hideTip);
      g.addEventListener('focus', function () { var r = g.getBoundingClientRect(); showTip(typeof html === 'function' ? html() : html, { clientX: r.left + 30, clientY: r.top }); });
      g.addEventListener('blur', hideTip);
    }
    function niceMax(v) { if (v <= 5) return 5; var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; var s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10; var m = s * p; return m >= v ? m : 10 * p; }
    function yearsOf(id) { var y = S.cy[id] || S.year; return y === 'all' ? YEARS : [+y]; }
    function scopeRows(id) { var ys = yearsOf(id); return DATA.filter(function (r) { return ys.indexOf(r.y) >= 0; }); }
    function yearSeg(id) {
      var cur = S.cy[id] || S.year, h = '<div class="k-seg sm" role="group">';
      YEARS.concat(['all']).forEach(function (y) { h += '<button type="button" data-card="' + id + '" data-y="' + y + '" aria-pressed="' + (String(cur) === String(y)) + '">' + (y === 'all' ? t('all') : y) + '</button>'; });
      return h + '</div>';
    }
    var sec = function (id, full, titulo, desc, extra) {
      return '<section class="k-card' + (full ? ' full' : '') + '"><div class="k-head"><div><h2 data-i="' + titulo + '"></h2><p class="k-desc" data-i="' + desc + '"></p></div>' + (extra || '') + '</div>';
    };

    /* ---------- Estructura ---------- */
    host.classList.add('ktb', 'no-i18n');
    host.innerHTML = '<div class="k-stack">' +
      '<header><h1 id="ktb-h1"></h1><p class="k-lead" id="ktb-lead"></p></header>' +
      '<div class="k-controls"><div class="k-seg" id="ktb-lang" role="group" aria-label="Idioma"></div><div class="k-seg" id="ktb-yr" role="group" aria-label="Año"></div></div>' +
      '<div class="k-kpis" id="ktb-kpis"></div>' +
      '<div class="k-grid">' +
      sec('month', 0, 'byMonth', 'byMonthD') + '<div data-yr="month"></div><div class="k-legend" id="ktb-lg-month"></div><div class="k-chart" id="ktb-c-month"></div></section>' +
      sec('area', 0, 'byArea', 'byAreaD', '<div data-yr="area"></div>') + '<div class="k-legend" id="ktb-lg-area"></div><div class="k-chart" id="ktb-c-area"></div></section>' +
      sec('cat', 0, 'byCat', 'byCatD', '<div data-yr="cat"></div>') + '<div class="k-legend" id="ktb-lg-cat"></div><div class="k-chart" id="ktb-c-cat"></div></section>' +
      sec('shift', 0, 'byShift', 'byShiftD', '<div data-yr="shift"></div>') + '<div class="k-legend" id="ktb-lg-shift"></div><div class="k-chart" id="ktb-c-shift"></div></section>' +
      sec('type', 0, 'byType', 'byTypeD') + '<div data-yr="type"></div><div class="k-legend" id="ktb-lg-type"></div><div class="k-chart" id="ktb-c-type"></div></section>' +
      sec('oc', 0, 'openClosed', 'openClosedD') + '<div data-yr="oc"></div><div class="k-legend" id="ktb-lg-oc"></div><div class="k-chart" id="ktb-c-oc"></div></section>' +
      sec('compl', 1, 'compl', 'complD', '<div data-yr="compl"></div>') + '<div class="k-donuts" id="ktb-donuts"></div></section>' +
      sec('dist', 1, 'distr', 'distrD', '<div data-yr="dist"></div>').replace('k-card full', 'k-card full k-dist') + '<div class="k-legend" id="ktb-lg-dist"></div><div id="ktb-dist"></div></section>' +
      sec('body', 1, 'body', 'bodyD', '<div data-yr="body"></div>') + '<div class="k-bodywrap"><div><div class="k-chart k-body" id="ktb-bodysvg"></div><div class="k-scale" id="ktb-bscale"></div></div><div id="ktb-bodybars"></div></div></section>' +
      '<section class="k-card full"><div class="k-head"><div><h2 id="ktb-cmt"></h2><p class="k-desc" data-i="cmD"></p></div><div class="sub2"><label class="k-desc" for="ktb-cmy" data-i="year"></label><select class="k-sel" id="ktb-cmy"></select><label class="k-desc" for="ktb-cmarea" data-i="area"></label><select class="k-sel" id="ktb-cmarea"></select></div></div>' +
      '<div class="k-legend" id="ktb-lg-cm"></div><div class="k-chart" id="ktb-funnel"></div></section>' +
      sec('g', 1, 'gT', 'gD') + '<div class="k-legend" id="ktb-lg-g"></div><div class="k-chart" id="ktb-gantt"></div></section>' +
      '<section class="k-card full"><div class="k-head"><div><h2 data-i="tT"></h2><p class="k-desc" id="ktb-tdesc"></p></div><div class="k-seg sm" id="ktb-tabs" role="group"></div></div><div class="k-tablewrap"><table id="ktb-tbl"></table></div></section>' +
      '</div><p class="k-note" id="ktb-foot"></p></div>';

    /* ---------- Gráfico de líneas ---------- */
    function lineChart(hostId, cats, labels, series, opt) {
      opt = opt || {};
      var hh = $(hostId); hh.innerHTML = '';
      var W = hh.clientWidth || 500, narrow = W < 420;
      var trunc = narrow ? 11 : 16;
      var shownLab = labels.map(function (l) { return opt.noTrunc ? l : short(l, trunc); });
      var mb = 18 + Math.min(Math.max.apply(null, shownLab.map(function (l) { return l.length; }).concat([1])), 20) * 5.2 * 0.7 + 8;
      var H = (narrow ? 250 : 290) + mb - 30, ml = 34, mr = 10, mt = 10;
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': opt.aria || '' }, hh);
      var vmax = 1; series.forEach(function (s) { s.vals.forEach(function (v) { if (v != null) vmax = Math.max(vmax, v); }); });
      var ymax = niceMax(vmax), step = ymax <= 5 ? 1 : ymax <= 10 ? 2 : ymax <= 25 ? 5 : ymax <= 60 ? 10 : 20;
      var ih = H - mt - mb, iw = W - ml - mr;
      var Y = function (v) { return mt + ih * (1 - v / ymax); };
      var X = function (i) { return ml + iw * (i + 0.5) / Math.max(cats.length, 1); };
      for (var v = 0; v <= ymax + 1e-9; v += step) {
        el('line', { x1: ml, x2: W - mr, y1: Y(v), y2: Y(v), stroke: 'var(--k-grid)' }, svg);
        el('text', { x: ml - 8, y: Y(v) + 4, 'text-anchor': 'end', 'font-size': 11, class: 'tm' }, svg, v);
      }
      shownLab.forEach(function (l, i) { el('text', { x: X(i), y: mt + ih + 14, 'text-anchor': 'end', 'font-size': 11, class: 'tm', transform: 'rotate(-32 ' + X(i) + ' ' + (mt + ih + 14) + ')' }, svg, l); });
      series.forEach(function (s) {
        var seg = [], segs = [seg];
        s.vals.forEach(function (v, i) { if (v == null) { seg = []; segs.push(seg); } else seg.push(X(i) + ',' + Y(v)); });
        segs.forEach(function (q) { if (q.length > 1) el('polyline', { points: q.join(' '), fill: 'none', stroke: s.color, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, svg); });
      });
      series.forEach(function (s) { s.vals.forEach(function (v, i) { if (v == null) return; el('circle', { cx: X(i), cy: Y(v), r: 4, fill: 'var(--k-surface)', stroke: s.color, 'stroke-width': 2 }, svg); }); });
      var cross = el('line', { y1: mt, y2: mt + ih, stroke: 'var(--k-muted)', opacity: 0 }, svg);
      var hit = el('rect', { x: ml, y: mt, width: iw, height: ih + 6, fill: 'transparent' }, svg);
      hit.addEventListener('mousemove', function (e) {
        var r = svg.getBoundingClientRect(), px = (e.clientX - r.left) * (W / r.width);
        var i = Math.max(0, Math.min(cats.length - 1, Math.floor((px - ml) / iw * cats.length)));
        cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.setAttribute('opacity', 1);
        var h = '<span class="ttl"><b>' + esc(labels[i]) + '</b></span>';
        series.forEach(function (s) { if (s.vals[i] != null) h += '<span style="color:' + s.color + '">●</span> ' + esc(s.name) + ': <b>' + s.vals[i] + '</b><br>'; });
        showTip(h, e);
      });
      hit.addEventListener('mouseleave', function () { cross.setAttribute('opacity', 0); hideTip(); });
    }
    function legendYears(id, series) { $(id).innerHTML = series.map(function (s) { return '<span><i class="ring" style="border-color:' + s.color + '"></i>' + s.name + ' · ' + t('total') + ' ' + s.total + '</span>'; }).join(''); }
    function yearSeries(id, keyFn, keys) {
      return yearsOf(id).map(function (y) {
        var rows = DATA.filter(function (r) { return r.y === y; });
        var lastM = Math.max.apply(null, rows.map(function (r) { return r.m; }).concat([0])), isNow = y === hoy.getFullYear();
        var vals = keys.map(function (k) { if (id === 'month' && isNow && k > Math.max(lastM, hoy.getMonth() + 1)) return null; return rows.filter(function (r) { return keyFn(r) === k; }).length; });
        return { name: String(y), color: YCOL[y], vals: vals, total: rows.length };
      });
    }
    var cuentaPor = function (k) { var c = {}; DATA.forEach(function (r) { c[r[k]] = (c[r[k]] || 0) + 1; }); return Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }); };
    var AREAS = cuentaPor('ar');
    var SHIFTS = ['Verde', 'Azul', 'Mixto', 'Sin turno'].filter(function (s) { return DATA.some(function (r) { return r.tu === s; }); }).concat(cuentaPor('tu').filter(function (s) { return ['Verde', 'Azul', 'Mixto', 'Sin turno'].indexOf(s) < 0; }));
    var TYPES = ETYPES.concat(cuentaPor('et').filter(function (e) { return ETYPES.indexOf(e) < 0; }));
    var CATSV = CATS.concat(DATA.some(function (r) { return r.c === 'XX'; }) ? ['XX'] : []);

    function drawLines() {
      var s;
      s = yearSeries('month', function (r) { return r.m; }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]); legendYears('lg-month', s);
      lineChart('c-month', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], L[S.lang].months, s, { noTrunc: true, aria: t('byMonth') });
      s = yearSeries('area', function (r) { return r.ar; }, AREAS); legendYears('lg-area', s);
      lineChart('c-area', AREAS, AREAS.map(tx), s, { aria: t('byArea') });
      s = yearSeries('cat', function (r) { return r.c; }, CATSV); legendYears('lg-cat', s);
      lineChart('c-cat', CATSV, CATSV.map(cname), s, { aria: t('byCat') });
      s = yearSeries('shift', function (r) { return r.tu; }, SHIFTS); legendYears('lg-shift', s);
      lineChart('c-shift', SHIFTS, SHIFTS.map(tx), s, { aria: t('byShift') });
      s = yearSeries('type', function (r) { return r.et; }, TYPES); legendYears('lg-type', s);
      lineChart('c-type', TYPES, TYPES.map(tx), s, { aria: t('byType') });
    }

    /* ---------- Abiertos y cerrados por área ---------- */
    function drawOC() {
      var rows = scopeRows('oc'), hh = $('c-oc'); hh.innerHTML = '';
      var by = {}; AREAS.forEach(function (a) { by[a] = { o: 0, c: 0 }; });
      rows.forEach(function (r) { by[r.ar][r.ps === 'Opened' ? 'o' : 'c']++; });
      var names = AREAS.slice().sort(function (a, b) { return by[b].o - by[a].o || (by[b].o + by[b].c) - (by[a].o + by[a].c); });
      var yo = {}; YEARS.forEach(function (y) { yo[y] = DATA.filter(function (r) { return r.y === y && r.ps === 'Opened'; }).length; });
      $('lg-oc').innerHTML = '<span><i style="background:var(--k-crit)"></i>' + t('opened') + '</span><span><i style="background:var(--k-hn)"></i>' + t('closed') + '</span><span><i style="background:none;border-top:2.5px solid var(--k-ink);height:0;vertical-align:3px"></i>' + t('cumOpen') + '</span>' +
        yearsOf('oc').map(function (y) { return '<span><i class="ring" style="border-color:' + YCOL[y] + '"></i>' + y + ' · ' + t('total') + ' ' + yo[y] + '</span>'; }).join('');
      if (!names.length) { hh.innerHTML = '<div class="k-empty">—</div>'; return; }
      var W = hh.clientWidth || 500, narrow = W < 420, labs = names.map(function (n) { return short(tx(n), narrow ? 11 : 16); });
      var mb = 22 + Math.min(Math.max.apply(null, labs.map(function (l) { return l.length; })), 20) * 3.6 + 8, H = (narrow ? 250 : 290) + mb - 30, ml = 34, mr = 10, mt = 10, ih = H - mt - mb, iw = W - ml - mr;
      var vmax = 1, cum = 0, cumv = names.map(function (n) { cum += by[n].o; return cum; });
      names.forEach(function (n, i) { vmax = Math.max(vmax, by[n].o, by[n].c, cumv[i]); });
      var ymax = niceMax(vmax), step = ymax <= 5 ? 1 : ymax <= 10 ? 2 : ymax <= 25 ? 5 : ymax <= 60 ? 10 : 20;
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': t('openClosed') }, hh);
      var Y = function (v) { return mt + ih * (1 - v / ymax); }, bw = iw / names.length, X = function (i) { return ml + bw * (i + 0.5); };
      for (var v = 0; v <= ymax + 1e-9; v += step) { el('line', { x1: ml, x2: W - mr, y1: Y(v), y2: Y(v), stroke: 'var(--k-grid)' }, svg); el('text', { x: ml - 8, y: Y(v) + 4, 'text-anchor': 'end', 'font-size': 11, class: 'tm' }, svg, v); }
      labs.forEach(function (l, i) { el('text', { x: X(i), y: mt + ih + 14, 'text-anchor': 'end', 'font-size': 11, class: 'tm', transform: 'rotate(-32 ' + X(i) + ' ' + (mt + ih + 14) + ')' }, svg, l); });
      var w = Math.min(bw * 0.34, 20);
      names.forEach(function (n, i) {
        var g = el('g', { class: 'row', tabindex: 0 }, svg), a = by[n];
        el('rect', { class: 'hit', x: ml + bw * i, y: mt, width: bw, height: ih, rx: 4 }, g);
        if (a.o) el('rect', { x: X(i) - w - 1, y: Y(a.o), width: w, height: Y(0) - Y(a.o), rx: 3, fill: 'var(--k-crit)' }, g);
        if (a.c) el('rect', { x: X(i) + 1, y: Y(a.c), width: w, height: Y(0) - Y(a.c), rx: 3, fill: 'var(--k-hn)' }, g);
        bind(g, '<span class="ttl"><b>' + esc(tx(n)) + '</b></span>' + t('opened') + ': <b>' + a.o + '</b><br>' + t('closed') + ': <b>' + a.c + '</b><br>' + t('cumOpen') + ': <b>' + cumv[i] + '</b>');
      });
      el('polyline', { points: names.map(function (n, i) { return X(i) + ',' + Y(cumv[i]); }).join(' '), fill: 'none', stroke: 'var(--k-ink)', 'stroke-width': 2 }, svg);
      names.forEach(function (n, i) { el('circle', { cx: X(i), cy: Y(cumv[i]), r: 3.5, fill: 'var(--k-surface)', stroke: 'var(--k-ink)', 'stroke-width': 2 }, svg); });
    }

    /* ---------- Donas ---------- */
    function arcPath(cx, cy, r0, r1, a0, a1) {
      var p = function (r, a) { return [cx + r * Math.sin(a), cy - r * Math.cos(a)]; }, large = a1 - a0 > Math.PI ? 1 : 0;
      var A = p(r1, a0), B = p(r1, a1), C = p(r0, a1), D = p(r0, a0);
      return 'M' + A + ' A' + r1 + ' ' + r1 + ' 0 ' + large + ' 1 ' + B + ' L' + C + ' A' + r0 + ' ' + r0 + ' 0 ' + large + ' 0 ' + D + ' Z';
    }
    function donut(parent, name, segs, centerTxt) {
      var wrap = document.createElement('div'); wrap.className = 'k-donut';
      var sv = el('svg', { viewBox: '0 0 200 200', role: 'img', 'aria-label': name + ' ' + centerTxt }, null);
      var tot = segs.reduce(function (a, s) { return a + s.v; }, 0), a = 0, nz = segs.filter(function (s) { return s.v > 0; });
      if (!tot) el('circle', { cx: 100, cy: 100, r: 72, fill: 'none', stroke: 'var(--k-track)', 'stroke-width': 30 }, sv);
      segs.forEach(function (s) {
        if (!s.v) return;
        var g = el('g', {}, sv), da = s.v / tot * 2 * Math.PI;
        if (nz.length === 1) el('circle', { cx: 100, cy: 100, r: 72, fill: 'none', stroke: s.color, 'stroke-width': 30 }, g);
        else { var gap = 0.03; el('path', { d: arcPath(100, 100, 57, 87, a + gap, a + da - gap), fill: s.color }, g); }
        bind(g, '<span class="ttl"><b>' + esc(name) + '</b></span><span style="color:' + s.color + '">●</span> ' + esc(s.label) + ': <b>' + s.v + '</b> (' + Math.round(s.v / tot * 100) + '%)');
        a += da;
      });
      el('text', { x: 100, y: 112, 'text-anchor': 'middle', 'font-size': 34 }, sv, centerTxt);
      wrap.appendChild(sv);
      var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = name; wrap.appendChild(nm);
      var lg = document.createElement('div'); lg.className = 'lg';
      lg.innerHTML = segs.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + esc(s.label) + ' ' + s.v + '</span>'; }).join('');
      wrap.appendChild(lg); parent.appendChild(wrap);
    }
    function drawDonuts() {
      var hh = $('donuts'); hh.innerHTML = '';
      yearsOf('compl').forEach(function (y) {
        var rows = DATA.filter(function (r) { return r.y === y; }), c = rows.filter(function (r) { return r.ps !== 'Opened'; }).length, o = rows.length - c;
        donut(hh, t('psClosed') + ' · ' + y, [{ v: c, color: 'var(--k-dgreen)', label: t('psCl') }, { v: o, color: 'var(--k-crit)', label: t('psOp') }], rows.length ? Math.round(c / rows.length * 100) + '%' : '—');
        var cm = rows.filter(function (r) { return r.hasCM; });
        if (cm.length) {
          var k = [3, 2, 1].map(function (n) { return cm.filter(function (r) { return r.cms === n; }).length; }), sin = cm.filter(function (r) { return !r.cms; }).length;
          var sg = [{ v: k[0], color: 'var(--k-dgreen)', label: t('cmsOkS') }, { v: k[1], color: 'var(--k-brown)', label: t('cmsGo') }, { v: k[2], color: 'var(--k-crit)', label: t('cmsNo') }];
          if (sin) sg.push({ v: sin, color: 'var(--k-hn)', label: t('cmsNa') });
          donut(hh, t('cmsOk') + ' · ' + y, sg, Math.round(k[0] / cm.length * 100) + '%');
        }
      });
    }

    /* ---------- Distribución turno × clasificación ---------- */
    function drawDist() {
      $('lg-dist').innerHTML = CATORD.map(function (c) { return '<span><i style="background:' + CATCOL[c] + '"></i>' + cname(c) + '</span>'; }).join('');
      var hh = $('dist'); hh.innerHTML = '';
      yearsOf('dist').forEach(function (y) {
        var h = '<h3>' + y + '</h3>';
        SHIFTS.forEach(function (tu) {
          var rows = DATA.filter(function (r) { return r.y === y && r.tu === tu; }); if (!rows.length) return;
          h += '<div class="drow"><span>' + esc(tx(tu)) + '</span><div class="bar">';
          CATORD.concat(['XX']).forEach(function (c) {
            var n = rows.filter(function (r) { return r.c === c; }).length; if (!n) return;
            var p = n / rows.length;
            h += '<div style="flex:' + n + ';background:' + CATCOL[c] + (c === 'PD' ? ';color:#0b0b0b' : '') + '" data-tip="' + esc('<span class="ttl"><b>' + y + ' · ' + esc(tx(tu)) + '</b></span><span style="color:' + CATCOL[c] + '">●</span> ' + esc(cname(c)) + ': <b>' + n + '</b> (' + Math.round(p * 100) + '%)') + '">' + (p >= 0.08 ? Math.round(p * 100) + '%' : '') + '</div>';
          });
          h += '</div><span class="n">' + rows.length + '</span></div>';
        });
        hh.insertAdjacentHTML('beforeend', h);
      });
      [].forEach.call(hh.querySelectorAll('[data-tip]'), function (n) { n.addEventListener('mousemove', function (e) { showTip(n.getAttribute('data-tip'), e); }); n.addEventListener('mouseleave', hideTip); });
    }

    /* ---------- Cuerpo (imagen del sistema) ---------- */
    function drawBody() {
      var ys = yearsOf('body'), inj = DATA.filter(function (r) { return ys.indexOf(r.y) >= 0 && r.inj; }), tot = inj.length || 1;
      var cnt = {}, wc = {}; PARTS.forEach(function (p) { cnt[p] = 0; wc[p] = {}; });
      var wtot = {}, WL = WOUNDS.slice(), zonas = {};
      inj.forEach(function (r) {
        var w = r.wd || 'Sin especificar'; if (WL.indexOf(w) < 0) WL.push(w); wtot[w] = (wtot[w] || 0) + 1;
        (r.bp.length ? r.bp : ['No especificada']).forEach(function (p) { if (cnt[p] === undefined) { cnt[p] = 0; wc[p] = {}; } cnt[p]++; wc[p][w] = (wc[p][w] || 0) + 1; });
        r.zonas.forEach(function (z) { zonas[z] = (zonas[z] || 0) + 1; });
      });
      var parts = Object.keys(cnt).sort(function (a, b) { return (a === 'No especificada') - (b === 'No especificada') || cnt[b] - cnt[a] || PARTS.indexOf(a) - PARTS.indexOf(b); });
      var max = Math.max.apply(null, parts.filter(function (p) { return p !== 'No especificada'; }).map(function (p) { return cnt[p]; }).concat([0]));
      var tipFor = function (p) {
        var h = '<span class="ttl">' + esc(tx(p)) + '</span><b>' + cnt[p] + '</b> ' + t('lesiones') + ' · ' + Math.round(cnt[p] / tot * 100) + '%';
        Object.keys(wc[p]).sort(function (a, b) { return wc[p][b] - wc[p][a]; }).forEach(function (w) { h += '<br>' + esc(tx(w)) + ': ' + wc[p][w]; });
        return h;
      };
      var fillOf = function (p) { return p === 'No especificada' ? 'var(--k-hn)' : 'rgba(220,38,38,' + (max ? (0.18 + 0.6 * Math.min(cnt[p] / max, 1)).toFixed(2) : 0.18) + ')'; };
      var bs = $('bodysvg');
      if (KF && KF.cuerpoSVG) {
        bs.innerHTML = KF.cuerpoSVG([], zonas, false);
        [].forEach.call(bs.querySelectorAll('[data-zona]'), function (z) {
          var g = KF.grupoDeZona ? KF.grupoDeZona(z.getAttribute('data-zona')) : '';
          [].forEach.call(z.querySelectorAll('title'), function (x) { x.remove(); });
          if (!g) return;
          z.style.cursor = 'default';
          z.addEventListener('mousemove', function (e) { showTip(tipFor(g) + (zonas[z.getAttribute('data-zona')] ? '<br><span class="ttl">' + esc(KF.nombreZona(z.getAttribute('data-zona'))) + ': ' + zonas[z.getAttribute('data-zona')] + '</span>' : ''), e); });
          z.addEventListener('mouseleave', hideTip);
        });
      } else bs.innerHTML = '<div class="k-empty">—</div>';
      $('bscale').innerHTML = t('less') + ' <i style="background:rgba(220,38,38,.2)"></i><i style="background:rgba(220,38,38,.4)"></i><i style="background:rgba(220,38,38,.6)"></i><i style="background:rgba(220,38,38,.78)"></i> ' + t('more');
      var b = $('bodybars'), h = '<h3>' + t('byPart') + '</h3>';
      parts.forEach(function (p) { h += '<div class="hr" data-p="' + esc(p) + '"><span>' + esc(tx(p)) + '</span><div class="t"><i style="width:' + (max ? Math.min(cnt[p] / max, 1) * 100 : 0) + '%;background:' + fillOf(p) + '"></i></div><span class="v">' + cnt[p] + ' · ' + Math.round(cnt[p] / tot * 100) + '%</span></div>'; });
      var wmax = Math.max.apply(null, WL.map(function (w) { return wtot[w] || 0; }).concat([1]));
      h += '<h3 style="margin-top:20px">' + t('byWound') + '</h3>';
      WL.forEach(function (w) { var n = wtot[w] || 0; h += '<div class="hr" data-w="' + esc(w) + '"><span>' + esc(tx(w)) + '</span><div class="t"><i style="width:' + n / wmax * 100 + '%;background:var(--k-s1)"></i></div><span class="v">' + n + ' · ' + Math.round(n / tot * 100) + '%</span></div>'; });
      b.innerHTML = h;
      [].forEach.call(b.querySelectorAll('.hr'), function (n) {
        var p = n.getAttribute('data-p'), w = n.getAttribute('data-w');
        n.addEventListener('mousemove', function (e) { showTip(p ? tipFor(p) : '<span class="ttl">' + esc(tx(w)) + '</span><b>' + (wtot[w] || 0) + '</b> ' + t('lesiones') + ' · ' + Math.round((wtot[w] || 0) / tot * 100) + '%', e); });
        n.addEventListener('mouseleave', hideTip);
      });
    }

    /* ---------- KPIs y encabezado ---------- */
    function drawHead() {
      var d = S.year === 'all' ? DATA : DATA.filter(function (r) { return r.y === +S.year; });
      var inj = d.filter(function (r) { return r.inj; }).length, nm = d.filter(function (r) { return r.c === 'NM'; }).length;
      var open = d.filter(function (r) { return r.ps === 'Opened'; }).length;
      var ult = function (f) { return DATA.filter(f).map(function (r) { return parse(r.f); }).filter(function (x) { return x != null && x <= T; }).sort(function (a, b) { return b - a; })[0]; };
      var lastLT = ult(function (r) { return r.c === 'LT' || r.dp > 0; }), lastInj = ult(function (r) { return r.inj; });
      var cm = d.filter(function (r) { return r.hasCM; }), av = cm.length ? cm.reduce(function (a, r) { return a + r.av; }, 0) / cm.length : null;
      $('h1').textContent = t('title');
      $('lead').innerHTML = L[S.lang].lead(d.length, inj, open, S.year);
      var dias = function (x) { return x == null ? '—' : Math.round((T - x) / DAY); };
      var k = [[t('k1'), dias(lastLT), lastLT == null ? t('none') : t('k1s') + iso(lastLT)], [t('k2'), dias(lastInj), lastInj == null ? t('none') : t('k2s') + iso(lastInj)], [t('k3'), d.length, t('k3s')],
        [t('k4'), inj, t('k4s')], [t('k5'), nm, t('k5s')], [t('k6'), d.length ? Math.round((d.length - open) / d.length * 100) + '%' : '—', t('k6s')], [t('k7'), av == null ? '—' : Math.round(av * 100) + '%', t('k7s')]];
      $('kpis').innerHTML = k.map(function (x) { return '<div class="k-kpi"><span>' + x[0] + '</span><b>' + x[1] + '</b><small>' + x[2] + '</small></div>'; }).join('');
    }

    /* ---------- Seguimiento de contramedidas ---------- */
    function cmRows() { return DATA.filter(function (r) { return r.y === S.cmy && (S.area === 'Todas' || r.ar === S.area); }); }
    function dueText(r) {
      if (r.due == null) return t('noDate');
      if (r.status === 'ready') return fdate(r.due) + ' · ' + t('cm100');
      return fdate(r.due) + (r.days < 0 ? ' · ' + (-r.days) + t('dLate') : r.days === 0 ? ' · ' + t('dToday') : ' · ' + t('dIn') + r.days + t('dD'));
    }
    function tipCM(r) {
      var s = ST[r.status] || ['', 'sNone', 'var(--k-muted)'];
      return '<span class="ttl"><b>#' + esc(r.n) + ' · ' + esc(tx(r.ar)) + ' · ' + esc(short(dtext(r), 120)) + '</b></span>' + s[0] + ' ' + t(s[1]) + '<br>' + t('resp') + ': ' + esc(r.resp || '—') + '<br>' + t('avance') + ': <b>' + pct(r.av) + '</b><br>' + t('comp') + ': ' + fdate(r.tc) +
        (r.te ? '<br>' + t('ext') + ': ' + fdate(r.te) : '') + '<br>' + t('vence') + ': ' + dueText(r) + (r.cm ? '<br><br>' + esc(short(r.cm, 220)) : '') + (r.nota ? '<br><br><i>' + esc(short(r.nota, 200)) + '</i>' : '');
    }
    function drawFunnel() {
      var hh = $('funnel'); hh.innerHTML = '';
      var d = cmRows(), n = d.length, open = d.filter(function (r) { return r.open; }), closed = n - open.length;
      var W = hh.clientWidth || 600, rowH = 50, bo = 22, top = 2, axisH = 24, H = top + 3 * rowH + axisH;
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': t('cmT') }, hh);
      var x0 = 2, x1 = W - 2, max = Math.max(n, 1), X = function (v) { return x0 + (x1 - x0) * v / max; };
      var step = max <= 12 ? 2 : max <= 30 ? 5 : max <= 60 ? 10 : max <= 150 ? 20 : 50;
      for (var v = 0; v <= max; v += step) { el('line', { x1: X(v), x2: X(v), y1: top, y2: H - axisH, stroke: 'var(--k-grid)' }, svg); el('text', { x: X(v), y: H - 8, 'text-anchor': v === 0 ? 'start' : 'middle', 'font-size': 11, class: 'tm' }, svg, v); }
      var lab = function (i, l, r) { el('text', { x: x0, y: top + i * rowH + 15, 'font-size': 12.5, class: 'halo' }, svg, l); el('text', { x: x1, y: top + i * rowH + 15, 'text-anchor': 'end', 'font-size': 12, class: 't2 halo' }, svg, r); };
      lab(0, t('fEv') + ' ' + S.cmy, n); el('rect', { x: X(0), y: top + bo, width: Math.max(X(n) - X(0), 1), height: 18, rx: 3, fill: 'var(--k-base)' }, svg);
      lab(1, t('fCl'), '−' + closed + ' (' + (n ? Math.round(closed / n * 100) : 0) + '%)');
      el('rect', { x: X(open.length), y: top + rowH + bo, width: Math.max(X(n) - X(open.length), 0), height: 18, rx: 3, fill: 'var(--k-dgreen)' }, svg);
      el('line', { x1: X(n), x2: X(n), y1: top + bo - 8, y2: top + rowH + bo, stroke: 'var(--k-axis)' }, svg);
      lab(2, t('fOp'), open.length);
      el('line', { x1: X(open.length), x2: X(open.length), y1: top + rowH + bo, y2: top + 2 * rowH + bo, stroke: 'var(--k-axis)' }, svg);
      var cx = 0;
      ORDER.forEach(function (k) {
        var c = open.filter(function (r) { return r.status === k; }).length; if (!c) return;
        var w = X(c) - X(0), g = el('g', { class: 'row', tabindex: 0 }, svg);
        el('rect', { x: X(cx) + 1, y: top + 2 * rowH + bo, width: Math.max(w - 2, 1), height: 18, rx: 3, fill: ST[k][2] }, g);
        if (w > 18) el('text', { x: X(cx) + w / 2, y: top + 2 * rowH + bo + 13, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, style: 'fill:' + ST[k][3] }, g, c);
        bind(g, '<span class="ttl"><b>' + t(ST[k][1]) + '</b></span>' + c); cx += c;
      });
    }
    function drawGantt() {
      var hh = $('gantt'); hh.innerHTML = '';
      var list = cmRows().filter(function (r) { return r.open; });
      list.sort(function (a, b) { return (ORDER.indexOf(a.status) - ORDER.indexOf(b.status)) || (a.due || 0) - (b.due || 0); });
      if (!list.length) { hh.innerHTML = '<div class="k-empty">—</div>'; return; }
      var W = hh.clientWidth || 600, narrow = W < 560, rowH = narrow ? 62 : 46, bo = narrow ? 34 : 20, bh = 14, top = 18, H = top + list.length * rowH + 4;
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': t('gT') }, hh);
      // eje: del 1 de enero del año elegido hasta la fecha más lejana (mínimo el 31 de diciembre)
      var t0 = Date.UTC(S.cmy, 0, 1), t1 = Math.max(Date.UTC(S.cmy, 11, 31), T + 15 * DAY, Math.max.apply(null, list.map(function (r) { return r.due || 0; })) + 10 * DAY);
      var x0 = 2, x1 = W - 2, X = function (ts) { return x0 + (x1 - x0) * (ts - t0) / (t1 - t0); };
      for (var m = 0; Date.UTC(S.cmy, m, 1) <= t1; m++) { var tm = Date.UTC(S.cmy, m, 1); el('line', { x1: X(tm), x2: X(tm), y1: top - 4, y2: H - 4, stroke: 'var(--k-grid)' }, svg); if (Math.abs(X(tm) - X(T)) > 30 && (W > 700 || m % 2 === 0)) el('text', { x: X(tm) + 3, y: 11, 'font-size': 11, class: 'tm' }, svg, L[S.lang].mshort[m % 12]); }
      list.forEach(function (r, i) {
        var y = top + i * rowH, s = ST[r.status], xs = X(r.t0), xe = r.due != null ? Math.max(X(r.due), xs + 8) : xs + 8;
        var g = el('g', { class: 'row', tabindex: 0 }, svg); el('rect', { class: 'hit', x: 0, y: y, width: W, height: rowH - 2, rx: 4 }, g);
        var tt = el('text', { x: x0 + 2, y: y + 14, 'font-size': 12.5, class: 'halo' }, g);
        el('tspan', { style: 'fill:' + (r.status === 'soon' ? 'var(--k-ink)' : s[2]), 'font-weight': 700 }, tt, s[0] + ' '); el('tspan', {}, tt, '#' + r.n + ' · ' + tx(r.ar) + ' · ' + short(dtext(r), narrow ? 28 : 44));
        el('text', narrow ? { x: x0 + 2, y: y + 28, 'font-size': 12, class: 't2 halo' } : { x: x1 - 2, y: y + 14, 'text-anchor': 'end', 'font-size': 12, class: 't2 halo' }, g, pct(r.av) + ' · ' + dueText(r));
        var by = y + bo; el('rect', { x: xs, y: by, width: xe - xs, height: bh, rx: 3, fill: 'var(--k-track)' }, g);
        if (r.av > 0) el('rect', { x: xs, y: by, width: Math.max((xe - xs) * Math.min(r.av, 1), 3), height: bh, rx: 3, fill: s[2] }, g);
        if (r.status === 'late') el('rect', { x: xe, y: by + bh / 2 - 2, width: Math.max(X(T) - xe, 0), height: 4, fill: 'var(--k-crit)' }, g);
        if (r.te != null && r.tc != null) el('path', { d: 'M' + X(r.tc) + ' ' + (by + bh + 1) + ' l4 4 l-4 4 l-4 -4 z', fill: 'var(--k-ink)' }, g);
        bind(g, function () { return tipCM(r); });
      });
      el('line', { x1: X(T), x2: X(T), y1: top - 4, y2: H - 4, stroke: 'var(--k-ink)', 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, svg);
      el('text', { x: X(T) + 4, y: 11, 'font-size': 11, 'font-weight': 700, class: 'halo' }, svg, t('today'));
    }
    function drawTable() {
      var d = cmRows(), tb = S.tab, list, dk;
      if (tb === 'open') { list = d.filter(function (r) { return r.open; }).sort(function (a, b) { return (ORDER.indexOf(a.status) - ORDER.indexOf(b.status)) || (a.due || 0) - (b.due || 0); }); dk = 'tdesc1'; }
      else if (tb === 'cms') { list = d.filter(function (r) { return r.hasCM && r.cms !== 3; }).sort(function (a, b) { return (a.cms - b.cms) || (parse(a.seg) || 0) - (parse(b.seg) || 0); }); dk = 'tdesc2'; }
      else { list = d.slice().sort(function (a, b) { return b.f.localeCompare(a.f) || String(b.n).localeCompare(String(a.n), 'es', { numeric: true }); }); dk = 'tdesc3'; }
      $('tdesc').textContent = t(dk) + ' ' + list.length + ' ' + t('regs') + '.';
      var h = '<thead><tr>' + L[S.lang].th.map(function (x, i) { return '<th' + (i === 0 ? ' class="n"' : '') + '>' + x + '</th>'; }).join('') + '</tr></thead><tbody>';
      list.forEach(function (r) {
        var c = CMSL[r.cms] || ['', null, 'var(--k-muted)'];
        var ps = r.open ? '<span class="pl"><b style="color:' + ST[r.status][2] + '">' + ST[r.status][0] + '</b>' + (r.status === 'ready' ? t('sReadyS') : t(ST[r.status][1])) + '</span>' : '<span class="pl"><b style="color:var(--k-good)">✓</b>' + t('psCl') + '</span>';
        h += '<tr><td class="n">' + esc(r.n) + '</td><td class="nw">' + esc(tx(r.ar)) + '</td><td>' + esc(dtext(r)) + '</td><td class="nw">' + esc(r.resp || '—') + '</td><td class="nw">' + fdate(r.tc) + (r.te ? ' → ' + fdate(r.te) : '') + '</td>' +
          '<td class="nw"><span class="mbar"><i style="width:' + Math.round(Math.min(r.av, 1) * 100) + '%"></i></span>' + pct(r.av) + '</td><td>' + ps + '</td>' +
          '<td><span class="pl"><b style="color:' + c[2] + '">' + c[0] + '</b>' + (c[1] ? t(c[1]) : '—') + '</span></td><td class="nw">' + fdate(parse(r.seg)) + '</td><td class="cm" title="' + esc(r.cm) + '">' + esc(short(r.cm, 110) || '—') + '</td></tr>';
      });
      if (!list.length) h += '<tr><td colspan="10" class="k-empty">—</td></tr>';
      $('tbl').innerHTML = h + '</tbody>';
    }
    function cmLegend() {
      var lg = ORDER.map(function (k) { return '<span><i class="' + ({ late: 'c-late', soon: 'c-soon', ok: 'c-ok', ready: 'c-ready' })[k] + '"></i>' + t(ST[k][1]) + '</span>'; }).join('');
      $('lg-cm').innerHTML = lg; $('lg-g').innerHTML = lg + '<span>' + t('diamond') + '</span>';
    }

    /* ---------- Controles ---------- */
    function drawControls() {
      $('lang').innerHTML = [['es', 'Español'], ['en', 'English'], ['ja', '日本語']].map(function (l) { return '<button type="button" data-lang="' + l[0] + '" aria-pressed="' + (S.lang === l[0]) + '">' + FLAGS[l[0]] + l[1] + '</button>'; }).join('');
      $('yr').innerHTML = YEARS.concat(['all']).map(function (y) { return '<button type="button" data-gy="' + y + '" aria-pressed="' + (String(S.year) === String(y)) + '">' + (y === 'all' ? t('all') : y) + '</button>'; }).join('');
      $('tabs').innerHTML = [['open', 'tab1'], ['cms', 'tab2'], ['all', 'tab3']].map(function (x) { return '<button type="button" data-t="' + x[0] + '" aria-pressed="' + (S.tab === x[0]) + '">' + t(x[1]) + '</button>'; }).join('');
      var sel = $('cmarea'), ars = AREAS.filter(function (a) { return DATA.some(function (r) { return r.y === S.cmy && r.ar === a; }); });
      if (S.area !== 'Todas' && ars.indexOf(S.area) < 0) S.area = 'Todas';
      sel.innerHTML = '<option value="Todas">' + t('all') + '</option>' + ars.map(function (a) { return '<option value="' + esc(a) + '">' + esc(tx(a)) + '</option>'; }).join('');
      sel.value = S.area;
      $('cmy').innerHTML = CMYEARS.slice().reverse().map(function (y) { return '<option value="' + y + '">' + y + '</option>'; }).join(''); $('cmy').value = String(S.cmy);
      $('cmt').textContent = t('cmT') + ' ' + S.cmy;
      [].forEach.call(host.querySelectorAll('[data-i]'), function (n) { n.textContent = t(n.getAttribute('data-i')); });
      [].forEach.call(host.querySelectorAll('[data-yr]'), function (n) { n.innerHTML = yearSeg(n.getAttribute('data-yr')); });
      $('foot').textContent = t('foot');
      host.setAttribute('lang', S.lang);
    }
    host.onclick = function (e) {
      var b = e.target.closest('button'); if (!b || !host.contains(b)) return;
      if (b.dataset.lang) { S.lang = b.dataset.lang; drawAll(); }
      else if (b.dataset.gy) { S.year = b.dataset.gy; S.cy = {}; drawAll(); }
      else if (b.dataset.card) { S.cy[b.dataset.card] = b.dataset.y; drawAll(); }
      else if (b.dataset.t) { S.tab = b.dataset.t; drawControls(); drawTable(); }
    };
    $('cmarea').addEventListener('change', function () { S.area = this.value; drawCM(); });
    $('cmy').addEventListener('change', function () { S.cmy = +this.value; S.area = 'Todas'; drawControls(); drawCM(); });

    function drawCM() { cmLegend(); drawFunnel(); drawGantt(); drawTable(); }
    function drawAll() { drawControls(); drawHead(); drawLines(); drawOC(); drawDonuts(); drawDist(); drawBody(); drawCM(); }
    drawAll();
    var lastW = host.clientWidth;
    var redraw = function () { var w = host.clientWidth; if (w && Math.abs(w - lastW) > 1) { lastW = w; drawLines(); drawOC(); drawFunnel(); drawGantt(); } };
    if (root.ResizeObserver) { host.__ktbRO = new ResizeObserver(redraw); host.__ktbRO.observe(host); }
    return { datos: DATA };
  }

  root.KTB = { render: render, VERSION: '0.9.0' };
})(typeof window !== 'undefined' ? window : this);
