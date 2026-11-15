import {useEffect, useRef, useState} from 'react';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {HStack, VStack, StackItem} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Badge} from '@astryxdesign/core/Badge';
import {Link} from '@astryxdesign/core/Link';
import {Divider} from '@astryxdesign/core/Divider';
import {TextInput} from '@astryxdesign/core/TextInput';
import {TextArea} from '@astryxdesign/core/TextArea';
import {CheckboxInput} from '@astryxdesign/core/CheckboxInput';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {TabList, Tab} from '@astryxdesign/core/TabList';
import {Pagination} from '@astryxdesign/core/Pagination';
import {Collapsible} from '@astryxdesign/core/Collapsible';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {AspectRatio} from '@astryxdesign/core/AspectRatio';
import {P, isMob, openAsk, useMobile} from './shared.jsx';

const Lock = () => (<svg width="12" height="12" viewBox="0 0 12 12" aria-label="비밀글" role="img" style={{color: 'var(--color-icon-secondary, #888)', flex: '0 0 12px'}}><rect x="2" y="5.2" width="8" height="5.8" rx="1.2" fill="currentColor"/><path d="M3.8 5.2V3.8a2.2 2.2 0 0 1 4.4 0v1.4" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>);
const Search = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);

function Nav({cur}) {
  return (<TabList value={cur} onChange={() => {}} hasDivider={false}>
    <Tab value="faq" label="도움말" href={P('/faq.html')} />
    <Tab value="qa" label="문의" href={P('/board/product/list.html?board_no=6')} />
  </TabList>);
}
export function parseQaList(host) {
  const rows = [...host.querySelectorAll('.ec-base-table.typeList tbody tr')].map(tr => {
    const a = tr.querySelector('td.subject a[href*="/article/"]'); if (!a) return null;
    const g = (c) => (tr.querySelector('td.' + c) || {}).textContent || '';
    return {title: a.textContent.trim(), href: a.getAttribute('href'), lock: !!tr.querySelector('img[alt="비밀글"], .bgw-qa-lock'), writer: g('bgw-qa-writer').trim(), date: g('q14-date').trim(), state: g('bgw-qa-state').trim()};
  }).filter(Boolean);
  const types = [...host.querySelectorAll('.q14-types a')].map(a => ({label: a.textContent.trim(), href: a.getAttribute('href'), cur: a.hasAttribute('aria-current')}));
  let last = 1, cur = 1, hasMore = false;
  host.querySelectorAll('.ec-base-paginate a, .ec-list-paginate a').forEach(a => { const n = +a.textContent.trim(); const p = +((a.getAttribute('href') || '').match(/[?&]page=(\d+)/) || [])[1] || 0;
    if (n) { if (n > last) last = n; if (/this/.test(a.className)) cur = n; } else if (/next/i.test(a.textContent) && p > last) hasMore = true; });
  const sp = new URLSearchParams(location.search);
  return {rows, types, last, cur, hasMore, q: sp.get('search') || '', key: sp.get('search_key') || 'content', intro: (host.querySelector('.q14-intro') || {}).textContent || ''};
}
export function QaList({d}) {
  const mob = useMobile();
  const [q, setQ] = useState(/ 문의$/.test(d.q) ? '' : d.q);
  const go = (search) => { const u = new URL(location.href); u.search = '?board_no=6' + (search ? '&search_date=all&search_key=content&search=' + encodeURIComponent(search) : ''); location.href = u.toString(); };
  const curType = (d.types.find(t => t.cur) || {}).label || '전체';
  const pageUrl = (p) => { const u = new URL(location.href); u.searchParams.set('page', p); return u.toString(); };
  return (
    <VStack gap={6}>
      <Nav cur="qa" />
      <HStack gap={4} vAlign="end" hAlign="between" wrap="wrap">
        <VStack gap={2}><Heading level={1}>문의</Heading><Text type="large" color="secondary">{d.intro}</Text></VStack>
        <HStack gap={2}><Button label="내 문의 보기" variant="ghost" href={P('/myshop/board_list.html')} /><Button label="문의하기" variant="primary" onClick={() => openAsk('6', '')} /></HStack>
      </HStack>
      <form onSubmit={(e) => { e.preventDefault(); go(q.trim()); }}>
        <TextInput label="문의 검색" isLabelHidden placeholder="문의 검색" value={q} onChange={setQ} hasClear startIcon={<Search />} size="lg" onEnter={() => go(q.trim())} />
      </form>
      <TabList value={curType} onChange={() => {}} overflow="scroll">
        {d.types.map(t => <Tab key={t.label} value={t.label} label={t.label} href={t.href} />)}
      </TabList>
      {d.rows.length ? <Card padding={0}><VStack gap={0}>
        {d.rows.map((r, i) => (
          <div key={r.href + i} style={{borderTop: i ? '1px solid var(--color-border-subtle, #eee)' : 0, padding: mob ? '14px 16px' : '16px 20px'}}>
            <HStack gap={3} vAlign="center" wrap={mob ? 'wrap' : 'nowrap'}>
              <StackItem size="fill"><HStack gap={2} vAlign="center">{r.lock ? <Lock /> : null}<Link href={r.href} type="body" weight="medium" color="primary">{r.title}</Link></HStack></StackItem>
              <Text type="supporting" color="secondary" hasTabularNumbers>{r.writer + '  ·  ' + r.date}</Text>
              <Badge variant={/완료/.test(r.state) ? 'success' : 'neutral'} label={r.state || '답변 대기'} />
            </HStack>
          </div>))}
      </VStack></Card> : <EmptyState title="문의가 없어요" description="궁금한 점을 남겨 주세요." actions={<Button label="문의하기" variant="primary" onClick={() => openAsk('6', '')} />} />}
      {d.last > 1 || d.hasMore ? <HStack hAlign="center"><Pagination page={d.cur} totalPages={d.hasMore ? undefined : d.last} hasMore={d.hasMore} onChange={(p) => { location.href = pageUrl(p); }} /></HStack> : null}
    </VStack>
  );
}

