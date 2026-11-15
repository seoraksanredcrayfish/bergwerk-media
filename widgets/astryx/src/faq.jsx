import {useMemo, useState} from 'react';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Badge} from '@astryxdesign/core/Badge';
import {TextInput} from '@astryxdesign/core/TextInput';
import {TabList, Tab} from '@astryxdesign/core/TabList';
import {Collapsible, CollapsibleGroup} from '@astryxdesign/core/Collapsible';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {P, isMob, openAsk} from './shared.jsx';

const Search = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
export function parseFaq(root) {
  const q = (s, r = root) => r.querySelector(s);
  return {
    title: (q('.h14-title') || {}).textContent || '도움말',
    intro: (q('.h14-intro') || {}).textContent || '',
    spec: [...root.querySelectorAll('.h14-spec li')].map(li => ({k: (q('.h14-spec__k', li) || {}).textContent || '', v: (q('.h14-spec__v', li) || {}).textContent || '', s: (q('.h14-spec__s', li) || {}).textContent || ''})),
    groups: [...root.querySelectorAll('.h14-group')].map(g => {
      const h = q('.h14-gh', g); const gn = h && q('.h14-gn', h); const title = h ? h.textContent.replace(gn ? gn.textContent : '', '').trim() : '';
      return {id: g.id || title, title, items: [...g.querySelectorAll('.h14-item')].map((it, i) => ({id: (g.id || title) + '-' + i, q: (q('.h14-qt', it) || {}).textContent || '', a: (q('.h14-a', it) || {}).innerHTML || '', policy: it.classList.contains('h14-item--policy')}))};
    }),
    foot: (q('.h14-foot') || {}).innerHTML || '',
  };
}
const plain = (h) => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent || ''; };
function Prose({html}) {
  return <div className="bgw-prose" dangerouslySetInnerHTML={{__html: html}} onClick={(e) => {
    const a = e.target.closest && e.target.closest('a'); if (!a) return;
    if (a.hasAttribute('data-bgw-ask-open')) { e.preventDefault(); openAsk(a.getAttribute('data-bgw-ask-open'), a.getAttribute('data-bgw-ask-product')); return; }
    const h = a.getAttribute('href'); if (h && h.charAt(0) === '/') { e.preventDefault(); location.href = P(h); }
  }} />;
}
export function Faq({d}) {
  const [qv, setQv] = useState(''); const [topic, setTopic] = useState('all');
  const mob = isMob();
  const norm = (s) => s.toLowerCase().replace(/\s+/g, '');
  const groups = useMemo(() => {
    const k = norm(qv);
    return d.groups.filter(g => topic === 'all' || g.id === topic || qv).map(g => ({...g, items: g.items.filter(it => !k || norm(it.q + plain(it.a)).includes(k))})).filter(g => g.items.length);
  }, [qv, topic]);
  const hits = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <VStack gap={6}>
      <TabList value="faq" onChange={() => {}} hasDivider={false}>
        <Tab value="faq" label="도움말" href={P('/faq.html')} />
        <Tab value="qa" label="문의" href={P('/board/product/list.html?board_no=6')} />
      </TabList>
      <VStack gap={2}><Heading level={1}>{d.title}</Heading><Text type="large" color="secondary">{d.intro}</Text></VStack>
      <TextInput label="도움말 검색" isLabelHidden placeholder="검색  예: 배송비, 반품, 적립금" value={qv} onChange={setQv} hasClear startIcon={<Search />} size="lg" />
      {qv ? <Text type="supporting" color="secondary">{hits ? '“' + qv + '” 검색 결과 ' + hits + '개' : ''}</Text> : null}
      {!qv && d.spec.length ? <VStack gap={3}>
        <Text type="supporting" weight="bold" color="secondary">한눈에 보기</Text>
        <div style={{display: 'grid', gridTemplateColumns: mob ? 'repeat(2, minmax(0,1fr))' : 'repeat(' + Math.min(5, d.spec.length) + ', minmax(0,1fr))', gap: 12}}>
          {d.spec.map(s => <Card key={s.k} padding={4} variant="muted"><VStack gap={1}><Text type="supporting" color="secondary">{s.k}</Text><Text type={mob ? 'large' : 'display-3'} weight="bold" hasTabularNumbers>{s.v}</Text><Text type="supporting" color="secondary">{s.s}</Text></VStack></Card>)}
        </div>
      </VStack> : null}
      {!qv ? <TabList value={topic} onChange={setTopic} overflow="scroll">
        <Tab value="all" label="전체" />
        {d.groups.map(g => <Tab key={g.id} value={g.id} label={g.title} />)}
      </TabList> : null}
      {groups.length ? groups.map(g => (
        <VStack key={g.id} gap={2}>
          <HStack gap={2} vAlign="center"><Heading level={3}>{g.title}</Heading><Badge variant="neutral" label={String(g.items.length)} /></HStack>
          <Card padding={0}><div style={{padding: '4px 16px'}}>
            <CollapsibleGroup type="multiple"><div className="bgw-acc">
              {g.items.map(it => <div key={it.id}><Collapsible value={it.id} trigger={<Text type="body" weight={it.policy ? 'normal' : 'semibold'} color={it.policy ? 'secondary' : 'primary'}>{it.q}</Text>}><div style={{padding: '0 0 16px'}}><Prose html={it.a} /></div></Collapsible></div>)}
            </div></CollapsibleGroup>
          </div></Card>
        </VStack>)) : <EmptyState title="찾는 답이 없어요" description="문의를 남겨 주시면 확인해서 답해 드려요." actions={<Button label="문의하기" variant="primary" onClick={() => openAsk('6', '')} />} />}
      <Card padding={5} variant="muted"><HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
        <VStack gap={1}><Text type="large" weight="bold">찾는 답이 없나요?</Text><Prose html={d.foot} /></VStack>
        <Button label="문의하기" variant="primary" onClick={() => openAsk('6', '')} />
      </HStack></Card>
    </VStack>
  );
}
