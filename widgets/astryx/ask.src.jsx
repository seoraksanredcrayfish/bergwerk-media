// BGW ask widget on Astryx (Meta, MIT). UI = Astryx components only. Glue = bot fetch + draft handoff.
import {createRoot} from 'react-dom/client';
import {useEffect, useRef, useState} from 'react';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {VStack} from '@astryxdesign/core/VStack';
import {IconButton} from '@astryxdesign/core/IconButton';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import CSS_CORE from '@astryxdesign/core/astryx.css';
import CSS_THEME from '@astryxdesign/theme-neutral/theme.css';
import {ChatComposer, ChatMessageList, ChatMessage, ChatMessageBubble, ChatTokenizedText, ChatSystemMessage} from '@astryxdesign/core/Chat';

const ACCENT = '#0284c7';
const Spark = ({size = 16}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{color: ACCENT, flex: '0 0 auto'}}><path fill="currentColor" d="M11 22C11 18.8118 10.3312 16.7445 9.11816 15.4639C7.91652 14.1955 5.98995 13.5 3 13.5C2.44772 13.5 2 13.0523 2 12.5C2 11.9477 2.44772 11.5 3 11.5C5.98995 11.5 7.91652 10.8045 9.11816 9.53613C10.3312 8.25552 11 6.18819 11 3C11 2.44772 11.4477 2 12 2C12.5523 2 13 2.44772 13 3C13 6.18819 13.6688 8.25552 14.8818 9.53613C16.0835 10.8045 18.01 11.5 21 11.5C21.5523 11.5 22 11.9477 22 12.5C22 13.0523 21.5523 13.5 21 13.5C18.01 13.5 16.0835 14.1955 14.8818 15.4639C13.6688 16.7445 13 18.8118 13 22C13 22.5523 12.5523 23 12 23C11.4477 23 11 22.5523 11 22ZM12 8.72559C11.6348 9.55269 11.1639 10.2845 10.5693 10.9121C9.93684 11.5796 9.19236 12.1027 8.34473 12.5C9.19235 12.8973 9.93684 13.4204 10.5693 14.0879C11.1637 14.7153 11.6348 15.4467 12 16.2734C12.3652 15.4467 12.8363 14.7153 13.4307 14.0879C14.063 13.4206 14.807 12.8972 15.6543 12.5C14.807 12.1028 14.063 11.5794 13.4307 10.9121C12.8361 10.2845 12.3652 9.55269 12 8.72559Z"/></svg>);
const Back = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const SUGS = ['주문한 상품은 언제 출고되나요?', '교환·반품은 언제까지 신청할 수 있나요?', '품절된 상품은 다시 들어오나요?'];
const DRAFT_KEY = 'bgwAskDraft';

function cfg() {
  const c = document.getElementById('bgw-ask-config');
  let bot = (c && c.getAttribute('data-bot')) || 'off';
  if (bot === 'off') bot = 'https://agent.bergwerkseoul.com';
  if (bot === 'none' || /[?&]bgw_bot=off/.test(location.search)) bot = '';
  return {bot: bot.replace(/\/$/, ''), board: String((c && c.getAttribute('data-board')) || '6'), write: (c && c.getAttribute('data-write-path')) || '/board/product/write.html'};
}
function fetchT(url, opt, ms) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  return fetch(url, {...opt, signal: ac.signal}).finally(() => clearTimeout(t));
}

