// Board 4 review data (ported from bgw-rv12): list pages + /exec/front/Board/Get per post, HTML fallback.
import {P, tx} from './shared.jsx';
const B = 4;
const NP = /\(\s*\d{4}-\d{2}-\d{2}[^)]*에 등록된 네이버 ?페이 구매평\s*\)/g;
export const SRC = {zigzag: '지그재그 구매', naver: '네이버페이 구매', bergwerk: '베르크서울 구매'};
const get = (url, json) => fetch(P(url), {credentials: 'same-origin', headers: json ? {'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json'} : {}}).then(r => { if (!r.ok) throw new Error('http ' + r.status); return json ? r.json() : r.text(); });
export const shortDate = (d) => { d = String(d || '').replace(/-/g, '.'); return /^\d{4}\./.test(d) ? d.slice(2, 10) : d; };
export function parseListDoc(doc) {
  const rows = [...doc.querySelectorAll('.xans-board-list-' + B + ' tr.xans-record-, tbody.xans-board-list-4 tr')].map(tr => {
    const a = tr.querySelector('a[href*="/article/review/' + B + '/"]'); if (!a) return null;
    const m = a.getAttribute('href').match(/\/article\/review\/\d+\/(\d+)\//); if (!m) return null;
    const td = tr.querySelectorAll('td'), pi = tr.querySelector('td.thumb img'), pn = tr.querySelector('p.product');
    return {no: +m[1], href: a.getAttribute('href'), subject: tx(a.innerHTML), writer: td[4] ? tx(td[4].innerHTML) : '', date: td[5] ? tx(td[5].innerHTML) : '',
      hasFile: !!tr.querySelector('[id^="afile_"], img[alt="파일첨부"]'), pimg: pi ? pi.getAttribute('src') : '', pname: pn ? tx(pn.innerHTML) : ''};
  }).filter(Boolean);
  const seen = {}; const uniq = rows.filter(r => seen[r.no] ? false : (seen[r.no] = 1));
  let last = 1; doc.querySelectorAll('.xans-board-paging a[href*="page="], .ec-base-paginate a[href*="page="]').forEach(x => { const p = +((x.getAttribute('href').match(/[?&]page=(\d+)/) || [])[1] || 0); if (p > last) last = p; });
  return {rows: uniq, last};
}
export const toItem = (r) => ({no: r.no, href: r.href, writer: r.writer, author: r.writer, date: (r.date || '').slice(0, 10).replace(/-/g, '.'), text: r.subject, subject: r.subject,
  source: /^네\*/.test(r.writer) ? 'naver' : 'bergwerk', option: '', body: '', media: [], hasFile: r.hasFile, pimg: r.pimg, pname: r.pname, loaded: false});
export function loadAll(pno) {
  const url = (p) => '/board/product/list.html?board_no=' + B + '&link_product_no=' + pno + (p > 1 ? '&page=' + p : '');
  const parse = (h) => parseListDoc(new DOMParser().parseFromString(h, 'text/html'));
  return get(url(1)).then(h => {
    const first = parse(h), pages = [], rest = {}; let known = 1, qi = 0;
    const extend = (last) => { last = Math.min(last, 200); for (let p = known + 1; p <= last; p++) pages.push(p); if (last > known) known = last; };
    extend(first.last);
    const nx = () => { if (qi >= pages.length) return Promise.resolve(); const p = pages[qi++]; return get(url(p)).then(x => { const r = parse(x); rest[p] = r.rows; if (r.rows.length) extend(r.last); }, () => { rest[p] = []; }).then(nx); };
    const w = []; for (let z = 0; z < Math.min(3, pages.length); z++) w.push(nx());
    return Promise.all(w).then(() => { let all = first.rows.slice(); pages.forEach(p => { all = all.concat(rest[p] || []); }); return all; });
  }).then(rows => { const seen = {}; return rows.filter(r => seen[r.no] ? false : (seen[r.no] = 1)).map(toItem).sort((x, y) => (y.date || '').localeCompare(x.date || '') || (y.no - x.no)); });
}
const imgs = (html) => { const d = document.createElement('div'), out = []; d.innerHTML = html || ''; d.querySelectorAll('img').forEach(i => { const s = i.getAttribute('src') || ''; if (/\/file_data\/[^/]+\.(jpe?g|png|gif|webp)/i.test(s) && out.indexOf(s) < 0) out.push(s); }); return out; };
export function fetchPost(no) {
  return get('/exec/front/Board/Get?no=' + no + '&board_no=' + B, true).then(j => {
    if (!j || j.failed !== false || !j.data || typeof j.data.content !== 'string') throw new Error('shape');
    return {content: j.data.content, media: imgs(j.data.content_image).concat(imgs(j.data.content)), writer: j.data.writer};
  }).catch(() => get('/article/review/' + B + '/' + no + '/').then(h => {
    const doc = new DOMParser().parseFromString(h, 'text/html'), det = doc.querySelector('.xans-board-read .detail'); if (!det) throw new Error('nohtml');
    const fr = det.querySelector('.fr-view'), nm = doc.querySelector('.xans-board-read .description .name');
    return {content: fr ? fr.innerHTML : det.innerHTML, media: imgs(det.innerHTML), writer: nm ? tx(nm.firstChild ? nm.firstChild.textContent : '') : ''};
  }));
}
export function parseContent(html) {
  const box = document.createElement('div'); box.innerHTML = html || '';
  const meta = box.querySelector('p.bw-meta'), f = {};
  if (meta) { tx(meta.innerHTML).split(/\s*·\s*/).forEach(kv => { const m = kv.match(/^([^:：]+)[:：]\s*(.*)$/); if (m) f[m[1].trim()] = m[2].trim(); }); meta.parentNode.removeChild(meta); }
  box.querySelectorAll('img').forEach(i => i.parentNode.removeChild(i));
  const t = tx(box.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')); const np = NP.test(t); NP.lastIndex = 0;
  return {f, np, text: t.replace(NP, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()};
}
export function apply(it, d) {
  const o = {...it, loaded: true}; if (!d) { o.failed = true; return o; }
  const c = parseContent(d.content); const seen = {};
  o.text = c.text || it.text; o.media = d.media.filter(u => seen[u] ? false : (seen[u] = 1));
  o.option = c.f['옵션'] || ''; o.body = (c.f['체형'] || '').replace(/\s*,\s*/g, ' · ');
  const s = c.f['출처'] || '', w = d.writer || it.writer;
  o.source = /지그재그/.test(s) ? 'zigzag' : /네이버/.test(s) ? 'naver' : s ? 'bergwerk' : (c.np || /^네\*/.test(w || '')) ? 'naver' : 'bergwerk';
  o.author = c.f['닉네임'] || (w || '').trim() || it.author; return o;
}
export function loadMany(list, onOne, n = 4) {
  const todo = list.filter(x => !x.loaded); let i = 0;
  const next = () => { if (i >= todo.length) return Promise.resolve(); const it = todo[i++]; return fetchPost(it.no).then(d => onOne(apply(it, d)), () => onOne(apply(it, null))).then(next); };
  const w = []; for (let k = 0; k < Math.min(n, todo.length); k++) w.push(next()); return Promise.all(w);
}
