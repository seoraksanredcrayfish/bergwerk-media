import {createRoot} from 'react-dom/client';
import CSS_CORE from '@astryxdesign/core/astryx.css';
import CSS_RESET from '@astryxdesign/core/reset.css';

export const PFX = (location.pathname.match(/^\/skin-[^/]+/) || [''])[0];
export const P = (u) => (typeof u === 'string' && u.charAt(0) === '/' && u.indexOf(PFX + '/') !== 0 && PFX) ? PFX + u : u;
export const tx = (h) => { const d = document.createElement('div'); d.innerHTML = h || ''; return (d.textContent || '').replace(/\u00a0/g, ' ').trim(); };
export const isMob = () => !!(window.matchMedia && matchMedia('(max-width:767px)').matches);

// Shadow root keeps the shop skin CSS (unlayered resets) from overriding Astryx's layered styles.
const BASE_CSS = CSS_RESET.replace(/:root\b/g, ':host').replace(/\bhtml\b/g, ':host') + '\n' + CSS_CORE.replace(/:root\b/g, ':host') + `
:host{all:initial;display:block;font-family:var(--font-family-body, system-ui), "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;color:var(--color-text-primary);-webkit-font-smoothing:antialiased}
.bgw-prose{font-size:var(--text-body-size, 15px);line-height:1.7;color:var(--color-text-primary);word-break:keep-all;overflow-wrap:anywhere}
.bgw-prose p{margin:0 0 8px}.bgw-prose ul,.bgw-prose ol{margin:0 0 8px;padding-left:20px}.bgw-prose li{margin:0 0 4px}
.bgw-prose a{color:var(--color-text-accent);text-decoration:underline;text-underline-offset:3px}
.bgw-prose dl{margin:12px 0 0;padding:0;border-top:1px solid var(--color-border-subtle, #e5e5e5)}
.bgw-prose dl>div{display:grid;grid-template-columns:140px minmax(0,1fr);gap:12px;padding:10px 0;border-bottom:1px solid var(--color-border-subtle, #eee)}
.bgw-prose dt{color:var(--color-text-secondary);margin:0}.bgw-prose dd{margin:0}
.bgw-prose .h14-lead,.bgw-prose .h14-em{font-weight:600}.bgw-prose .h14-note{color:var(--color-text-secondary);font-size:.92em}
.bgw-prose .h14-links{display:flex;gap:16px;margin-top:12px}
.bgw-img{display:block;width:100%;height:100%;object-fit:cover}
.bgw-tile{position:relative;display:block;width:100%;padding:0;border:0;background:var(--color-background-muted, #f4f4f4);border-radius:var(--radius-container, 12px);overflow:hidden;cursor:pointer}
.bgw-tile img{transition:transform .5s cubic-bezier(.2,.7,.2,1)}.bgw-tile:hover img{transform:scale(1.03)}
.bgw-plus{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:rgba(0,0,0,.45);color:#fff;font-weight:600}
.bgw-hide-sb::-webkit-scrollbar{display:none}
.astryx-collapsible-trigger{padding-block:16px!important;line-height:1.45}
.bgw-acc>div+div{border-top:1px solid var(--color-border)}
@media (max-width:767px){.bgw-prose dl>div{grid-template-columns:92px minmax(0,1fr)}}
`;
// @property rules are ignored inside shadow roots; register them once on the document (they only declare --x--- custom property names).
let propsDone = false;
function registerProps() { if (propsDone) return; propsDone = true; const m = (CSS_CORE + '\n' + CSS_RESET).match(/@property\s+[^{]+\{[^}]*\}/g) || []; const s = document.createElement('style'); s.id = 'bgw-ax-props'; s.textContent = m.join('\n'); document.head.appendChild(s); }
export function mount(host, el, extraCss) {
  registerProps();
  const sr = host.attachShadow({mode: 'open'});
  const st = document.createElement('style'); st.textContent = BASE_CSS + (extraCss || ''); sr.appendChild(st);
  const div = document.createElement('div'); sr.appendChild(div);
  createRoot(div).render(el);
  return sr;
}
export function globalCss(id, css) { if (document.getElementById(id)) return; const s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s); }
export function makeHost(id, before) { const h = document.createElement('div'); h.id = id; before.parentNode.insertBefore(h, before); return h; }
export const openAsk = (b, p) => { if (window.BGW_ASK_AX && window.BGW_ASK_AX.open) window.BGW_ASK_AX.open(b || '', p || ''); };