/* ---- Q&A write: Astryx form that fills and submits the real Cafe24 form (modules stay in place) ---- */
export function parseQaWrite() {
  const f = document.getElementById('boardWriteForm'); if (!f) return null;
  const vis = (id) => { const e = document.getElementById(id); if (!e) return false; const tr = e.closest('tr') || e; return getComputedStyle(tr).display !== 'none' && !/displaynone/.test(tr.className); };
  const sel = document.getElementById('subject');
  const pb = document.querySelector('.ec-base-box.typeProduct'); const pn = pb && pb.querySelector('h3, .name'); const pi = pb && pb.querySelector('img');
  const pno = (document.getElementById('product_no') || {}).value || '';
  const agree = document.getElementById('privacy_agreement_radio0'); const agreeTr = agree && agree.closest('tr');
  return {
    types: sel && sel.tagName === 'SELECT' ? [...sel.options].filter(o => o.value).map(o => ({v: o.value, label: o.text.replace(/\s*문의$/, '')})) : [],
    writer: vis('writer'), password: vis('password'), captcha: vis('captcha'), privacy: !!(agree && vis('privacy_agreement_radio0')),
    privacyText: agreeTr ? (agreeTr.querySelector('td') || agreeTr).innerText.trim() : '',
    product: pno && pn && pn.textContent.trim() ? {name: pn.textContent.trim(), img: pi ? pi.src : ''} : null,
    board: (location.search.match(/[?&]board_no=(\d+)/) || [])[1] || '6',
  };
}
function captchaData() { const src = document.querySelector('img[id^="captcha_"]'); if (!src || !src.naturalWidth) return ''; try { const c = document.createElement('canvas'); c.width = src.naturalWidth; c.height = src.naturalHeight; c.getContext('2d').drawImage(src, 0, 0); return c.toDataURL('image/png'); } catch (e) { return src.src; } }
const nl2p = (t) => t.split(/\n{2,}/).map(p => '<p>' + p.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])).replace(/\n/g, '<br>') + '</p>').join('');
export function QaWrite({d}) {
  const draft = useRef(null);
  if (draft.current === null) { draft.current = {}; try { const dr = JSON.parse(localStorage.getItem('bgwAskDraft') || 'null'); if (dr && String(dr.board) === String(d.board) && Date.now() - (dr.ts || 0) < 2 * 3600 * 1000) { draft.current = dr; localStorage.removeItem('bgwAskDraft'); } } catch (e) {} }
  const [type, setType] = useState(draft.current.subject || (d.product ? (d.types.find(t => /상품/.test(t.label)) || {}).v : '') || '');
  const [name, setName] = useState(''); const [pw, setPw] = useState(''); const [body, setBody] = useState(draft.current.text || '');
  const [cap, setCap] = useState(''); const [capImg, setCapImg] = useState(''); const [agree, setAgree] = useState(false);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const refreshCap = () => { const img = document.querySelector('img[id^="captcha_"]'); if (!img) return; img.addEventListener('load', () => setCapImg(captchaData()), {once: true}); if (window.BOARD && window.BOARD.refresh_captcha) window.BOARD.refresh_captcha('Write', ''); else img.src = img.src.replace(/&_t=\d+|$/, '&_t=' + Date.now()); };
  useEffect(() => { if (d.captcha) refreshCap(); }, []);
  const missing = !type ? '문의 종류를 골라 주세요.' : (d.writer && !name.trim()) ? '이름을 적어 주세요.' : (d.password && !pw) ? '비밀번호를 적어 주세요.' : !body.trim() ? '문의 내용을 적어 주세요.' : (d.captcha && !cap.trim()) ? '보안문자를 적어 주세요.' : (d.privacy && !agree) ? '개인정보 수집·이용에 동의해 주세요.' : '';
  const submit = () => {
    if (missing) { setErr(missing); return; } setErr(''); setBusy(true);
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
    const sel = document.getElementById('subject'); if (sel) { sel.value = type; try { if (window.EC$) window.EC$(sel).trigger('change'); else sel.dispatchEvent(new Event('change', {bubbles: true})); } catch (e) {} }
    const html = nl2p(body.trim()); let ok = false; try { ok = window.applyContentToFroala(html) !== false; } catch (e) {} if (!ok) { try { window.EC_FROALA_INSTANCE.html.set(html); } catch (e) {} } set('content', html);
    if (d.writer) set('writer', name.trim()); if (d.password) set('password', pw); if (d.captcha) set('captcha', cap.trim());
    const pa = document.getElementById('privacy_agreement_radio0'); if (pa) pa.checked = agree;
    const s1 = document.getElementById('secure1'); if (s1) s1.checked = true;
    const realAlert = window.alert; window.alert = (m) => { setErr(String(m || '')); setBusy(false); };
    try { window.BOARD_WRITE.is_submitting = false; window.BOARD_WRITE.form_submit('boardWriteForm'); } catch (e) { setErr('등록 중 오류가 났어요. 잠시 후 다시 시도해 주세요.'); setBusy(false); }
    setTimeout(() => { window.alert = realAlert; }, 4000);
  };
  window.__bgwQaWriteDryRun = () => ({type, name, body, cap, agree, missing});
  return (
    <VStack gap={6}>
      <Nav cur="qa" />
      <VStack gap={2}><Heading level={1}>문의 남기기</Heading><Text type="large" color="secondary">비밀글로 등록돼 작성자와 관리자만 볼 수 있어요.</Text></VStack>
      <Card padding={6}><VStack gap={5}>
        {d.product ? <HStack gap={3} vAlign="center">{d.product.img ? <div style={{width: 56, flex: '0 0 56px', borderRadius: 8, overflow: 'hidden'}}><AspectRatio ratio={1}><img className="bgw-img" src={d.product.img} alt="" /></AspectRatio></div> : null}<VStack gap={1}><Text type="supporting" color="secondary">문의할 상품</Text><Text type="body" weight="bold">{d.product.name}</Text></VStack></HStack> : null}
        {d.types.length ? <VStack gap={2}><Text type="body" weight="bold">문의 종류</Text><HStack gap={2} wrap="wrap">{d.types.map(t => <Button key={t.v} label={t.label} size="md" variant={type === t.v ? 'primary' : 'secondary'} onClick={() => setType(t.v)} />)}</HStack></VStack> : null}
        {d.writer || d.password ? <HStack gap={3} wrap="wrap">
          {d.writer ? <StackItem size="fill"><TextInput label="이름" value={name} onChange={setName} autoComplete="name" /></StackItem> : null}
          {d.password ? <StackItem size="fill"><TextInput label="비밀번호" placeholder="답변 확인용" type="password" value={pw} onChange={setPw} autoComplete="new-password" /></StackItem> : null}
        </HStack> : null}
        <TextArea label="문의 내용" placeholder="주문번호와 함께 적어 주시면 더 빨리 확인해 드려요." value={body} onChange={setBody} rows={8} maxLength={2000} />
        {d.captcha ? <VStack gap={2}><Text type="body" weight="bold">보안문자</Text><HStack gap={3} vAlign="center" wrap="wrap">
          {capImg ? <img src={capImg} alt="보안문자" style={{height: 40, borderRadius: 8, border: '1px solid var(--color-border-subtle, #e5e5e5)'}} /> : null}
          <StackItem size="fill"><TextInput label="보안문자 입력" isLabelHidden placeholder="보이는 글자 입력" value={cap} onChange={setCap} autoComplete="off" /></StackItem>
          <Button label="새로고침" variant="secondary" onClick={refreshCap} />
        </HStack></VStack> : null}
        {d.privacy ? <VStack gap={2}><CheckboxInput label="개인정보 수집·이용에 동의합니다 (필수)" value={agree} onChange={setAgree} />
          <Collapsible trigger={<Text type="supporting" color="secondary">내용 보기</Text>}><Text type="supporting" color="secondary" style={{whiteSpace: 'pre-line'}}>{d.privacyText}</Text></Collapsible></VStack> : null}
        {err ? <Text type="body" color="error">{err}</Text> : null}
        <Divider />
        <HStack gap={2} hAlign="end"><Button label="취소" variant="secondary" href={P('/board/product/list.html?board_no=' + d.board)} /><Button label="등록" variant="primary" isLoading={busy} onClick={submit} /></HStack>
      </VStack></Card>
    </VStack>
  );
}
