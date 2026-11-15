import {useEffect, useMemo, useState} from 'react';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {IconButton} from '@astryxdesign/core/IconButton';
import {HStack, VStack, StackItem} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Badge} from '@astryxdesign/core/Badge';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Link} from '@astryxdesign/core/Link';
import {AspectRatio} from '@astryxdesign/core/AspectRatio';
import {Divider} from '@astryxdesign/core/Divider';
import {Skeleton} from '@astryxdesign/core/Skeleton';
import {Pagination} from '@astryxdesign/core/Pagination';
import {P, isMob, openAsk} from './shared.jsx';
import {SRC, shortDate, loadAll, loadMany} from './reviewdata.js';

const Chev = ({d}) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={d === 'l' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
export const srcLabel = (it) => SRC[it.source] || SRC.bergwerk;
const metaLine = (it) => [it.option, it.body].filter(Boolean).join(' · ');
function useMobile() { const [m, setM] = useState(isMob()); useEffect(() => { const f = () => setM(isMob()); addEventListener('resize', f); return () => removeEventListener('resize', f); }, []); return m; }

/* ---- card popup (same screen, no page move) ---- */
export function ReviewDialog({items, index, onClose, onIndex}) {
  const mob = useMobile();
  const it = items[index]; const [mi, setMi] = useState(0);
  useEffect(() => setMi(0), [index]);
  useEffect(() => { if (it) { try { history.pushState({bgwRv: 1}, ''); } catch (e) {} const pop = () => onClose(true); addEventListener('popstate', pop); return () => removeEventListener('popstate', pop); } }, [!!it]);
  const close = () => { if (history.state && history.state.bgwRv) history.back(); else onClose(); };
  if (!it) return null;
  const media = it.media || [];
  return (
    <Dialog isOpen onOpenChange={(v) => { if (!v) close(); }} width={mob ? '100%' : 980} maxHeight={mob ? '100%' : 720} padding={0}>
      <div style={{display: 'grid', gridTemplateColumns: !mob && media.length ? 'minmax(0,1.25fr) minmax(0,1fr)' : '1fr', height: mob ? '100dvh' : 'min(720px, 88vh)', overflow: mob ? 'auto' : 'hidden'}}>
        {media.length ? (
          <div style={{position: 'relative', background: 'var(--color-background-muted, #f4f4f4)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: mob ? 320 : 0}}>
            <img src={media[mi]} alt="" style={{display: 'block', maxWidth: '100%', maxHeight: mob ? '70vh' : '100%', objectFit: 'contain'}} />
            {media.length > 1 ? <>
              <div style={{position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)'}}><IconButton label="이전 사진" icon={<Chev d="l" />} variant="secondary" isDisabled={mi === 0} onClick={() => setMi(mi - 1)} /></div>
              <div style={{position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)'}}><IconButton label="다음 사진" icon={<Chev d="r" />} variant="secondary" isDisabled={mi === media.length - 1} onClick={() => setMi(mi + 1)} /></div>
              <div style={{position: 'absolute', left: 12, bottom: 12}}><Badge variant="neutral" label={(mi + 1) + ' / ' + media.length} /></div>
            </> : null}
          </div>) : null}
        <div style={{display: 'flex', flexDirection: 'column', minHeight: 0, order: mob ? -1 : 0}}>
          <DialogHeader title={<HStack gap={2} vAlign="center"><Avatar name={it.author || '구매자'} size="sm" /><span>{it.author || '구매자'}</span></HStack>}
            subtitle={shortDate(it.date)} onOpenChange={(v) => { if (!v) close(); }} hasDivider />
          <div style={{flex: '1 1 auto', minHeight: 0, overflow: 'auto', padding: 'var(--spacing-5, 20px)'}}>
            <VStack gap={3}>
              <HStack gap={2} wrap="wrap"><Badge variant="info" label={srcLabel(it)} />{it.option ? <Badge variant="neutral" label={it.option} /> : null}{it.body ? <Badge variant="neutral" label={it.body} /> : null}</HStack>
              {it.pname ? <Text type="supporting" color="secondary">{it.pname}</Text> : null}
              <Text type="body" style={{whiteSpace: 'pre-line'}}>{it.loaded ? it.text : '불러오는 중…'}</Text>
            </VStack>
          </div>
          <Divider />
          <HStack gap={2} vAlign="center" hAlign="between" style={{padding: '12px var(--spacing-5, 20px)'}}>
            <Button label="이전 리뷰" variant="secondary" size="sm" isDisabled={index === 0} onClick={() => onIndex(index - 1)} />
            <Text type="supporting" color="secondary" hasTabularNumbers>{(index + 1) + ' / ' + items.length}</Text>
            <Button label="다음 리뷰" variant="secondary" size="sm" isDisabled={index === items.length - 1} onClick={() => onIndex(index + 1)} />
          </HStack>
        </div>
      </div>
    </Dialog>
  );
}

export function PhotoTile({it, onOpen, plus, ratio = 3 / 4, caption}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 6, width: '100%', minWidth: 0}}>
      <button type="button" className="bgw-tile" style={{width: '100%'}} onClick={onOpen} aria-label={plus ? '사진 리뷰 전체 보기' : '사진 리뷰 보기'}>
        <div style={{aspectRatio: String(ratio), width: '100%'}}><img className="bgw-img" src={it.media[0]} alt="" loading="lazy" style={{objectPosition: '50% 30%'}} /></div>
        {plus ? <span className="bgw-plus"><span style={{fontSize: 22}}>{'+' + plus}</span><span style={{fontSize: 13, fontWeight: 500}}>사진 전체</span></span> : null}
      </button>
      {caption !== false ? <Text type="supporting" color="secondary" maxLines={1}>{caption || it.body || metaLine(it) || shortDate(it.date)}</Text> : null}
    </div>
  );
}

export function ReviewCard({it, onOpen, hideProduct}) {
  return (
    <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }} style={{cursor: 'pointer'}}>
      <Card padding={4}>
        <HStack gap={3} vAlign="start">
          <StackItem size="fill">
            <VStack gap={2}>
              <HStack gap={2} vAlign="center" wrap="wrap">
                <Avatar name={it.author || '구매자'} size="sm" />
                <Text type="body" weight="bold">{it.author || '구매자'}</Text>
                <Text type="supporting" color="secondary">{shortDate(it.date)}</Text>
                <Badge variant={it.source === 'zigzag' ? 'info' : 'neutral'} label={srcLabel(it)} />
              </HStack>
              {metaLine(it) ? <Text type="supporting" color="secondary" maxLines={1}>{metaLine(it)}</Text> : null}
              {it.pname && !hideProduct ? <Text type="supporting" color="secondary" maxLines={1}>{it.pname}</Text> : null}
              <Text type="body" maxLines={3}>{it.text}</Text>
            </VStack>
          </StackItem>
          {it.media && it.media[0] ? <div style={{width: 72, flex: '0 0 72px', borderRadius: 'var(--radius-element, 8px)', overflow: 'hidden'}}><AspectRatio ratio={1}><img className="bgw-img" src={it.media[0]} alt="" loading="lazy" /></AspectRatio></div> : null}
        </HStack>
      </Card>
    </div>
  );
}

