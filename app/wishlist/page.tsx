'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import AddWishModal from '../AddWishModal'

const WINE_TYPE_EMOJI: Record<string, string> = {
  red: '🍷', white: '🥂', sparkling: '🍾', rosé: '🌸', dessert: '🍯',
}

const WINE_TYPE_LABEL: Record<string, string> = {
  red: '레드', white: '화이트', sparkling: '샴페인', rosé: '로제', dessert: '디저트',
}

const PRIORITY_META: Record<number, { label: string; color: string }> = {
  3: { label: 'NEXT GATHERING', color: 'var(--ink-bordeaux)' },
  2: { label: 'SOON',           color: 'var(--ink-ochre)' },
  1: { label: 'SOMEDAY',        color: 'var(--ink-mist)' },
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 3,     label: 'Next Gathering' },
  { value: 2,     label: 'Soon' },
  { value: 1,     label: 'Someday' },
] as const

function formatAddedDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

type WishItem = {
  id: string
  name: string
  vintage_year: number | null
  region: string | null
  country: string | null
  varietal: string | null
  wine_type: string
  priority: number
  source: string | null
  photo_url: string | null
  note: string | null
  added_at: string
}

export default function Wishlist() {
  const [items, setItems] = useState<WishItem[]>([])
  const [filter, setFilter] = useState<'all' | 1 | 2 | 3>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function fetchItems() {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .order('priority', { ascending: false })
      .order('added_at', { ascending: false })
    if (!error && data) setItems(data as WishItem[])
  }

  useEffect(() => { fetchItems() }, [])

  const filtered = filter === 'all' ? items : items.filter(i => i.priority === filter)

  async function handleDelete(item: WishItem, kind: 'drunk' | 'remove') {
    const msg = kind === 'drunk'
      ? `"${item.name}" 을(를) 마셨어요. 위시리스트에서 제거할까요?`
      : `"${item.name}" 을(를) 위시리스트에서 삭제할까요?`
    if (!confirm(msg)) return
    setDeletingId(item.id)
    const { error } = await supabase.from('wishlist').delete().eq('id', item.id)
    setDeletingId(null)
    if (error) { alert('삭제 실패: ' + error.message); return }
    await fetchItems()
  }

  return (
    <div id="app-container">
      {/* 헤더 */}
      <div style={{ padding: '64px 24px 28px', position: 'relative' }}>
        <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '6px', textShadow: '0 1px 8px rgba(244,239,230,0.7)' }}>TO DRINK NEXT</div>
        <h1 className="type-display-1" style={{ color: 'var(--ink-charcoal)', margin: '0 0 6px', textShadow: '0 1px 12px rgba(244,239,230,0.85)' }}>
          Wishlist<span style={{ color: 'var(--ink-bordeaux)' }}>.</span>
        </h1>
        <p className="type-body" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', margin: '0 0 18px', textShadow: '0 1px 8px rgba(244,239,230,0.7)' }}>
          {items.length === 0
            ? '아직 비어 있어요'
            : items.length === 1 ? 'one bottle waiting' : `${items.length} bottles waiting`}
        </p>
      </div>

      {/* 탭 — 홈/분석/위시 */}
      <div style={{ display: 'flex', gap: '28px', padding: '0 24px', borderBottom: '1px solid rgba(200,184,154,0.4)' }}>
        <Link href="/" className="tab-btn">Home</Link>
        <Link href="/?tab=analysis" className="tab-btn">Analysis</Link>
        <span className="tab-btn is-active" aria-current="page">Wishlist</span>
      </div>

      {/* 필터 칩 */}
      <div style={{ padding: '20px 16px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const active = filter === f.value
          return (
            <button key={String(f.value)} onClick={() => setFilter(f.value)} className="year-btn" style={{
              padding: '7px 16px', borderRadius: '20px',
              border: active ? '1.5px solid var(--ink-bordeaux)' : '1px solid rgba(200,184,154,0.6)',
              background: active ? 'var(--ink-bordeaux)' : 'rgba(250,246,238,0.6)',
              color: active ? '#fff' : 'var(--ink-mist)',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-sans)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}>{f.label}</button>
          )
        })}
      </div>

      {/* 리스트 또는 빈 상태 */}
      {items.length === 0 ? (
        <div style={{ padding: '40px 24px' }}>
          <div className="glass-card glass-card--light" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.6 }}>🥂</div>
            <div className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', marginBottom: '8px' }}>비어 있어요</div>
            <div className="type-micro" style={{ color: 'var(--ink-mist)' }}>FIRST WINE TO TRY?</div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div className="type-micro" style={{ color: 'var(--ink-mist)' }}>이 카테고리에는 아직 와인이 없어요</div>
        </div>
      ) : (
        <div style={{ padding: '20px 16px 120px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map(item => {
            const pri = PRIORITY_META[item.priority] || PRIORITY_META[2]
            return (
              <article key={item.id} className="glass-card" style={{
                padding: '14px',
                display: 'flex',
                gap: '14px',
                alignItems: 'stretch',
                opacity: deletingId === item.id ? 0.4 : 1,
                transition: 'opacity 0.2s',
              }}>
                {/* 사진 또는 플레이스홀더 */}
                <div style={{
                  width: '88px', height: '88px', flexShrink: 0,
                  borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                  background: item.photo_url ? 'none' : 'linear-gradient(135deg, rgba(107,31,42,0.15), rgba(140,42,58,0.08))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--glass-border)',
                }}>
                  {item.photo_url
                    ? <img src={item.photo_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    : <span style={{ fontSize: '28px', opacity: 0.5 }}>{WINE_TYPE_EMOJI[item.wine_type] || '🍷'}</span>}
                </div>

                {/* 본문 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div className="type-micro" style={{ color: pri.color, marginBottom: '4px', fontWeight: 600 }}>
                    {pri.label}
                  </div>
                  <div className="type-title-md" style={{
                    fontStyle: 'italic', color: 'var(--ink-charcoal)',
                    fontSize: '17px', lineHeight: 1.2, marginBottom: '4px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {item.name}{item.vintage_year ? ` · ${item.vintage_year}` : ''}
                  </div>
                  <div className="type-caption" style={{ color: 'var(--ink-mist)', marginBottom: '6px', fontSize: '10px' }}>
                    {[WINE_TYPE_LABEL[item.wine_type], item.region, item.country].filter(Boolean).join(' · ')}
                  </div>
                  {item.source && (
                    <div className="type-micro" style={{ color: 'var(--ink-mist)', fontStyle: 'italic', marginBottom: '6px', textTransform: 'none', letterSpacing: 0, fontSize: '11px' }}>
                      {item.source}
                    </div>
                  )}
                  {item.note && (
                    <div className="type-micro" style={{ color: 'var(--ink-charcoal)', textTransform: 'none', letterSpacing: 0, fontSize: '11px', lineHeight: 1.4, marginBottom: '6px' }}>
                      {item.note}
                    </div>
                  )}
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span className="type-micro" style={{ color: 'var(--ink-sand)' }}>
                      added {formatAddedDate(item.added_at)}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleDelete(item, 'drunk')} disabled={deletingId === item.id} className="type-micro" style={{
                        padding: '5px 10px', borderRadius: 'var(--radius-full)',
                        background: 'rgba(92,107,63,0.1)', border: '1px solid rgba(92,107,63,0.3)',
                        color: 'var(--ink-olive)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      }}>✓ Drunk</button>
                      <button onClick={() => handleDelete(item, 'remove')} disabled={deletingId === item.id} className="type-micro" style={{
                        padding: '5px 10px', borderRadius: 'var(--radius-full)',
                        background: 'transparent', border: '1px solid rgba(181,62,42,0.3)',
                        color: '#B53E2A', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      }}>✕</button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setShowAdd(true)} aria-label="위시 추가" style={{
        position: 'fixed', bottom: '32px', right: 'calc(50% - 215px + 16px)',
        width: '56px', height: '56px', borderRadius: '50%',
        background: 'var(--ink-bordeaux)',
        border: 'none', color: '#fff', fontSize: '26px', cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(107,31,42,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 300, lineHeight: 1, zIndex: 50,
        transition: 'transform var(--dur-base) var(--ease-out-soft), box-shadow var(--dur-base) var(--ease-out-soft)',
      }}>+</button>

      {showAdd && <AddWishModal onClose={() => setShowAdd(false)} onSaved={fetchItems} />}
    </div>
  )
}
