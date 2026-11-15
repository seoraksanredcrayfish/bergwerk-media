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
import {EmptyState} from '@astryxdesign/core/EmptyState';
import CSS_CORE from '@astryxdesign/core/astryx.css';
import CSS_THEME from '@astryxdesign/theme-neutral/theme.css';
import {ChatComposer, ChatMessageList, ChatMessage, ChatMessageBubble, ChatTokenizedText, ChatSystemMessage} from '@astryxdesign/core/Chat';

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

  useEffect(() => { api.open = (b, p) => { if (b) setBoard(String(b)); setProduct(p ? String(p) : ''); setOpen(true); }; api.close = () => setOpen(false); }, []);
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
    <EmptyState title="무엇을 도와드릴까요?" description="주문·배송·교환, 편하게 물어보세요."
      actions={<VStack gap={1}>{SUGS.map(s => <Button key={s} variant="ghost" label={s} onClick={() => ask(s)} />)}</VStack>} />
  );
  return (
    <Theme theme={neutralTheme}>
      <Dialog isOpen={open} onOpenChange={setOpen} width={680} maxHeight={700} purpose="info">
        <div className="bgw-ax" style={{display: 'flex', flexDirection: 'column', height: 'min(700px, calc(100dvh - 32px))'}}>
          <DialogHeader title="문의하기" subtitle="자주 묻는 질문으로 먼저 답해 드려요." onOpenChange={setOpen} />
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
  const st = document.createElement('style'); st.textContent = CSS_CORE.replace(/:root\b/g, ':host') + '\n' + CSS_THEME.replace(/:root\b/g, ':host') + '\n:host{all:initial}'; sr.appendChild(st);
  const mountEl = document.createElement('div'); sr.appendChild(mountEl);
  createRoot(mountEl).render(<Ask api={api} />);
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-bgw-ask-open], .bgw-qa-ask, .bgw-help__ask');
    if (!t) return; e.preventDefault(); e.stopImmediatePropagation();
    const b = t.getAttribute('data-bgw-ask-open'); const p = t.getAttribute('data-bgw-ask-product');
    api.open && api.open(/^\d+$/.test(b || '') ? b : '', /^\d{1,9}$/.test(p || '') ? p : '');
  }, true);
})();