/* ---- product detail review section ---- */
export function DetailReviews({pno}) {
  const mob = useMobile();
  const [items, setItems] = useState(null); const [rows, setRows] = useState(5); const [gridOpen, setGridOpen] = useState(false);
  const [dlg, setDlg] = useState(null);
  const upd = (o) => setItems(cur => cur ? cur.map(x => x.no === o.no ? o : x) : cur);
  useEffect(() => { loadAll(pno).then(all => { setItems(all); const firstPhotos = all.filter(x => x.hasFile).slice(0, mob ? 8 : 12); return Promise.all([loadMany(firstPhotos, upd), loadMany(all.filter(x => !x.hasFile).slice(0, 5), upd, 2)]); }).catch(() => setItems([])); }, [pno]);
  const photos = useMemo(() => (items || []).filter(x => x.loaded && !x.failed && x.media.length), [items]);
  const photoTotal = (items || []).filter(x => x.hasFile).length;
  useEffect(() => { if (items) loadMany(items.slice(0, rows), upd, 3); }, [rows, !!items]);
  useEffect(() => { if (gridOpen && items) loadMany(items.filter(x => x.hasFile), upd, 4); }, [gridOpen]);
  const N = mob ? 6 : 6, heroN = gridOpen ? photos.length : Math.min(N, photos.length);
  const writeHref = P('/board/product/write.html?board_no=4&product_no=' + pno);
  const listHref = P('/board/product/list.html?board_no=6&link_product_no=' + pno);
  if (items && !items.length) return (
    <VStack gap={4}>
      <HStack vAlign="center" hAlign="between"><Heading level={2}>리뷰</Heading><Button label="리뷰 쓰기" variant="secondary" href={writeHref} /></HStack>
      <Card padding={5}><Text type="body" color="secondary">아직 리뷰가 없어요. 첫 리뷰를 남겨 주세요.</Text></Card>
      <QnaCta pno={pno} listHref={listHref} />
    </VStack>);
  return (
    <VStack gap={5}>
      <HStack vAlign="center" hAlign="between" gap={3}>
        <HStack gap={2} vAlign="baseline"><Heading level={2}>리뷰</Heading>{items ? <Text type="large" color="secondary" hasTabularNumbers>{items.length}</Text> : null}{photoTotal ? <Badge variant="neutral" label={'사진 ' + photoTotal} /> : null}</HStack>
        <Button label="리뷰 쓰기" variant="secondary" href={writeHref} />
      </HStack>
      {!items ? <Grid columns={mob ? 3 : 6} gap={2}>{[...Array(6)].map((_, i) => <AspectRatio key={i} ratio={3 / 4}><Skeleton width="100%" height="100%" /></AspectRatio>)}</Grid> : null}
      {photos.length ? (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(' + (mob ? 3 : 6) + ', minmax(0,1fr))', gap: mob ? '12px 6px' : '16px 8px', alignItems: 'start'}}>
          {photos.slice(0, heroN).map((it, i) => {
            const isLast = !gridOpen && i === heroN - 1 && photoTotal > heroN;
            return <PhotoTile key={it.no} it={it} plus={isLast ? photoTotal - heroN + 1 : 0} onOpen={() => isLast ? setGridOpen(true) : setDlg({list: photos, i})} />;
          })}
        </div>) : null}
      {gridOpen && photos.length < photoTotal ? <HStack hAlign="center"><Text type="supporting" color="secondary">사진을 불러오는 중… {photos.length} / {photoTotal}</Text></HStack> : null}
      {items && items.length ? <VStack gap={3}>
        <Grid columns={{minWidth: mob ? 260 : 420, repeat: 'fill'}} gap={3}>
          {items.slice(0, rows).map((it, i) => <ReviewCard key={it.no} it={it} hideProduct onOpen={() => setDlg({list: items, i})} />)}
        </Grid>
        {rows < items.length ? <HStack hAlign="center"><Button label={'리뷰 더 보기 (' + (items.length - rows) + ')'} variant="secondary" onClick={() => setRows(rows + 10)} /></HStack> : null}
      </VStack> : null}
      <QnaCta pno={pno} listHref={listHref} />
      {dlg ? <ReviewDialog items={dlg.list} index={dlg.i} onIndex={(i) => { setDlg({...dlg, i}); loadMany([dlg.list[i]], upd); }} onClose={() => setDlg(null)} /> : null}
    </VStack>
  );
}
function QnaCta({pno, listHref}) {
  return (
    <Card padding={4}>
      <HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
        <VStack gap={1}><Text type="large" weight="bold">궁금한 점이 있나요?</Text><Text type="supporting" color="secondary">사이즈·배송·재입고, 바로 물어보세요.</Text></VStack>
        <HStack gap={2} vAlign="center"><Link href={listHref} type="supporting">상품 문의 보기</Link><Button label="문의하기" variant="primary" onClick={() => openAsk('6', pno)} /></HStack>
      </HStack>
    </Card>
  );
}

