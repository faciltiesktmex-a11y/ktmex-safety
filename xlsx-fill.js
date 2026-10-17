/*
 * KTMEX EHS Control — Llenado de un .xlsx maestro SIN modificarlo.
 * ----------------------------------------------------------------------------
 * Escribe únicamente: (1) valores de celdas de entrada, (2) el estado de casillas
 * de formulario (checkboxes) y, opcionalmente, (3) la altura de filas llenadas.
 * Todo lo demás del archivo (estilos, celdas combinadas, validaciones, formato
 * condicional, imágenes, encabezados/pies, fórmulas, hojas) se copia byte a byte.
 *
 * Sin dependencias: usa DecompressionStream del navegador (o de Node 18+).
 * Funciona en el navegador (window.KTMEX_XLSX) y en Node (module.exports).
 */
(function (root) {
  'use strict';
  const enc = new TextEncoder();
  const dec = new TextDecoder('utf-8');

  // ------------------------------------------------------------------ CRC32
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  // ------------------------------------------------------------------ ZIP
  function readZip(bytes) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('El archivo no es un .xlsx válido (no se encontró el directorio ZIP).');
    const total = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const entries = [];
    for (let i = 0; i < total; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('El .xlsx está dañado (directorio ZIP).');
      const flags = dv.getUint16(p + 8, true), method = dv.getUint16(p + 10, true);
      const time = dv.getUint16(p + 12, true), date = dv.getUint16(p + 14, true);
      const crc = dv.getUint32(p + 16, true), csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
      const nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      const lho = dv.getUint32(p + 42, true);
      if (csize === 0xFFFFFFFF || usize === 0xFFFFFFFF) throw new Error('ZIP64 no soportado.');
      const name = dec.decode(bytes.subarray(p + 46, p + 46 + nlen));
      const dataStart = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
      entries.push({ name, flags: flags & ~0x08, method, time, date, crc, csize, usize, raw: bytes.subarray(dataStart, dataStart + csize) });
      p += 46 + nlen + elen + clen;
    }
    return entries;
  }

  async function inflateRaw(u8) {
    const stream = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  async function entryData(e) {
    if (e.method === 0) return e.raw;
    if (e.method === 8) return inflateRaw(e.raw);
    throw new Error('Método de compresión no soportado: ' + e.method);
  }
  async function entryText(e) { return dec.decode(await entryData(e)); }

  function writeZip(entries) {
    const chunks = [], central = [];
    let offset = 0;
    for (const e of entries) {
      const nameB = enc.encode(e.name);
      const lh = new Uint8Array(30 + nameB.length), d = new DataView(lh.buffer);
      d.setUint32(0, 0x04034b50, true); d.setUint16(4, 20, true); d.setUint16(6, e.flags, true); d.setUint16(8, e.method, true);
      d.setUint16(10, e.time, true); d.setUint16(12, e.date, true); d.setUint32(14, e.crc, true);
      d.setUint32(18, e.csize, true); d.setUint32(22, e.usize, true); d.setUint16(26, nameB.length, true); d.setUint16(28, 0, true);
      lh.set(nameB, 30);
      chunks.push(lh, e.raw);
      const ch = new Uint8Array(46 + nameB.length), c = new DataView(ch.buffer);
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, e.flags, true);
      c.setUint16(10, e.method, true); c.setUint16(12, e.time, true); c.setUint16(14, e.date, true); c.setUint32(16, e.crc, true);
      c.setUint32(20, e.csize, true); c.setUint32(24, e.usize, true); c.setUint16(28, nameB.length, true); c.setUint32(42, offset, true);
      ch.set(nameB, 46);
      central.push(ch);
      offset += lh.length + e.raw.length;
    }
    const cdSize = central.reduce((a, b) => a + b.length, 0);
    const end = new Uint8Array(22), ed = new DataView(end.buffer);
    ed.setUint32(0, 0x06054b50, true); ed.setUint16(8, entries.length, true); ed.setUint16(10, entries.length, true);
    ed.setUint32(12, cdSize, true); ed.setUint32(16, offset, true);
    const parts = chunks.concat(central, [end]);
    const out = new Uint8Array(parts.reduce((a, b) => a + b.length, 0));
    let p = 0;
    for (const b of parts) { out.set(b, p); p += b.length; }
    return out;
  }

  // Reemplazo de una parte: se guarda SIN comprimir (método 0); el resto conserva sus bytes originales.
  function replacedEntry(orig, text) {
    const data = enc.encode(text);
    return Object.assign({}, orig, { method: 0, raw: data, csize: data.length, usize: data.length, crc: crc32(data) });
  }

  // ------------------------------------------------------------------ XML (a nivel de texto, sin reserializar)
  const escXml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const unescXml = s => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');
  const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

  function colToNum(col) { let n = 0; for (const ch of col) n = n * 26 + ch.charCodeAt(0) - 64; return n; }
  function splitRef(ref) {
    const m = /^([A-Z]+)(\d+)$/.exec(ref);
    if (!m) throw new Error('Referencia de celda inválida: ' + ref);
    return { col: m[1], row: Number(m[2]) };
  }

  function findRow(xml, n) {
    const re = new RegExp('<row\\b(?=[^>]*\\sr="' + n + '")[^>]*?(/>|>)', 'g');   // r="n" en cualquier posición del elemento
    const m = re.exec(xml);
    if (!m) return null;
    if (m[1] === '/>') return { start: m.index, end: m.index + m[0].length, selfClosing: true, text: m[0] };
    const close = xml.indexOf('</row>', m.index);
    return { start: m.index, end: close + 6, selfClosing: false, text: xml.slice(m.index, close + 6) };
  }

  function insertRow(xml, n, rowXml) {
    const sd = xml.indexOf('<sheetData');
    const sdEnd = xml.indexOf('>', sd) + 1;
    if (xml.slice(sd, sdEnd).endsWith('/>')) {
      return xml.slice(0, sd) + xml.slice(sd, sdEnd - 2) + '>' + rowXml + '</sheetData>' + xml.slice(sdEnd);
    }
    const re = /<row r="(\d+)"/g;
    let m, before = null;
    re.lastIndex = sdEnd;
    while ((m = re.exec(xml))) { if (Number(m[1]) > n) { before = m.index; break; } }
    const pos = before !== null ? before : xml.indexOf('</sheetData>');
    return xml.slice(0, pos) + rowXml + xml.slice(pos);
  }

  function buildCell(ref, style, value, formula) {
    const s = style ? ` s="${style}"` : '';
    const f = formula || '';
    if (value === null || value === undefined || value === '') return `<c r="${ref}"${s}>${f}</c>`;
    if (typeof value === 'object' && value.is) return `<c r="${ref}"${s} t="inlineStr">${value.is}</c>`;
    if (typeof value === 'number') return `<c r="${ref}"${s}>${f}<v>${value}</v></c>`;
    if (f) return `<c r="${ref}"${s} t="str">${f}<v>${escXml(value)}</v></c>`;
    return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${escXml(value)}</t></is></c>`;
  }

  // Devuelve el nuevo XML de la hoja con la celda escrita (conserva estilo y fórmula existentes).
  function writeCell(xml, ref, value) {
    const { col, row } = splitRef(ref);
    let r = findRow(xml, row);
    if (!r) {
      xml = insertRow(xml, row, `<row r="${row}"></row>`);
      r = findRow(xml, row);
    }
    let rowXml = r.text;
    if (r.selfClosing) rowXml = rowXml.replace(/\s*\/>$/, '>') + '</row>';
    const cellRe = new RegExp('<c r="' + ref + '"([^>]*?)(/>|>([\\s\\S]*?)</c>)');
    const m = cellRe.exec(rowXml);
    let newRow;
    if (m) {
      const attrs = m[1];
      const style = (/\ss="(\d+)"/.exec(attrs) || [])[1];
      const inner = m[3] || '';
      const formula = (/<f\b[^>]*?(?:\/>|>[\s\S]*?<\/f>)/.exec(inner) || [''])[0];
      newRow = rowXml.slice(0, m.index) + buildCell(ref, style, value, formula) + rowXml.slice(m.index + m[0].length);
    } else {
      const cellsRe = /<c r="([A-Z]+)\d+"/g;
      let cm, insertAt = -1, last = -1;
      while ((cm = cellsRe.exec(rowXml))) {
        last = cm.index;
        if (colToNum(cm[1]) > colToNum(col)) { insertAt = cm.index; break; }
      }
      const cell = buildCell(ref, null, value, '');
      if (insertAt >= 0) newRow = rowXml.slice(0, insertAt) + cell + rowXml.slice(insertAt);
      else newRow = rowXml.slice(0, rowXml.length - 6) + cell + '</row>';
    }
    return xml.slice(0, r.start) + newRow + xml.slice(r.end);
  }

  // Índices de estilo (cellXfs) que tienen ajuste de texto (wrapText).
  function wrapStyles(stylesXml) {
    const m = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(stylesXml || '');
    const out = [];
    if (!m) return out;
    const re = /<xf\b[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g;
    let x;
    while ((x = re.exec(m[1]))) out.push(/<alignment\b[^>]*\swrapText="(?:1|true)"/.test(x[0]));
    return out;
  }
  function cellStyleIndex(xml, ref) {
    const m = new RegExp('<c r="' + ref + '"([^>]*?)(/>|>)').exec(xml);
    return m ? Number((/\ss="(\d+)"/.exec(m[1]) || [])[1] || 0) : 0;
  }

  function setRowHeight(xml, n, pt) {
    const r = findRow(xml, n);
    if (!r) return xml;
    const headEnd = r.text.indexOf('>') + (r.selfClosing ? 0 : 1);
    let head = r.text.slice(0, r.selfClosing ? r.text.length : headEnd);
    head = head.replace(/\sht="[^"]*"/, '').replace(/\scustomHeight="[^"]*"/, '');
    head = head.replace(/\sr="(\d+)"/, (m) => `${m} ht="${pt}" customHeight="1"`);   // junto a r="n": el orden de atributos no cambia de un llenado a otro
    return xml.slice(0, r.start) + head + (r.selfClosing ? '' : r.text.slice(headEnd)) + xml.slice(r.end);
  }

  // ------------------------------------------------------------------ Lectura de texto de celdas (validación del maestro)
  function parseSharedStrings(xml) {
    const out = [];
    const re = /<si>([\s\S]*?)<\/si>/g;
    let m;
    while ((m = re.exec(xml))) {
      let t = '';
      const tr = /<t[^>]*>([\s\S]*?)<\/t>/g;
      let x;
      while ((x = tr.exec(m[1]))) t += unescXml(x[1]);
      out.push(t);
    }
    return out;
  }
  function readCellText(sheetXml, shared, ref) {
    const m = new RegExp('<c r="' + ref + '"([^>]*?)(/>|>([\\s\\S]*?)</c>)').exec(sheetXml);
    if (!m || !m[3]) return '';
    const t = (/\st="(\w+)"/.exec(m[1]) || [])[1];
    const v = (/<v>([\s\S]*?)<\/v>/.exec(m[3]) || [])[1];
    if (t === 's') return shared[Number(v)] || '';
    if (t === 'inlineStr') return unescXml((/<t[^>]*>([\s\S]*?)<\/t>/.exec(m[3]) || [])[1] || '');
    return v === undefined ? '' : unescXml(v);
  }

  // ------------------------------------------------------------------ Paquete
  async function openPackage(bytes) {
    const entries = readZip(bytes);
    const byName = new Map(entries.map(e => [e.name, e]));
    const text = async name => { const e = byName.get(name); if (!e) throw new Error('Falta la parte ' + name); return entryText(e); };
    const wb = await text('xl/workbook.xml');
    const rels = await text('xl/_rels/workbook.xml.rels');
    const relTarget = {};
    for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
      const id = (/\bId="([^"]+)"/.exec(m[0]) || [])[1], tg = (/\bTarget="([^"]+)"/.exec(m[0]) || [])[1];
      if (id && tg) relTarget[id] = tg.startsWith('/') ? tg.slice(1) : 'xl/' + tg;
    }
    const sheets = [];
    for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
      const name = unescXml((/\bname="([^"]*)"/.exec(m[0]) || [])[1] || '');
      const rid = (/\br:id="([^"]+)"/.exec(m[0]) || [])[1];
      sheets.push({ name, path: relTarget[rid] });
    }
    let shared = [];
    if (byName.has('xl/sharedStrings.xml')) shared = parseSharedStrings(await text('xl/sharedStrings.xml'));
    return { entries, byName, text, sheets, shared };
  }
  const sheetByName = (pkg, name) => {
    const s = pkg.sheets.find(x => x.name === name);
    if (!s) throw new Error(`El maestro no tiene la hoja «${name}». ¿Es el formato correcto?`);
    return s;
  };

  // spec.expect = [{ sheet, ref, text }]  → comprueba que es el formato esperado antes de escribir.
  async function validateMaster(bytes, expect) {
    const pkg = await openPackage(bytes);
    const problems = [];
    for (const ex of expect) {
      let sh;
      try { sh = sheetByName(pkg, ex.sheet); } catch (e) { problems.push(e.message); continue; }
      const got = readCellText(await pkg.text(sh.path), pkg.shared, ex.ref);
      if (norm(got) !== norm(ex.text)) problems.push(`${ex.sheet.trim()}!${ex.ref}: se esperaba «${ex.text}» y el maestro trae «${got}».`);
    }
    return problems;
  }

  // ------------------------------------------------------------------ Casillas (controles de formulario)
  async function readCheckboxes(pkg, sheetPath) {
    const sheetXml = await pkg.text(sheetPath);
    const relsPath = sheetPath.replace('worksheets/', 'worksheets/_rels/') + '.rels';
    const rels = await pkg.text(relsPath);
    const ctrlByRid = {}, vmlPath = {};
    for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
      const id = (/\bId="([^"]+)"/.exec(m[0]) || [])[1], tg = (/\bTarget="([^"]+)"/.exec(m[0]) || [])[1], ty = (/\bType="([^"]+)"/.exec(m[0]) || [])[1] || '';
      if (!tg) continue;
      const full = tg.startsWith('/') ? tg.slice(1) : 'xl/' + tg.replace(/^\.\.\//, '');
      if (/ctrlProp$/.test(ty)) ctrlByRid[id] = full;
      if (/vmlDrawing$/.test(ty)) vmlPath.p = full;
    }
    const vml = vmlPath.p ? await pkg.text(vmlPath.p) : '';
    const captionByShape = {};
    for (const m of vml.matchAll(/<v:shape\b[^>]*?id="_x0000_s(\d+)"[^>]*>([\s\S]*?)<\/v:shape>/g)) {
      const tb = /<v:textbox[^>]*>([\s\S]*?)<\/v:textbox>/.exec(m[2]);
      captionByShape[m[1]] = tb ? unescXml(tb[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() : '';
    }
    const boxes = [];
    for (const m of sheetXml.matchAll(/<control\b[^>]*>/g)) {
      const shapeId = (/\bshapeId="(\d+)"/.exec(m[0]) || [])[1], rid = (/\br:id="([^"]+)"/.exec(m[0]) || [])[1];
      if (!shapeId || !ctrlByRid[rid]) continue;
      boxes.push({ shapeId, ctrlPath: ctrlByRid[rid], vmlPath: vmlPath.p, caption: captionByShape[shapeId] || '' });
    }
    return boxes;
  }

  function setCtrlChecked(xml, on) {
    let out = xml.replace(/\schecked="[^"]*"/, '');
    if (on) out = out.replace(/(<formControlPr\b)/, '$1 checked="Checked"');
    return out;
  }
  function setVmlChecked(vml, shapeId, on) {
    const re = new RegExp('(<v:shape\\b[^>]*?id="_x0000_s' + shapeId + '"[^>]*>)([\\s\\S]*?)(</v:shape>)');
    const m = re.exec(vml);
    if (!m) return vml;
    let body = m[2].replace(/<x:Checked>\d+<\/x:Checked>/, '');
    if (on) body = body.replace(/(<x:ClientData\b[^>]*>)/, '$1<x:Checked>1</x:Checked>');
    return vml.slice(0, m.index) + m[1] + body + m[3] + vml.slice(m.index + m[0].length);
  }

  // ------------------------------------------------------------------ API principal
  /*
   * spec = {
   *   sheets: [{ name, cells: {A1: valor}, rowHeights: {43: 80} }],
   *   checkboxes: { sheet: 'Nombre', states: { 'Título de la casilla': true|false } }
   * }
   * Devuelve { bytes, report: { cells: [...], checkboxes: [...], rowHeights: [...] } }
   */
  async function fill(masterBytes, spec) {
    const pkg = await openPackage(masterBytes);
    const replaced = new Map();
    const report = { cells: [], checkboxes: [], rowHeights: [], flattened: [] };
    const wrapIdx = pkg.byName.has('xl/styles.xml') ? wrapStyles(await pkg.text('xl/styles.xml')) : [];
    // Texto con dos formatos (v0.4): [{t, negro}] → cada parte conserva la letra de la celda; el inglés va en negro.
    const stylesXml = pkg.byName.has('xl/styles.xml') ? await pkg.text('xl/styles.xml') : '';
    const fontsXml = [...((/<fonts\b[^>]*>([\s\S]*?)<\/fonts>/.exec(stylesXml) || [])[1] || '').matchAll(/<font\b[^>]*?(?:\/>|>([\s\S]*?)<\/font>)/g)].map(m => m[1] || '');
    const xfFont = [...((/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(stylesXml) || [])[1] || '').matchAll(/<xf\b([^>]*?)(?:\/>|>)/g)].map(m => +((/fontId="(\d+)"/.exec(m[1]) || [])[1] || 0));
    const rico = (partes, styleIdx) => {
      const base = (fontsXml[xfFont[styleIdx] || 0] || '').replace(/<name\b/g, '<rFont').replace(/<scheme\b[^>]*\/>/g, '');
      const rpr = negro => '<rPr>' + (negro ? base.replace(/<color\b[^>]*\/>/g, '') + '<color theme="1"/>' : base) + '</rPr>';
      return { is: '<is>' + partes.filter(p => p.t).map(p => `<r>${rpr(p.negro)}<t xml:space="preserve">${escXml(p.t)}</t></r>`).join('') + '</is>' };
    };

    for (const sh of (spec.sheets || [])) {
      const info = sheetByName(pkg, sh.name);
      let xml = await pkg.text(info.path);
      for (const [ref, raw] of Object.entries(sh.cells || {})) {
        let value = raw;
        if (value && typeof value === 'object' && Array.isArray(value.rico)) { xml = writeCell(xml, ref, rico(value.rico, cellStyleIndex(xml, ref))); report.cells.push(`${sh.name.trim()}!${ref}`); continue; }
        if (typeof value === 'string' && value.includes('\n') && !wrapIdx[cellStyleIndex(xml, ref)]) {
          value = value.replace(/\s*\n\s*/g, ' ');            // sin ajuste de texto los saltos de línea no se ven: se escribe en una sola línea
          report.flattened.push(`${sh.name.trim()}!${ref}`);
        }
        xml = writeCell(xml, ref, value);
        report.cells.push(`${sh.name.trim()}!${ref}`);
      }
      for (const [n, pt] of Object.entries(sh.rowHeights || {})) { xml = setRowHeight(xml, Number(n), pt); report.rowHeights.push(`${sh.name.trim()}!fila ${n}`); }
      replaced.set(info.path, xml);
    }

    if (spec.checkboxes) {
      const info = sheetByName(pkg, spec.checkboxes.sheet);
      const boxes = await readCheckboxes(pkg, info.path);
      const states = spec.checkboxes.states || {};
      const matches = c => boxes.filter(b => norm(b.caption) === norm(c));
      const unknown = Object.keys(states).filter(c => matches(c).length === 0);
      if (unknown.length) throw new Error('El maestro no tiene la casilla: ' + unknown.join(', '));
      const ambiguous = Object.keys(states).filter(c => matches(c).length > 1);
      if (ambiguous.length) throw new Error('Hay más de una casilla con el título: ' + ambiguous.join(', '));
      const vmlTexts = {};
      for (const b of boxes) {
        const key = Object.keys(states).find(c => norm(b.caption) === norm(c));
        if (key === undefined) continue;
        const on = Boolean(states[key]);
        replaced.set(b.ctrlPath, setCtrlChecked(replaced.get(b.ctrlPath) ?? await pkg.text(b.ctrlPath), on));
        if (b.vmlPath) {
          vmlTexts[b.vmlPath] = setVmlChecked(vmlTexts[b.vmlPath] ?? await pkg.text(b.vmlPath), b.shapeId, on);
          replaced.set(b.vmlPath, vmlTexts[b.vmlPath]);
        }
        report.checkboxes.push(`${b.caption}=${on ? 'sí' : 'no'}`);
      }
    }

    // KTMEX Safety v0.3: fotos, textos de cuadros (drawingText) y recálculo de fórmulas al abrir.
    const nuevas = [];
    const getText = async name => replaced.has(name) ? replaced.get(name) : await pkg.text(name);
    for (const grupo of (spec.images || [])) {
      if (!grupo.items || !grupo.items.length) continue;
      const info = sheetByName(pkg, grupo.sheet);
      const relsPath = info.path.replace(/([^/]+)$/, '_rels/$1.rels');
      const rels = await getText(relsPath);
      const dm = /<Relationship\b[^>]*Type="[^"]*\/drawing"[^>]*>/.exec(rels);
      if (!dm) throw new Error('La hoja no tiene capa de dibujo para insertar fotos.');
      const drawingPath = 'xl/' + (/Target="([^"]+)"/.exec(dm[0])[1]).replace(/^\.\.\//, '').replace(/^\/xl\//, '');
      const dRelsPath = drawingPath.replace(/([^/]+)$/, '_rels/$1.rels');
      let dxml = await getText(drawingPath);
      let drels = pkg.byName.has(dRelsPath) || replaced.has(dRelsPath) ? await getText(dRelsPath)
        : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
      let maxId = 0; for (const m of dxml.matchAll(/<xdr:cNvPr id="(\d+)"/g)) maxId = Math.max(maxId, +m[1]);
      grupo.items.forEach((im, k) => {
        const m = /^data:image\/(jpeg|png);base64,(.+)$/.exec(im.dataUrl || ''); if (!m) return;
        const bin = typeof atob === 'function' ? Uint8Array.from(atob(m[2]), c => c.charCodeAt(0)) : new Uint8Array(Buffer.from(m[2], 'base64'));
        const ext = m[1] === 'png' ? 'png' : 'jpeg', media = `xl/media/ktmex_${Date.now()}_${k}.${ext}`, rid = 'rIdK' + (k + 1) + '_' + Math.floor(Math.random() * 1e6);
        nuevas.push({ name: media, flags: 0, method: 0, time: 0, date: 0x5a21, crc: crc32(bin), csize: bin.length, usize: bin.length, raw: bin });
        drels = drels.replace('</Relationships>', `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${media.split('/').pop()}"/></Relationships>`);
        const E = 9525, cx = Math.round(im.w * E), cy = Math.round(im.h * E);
        dxml = dxml.replace(/<\/xdr:wsDr>\s*$/, `<xdr:oneCellAnchor><xdr:from><xdr:col>${im.col}</xdr:col><xdr:colOff>${Math.round(im.colOff * E)}</xdr:colOff><xdr:row>${im.row}</xdr:row><xdr:rowOff>${Math.round(im.rowOff * E)}</xdr:rowOff></xdr:from><xdr:ext cx="${cx}" cy="${cy}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${++maxId}" name="Foto ${k + 1}"/><xdr:cNvPicPr><a:picLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rid}"/><a:stretch xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>`);
      });
      replaced.set(drawingPath, dxml); replaced.set(dRelsPath, drels);
      let ct = await getText('[Content_Types].xml');
      if (!/Extension="jpeg"/i.test(ct)) ct = ct.replace('</Types>', '<Default Extension="jpeg" ContentType="image/jpeg"/></Types>');
      if (!/Extension="png"/i.test(ct)) ct = ct.replace('</Types>', '<Default Extension="png" ContentType="image/png"/></Types>');
      replaced.set('[Content_Types].xml', ct);
    }
    for (const t of (spec.drawingText || [])) {
      const info = sheetByName(pkg, t.sheet);
      const rels = await getText(info.path.replace(/([^/]+)$/, '_rels/$1.rels'));
      const dm = /<Relationship\b[^>]*Type="[^"]*\/drawing"[^>]*>/.exec(rels); if (!dm) continue;
      const drawingPath = 'xl/' + (/Target="([^"]+)"/.exec(dm[0])[1]).replace(/^\.\.\//, '');
      replaced.set(drawingPath, (await getText(drawingPath)).split('<a:t>' + escXml(t.from) + '</a:t>').join('<a:t>' + escXml(t.to) + '</a:t>'));
    }
    if (spec.recalcular) {
      let wb = await getText('xl/workbook.xml');
      wb = /<calcPr\b/.test(wb) ? wb.replace(/<calcPr\b([^>]*?)(\/?)>/, (m, at, sl) => `<calcPr${at.replace(/\sfullCalcOnLoad="[^"]*"/, '')} fullCalcOnLoad="1"${sl}>`) : wb.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>');
      replaced.set('xl/workbook.xml', wb);
    }
    const out = pkg.entries.map(e => replaced.has(e.name) ? replacedEntry(e, replaced.get(e.name)) : e).concat(nuevas);
    return { bytes: writeZip(out), report };
  }

  async function sha256Hex(bytes) {
    const subtle = (root.crypto && root.crypto.subtle) || (typeof require === 'function' ? require('crypto').webcrypto.subtle : null);
    const digest = new Uint8Array(await subtle.digest('SHA-256', bytes));
    return Array.from(digest).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function readCell(pkg, sheetName, ref) {
    const sh = sheetByName(pkg, sheetName);
    return readCellText(await pkg.text(sh.path), pkg.shared, ref);
  }

  const api = { fill, validateMaster, readCheckboxes, readCell, openPackage, readZip, writeZip, entryData, sha256Hex, sheetByName, _internal: { writeCell, setRowHeight, norm, unescXml } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.KTMEX_XLSX = api;
})(typeof window !== 'undefined' ? window : globalThis);
