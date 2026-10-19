/* ════════════════════════════════════════════════════════════════════
   KTMEX Safety — Formatos oficiales (v0.3)
   · Llena el Excel ORIGINAL de cada formato (forms/*.xlsx) con xlsx-fill.js:
     solo escribe las celdas de captura, las casillas y las fotos.
   · Dibuja en pantalla la vista previa del Excel ya lleno (celdas, bordes,
     colores, combinadas, imágenes, cuadros de texto y casillas).
   · Convierte los valores de la matriz (1–5) a la escala de cada formato.
   ════════════════════════════════════════════════════════════════════ */
(function(root){
  'use strict';
  const X = () => root.KTMEX_XLSX;
  const MAESTROS = { JSA:'forms/F-SGA-8.1-7.xlsx', JRA:'forms/FO-015.xlsx', COM:'forms/FO-014.xlsx', ALE:'forms/FO-005.xlsx' };
  const HOJAS = { JSA:'JSA', JRA:'Analisis de riesgos ', JRA_ANEXO:'Anexo hoja sustancias química', COM:'Safety communication', ALE:'Safety Alert' };
  const cache = {};
  async function maestro(tipo){
    if(cache[tipo]) return cache[tipo];
    const r = await fetch(MAESTROS[tipo] + '?v=0.7.1', {cache:'no-cache'});
    if(!r.ok) throw new Error('No se encontró el formato ' + MAESTROS[tipo] + '. Revisa que la carpeta forms esté en el repositorio.');
    return (cache[tipo] = new Uint8Array(await r.arrayBuffer()));
  }
  const attr = (s, n) => { const m = new RegExp('\\b'+n+'="([^"]*)"').exec(s); return m ? m[1] : null; };
  const bi = v => { if(!v) return ''; if(typeof v==='string') return v; const es=(v.es||'').trim(), en=(v.en||'').trim(); return en && en!==es ? es+' / '+en : es; };
  // Bilingüe con formato: el inglés va en negro. Comunicado: renglón aparte. Alerta: « / ».
  const biR = (v, sep) => { if(!v) return ''; if(typeof v==='string') return v; const es=(v.es||'').trim(), en=(v.en||'').trim(); if(!en || en===es) return es; return { rico:[{t:es+sep},{t:en, negro:true}] }; };
  const biLista = (items, sep, pref) => { const r = []; items.forEach((it,i)=>{ const es=(it.es||'').trim(), en=(it.en||'').trim(), p = pref(i);
      if(r.length) r.push({t:'\n'}); r.push({t:p+es}); if(en && en!==es) r.push(sep==='\n' ? {t:'\n'} : {t:sep}, {t:(sep==='\n'?p:'')+en, negro:true}); }); return r.length ? {rico:r} : ''; };
  const fechaMx = iso => { const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(iso||''); return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso||''); };

  /* ───────── Escalas de cada formato ───────── */
  const JSA_SEV = ['MENOR','MODERADA','CRITICA','FATAL'];                       // tal como en Hoja2 del F-SGA-8.1-7
  const JSA_PROB = ['REMOTA','AISLADA','OCASIONAL','RECURRENTE','FRECUENTE'];
  const JSA_CAT = p => !p ? '' : p<=3 ? '[E]\nMínimo' : p===4 ? '[D]\nBajo' : p<=8 ? '[C]\nMedio' : p<=12 ? '[B]\nElevado' : '[A]\nGrave';
  const jsaPuntaje = (sev, prob) => { const s=JSA_SEV.indexOf(sev)+1, p=JSA_PROB.indexOf(prob)+1; return s&&p ? s*p : 0; };
  const JRA = { S:[2,3,20,40], F:[1,4,6,8], P:[0.5,1], C:[1,0.9,0.5,0.1] };
  const r2 = v => Math.round((v+Number.EPSILON)*100)/100;
  // Conversión aprobada por Safety: matriz (1–5) → escala de cada formato. Son sugerencias editables.
  const desdeMatriz = {
    jsaSev: s => ({1:'MENOR',2:'MENOR',3:'MODERADA',4:'CRITICA',5:'FATAL'})[Number(s)] || '',
    jsaProb: p => JSA_PROB[Number(p)-1] || '',
    jraS: s => ({1:2,2:2,3:3,4:20,5:40})[Number(s)] || '',
    jraP: p => !p ? '' : Number(p)<=2 ? 0.5 : 1,
    jraC: c => ({'Ninguno':1,'EPP':0.9,'Administrativo':0.5,'Ingeniería':0.1,'Sustitución':0.1,'Eliminación':0.1})[c] ?? ''
  };

  /* ───────── Colocación de fotos dentro de una zona del formato ───────── */
  // Zonas de fotografía por rango de celdas; las medidas se leen del Excel maestro.
  const ZONAS = { COM:{ sheet:HOJAS.COM, rango:[2,46,28,73] }, ALE:{ sheet:HOJAS.ALE, rango:[4,27,30,42] } };
  async function geometria(bytes, hoja){
    const x = X(), pkg = await x.openPackage(bytes), xml = await pkg.text(x.sheetByName(pkg, hoja).path);
    const fmt = (/<sheetFormatPr\b[^>]*>/.exec(xml)||[''])[0];
    const defW = +(attr(fmt,'defaultColWidth')||((+(attr(fmt,'baseColWidth')||8))+0.71)), defH = +(attr(fmt,'defaultRowHeight')||15);
    const cw = {}; for(const m of xml.matchAll(/<col\b[^>]*>/g)){ const a=m[0]; for(let c=+attr(a,'min'); c<=+attr(a,'max'); c++) cw[c] = attr(a,'hidden')==='1' ? 0 : +(attr(a,'width')||defW); }
    const rh = {}; for(const m of xml.matchAll(/<row\b([^>]*?)(?:\/>|>)/g)){ const r=+attr(m[1],'r'); if(attr(m[1],'hidden')==='1') rh[r]=0; else if(attr(m[1],'ht')) rh[r]=+attr(m[1],'ht'); }
    return { colpx: c => { const w = cw[c] ?? defW; return w ? Math.floor(w*7+5) : 0; }, rowpx: r => Math.round((rh[r] ?? defH)*4/3) };
  }
  function ubicar(px, lista){ let i=0; while(i<lista.length-1 && px>=lista[i]){ px-=lista[i]; i++; } return [i, Math.max(0,px)]; }
  async function colocarFotos(zonaId, fotos, bytes){   // fotos: [{dataUrl, ancho, alto}]
    const z = ZONAS[zonaId], n = fotos.length; if(!n) return [];
    const geo = await geometria(bytes, z.sheet), [c1,r1,c2,rr] = z.rango;
    const colpx = Array.from({length:c2-c1+1},(_,i)=>geo.colpx(c1+i)), rowpx = Array.from({length:rr-r1+1},(_,i)=>geo.rowpx(r1+i));
    const W = colpx.reduce((a,b)=>a+b,0), H = rowpx.reduce((a,b)=>a+b,0), m = 10, g = 14;
    const sw = (W-2*m-(n-1)*g)/n, sh = H-2*m;
    return fotos.map((f,i)=>{ const k = Math.min(sw/f.ancho, sh/f.alto), w = f.ancho*k, h = f.alto*k;
      const x = m + i*(sw+g) + (sw-w)/2, y = m + (sh-h)/2, [c,co] = ubicar(x, colpx), [r,ro] = ubicar(y, rowpx);
      return { dataUrl:f.dataUrl, col:c1-1+c, colOff:co, row:r1-1+r, rowOff:ro, w, h }; });
  }
  function medir(dataUrl){ return new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res({dataUrl, ancho:im.naturalWidth, alto:im.naturalHeight}); im.onerror=rej; im.src=dataUrl; }); }

  /* ───────── JSA · F-SGA-8.1-7 ─────────
     doc.datos = { general:{compania,periodo,horario,actividad}, personal:[{nombre}],
       tareas:[{ texto, seg:{riesgos[],sev,prob,medidas[],sevD,probD}, amb:{...}, documentos:[] }] } */
  const lineas = (arr, pref) => (arr||[]).filter(x=>String(x||'').trim()).map((x,i)=>`${pref}${i+1}.- ${String(x).trim()}`).join('\n');
  function specJSA(doc){
    const d = doc.datos||{}, g = d.general||{}, tareas = d.tareas||[], pers = d.personal||[];
    const hojas = Math.max(1, Math.ceil(tareas.length/10), Math.ceil(pers.length/6)), specs = [];
    for(let h=0; h<hojas; h++){
      const cells = { C4:g.compania||'', S4:g.periodo||'', C5:(g.actividad||'') + (hojas>1?`  (hoja ${h+1} de ${hojas})`:''), S5:g.horario||'' }, overlay = {};
      for(let i=0;i<10;i++){
        const t = tareas[h*10+i], r = 9+2*i, n = h*10+i+1;
        const filas = [['seg',r],['amb',r+1]];
        cells['A'+r] = t ? `${n}.- ${t.texto||''}` : '';
        filas.forEach(([k,row])=>{
          const x = (t && t[k]) || {}, vacio = !t || !(x.riesgos||[]).some(s=>String(s||'').trim());
          cells['E'+row] = vacio ? '' : lineas(x.riesgos, n+'.');
          cells['F'+row] = vacio ? '' : (x.sev||''); cells['H'+row] = vacio ? '' : (x.prob||'');
          cells['L'+row] = vacio ? '' : lineas(x.medidas, n+'.');
          cells['M'+row] = vacio ? '' : (x.sevD||''); cells['O'+row] = vacio ? '' : (x.probD||'');
          cells['S'+row] = vacio ? '' : (x.documentos||[]).filter(Boolean).join('\n');
          const a = jsaPuntaje(x.sev,x.prob), b = jsaPuntaje(x.sevD,x.probD);
          Object.assign(overlay, { ['G'+row]: vacio?0:(JSA_SEV.indexOf(x.sev)+1||0), ['I'+row]: vacio?0:(JSA_PROB.indexOf(x.prob)+1||0), ['J'+row]: vacio?0:a, ['K'+row]: vacio?'':JSA_CAT(a),
            ['N'+row]: vacio?0:(JSA_SEV.indexOf(x.sevD)+1||0), ['P'+row]: vacio?0:(JSA_PROB.indexOf(x.probD)+1||0), ['Q'+row]: vacio?0:b, ['R'+row]: vacio?'':JSA_CAT(b) });
        });
      }
      for(let k=0;k<6;k++){ const p = pers[h*6+k]; cells['A'+(32+k)] = p ? (p.nombre||'') : ''; }
      specs.push({ tipo:'JSA', overlay, spec:{ sheets:[{ name:HOJAS.JSA, cells }], recalcular:true } });
    }
    return specs;
  }

  /* ───────── JRA · KQMS-SA-FO-015 (mapa del piloto, un renglón por riesgo) ───────── */
  function specJRA(doc){
    const M = root.KTMEX_FO015, d = doc.datos||{}, g = d.general||{}, L = M.LAYOUT, cap = L.lastRow-L.firstRow+1;
    const filas = [];
    (d.tareas||[]).forEach((t,ti)=>(t.riesgos||[]).forEach((r,j)=>{ const uc=r2(r.s*r.f*r.p), ct=r2(uc*r.c);
      filas.push({ no: j===0 ? ti+1 : '', tarea: j===0 ? (t.texto||'') : '', riesgo:r.texto||'', cat:r.categoria||'', s:r.s, f:r.f, p:r.p, c:r.c, uc, ct, notas: lineas(r.medidas,'').replace(/^(\d+)\.- /gm,'$1.- ') }); }));
    const hojas = Math.max(1, Math.ceil(filas.length/cap)), specs = [];
    for(let h=0; h<hojas; h++){
      const main = { B5:M.formatDate(g.fechaTrabajo), E5:(g.consecutivo||'')+(hojas>1?` (${h+1}/${hojas})`:''), G5:[g.capturoNombre,g.departamento].filter(Boolean).join(', '),
        B7:g.departamento||'', E7:g.lineaMaquina||'', J7:[g.proceso,g.actividad].filter(Boolean).join(' / ') }, alturas = {}, overlay = {};
      for(let r=L.firstRow; r<=L.lastRow; r++){
        const f = filas[h*cap + r-L.firstRow];
        if(f){ overlay['X'+r] = f.uc; overlay['Y'+r] = f.ct; Object.assign(main, {['B'+r]:f.no, ['C'+r]:f.tarea, ['K'+r]:f.riesgo, ['S'+r]:f.cat, ['T'+r]:f.s, ['U'+r]:f.f, ['V'+r]:f.p, ['W'+r]:f.c, ['X'+r]:f.uc, ['Y'+r]:f.ct, ['Z'+r]:f.notas});
          const lin = Math.max(M.estimateLines(f.tarea,L.widths.task), M.estimateLines(f.riesgo,L.widths.risk), M.estimateLines(f.notas,L.widths.notes));
          const need = Math.ceil(lin*L.linePt+4); if(need > L.defaultRowHeight) alturas[r] = Math.min(L.maxRowHeight, need); }
        else ['B','C','K','S','T','U','V','W','X','Y','Z'].forEach(c=>main[c+r]='');
      }
      const quim = d.sinQuimicos ? [] : (d.quimicos||[]);
      for(let r=L.ihFirst; r<=L.ihLast; r++){ const c = quim[r-L.ihFirst]; Object.assign(main, {['C'+r]:c?c.nombre:'', ['L'+r]:c?c.id:'', ['Q'+r]:c?c.frecuencia:'', ['R'+r]:c?c.duracion:'', ['S'+r]:c?c.aire:'', ['T'+r]:c?c.dermico:'', ['U'+r]:c?c.control:'', ['V'+r]:c?c.epp:''}); }
      const states = {};
      Object.entries(M.CHECKBOX.workCategory).forEach(([k,cap])=>states[cap] = g.categoriaTrabajo===k);
      Object.entries(M.CHECKBOX.activityType).forEach(([k,cap])=>states[cap] = (g.tipoActividad||'routine')===k);
      states[M.CHECKBOX.moe.yes] = g.moe==='SI'; states[M.CHECKBOX.moe.no] = g.moe==='NO';
      states[M.CHECKBOX.noChemicals] = !!d.sinQuimicos;
      M.OTHER_HAZARDS.forEach(x=>states[x] = (d.otrosRiesgos||[]).includes(x));
      const sheets = [{ name:HOJAS.JRA, cells:main, rowHeights:alturas }];
      if(quim.length){ const an = { B6:main.B5, E6:main.E5, G6:main.G5, B8:main.B7, E8:main.E7, J8:main.J7 };
        for(let r=L.annexFirst; r<=L.annexLast; r++){ const c = quim[r-L.annexFirst]; Object.assign(an, {['C'+r]:c?c.nombre:'', ['G'+r]:c?c.id:'', ['H'+r]:c?c.frecuencia:'', ['I'+r]:c?c.duracion:'', ['J'+r]:c?c.aire:'', ['K'+r]:c?c.dermico:'', ['L'+r]:c?c.control:'', ['M'+r]:c?(r===L.annexFirst?c.epp:(c.epp==='SI'?'Yes':'No')):'', ['N'+r]:c?(c.eppTexto||''):''}); }
        sheets.push({ name:HOJAS.JRA_ANEXO, cells:an }); }
      specs.push({ tipo:'JRA', overlay, spec:{ sheets, checkboxes:{ sheet:HOJAS.JRA, states } } });
    }
    return specs;
  }

  /* ───────── Comunicado · KQMS-SA-FO-014 ───────── */
  const COM_CLASIF = { 'Lesión':'B9', 'Tratamiento médico':'F9', 'Primer auxilio':'K9', 'Daño a la propiedad':'O9', 'Casi accidente':'T9' };
  const COM_STOPSEV = { 'Sin lesión':'B33', 'Primeros auxilios':'F33', 'Tratamiento médico':'K33', 'Restricción':'P33', 'Incapacidad':'T33', 'Fatalidad':'X33' };
  async function specCOM(ev, fotosDataUrls){
    // Turno: el formato tiene dos casillas que se pintan solas: «G» verde (Y9) y «B» azul (AA9). Mixto no tiene casilla: se escribe «M».
    const turno = { Verde:['Y9','G'], Azul:['AA9','B'], Mixto:['Y9','M'] }[ev.turno];
    const d = ev.datos||{}, cells = { Y9:'', AA9:'', H13:ev.numero||'', H15:(fechaMx(ev.fecha)+' '+(ev.hora||'')).trim(), H17:(fechaMx(d.fechaNotificacion)+' '+(d.horaNotificacion||'')).trim(),
      H19:biR(d.ubicacion,'\n'), H21:biR(d.antiguedadPlanta,'\n'), H23:biR(d.antiguedadEstacion,'\n'), E27:biR(d.queOcurrio,'\n'), E29:biR(d.comoOcurrio,'\n'),
      // sin riesgo STOP 6 → «NA», como en los formatos de Safety
      B37:(!ev.stopRiesgo || ev.stopRiesgo==='NA') ? 'NA' : ev.stopRiesgo.replace(/\d/,''),
      G75:biLista((d.acciones||[]).map(a=>a.accion||{}).filter(a=>(a.es||'').trim()), '\n', i=>`${i+1}. `),
      Y75:[...new Set((d.acciones||[]).map(a=>a.responsable).filter(Boolean))].join(', ') };
    Object.values(COM_CLASIF).forEach(c=>cells[c]=''); Object.values(COM_STOPSEV).forEach(c=>cells[c]='');
    if(turno) cells[turno[0]] = turno[1];
    // la casilla de Lesión se colorea con «X» mayúscula; las demás con «x», igual que las reglas del formato
    if(COM_CLASIF[ev.clasificacion]) cells[COM_CLASIF[ev.clasificacion]] = ev.clasificacion==='Lesión' ? 'X' : 'x';
    if(COM_STOPSEV[ev.stopSeveridad]) cells[COM_STOPSEV[ev.stopSeveridad]] = 'X';
    const fotos = await Promise.all((fotosDataUrls||[]).slice(0,3).map(medir));
    return [{ tipo:'COM', overlay:{}, spec:{ sheets:[{ name:HOJAS.COM, cells }], images:[{ sheet:HOJAS.COM, items:await colocarFotos('COM', fotos, await maestro('COM')) }] } }];
  }
  /* ───────── Alerta · KQMS-SA-FO-005 ───────── */
  async function specALE(ev, fotosDataUrls){
    const d = ev.datos||{}, acc = d.acciones||[], nc = biR(d.noCumplimiento,' / ');
    const cells = { D9:d.mes||'', D12:d.dia||'', I12:ev.departamento||'', O12:biR(d.problema,' / '),
      D46: !nc ? (d.regla||'') : typeof nc==='string' ? [d.regla,nc].filter(Boolean).join('\n') : (d.regla ? {rico:[{t:d.regla+'\n'}].concat(nc.rico)} : nc) };
    [[62,63],[67,68],[72,73]].forEach(([r,ro],i)=>{ const a = acc[i];
      cells['D'+r] = a ? biLista([a.accion||{}], ' / ', ()=>`${i+1}.- `) : ''; cells['O'+ro] = a ? (a.responsable||'') : '';
      cells['T'+r] = a ? [fechaMx(a.inicio), fechaMx(a.cierre)].filter(Boolean).join(' - ') : ''; cells['Z'+r] = a ? ({Abierta:'Abierto / Open','En proceso':'En proceso / In progress',Cerrada:'Cerrado / Closed'}[a.estatus]||a.estatus||'') : ''; });
    const fotos = await Promise.all((fotosDataUrls||[]).slice(0,3).map(medir));
    return [{ tipo:'ALE', overlay:{}, spec:{ sheets:[{ name:HOJAS.ALE, cells }], images:[{ sheet:HOJAS.ALE, items:await colocarFotos('ALE', fotos, await maestro('ALE')) }], drawingText:[{ sheet:HOJAS.ALE, from:'#NUM#', to:String(ev.numero||'') }] } }];
  }

  async function generar(tipo, doc, fotos){
    const partes = tipo==='JSA' ? specJSA(doc) : tipo==='JRA' ? specJRA(doc) : tipo==='COM' ? await specCOM(doc, fotos) : await specALE(doc, fotos);
    const base = await maestro(tipo);
    for(const p of partes){ p.bytes = (await X().fill(base, p.spec)).bytes; }
    return partes;
  }
  function descargar(bytes, nombre){
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
    a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  /* ───────── Vista previa: dibuja la hoja del Excel ───────── */
  const colNum = c => { let n=0; for(const ch of c) n = n*26 + ch.charCodeAt(0)-64; return n; };
  const ref2 = r => { const m = /^([A-Z]+)(\d+)$/.exec(r); return m ? [colNum(m[1]), +m[2]] : [0,0]; };
  const escH = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function temaColores(xml){
    const orden = ['lt1','dk1','lt2','dk2','accent1','accent2','accent3','accent4','accent5','accent6'], out = [];
    orden.forEach(k=>{ const m = new RegExp('<a:'+k+'>[\\s\\S]*?(?:srgbClr val|lastClr)="([0-9A-Fa-f]{6})"').exec(xml||''); out.push(m ? '#'+m[1] : (k==='lt1'?'#FFFFFF':'#000000')); });
    return out;
  }
  function tinte(hex, t){ if(!t) return hex; t = +t; const n = parseInt(hex.slice(1),16); let r=n>>16,g=(n>>8)&255,b=n&255;
    const f = c => Math.round(t<0 ? c*(1+t) : c+(255-c)*t); return '#'+[f(r),f(g),f(b)].map(x=>Math.max(0,Math.min(255,x)).toString(16).padStart(2,'0')).join(''); }
  function color(tag, tema){ if(!tag) return null; const rgb = attr(tag,'rgb'); if(rgb) return '#'+rgb.slice(-6);
    const th = attr(tag,'theme'); if(th!==null) return tinte(tema[+th]||'#000000', attr(tag,'tint')); const ix = attr(tag,'indexed'); if(ix==='64'||ix===null) return null;
    return ['#000000','#FFFFFF','#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF','#000000','#FFFFFF','#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF','#800000','#008000','#000080','#808000','#800080','#008080','#C0C0C0','#808080'][+ix] || null; }
  function estilos(xml, tema){
    const sec = n => (new RegExp('<'+n+'\\b[^>]*>([\\s\\S]*?)</'+n+'>').exec(xml)||[])[1]||'';
    const fonts = [...sec('fonts').matchAll(/<font\b[^>]*>([\s\S]*?)<\/font>|<font\b[^>]*\/>/g)].map(m=>{ const f=m[1]||''; return { b:/<b\/>|<b val="1"/.test(f), i:/<i\/>/.test(f), sz:+(attr((/<sz\b[^>]*>/.exec(f)||[''])[0],'val')||11), color:color((/<color\b[^>]*>/.exec(f)||[''])[0],tema), name:attr((/<name\b[^>]*>/.exec(f)||[''])[0],'val')||'Calibri', u:/<u\b/.test(f) }; });
    const fills = [...sec('fills').matchAll(/<fill>([\s\S]*?)<\/fill>/g)].map(m=>{ const p=(/<patternFill\b[^>]*>/.exec(m[1])||[''])[0]; if(!/patternType="solid"/.test(p)) return null; return color((/<fgColor\b[^>]*>/.exec(m[1])||[''])[0],tema); });
    const borders = [...sec('borders').matchAll(/<border\b[^>]*>([\s\S]*?)<\/border>|<border\b[^>]*\/>/g)].map(m=>{ const b=m[1]||'', o={};
      ['left','right','top','bottom'].forEach(s=>{ const t=(new RegExp('<'+s+'\\b[^>]*?(?:/>|>[\\s\\S]*?</'+s+'>)').exec(b)||[''])[0]; const st=attr(t,'style'); if(st) o[s]=[st, color((/<color\b[^>]*>/.exec(t)||[''])[0],tema)||'#000']; }); return o; });
    const xfs = [...sec('cellXfs').matchAll(/<xf\b([^>]*?)(?:\/>|>([\s\S]*?)<\/xf>)/g)].map(m=>{ const al=(/<alignment\b[^>]*>/.exec(m[2]||'')||[''])[0];
      return { font:+(attr(m[1],'fontId')||0), fill:+(attr(m[1],'fillId')||0), border:+(attr(m[1],'borderId')||0), h:attr(al,'horizontal'), v:attr(al,'vertical'), wrap:attr(al,'wrapText')==='1', rot:+(attr(al,'textRotation')||0) }; });
    return { fonts, fills, borders, xfs };
  }
  const bordeCss = ([st,c]) => `${({thin:'1px solid',medium:'2px solid',thick:'3px solid',hair:'1px solid',dashed:'1px dashed',dotted:'1px dotted',double:'3px double',mediumDashed:'2px dashed',dashDot:'1px dashed',mediumDashDot:'2px dashed',slantDashDot:'2px dashed'})[st]||'1px solid'} ${c}`;
  async function vista(bytes, hoja, opts){
    opts = opts || {};
    const x = X(), pkg = await x.openPackage(bytes), info = x.sheetByName(pkg, hoja), xml = await pkg.text(info.path), un = x._internal.unescXml;
    let tema = []; try { tema = temaColores(await pkg.text('xl/theme/theme1.xml')); } catch(e){ tema = temaColores(''); }
    const st = estilos(await pkg.text('xl/styles.xml'), tema);
    // área: área de impresión o dimensión
    const wb = await pkg.text('xl/workbook.xml'), idx = pkg.sheets.indexOf(info);
    let area = null; for(const m of wb.matchAll(/<definedName\b([^>]*)>([^<]*)<\/definedName>/g)){ if(attr(m[1],'name')==='_xlnm.Print_Area' && +attr(m[1],'localSheetId')===idx){ const a=/\$([A-Z]+)\$(\d+):\$([A-Z]+)\$(\d+)/.exec(un(m[2])); if(a) area=[colNum(a[1]),+a[2],colNum(a[3]),+a[4]]; } }
    if(!area){ const dm = /<dimension ref="([A-Z]+\d+):([A-Z]+\d+)"/.exec(xml); const [c1,r1]=ref2(dm?dm[1]:'A1'), [c2,rr2]=ref2(dm?dm[2]:'Z60'); area=[1,1,Math.min(c2,60),Math.min(rr2,120)]; }
    if(opts.maxRow) area[3] = Math.min(area[3], opts.maxRow);
    const [C1,R1,C2,R2] = area;
    const fmt = /<sheetFormatPr\b[^>]*>/.exec(xml); const defW = +(attr(fmt?fmt[0]:'','defaultColWidth')||((+(attr(fmt?fmt[0]:'','baseColWidth')||8))+0.71)), defH = +(attr(fmt?fmt[0]:'','defaultRowHeight')||15);
    const cw = {}; for(const m of xml.matchAll(/<col\b[^>]*>/g)){ const a=m[0]; for(let c=+attr(a,'min'); c<=+attr(a,'max'); c++) cw[c] = attr(a,'hidden')==='1' ? 0 : +(attr(a,'width')||defW); }
    const colpx = c => { const w = cw[c] ?? defW; return w ? Math.floor(w*7+5) : 0; };
    // textos compartidos con formato mixto (p. ej. español normal + inglés en negrita en las etiquetas del formato)
    const siRuns = {}; if(pkg.byName.has('xl/sharedStrings.xml')){ [...(await pkg.text('xl/sharedStrings.xml')).matchAll(/<si>([\s\S]*?)<\/si>/g)].forEach((m,i)=>{ if(!/<r>/.test(m[1])) return;
      siRuns[i] = [...m[1].matchAll(/<r>([\s\S]*?)<\/r>/g)].map(z=>({ t:un((/<t\b[^>]*>([\s\S]*?)<\/t>/.exec(z[1])||[])[1]||''), c:color((/<color\b[^>]*\/>/.exec(z[1])||[''])[0], tema), b:/<b\/>|<b val="1"\/>/.test(z[1]) })); }); }
    const rh = {}, celdas = {};
    for(const m of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)){
      const r = +attr(m[1],'r'); if(attr(m[1],'hidden')==='1') rh[r]=0; else if(attr(m[1],'ht')) rh[r]=+attr(m[1],'ht');
      for(const c of (m[2]||'').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)){
        const rf = attr(c[1],'r'), t = attr(c[1],'t'), s = +(attr(c[1],'s')||0), body = c[2]||'';
        let v = (/<v>([\s\S]*?)<\/v>/.exec(body)||[])[1]; if(v!==undefined) v = un(v);
        let runs = null;
        if(t==='s'){ const k = +v; v = pkg.shared[k]; const si = siRuns[k]; if(si) runs = si; } else if(t==='inlineStr'){ v = [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(z=>un(z[1])).join('');
          if(/<r>/.test(body)) runs = [...body.matchAll(/<r>([\s\S]*?)<\/r>/g)].map(z=>({ t:un((/<t\b[^>]*>([\s\S]*?)<\/t>/.exec(z[1])||[])[1]||''), c:color((/<color\b[^>]*\/>/.exec(z[1])||[''])[0], tema), b:/<b\/>|<b val="1"\/>/.test(z[1]) })); }
        else if(v!==undefined && t!=='str' && t!=='b' && t!=='e' && !isNaN(+v)) v = (Math.round(+v*100)/100).toString();
        celdas[rf] = { v, s, runs };
      }
    }
    const rowpx = r => { const h = rh[r] ?? defH; return Math.round(h*4/3); };
    // Formato condicional (igual a / contiene texto): colores que Excel aplica solo, p. ej. las casillas del comunicado
    const dxfs = [...((/<dxfs\b[^>]*>([\s\S]*?)<\/dxfs>/.exec(await pkg.text('xl/styles.xml'))||[])[1]||'').matchAll(/<dxf>([\s\S]*?)<\/dxf>/g)].map(m=>({ fill:color((/<bgColor\b[^>]*\/>/.exec(m[1])||[''])[0],tema), font:color((/<font>[\s\S]*?(<color\b[^>]*\/>)/.exec(m[1])||['',''])[1],tema) }));
    const reglasCF = {};
    for(const m of xml.matchAll(/<conditionalFormatting sqref="([^"]+)">([\s\S]*?)<\/conditionalFormatting>/g)){
      const reglas = [...m[2].matchAll(/<cfRule\b([^>]*)>([\s\S]*?)<\/cfRule>/g)].map(r=>({ tipo:attr(r[1],'type'), op:attr(r[1],'operator'), texto:attr(r[1],'text'), dxf:+attr(r[1],'dxfId'), prio:+attr(r[1],'priority'), valor:(/<formula>"([^"]*)"<\/formula>/.exec(r[2])||[])[1] })).sort((a,b)=>a.prio-b.prio);
      m[1].split(' ').forEach(rf=>{ if(/^[A-Z]+\d+$/.test(rf)) reglasCF[rf] = (reglasCF[rf]||[]).concat(reglas); });
    }
    const cf = (rf, v) => { const rs = reglasCF[rf]; if(!rs || v===undefined || v==='') return null; const t = String(v).toLowerCase();
      for(const r of rs){ if((r.tipo==='cellIs' && r.op==='equal' && r.valor!==undefined && t===r.valor.toLowerCase()) || (r.tipo==='containsText' && r.texto && t.includes(r.texto.toLowerCase()))) return dxfs[r.dxf]||null; } return null; };
    const merges = {}, cubiertas = new Set();
    for(const m of xml.matchAll(/<mergeCell ref="([A-Z]+\d+):([A-Z]+\d+)"/g)){ const [a,b]=[ref2(m[1]),ref2(m[2])]; merges[m[1]] = [b[0]-a[0]+1, b[1]-a[1]+1];
      for(let r=a[1]; r<=b[1]; r++) for(let c=a[0]; c<=b[0]; c++) if(r!==a[1]||c!==a[0]) cubiertas.add(r+':'+c); }
    const colL = n => { let s=''; while(n>0){ const k=(n-1)%26; s=String.fromCharCode(65+k)+s; n=Math.floor((n-1)/26); } return s; };
    const xs = [0]; for(let c=C1; c<=C2; c++) xs.push(xs[xs.length-1]+colpx(c));
    const ys = [0]; for(let r=R1; r<=R2; r++) ys.push(ys[ys.length-1]+rowpx(r));
    const W = xs[xs.length-1], H = ys[ys.length-1];
    let html = `<table style="border-collapse:collapse;table-layout:fixed;width:${W}px"><colgroup>${Array.from({length:C2-C1+1},(_,i)=>`<col style="width:${colpx(C1+i)}px">`).join('')}</colgroup>`;
    for(let r=R1; r<=R2; r++){
      html += `<tr style="height:${rowpx(r)}px">`;
      for(let c=C1; c<=C2; c++){
        if(cubiertas.has(r+':'+c)) continue;
        const rf = colL(c)+r, cel = celdas[rf] || {s:0}, mg = merges[rf], xf = st.xfs[cel.s] || {}, f = st.fonts[xf.font] || {}, fill = st.fills[xf.fill], bd = st.borders[xf.border] || {};
        let v = Object.prototype.hasOwnProperty.call(opts.overlay||{}, rf) ? opts.overlay[rf] : cel.v;
        if(v===0 && (opts.overlay||{})[rf]===0) v = '0';
        // los bordes de una celda combinada se toman de su esquina inferior derecha si la superior no los tiene
        let bd2 = bd; if(mg){ const fin = celdas[colL(c+mg[0]-1)+(r+mg[1]-1)]; const xf2 = fin && st.xfs[fin.s]; const b2 = xf2 && st.borders[xf2.border]; if(b2) bd2 = Object.assign({}, b2, bd); }
        const cfx = cf(rf, v);
        const css = [ (cfx&&cfx.fill)?`background:${cfx.fill}`:fill?`background:${fill}`:'', bd2.left?`border-left:${bordeCss(bd2.left)}`:'', bd2.right?`border-right:${bordeCss(bd2.right)}`:'', bd2.top?`border-top:${bordeCss(bd2.top)}`:'', bd2.bottom?`border-bottom:${bordeCss(bd2.bottom)}`:'',
          `font:${f.i?'italic ':''}${f.b?'700 ':''}${(f.sz||11)*4/3}px '${f.name||'Calibri'}',Arial,sans-serif`, (cfx&&cfx.font)?`color:${cfx.font}`:f.color?`color:${f.color}`:'', f.u?'text-decoration:underline':'',
          `text-align:${xf.h==='centerContinuous'?'center':(xf.h||(v!==undefined&&!isNaN(+v)&&v!==''?'right':'left'))}`, `vertical-align:${xf.v==='center'?'middle':(xf.v||'bottom')}`,
          xf.wrap?'white-space:pre-wrap;word-break:break-word':'white-space:pre', 'overflow:hidden', 'padding:0 2px', 'line-height:1.15' ].filter(Boolean).join(';');
        const vert = xf.rot===90||xf.rot===255||xf.rot===180 ? ' writing-mode:vertical-rl;transform:rotate(180deg)' : '';
        const contenido = cel.runs && !Object.prototype.hasOwnProperty.call(opts.overlay||{}, rf) ? cel.runs.map(x=>`<span style="${x.c?`color:${x.c};`:''}${x.b?'font-weight:700':''}">${escH(x.t)}</span>`).join('') : escH(v??'');
        html += `<td${mg?` colspan="${mg[0]}" rowspan="${mg[1]}"`:''} style="${css}"><div style="max-height:${mg?ys[Math.min(r-R1+mg[1],ys.length-1)]-ys[r-R1]:rowpx(r)}px;overflow:hidden;${vert}">${contenido}</div></td>`;
      }
      html += '</tr>';
    }
    html += '</table>';
    // dibujos: imágenes, cuadros de texto y figuras con relleno
    const posX = (col, off) => { const c = col+1; if(c<C1) return 0; return (xs[Math.min(c-C1, xs.length-1)]||W) + off/9525; };
    const posY = (row, off) => { const r = row+1; if(r<R1) return 0; return (ys[Math.min(r-R1, ys.length-1)]||H) + off/9525; };
    let capas = '';
    const rels = pkg.byName.has(info.path.replace(/([^/]+)$/,'_rels/$1.rels')) ? await pkg.text(info.path.replace(/([^/]+)$/,'_rels/$1.rels')) : '';
    const dm = /<Relationship\b[^>]*Type="[^"]*\/drawing"[^>]*>/.exec(rels);
    if(dm){
      const dpath = 'xl/' + attr(dm[0],'Target').replace(/^\.\.\//,''), dxml = await pkg.text(dpath), drp = dpath.replace(/([^/]+)$/,'_rels/$1.rels');
      const drels = pkg.byName.has(drp) ? await pkg.text(drp) : '', medios = {};
      for(const m of drels.matchAll(/<Relationship\b[^>]*>/g)){ const id = attr(m[0],'Id'), tg = attr(m[0],'Target'); if(/media\//.test(tg||'')) medios[id] = 'xl/media/' + tg.split('/').pop(); }
      for(const m of dxml.matchAll(/<xdr:(twoCellAnchor|oneCellAnchor)\b[^>]*>([\s\S]*?)<\/xdr:\1>/g)){
        const a = m[2]; if(/<xdr:cNvPr\b[^>]*\bhidden="1"/.test(a)) continue;
        const fr = /<xdr:from><xdr:col>(\d+)<\/xdr:col><xdr:colOff>(-?\d+)<\/xdr:colOff><xdr:row>(\d+)<\/xdr:row><xdr:rowOff>(-?\d+)<\/xdr:rowOff><\/xdr:from>/.exec(a); if(!fr) continue;
        const x1 = posX(+fr[1],+fr[2]), y1 = posY(+fr[3],+fr[4]); let x2, y2;
        const to = /<xdr:to><xdr:col>(\d+)<\/xdr:col><xdr:colOff>(-?\d+)<\/xdr:colOff><xdr:row>(\d+)<\/xdr:row><xdr:rowOff>(-?\d+)<\/xdr:rowOff><\/xdr:to>/.exec(a);
        if(to){ x2 = posX(+to[1],+to[2]); y2 = posY(+to[3],+to[4]); } else { const ex = /<xdr:ext cx="(\d+)" cy="(\d+)"/.exec(a); if(!ex) continue; x2 = x1 + ex[1]/9525; y2 = y1 + ex[2]/9525; }
        if(y1>H || x1>W) continue;
        const caja = `left:${x1}px;top:${y1}px;width:${Math.max(1,x2-x1)}px;height:${Math.max(1,y2-y1)}px`;
        for(const p of a.matchAll(/r:embed="([^"]+)"/g)){ const med = medios[p[1]]; if(med && pkg.byName.has(med) && !/\.(wdp|emf|wmf)$/.test(med)){ const data = await x.entryData(pkg.byName.get(med)); const tipo = /\.png$/.test(med)?'image/png':/\.svg$/.test(med)?'image/svg+xml':'image/jpeg';
            capas += `<img alt="" src="${URL.createObjectURL(new Blob([data],{type:tipo}))}" style="position:absolute;${caja};object-fit:fill">`; break; } }
        const textos = [...a.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)].map(pp=>[...pp[1].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map(t=>un(t[1])).join('')).filter(Boolean);
        if(textos.length && !/<xdr:pic>/.test(a)){ const sz = attr((/<a:rPr\b[^>]*>/.exec(a)||[''])[0],'sz'); const b = /<a:rPr\b[^>]*\bb="1"/.test(a);
          const col = (/<a:rPr\b[\s\S]*?<a:srgbClr val="([0-9A-F]{6})"/i.exec(a)||[])[1];
          capas += `<div style="position:absolute;${caja};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;font:${b?'700 ':''}${sz?sz/100*4/3:14}px Arial,sans-serif;${col?'color:#'+col:''};line-height:1.15;overflow:hidden">${textos.map(escH).join('<br>')}</div>`; }
      }
    }
    // casillas de formulario (VML)
    const vm = /<legacyDrawing r:id="([^"]+)"/.exec(xml);
    if(vm){ const rr = new RegExp('<Relationship\\b[^>]*Id="'+vm[1]+'"[^>]*>').exec(rels); if(rr){ const vpath = 'xl/' + attr(rr[0],'Target').replace(/^\.\.\//,'');
      if(pkg.byName.has(vpath)){ const v = await pkg.text(vpath);
        for(const s of v.matchAll(/<v:shape\b[\s\S]*?<\/v:shape>/g)){ const sh = s[0]; if(!/ObjectType="Checkbox"/.test(sh)) continue;
          const an = (/<x:Anchor>\s*([\d\s,]+)<\/x:Anchor>/.exec(sh)||[])[1]; if(!an) continue; const k = an.split(',').map(z=>+z.trim());
          const x1 = posX(k[0],0)+k[1], y1 = posY(k[2],0)+k[3], x2 = posX(k[4],0)+k[5], y2 = posY(k[6],0)+k[7]; if(y1>H) continue;
          const on = /<x:Checked>1<\/x:Checked>/.test(sh), tb = (/<v:textbox\b[\s\S]*?<\/v:textbox>/.exec(sh)||[''])[0], txt = un(tb.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
          capas += `<div style="position:absolute;left:${x1}px;top:${y1}px;width:${x2-x1}px;height:${y2-y1}px;display:flex;align-items:center;gap:3px;font:11px Arial,sans-serif;white-space:nowrap;overflow:hidden"><span style="display:inline-flex;width:11px;height:11px;border:1px solid #333;background:#fff;align-items:center;justify-content:center;font-size:10px;flex:none">${on?'✓':''}</span>${escH(txt)}</div>`; } } } }
    const div = document.createElement('div');
    div.className = 'xv'; div.style.cssText = `position:relative;width:${W}px;height:${H}px;background:#fff;transform-origin:0 0`;
    div.innerHTML = html + capas; div.dataset.ancho = W; div.dataset.alto = H;
    return div;
  }
  // Coloca una o varias hojas en un contenedor, ajustadas al ancho disponible
  async function mostrar(contenedor, partes){
    contenedor.innerHTML = '';
    for(const p of partes){
      const hoja = HOJAS[p.tipo==='COM'?'COM':p.tipo==='ALE'?'ALE':p.tipo];
      const v = await vista(p.bytes, hoja, { overlay:p.overlay, maxRow: p.tipo==='JRA' ? 70 : undefined });
      const marco = document.createElement('div'); marco.className = 'xv-marco';
      const disp = Math.max(320, contenedor.clientWidth - 8), k = Math.min(1, disp / +v.dataset.ancho);
      v.style.transform = `scale(${k})`; marco.style.height = (+v.dataset.alto * k + 4) + 'px'; marco.style.overflow = 'hidden';
      marco.appendChild(v); contenedor.appendChild(marco);
    }
  }

  /* ───────── Figura del cuerpo sobre la imagen cuerpo.jpg (1448×1086) ─────────
     Frente: el lado derecho de la persona queda a la izquierda de quien mira. Espalda: queda a la derecha. */
  const E_ = (cx,cy,rx,ry) => ['e',cx,cy,rx,ry], R_ = (x,y,w,h) => ['r',x,y,w,h], P_ = pts => ['p',pts];
  const ZONAS_CUERPO = [
    ['cabeza','Cabeza',[E_(1004,72,46,58)]], ['cara','Cara',[E_(445,88,34,46)]], ['ojo_der','Ojo derecho',[E_(429,78,9,6)]], ['ojo_izq','Ojo izquierdo',[E_(461,78,9,6)]],
    ['cuello','Cuello',[R_(413,138,64,50), R_(972,112,62,56)]],
    ['hombro_der','Hombro derecho',[E_(326,228,30,44), E_(1124,228,30,44)]], ['hombro_izq','Hombro izquierdo',[E_(564,228,30,44), E_(882,228,30,44)]],
    ['torax','Tórax',[P_('358,190 532,190 548,300 520,318 368,318 342,300')]], ['abdomen','Abdomen',[P_('368,318 520,318 528,438 360,438')]],
    ['espalda_alta','Espalda alta',[P_('905,170 1100,170 1112,300 893,300')]], ['espalda_baja','Espalda baja',[P_('893,300 1112,300 1104,392 902,392')]],
    ['cadera_der','Cadera / glúteo derecho',[P_('342,440 445,440 445,540 345,512'), P_('1003,392 1104,392 1108,545 1003,545')]], ['cadera_izq','Cadera / glúteo izquierdo',[P_('445,440 546,440 544,512 445,540'), P_('902,392 1003,392 1003,545 898,545')]],
    ['brazo_der','Brazo derecho',[P_('300,262 345,268 338,358 292,352'), P_('1105,258 1150,262 1160,360 1115,365')]], ['brazo_izq','Brazo izquierdo',[P_('545,268 590,262 598,352 552,358'), P_('855,262 900,258 890,365 845,360')]],
    ['codo_der','Codo derecho',[E_(312,362,24,16), E_(1140,364,24,16)]], ['codo_izq','Codo izquierdo',[E_(578,362,24,16), E_(866,364,24,16)]],
    ['antebrazo_der','Antebrazo derecho',[P_('290,372 326,378 270,478 238,468'), P_('1128,375 1162,370 1206,475 1178,486')]], ['antebrazo_izq','Antebrazo izquierdo',[P_('564,378 600,372 652,468 620,478'), P_('842,370 876,375 826,486 798,475')]],
    ['muneca_der','Muñeca derecha',[E_(246,484,20,13), E_(1196,488,20,13)]], ['muneca_izq','Muñeca izquierda',[E_(642,484,20,13), E_(808,488,20,13)]],
    ['mano_der','Mano derecha',[P_('205,495 262,492 258,545 210,548'), P_('1180,500 1236,500 1238,548 1190,552')]], ['mano_izq','Mano izquierda',[P_('628,492 685,495 680,548 632,545'), P_('768,500 824,500 814,552 766,548')]],
    ['dedos_der','Dedos mano derecha',[P_('184,525 210,548 258,545 240,600 200,598'), P_('1190,552 1238,548 1258,528 1240,600 1205,600')]], ['dedos_izq','Dedos mano izquierda',[P_('632,545 680,548 706,525 690,598 650,600'), P_('766,548 814,552 800,600 764,600 746,528')]],
    ['muslo_der','Muslo derecho',[P_('342,515 445,542 440,680 352,680'), P_('1005,548 1106,548 1100,688 1012,688')]], ['muslo_izq','Muslo izquierdo',[P_('445,542 548,515 538,680 450,680'), P_('900,548 1000,548 994,688 906,688')]],
    ['rodilla_der','Rodilla derecha',[E_(386,712,36,38), E_(1058,716,34,34)]], ['rodilla_izq','Rodilla izquierda',[E_(505,712,36,38), E_(946,716,34,34)]],
    ['pierna_der','Pierna derecha',[P_('340,750 410,750 404,910 348,910'), P_('1022,750 1104,750 1094,930 1034,930')]], ['pierna_izq','Pierna izquierda',[P_('480,750 550,750 542,910 486,910'), P_('902,750 984,750 972,930 912,930')]],
    ['tobillo_der','Tobillo derecho',[E_(374,926,28,15), E_(1068,944,30,14)]], ['tobillo_izq','Tobillo izquierdo',[E_(516,926,28,15), E_(936,944,30,14)]],
    ['pie_der','Pie derecho',[P_('330,940 405,940 412,1018 326,1018'), P_('1040,955 1112,955 1122,1012 1048,1012')]], ['pie_izq','Pie izquierdo',[P_('485,940 560,940 564,1018 478,1018'), P_('892,955 966,955 958,1012 884,1012')]]
  ];
  const nombreZona = id => (ZONAS_CUERPO.find(z=>z[0]===id)||[])[1] || id;
  // Partes del cuerpo expuestas por un riesgo: por palabras del peligro y, si no hay, por su categoría (A–G).
  const AMBOS = (...b) => b.flatMap(x=>[x+'_der', x+'_izq']);
  const REGLAS_CUERPO = [
    [/atrap|aplast|pellizc|engran|rodillo|prensa|troquel/, AMBOS('mano','dedos','antebrazo')],
    [/mano|corte|cortad|filos|lámina|lamina|rebaba|navaja|cuchill/, AMBOS('mano','dedos')],
    [/ojo|proyecci|partícul|particul|esquirla|salpic|soldad|arco|radiaci|polvo|chispa|esmeril/, ['ojo_der','ojo_izq','cara']],
    [/químic|quimic|solvente|ácido|acido|corrosiv|pintura|aceite/, AMBOS('mano').concat(['ojo_der','ojo_izq','cara'])],
    [/ruido|auditiv|hipoacusia/, ['cabeza']],
    [/caída|caida|altura|resbal|tropiez|mismo nivel|distinto nivel|escalera/, ['cabeza'].concat(AMBOS('muneca','rodilla','tobillo'),['espalda_baja'])],
    [/golpe|objeto|suspendid|izaje|desprend|herramienta|cae /, ['cabeza'].concat(AMBOS('hombro','pie'))],
    [/lumbar|ergon|carga manual|levant|postura|espalda|sobreesfuerzo|trastorno|repetitiv|tendin|túnel|tunel/, ['espalda_baja','espalda_alta'].concat(AMBOS('hombro','muneca'))],
    [/eléctric|electric|descarga|electrocu|energizad|energía|energia/, AMBOS('mano').concat(['torax'])],
    [/quemad|térmic|termic|caliente|incendio|fuego|flama|explosi|fundid/, AMBOS('mano','antebrazo').concat(['cara'])],
    [/vehícul|vehicul|montacarga|atropell|grúa|grua|tránsito|transito/, AMBOS('pierna','cadera').concat(['torax'])],
    [/asfixia|gas|vapor|humo|atmósfera|atmosfera|confinad|intoxic|oxígeno|oxigeno/, ['cara','torax']],
    [/pie|calzado|piso/, AMBOS('pie')]
  ];
  const CUERPO_CAT = { A:AMBOS('mano','dedos'), B:AMBOS('mano','pie').concat(['cabeza']), C:AMBOS('pierna','cadera'), D:['cabeza'].concat(AMBOS('rodilla','tobillo')), E:AMBOS('mano').concat(['torax']), F:AMBOS('mano').concat(['cara']) };
  function zonasDeRiesgo(r){
    const t = ((r.peligro||'')+' '+(r.causa||'')).toLowerCase(), z = new Set();
    REGLAS_CUERPO.forEach(([re, zs])=>{ if(re.test(t)) zs.forEach(x=>z.add(x)); });
    if(!z.size) (CUERPO_CAT[r.categoria]||[]).forEach(x=>z.add(x));
    return [...z];
  }
  // seleccion: zonas marcadas · conteos: {zona:n} para el mapa de calor · interactivo: se puede tocar
  function cuerpoSVG(seleccion, conteos, interactivo){
    seleccion = seleccion || []; conteos = conteos || {}; const max = Math.max(1, ...Object.values(conteos));
    // las zonas pequeñas (ojos, muñecas, codos, tobillos, cara) se dibujan al final para quedar encima
    const orden = ZONAS_CUERPO.slice().sort((a,b)=>(/cara|ojo|codo|muneca|tobillo|dedos/.test(a[0])?1:0)-(/cara|ojo|codo|muneca|tobillo|dedos/.test(b[0])?1:0));
    const formas = orden.map(([id,nom,fs])=>{ const n = conteos[id]||0, sel = seleccion.includes(id);
      const fill = sel ? 'rgba(220,38,38,.55)' : n ? `rgba(220,38,38,${0.18+0.6*n/max})` : 'rgba(0,0,0,0)';
      const at = `data-zona="${id}" fill="${fill}" stroke="${sel||n?'#991B1B':'transparent'}" stroke-width="3" style="cursor:${interactivo?'pointer':'default'}" class="zc"`;
      const tt = `<title>${escH(nom)}${n?' · '+n:''}</title>`;
      return fs.map(f => f[0]==='e' ? `<ellipse cx="${f[1]}" cy="${f[2]}" rx="${f[3]}" ry="${f[4]}" ${at}>${tt}</ellipse>` : f[0]==='r' ? `<rect x="${f[1]}" y="${f[2]}" width="${f[3]}" height="${f[4]}" rx="8" ${at}>${tt}</rect>` : `<polygon points="${f[1]}" ${at}>${tt}</polygon>`).join(''); }).join('');
    return `<div style="position:relative;width:100%;max-width:560px"><img src="cuerpo.jpg" alt="Figura del cuerpo, frente y espalda" style="width:100%;display:block;border-radius:10px;min-height:120px;background:#F8FAFC" onerror="this.outerHTML='<div class=&quot;err-box&quot;>No se encontró el archivo cuerpo.jpg en el repositorio. Súbelo junto con index.html.</div>'"><svg viewBox="0 0 1448 1086" style="position:absolute;inset:0;width:100%;height:100%" role="img" aria-label="Zonas del cuerpo">${interactivo?'<style>.zc:hover{fill:rgba(37,99,235,.28);stroke:#1D4ED8}</style>':''}${formas}</svg></div>`;
  }

  /* ───────── Layout de la planta (layout.png + layout-zonas.js) ───────── */
  // seleccion: [ids] marcadas · conteos: {id:n} mapa de calor · interactivo: tocar una zona la marca o desmarca
  function layoutSVG(seleccion, conteos, interactivo){
    const L = root.KTLAYOUT; if(!L) return '<p class="help">No se cargó el layout de la planta.</p>';
    seleccion = (seleccion||[]).map(Number); conteos = conteos || {}; const max = Math.max(1, ...Object.values(conteos)), vb = L.viewBox.split(' ').map(Number);
    const zonas = L.zonas.map(z=>{ const n = conteos[z.id]||0, sel = seleccion.includes(z.id);
      const fill = sel ? z.c : n ? '#DC2626' : 'transparent', op = sel ? .6 : n ? 0.2+0.6*n/max : 1;
      return `<path d="${z.d}" data-zl="${z.id}" fill="${fill}" fill-opacity="${op}" stroke="${sel||n?'#000':'none'}" stroke-width="3" vector-effect="non-scaling-stroke" class="zl" style="cursor:${interactivo?'pointer':'default'}"><title>${escH(z.n)}${n?' · '+n:''}</title></path>`; }).join('');
    const etiquetas = L.zonas.filter(z=>seleccion.includes(z.id)||conteos[z.id]).map(z=>`<text x="${z.lx}" y="${z.ly}" style="font:700 30px Arial,sans-serif;text-anchor:middle;dominant-baseline:middle;paint-order:stroke;stroke:#fff;stroke-width:8px;fill:#000;pointer-events:none">${escH(z.n)}${conteos[z.id]?' ('+conteos[z.id]+')':''}</text>`).join('');
    return `<div style="position:relative;width:100%;aspect-ratio:${vb[2]} / ${vb[3]}"><img src="${L.img}" alt="Layout de la planta" style="position:absolute;inset:0;width:100%;height:100%;user-select:none;pointer-events:none"><svg viewBox="${L.viewBox}" style="position:absolute;inset:0;width:100%;height:100%">${interactivo?'<style>.zl:hover{fill:#2563EB;fill-opacity:.25;stroke:#1D4ED8}</style>':''}${zonas}${etiquetas}</svg></div>`;
  }
  const nombreZonaPlanta = id => { const z = root.KTLAYOUT && root.KTLAYOUT.zonas.find(x=>x.id===Number(id)); return z ? z.n : String(id); };

  root.KF = { MAESTROS, HOJAS, JSA_SEV, JSA_PROB, JSA_CAT, jsaPuntaje, JRA, desdeMatriz, generar, descargar, vista, mostrar, cuerpoSVG, ZONAS_CUERPO, nombreZona, zonasDeRiesgo, layoutSVG, nombreZonaPlanta, bi, fechaMx, r2, _spec:{specJSA,specJRA,specCOM,specALE}, maestro };
})(typeof window!=='undefined'?window:globalThis);
