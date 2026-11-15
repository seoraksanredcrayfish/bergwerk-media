/*! bgw-ax: Bergwerk Seoul review / FAQ / Q&A / chatbot UI on Astryx (Meta, MIT) + React 19 (MIT). Mounted in shadow roots; Cafe24 modules stay in place. */
import {Ask} from './ask.jsx';
import {Faq, parseFaq} from './faq.jsx';
import {QaList, QaWrite, parseQaList, parseQaWrite} from './qa.jsx';
import {DetailReviews, BoardList, BoardRead, srcLabel} from './review.jsx';
import {parseListDoc, toItem, parseContent, shortDate} from './reviewdata.js';
import {P, tx, mount, globalCss, makeHost} from './shared.jsx';

const H = document.documentElement;
const waitFor = (fn, ms = 6000) => new Promise(res => { const t0 = Date.now(); (function tick() { const v = fn(); if (v || Date.now() - t0 > ms) return res(v); setTimeout(tick, 120); })(); });
const pad = (host, css) => { host.style.cssText = css; };

function mountAsk() {
  if (window.BGW_ASK_AX) return; const api = {}; window.BGW_ASK_AX = api;
  const host = document.createElement('div'); host.id = 'bgw-ask-ax'; document.body.appendChild(host);
  mount(host, <Ask api={api} />);
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-bgw-ask-open], .bgw-qa-ask, .bgw-help__ask');
    if (!t) return; e.preventDefault(); e.stopImmediatePropagation();
    const b = t.getAttribute('data-bgw-ask-open'), p = t.getAttribute('data-bgw-ask-product');
    api.open && api.open(/^\d+$/.test(b || '') ? b : '', /^\d{1,9}$/.test(p || '') ? p : '');
  }, true);
}
async function mountFaq() {
  const h14 = document.querySelector('.h14'); if (!h14) return;
  const d = parseFaq(h14); globalCss('bgw-ax-faq-css', 'html.bgw-ax-faq .h14,html.bgw-ax-faq .bgw-help__ask{display:none!important}');
  const host = makeHost('bgw-ax-faq', h14); pad(host, 'display:block;max-width:1040px;margin:0 auto;padding:40px 24px 120px;box-sizing:border-box');
  mount(host, <Faq d={d} />); H.classList.add('bgw-ax-faq');
}
async function mountQa() {
  if (!/[?&]board_no=6(&|$)/.test(location.search) && !/\/article\/qa\/6\//.test(location.pathname)) return;
  const isList = /\/board\/product\/list\.html/.test(location.pathname), isWrite = /\/board\/product\/write\.html/.test(location.pathname);
  if (!isList && !isWrite) return;
  const host0 = await waitFor(() => document.querySelector('.bgw-qa-host')); if (!host0) return;
  globalCss('bgw-ax-qa-css', 'html.bgw-ax-qa .bgw-qa-host>:not(.bgw-ax-host){display:none!important}html.bgw-ax-qaw .bgw-qa-host>:not(.bgw-ax-host){position:absolute!important;left:-10000px!important;top:0!important;width:900px!important}html.bgw-ax-qa .bgw-help__ask{display:none!important}');
  const host = document.createElement('div'); host.className = 'bgw-ax-host'; host0.insertBefore(host, host0.firstChild);
  pad(host, 'display:block;width:100%;max-width:960px;margin:0 auto;box-sizing:border-box');
  if (isList) { await waitFor(() => host0.querySelector('.q14-types a')); mount(host, <QaList d={parseQaList(host0)} />); H.classList.add('bgw-ax-qa'); }
  else { await waitFor(() => window.BOARD_WRITE && document.getElementById('boardWriteForm')); const d = parseQaWrite(); if (!d) return; mount(host, <QaWrite d={d} />); H.classList.add('bgw-ax-qaw'); }
}
async function mountDetailReviews() {
  const prd = document.getElementById('prdReview'); if (!prd) return;
  const root = prd.querySelector('.bgw-rv[data-product-no]') || prd.querySelector('#alph_new_board');
  let pno = root && root.getAttribute('data-product-no');
  if (!/^\d+$/.test(pno || '')) { const m = location.search.match(/[?&]product_no=(\d+)/) || location.pathname.match(/\/(\d+)\/category\//); pno = m ? m[1] : (window.iProductNo ? String(window.iProductNo) : ''); }
  if (!pno) return;
  globalCss('bgw-ax-rv-css', 'html.bgw-ax-rv #prdReview .bgw-rv,html.bgw-ax-rv #prdReview #alph_new_board,html.bgw-ax-rv .bgw-qcta{display:none!important}html.bgw-ax-rv #prdReview>h2,html.bgw-ax-rv #prdReview>h3{display:none!important}');
  const host = document.createElement('div'); host.className = 'bgw-ax-host'; const anchor = prd.querySelector('#alph_new_board') || root; if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(host, anchor); else prd.appendChild(host);
  pad(host, 'display:block;margin:0;padding:8px 0 24px;box-sizing:border-box');
  mount(host, <DetailReviews pno={pno} />); H.classList.add('bgw-ax-rv');
}
async function mountBoard4() {
  const isList = /\/board\/product\/list\.html/.test(location.pathname) && /[?&]board_no=4(&|$)/.test(location.search);
  const isRead = /\/article\/review\/4\//.test(location.pathname);
  if (!isList && !isRead) return;
  const contents = document.getElementById('contents') || document.querySelector('#container') || document.body;
  globalCss('bgw-ax-b4-css', 'html.bgw-ax-b4 #contents>:not(.bgw-ax-host){display:none!important}');
  const host = document.createElement('div'); host.className = 'bgw-ax-host'; contents.insertBefore(host, contents.firstChild);
  pad(host, 'display:block;max-width:1200px;margin:0 auto;padding:32px 24px 96px;box-sizing:border-box');
  if (isList) {
    const r = parseListDoc(document); const sp = new URLSearchParams(location.search); const cur = +(sp.get('page') || 1);
    const wb = document.querySelector('a[href*="/board/product/write.html"][href*="board_no=4"]');
    const pages = {cur, last: Math.max(r.last, cur), url: (p) => { const u = new URL(location.href); u.searchParams.set('page', p); return u.toString(); }};
    mount(host, <BoardList rows={r.rows.map(toItem)} pages={pages} writeHref={wb ? wb.getAttribute('href') : P('/board/product/write.html?board_no=4')} />);
  } else {
    const rd = document.querySelector('.xans-board-read'); if (!rd) return;
    const det = rd.querySelector('.detail'); const fr = det && (det.querySelector('.fr-view') || det);
    const c = parseContent(fr ? fr.innerHTML : '');
    const media = []; (det ? det.querySelectorAll('img') : []).forEach(i => { const s = i.getAttribute('src') || ''; if (/\/file_data\//.test(s) && media.indexOf(s) < 0) media.push(s); });
    const desc = rd.querySelector('.description'); const dtext = desc ? desc.textContent : '';
    const nm = desc && desc.querySelector('.name'); const writer = nm ? tx(nm.firstChild ? nm.firstChild.textContent : nm.textContent) : (dtext.trim().split(/\s+/)[0] || '');
    const pb = document.querySelector('.xans-board-product'); const pa = pb && pb.querySelector('a[href*="/product/"]');
    const product = pb ? {img: (pb.querySelector('img') || {}).src || '', name: tx(((pb.querySelector('h3, .name') || {}).innerHTML) || ''), price: tx(((pb.querySelector('.price, p') || {}).innerHTML) || ''), href: pa ? pa.getAttribute('href') : ''} : null;
    const actions = [...document.querySelectorAll('.xans-board-read .ec-base-button a, .xans-board-read .ec-base-button button')].filter(a => /^(수정|삭제)$/.test(a.textContent.trim()) && a.offsetParent !== null || /^(수정|삭제)$/.test(a.textContent.trim())).filter((a, i, arr) => arr.findIndex(x => x.textContent.trim() === a.textContent.trim()) === i).map(a => ({label: a.textContent.trim(), run: () => a.click()}));
    const listA = [...document.querySelectorAll('.xans-board-read .ec-base-button a')].find(a => a.textContent.trim() === '목록');
    const moves = [...document.querySelectorAll('.xans-board-movement li')].map(li => { const a = li.querySelector('a'); return a ? {label: tx((li.querySelector('strong, th') || {}).innerHTML || '') || '', title: a.textContent.trim(), href: a.getAttribute('href')} : null; }).filter(Boolean);
    const srcKey = /지그재그/.test(c.f['출처'] || '') ? 'zigzag' : /네이버/.test(c.f['출처'] || '') || c.np ? 'naver' : 'bergwerk';
    const d = {subject: tx(((rd.querySelector('.head h3, h3') || {}).innerHTML) || '') || '고객 리뷰', author: c.f['닉네임'] || writer || '구매자', date: shortDate((dtext.match(/\d{4}-\d{2}-\d{2}/) || [''])[0]),
      srcLabel: srcLabel({source: srcKey}), option: c.f['옵션'] || '', body: (c.f['체형'] || '').replace(/\s*,\s*/g, ' · '), text: c.text, media, product, actions, moves,
      listHref: listA ? listA.getAttribute('href') : P('/board/product/list.html?board_no=4')};
    mount(host, <BoardRead d={d} />);
  }
  H.classList.add('bgw-ax-b4');
}
function boot() {
  try { mountAsk(); } catch (e) {}
  [mountFaq, mountQa, mountDetailReviews, mountBoard4].forEach(f => { try { f().catch(() => {}); } catch (e) {} });
}
if (!window.__bgwAx) { window.__bgwAx = 1; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot(); }