/* ---- board 4 list page ---- */
export function BoardList({rows, pages, writeHref}) {
  const mob = useMobile();
  const [items, setItems] = useState(rows);
  const [dlg, setDlg] = useState(null);
  const upd = (o) => setItems(cur => cur.map(x => x.no === o.no ? o : x));
  useEffect(() => { loadMany(rows.filter(x => x.hasFile), upd, 4); loadMany(rows.filter(x => !x.hasFile), upd, 2); }, []);
  const photos = items.filter(x => x.hasFile), texts = items.filter(x => !x.hasFile);
  const shown = photos.filter(x => x.loaded && !x.failed && x.media.length);
  const cols = mob ? 2 : 4;
  const colsArr = [...Array(cols)].map(() => []); shown.forEach((it, i) => colsArr[i % cols].push({it, i}));
  return (
    <VStack gap={6}>
      <HStack vAlign="end" hAlign="between" gap={3} wrap="wrap">
        <VStack gap={1}><Heading level={1}>고객 리뷰</Heading><Text type="body" color="secondary">실제로 입어 본 분들의 사진과 이야기예요.</Text></VStack>
        {writeHref ? <Button label="리뷰 쓰기" variant="primary" href={writeHref} /> : null}
      </HStack>
      {photos.length ? <VStack gap={3}>
        <HStack gap={2} vAlign="baseline"><Heading level={3}>사진 리뷰</Heading><Text type="supporting" color="secondary">{photos.length}</Text></HStack>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', minmax(0,1fr))', gap: 12, alignItems: 'start'}}>
          {colsArr.map((c, ci) => <VStack key={ci} gap={4}>{c.map(({it, i}) =>
            <VStack key={it.no} gap={1}>
              <PhotoTile it={it} ratio={[3 / 4, 4 / 5, 2 / 3, 1][(it.no % 4)]} caption={false} onOpen={() => setDlg({list: shown, i})} />
              <Text type="supporting" color="secondary" maxLines={1}>{[it.body, it.pname].filter(Boolean).join(' · ') || shortDate(it.date)}</Text>
              <Text type="body" maxLines={1}>{it.text}</Text>
            </VStack>)}</VStack>)}
        </div>
        {shown.length < photos.length ? <Grid columns={cols} gap={3}>{photos.slice(shown.length, shown.length + cols).map(x => <AspectRatio key={x.no} ratio={3 / 4}><Skeleton width="100%" height="100%" /></AspectRatio>)}</Grid> : null}
      </VStack> : null}
      {texts.length ? <VStack gap={3}>
        <HStack gap={2} vAlign="baseline"><Heading level={3}>글 리뷰</Heading><Text type="supporting" color="secondary">{texts.length}</Text></HStack>
        <Grid columns={{minWidth: mob ? 260 : 380, repeat: 'fill'}} gap={3}>{texts.map((it, i) => <ReviewCard key={it.no} it={it} onOpen={() => setDlg({list: texts, i})} />)}</Grid>
      </VStack> : null}
      {pages && pages.last > 1 ? <HStack hAlign="center"><Pagination page={pages.cur} totalPages={pages.last} onChange={(p) => { location.href = pages.url(p); }} /></HStack> : null}
      {dlg ? <ReviewDialog items={dlg.list} index={dlg.i} onIndex={(i) => setDlg({...dlg, i})} onClose={() => setDlg(null)} /> : null}
    </VStack>
  );
}