function Ask({api}) {
  const C = useRef(cfg()).current;
  const [open, setOpen] = useState(false);
  const [board, setBoard] = useState(C.board);
  const [product, setProduct] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [botUp, setBotUp] = useState(null);
  const [draft, setDraft] = useState('');
  const sid = useRef(null), lastQ = useRef('');

  const msgsRef = useRef(msgs); msgsRef.current = msgs;
  const reset = () => { setMsgs([]); setDraft(''); sid.current = null; };
  const close = () => { if (history.state && history.state.bgwAsk) history.back(); else setOpen(false); };
  useEffect(() => {
    api.open = (b, p) => { if (b) setBoard(String(b)); setProduct(p ? String(p) : ''); setOpen(true); try { history.pushState({bgwAsk: 1}, ''); } catch (e) {} };
    api.close = close;
    const onPop = () => { setOpen(false); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    if (!open || botUp !== null) return;
    if (!C.bot) { setBotUp(false); return; }
    fetchT(C.bot + '/v1/health', {method: 'GET'}, 8000).then(r => r.json()).then(j => setBotUp(!!(j && j.ok && j.up))).catch(() => setBotUp(false));
  }, [open]);

  const toQa = (text) => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({board, product, subject: '', text: text || '', ts: Date.now()})); } catch (e) {}
    const pre = (location.pathname.match(/^\/skin-[^/]+/) || [''])[0];
    location.href = pre + C.write + '?board_no=' + board + (product ? '&product_no=' + product : '');
  };
  const ask = (q) => {
    q = (q || '').trim(); if (!q || busy) return;
    lastQ.current = q; setDraft('');
    setMsgs(m => [...m, {who: 'user', text: q}]);
    if (!botUp) { setMsgs(m => [...m, {who: 'system', text: '지금은 자동 답변을 쓸 수 없어요. Q&A로 남겨 주세요.', handoff: q}]); return; }
    setBusy(true);
    const pno = (document.querySelector('meta[property="product:productId"]') || {}).content || (location.search.match(/product_no=(\d+)/) || [])[1] || product || null;
    fetchT(C.bot + '/v1/ask', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({q, sid: sid.current, path: location.pathname, product_no: pno})}, 65000)
      .then(r => r.json())
      .then(j => {
        if (j && j.ok && j.answer) { sid.current = j.sid || sid.current; setMsgs(m => [...m, {who: 'assistant', text: j.answer, handoff: q}]); }
        else setMsgs(m => [...m, {who: 'system', text: (j && j.message) || '자동 답변으로 해결하기 어려운 문의예요. Q&A로 남겨 주세요.', handoff: q}]);
      })
      .catch(() => setMsgs(m => [...m, {who: 'system', text: '답변이 늦어지고 있어요. Q&A로 남겨 주세요.', handoff: q}]))
      .finally(() => setBusy(false));
  };

  const empty = (
    <EmptyState icon={<Spark size={28} />} title="무엇을 도와드릴까요?" description="주문·배송·교환, 편하게 물어보세요."
      actions={<VStack gap={1}>{SUGS.map(s => <Button key={s} variant="ghost" label={s} onClick={() => ask(s)} />)}</VStack>} />
  );
  return (
    <Theme theme={neutralTheme}>
      <Dialog isOpen={open} onOpenChange={(v) => { if (!v) close(); }} width={680} maxHeight={700} purpose="info">
        <div className="bgw-ax" style={{display: 'flex', flexDirection: 'column', height: 'min(700px, calc(100dvh - 32px))'}}>
          <DialogHeader
            title={<span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}><Spark />문의하기</span>}
            subtitle="자주 묻는 질문으로 먼저 답해 드려요."
            startContent={msgs.length ? <IconButton label="처음으로" icon={<Back />} variant="ghost" onClick={reset} /> : null}
            onOpenChange={(v) => { if (!v) close(); }} />
          <div style={{flex: '1 1 auto', minHeight: 0, overflow: 'auto', margin: '12px 0'}}>
            {msgs.length === 0 ? empty : <ChatMessageList isStreaming={busy} align="bottom">
              {msgs.map((m, i) => m.who === 'system'
                ? <ChatSystemMessage key={i}>{m.text}</ChatSystemMessage>
                : <ChatMessage key={i} sender={m.who}>
                    <ChatMessageBubble><ChatTokenizedText>{m.text}</ChatTokenizedText></ChatMessageBubble>
                    {m.who !== 'user' && m.handoff ? <Button variant="secondary" size="sm" label="Q&A로 남기기" onClick={() => toQa(m.handoff)} /> : null}
                  </ChatMessage>)}
              {msgs.length && msgs[msgs.length - 1].who === 'system' && msgs[msgs.length - 1].handoff
                ? <Button variant="secondary" size="sm" label="Q&A로 남기기" onClick={() => toQa(msgs[msgs.length - 1].handoff)} /> : null}
            </ChatMessageList>}
          </div>
          <ChatComposer value={draft} onChange={setDraft} onSubmit={ask} placeholder="베르크서울에 대해 물어보세요…" isDisabled={busy}
            footerActions={<Text size="sm" color="secondary">{botUp === false ? '비밀글 Q&A로 이어서 남길 수 있어요' : '답이 부족하면 Q&A로 남길 수 있어요'}</Text>} />
          <Text size="sm" color="secondary" justify="center">자동 답변은 틀릴 수 있어요. 카드번호 같은 개인정보는 적지 마세요.</Text>
        </div>
      </Dialog>
    </Theme>
  );
}

(function mount() {
  if (window.BGW_ASK_AX) return;
  const api = {}; window.BGW_ASK_AX = api;
  const host = document.createElement('div'); host.id = 'bgw-ask-ax'; document.body.appendChild(host);
  const sr = host.attachShadow({mode: 'open'});
  const st = document.createElement('style'); st.textContent = CSS_CORE.replace(/:root\b/g, ':host') + '\n' + CSS_THEME.replace(/:root\b/g, ':host') + '\n:host{all:initial}\n[data-astryx-theme],:host{--color-accent:#0284c7;--color-on-accent:#ffffff;--color-text-accent:#0284c7;--color-icon-accent:#0284c7;--color-border-focus:#0284c7}'; sr.appendChild(st);
  const mountEl = document.createElement('div'); sr.appendChild(mountEl);
  createRoot(mountEl).render(<Ask api={api} />);
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-bgw-ask-open], .bgw-qa-ask, .bgw-help__ask');
    if (!t) return; e.preventDefault(); e.stopImmediatePropagation();
    const b = t.getAttribute('data-bgw-ask-open'); const p = t.getAttribute('data-bgw-ask-product');
    api.open && api.open(/^\d+$/.test(b || '') ? b : '', /^\d{1,9}$/.test(p || '') ? p : '');
  }, true);
})();