/* ---- board 4 read page ---- */
export function BoardRead({d}) {
  const mob = useMobile();
  const [li, setLi] = useState(-1);
  return (
    <VStack gap={5}>
      <HStack gap={2} vAlign="center"><Link href={d.listHref} type="supporting" color="secondary">고객 리뷰</Link></HStack>
      {d.product ? <Card padding={3}><HStack gap={3} vAlign="center">
        {d.product.img ? <div style={{width: 56, flex: '0 0 56px', borderRadius: 8, overflow: 'hidden'}}><AspectRatio ratio={1}><img className="bgw-img" src={d.product.img} alt="" /></AspectRatio></div> : null}
        <StackItem size="fill"><VStack gap={1}><Text type="body" weight="bold" maxLines={1}>{d.product.name}</Text>{d.product.price ? <Text type="supporting" color="secondary">{d.product.price}</Text> : null}</VStack></StackItem>
        {d.product.href ? <Button label="상품 보기" variant="secondary" size="sm" href={d.product.href} /> : null}
      </HStack></Card> : null}
      <VStack gap={2}>
        <Heading level={1}>{d.subject}</Heading>
        <HStack gap={2} vAlign="center" wrap="wrap"><Avatar name={d.author} size="sm" /><Text type="body" weight="bold">{d.author}</Text><Text type="supporting" color="secondary">{d.date}</Text><Badge variant="info" label={d.srcLabel} />{d.option ? <Badge variant="neutral" label={d.option} /> : null}{d.body ? <Badge variant="neutral" label={d.body} /> : null}</HStack>
      </VStack>
      {d.media.length ? <Grid columns={mob ? 1 : Math.min(2, d.media.length)} gap={3}>{d.media.map((u, i) =>
        <button key={u} type="button" className="bgw-tile" onClick={() => setLi(i)}><img src={u} alt="" style={{display: 'block', width: '100%', height: 'auto'}} /></button>)}</Grid> : null}
      <Text type="body" style={{whiteSpace: 'pre-line'}}>{d.text}</Text>
      <Divider />
      <HStack gap={2} hAlign="between" wrap="wrap">
        <HStack gap={2}>{d.actions.map(a => <Button key={a.label} label={a.label} variant="secondary" size="sm" onClick={a.run} />)}</HStack>
        <Button label="목록" variant="primary" href={d.listHref} />
      </HStack>
      {d.moves.length ? <Card padding={0}><VStack gap={0}>{d.moves.map((m, i) => <div key={i} style={{padding: '12px 16px', borderTop: i ? '1px solid var(--color-border-subtle, #eee)' : 0}}><HStack gap={3} vAlign="center"><Text type="supporting" color="secondary">{m.label}</Text><Link href={m.href} type="body">{m.title}</Link></HStack></div>)}</VStack></Card> : null}
      {li >= 0 ? <Dialog isOpen onOpenChange={(v) => { if (!v) setLi(-1); }} width={mob ? '100%' : 980} padding={0}>
        <div style={{position: 'relative', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', height: mob ? '100dvh' : '86vh'}}>
          <img src={d.media[li]} alt="" style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
          <div style={{position: 'absolute', top: 12, right: 12}}><IconButton label="닫기" icon={<svg width="16" height="16" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>} variant="secondary" onClick={() => setLi(-1)} /></div>
          {d.media.length > 1 ? <><div style={{position: 'absolute', left: 12, top: '50%'}}><IconButton label="이전" icon={<Chev d="l" />} variant="secondary" isDisabled={li === 0} onClick={() => setLi(li - 1)} /></div>
          <div style={{position: 'absolute', right: 12, top: '50%'}}><IconButton label="다음" icon={<Chev d="r" />} variant="secondary" isDisabled={li === d.media.length - 1} onClick={() => setLi(li + 1)} /></div></> : null}
        </div>
      </Dialog> : null}
    </VStack>
  );
}
