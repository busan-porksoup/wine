'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import AddWineModal from './AddWineModal'
import Analytics from './Analytics'
import { ImagePositioner } from './ImagePositioner'

const TYPE_BADGE: Record<string, { emoji: string; label: string; bg: string; color: string }> = {
  red:      { emoji: '🍷', label: '레드',   bg: 'rgba(107,31,42,0.10)', color: '#6B1F2A' },
  white:    { emoji: '🥂', label: '화이트', bg: 'rgba(92,107,63,0.10)', color: '#5C6B3F' },
  sparkling:{ emoji: '🍾', label: '샴페인', bg: 'rgba(184,134,11,0.10)',color: '#B8860B' },
  rosé:     { emoji: '🌸', label: '로제',   bg: 'rgba(196,132,138,0.12)',color: '#A45560' },
  dessert:  { emoji: '🍯', label: '디저트', bg: 'rgba(184,134,11,0.10)',color: '#A06A1A' },
}

const WINE_TYPES = [
  { value: 'red',       label: '레드',   emoji: '🍷' },
  { value: 'white',     label: '화이트', emoji: '🥂' },
  { value: 'sparkling', label: '샴페인', emoji: '🍾' },
  { value: 'rosé',      label: '로제',   emoji: '🌸' },
  { value: 'dessert',   label: '디저트', emoji: '🍯' },
]

const FOOD_KEYWORDS = [
  { group: '육류',       items: ['소고기', '돼지고기', '양고기', '닭고기'] },
  { group: '해산물',     items: ['해산물', '생선', '굴'] },
  { group: '패스트푸드', items: ['피자', '햄버거', '파스타'] },
  { group: '기타',       items: ['치즈', '샐러드', '디저트'] },
]

const STAR_COLOR = '#6B1F2A'
const STAR_EMPTY = '#E2D8C8'

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: '10px',
  border: '1.5px solid rgba(200,184,154,0.5)', fontSize: '13px',
  fontFamily: "var(--font-sans)",
  boxSizing: 'border-box' as const,
  color: '#2A2420', background: 'rgba(250,246,238,0.85)', outline: 'none',
}

const labelStyle = {
  fontSize: '10px', fontWeight: '600' as const, color: '#8A7E6D',
  letterSpacing: '0.14em', textTransform: 'uppercase' as const,
  marginBottom: '6px', display: 'block',
  fontFamily: 'var(--font-sans)',
}

function Stars({ rating, size, onChange }: { rating: number; size: number; onChange?: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24"
          fill={s <= rating ? STAR_COLOR : STAR_EMPTY}
          style={{ cursor: onChange ? 'pointer' : 'default', flexShrink: 0 }}
          onClick={() => onChange?.(s)}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

function Avatar({ name, gradient }: { name: string; gradient: string }) {
  return (
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%',
      background: gradient, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '11px', color: '#fff', fontWeight: '700', letterSpacing: '-0.5px',
    }}>{name}</div>
  )
}

// 스크롤 진입 감지 훅
function useScrollVisible(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, visible }
}

// Editorial-style date formatter — "16 MAY 2026"
function formatEditorialDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

// 와인 카드 — Option A: 풀블리드 사진 + 하단 글래스 패널 오버레이
function WineCard({ wine, index, onClick }: { wine: any; index: number; onClick: () => void }) {
  const { ref, visible } = useScrollVisible()
  const b = TYPE_BADGE[wine.wine_type]
  const delay = Math.min(index * 50, 240)

  return (
    <article
      ref={ref}
      onClick={onClick}
      className="wine-card"
      style={{
        position: 'relative',
        aspectRatio: '4 / 5',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lift), var(--shadow-inset)',
        cursor: 'pointer',
        background: wine.image_url
          ? 'none'
          : 'linear-gradient(135deg, rgba(107,31,42,0.85), rgba(140,42,58,0.65))',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.55s var(--ease-out-soft) ${delay}ms, transform 0.55s var(--ease-out-soft) ${delay}ms`,
      }}
    >
      {wine.image_url && (
        <img src={wine.image_url} alt={wine.name}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: wine.image_position || '50% 50%',
            display: 'block',
          }}/>
      )}

      {/* 하단 글래스 패널 */}
      <div style={{
        position: 'absolute', left: 16, right: 16, bottom: 16,
        background: 'rgba(250,246,238,0.75)',
        backdropFilter: 'blur(18px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.15)',
        border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
      }}>
        <div className="type-micro" style={{ color: 'var(--ink-mist)', marginBottom: '6px' }}>
          {formatEditorialDate(wine.drunk_at)}
        </div>
        <h3 className="type-title-lg" style={{
          color: 'var(--ink-charcoal)',
          margin: '0 0 4px',
          fontSize: '22px',
          lineHeight: 1.15,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {wine.name}
        </h3>
        <div className="type-caption" style={{ color: 'var(--ink-mist)', marginBottom: '8px' }}>
          {[b?.label, wine.region, wine.country].filter(Boolean).join(' · ')}
        </div>
        <Stars rating={wine.rating || 0} size={13} />
      </div>
    </article>
  )
}

export default function Home() {
  const [wines, setWines] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('홈')
  const [editMode, setEditMode] = useState(false)
  const [yearFilter, setYearFilter] = useState('전체기록')

  const [memoJ, setMemoJ] = useState('')
  const [memoW, setMemoW] = useState('')
  const [ratingJ, setRatingJ] = useState(0)
  const [ratingW, setRatingW] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [editName, setEditName] = useState('')
  const [editProducer, setEditProducer] = useState('')
  const [editCountry, setEditCountry] = useState('')
  const [editRegion, setEditRegion] = useState('')
  const [editVintage, setEditVintage] = useState('')
  const [editWineType, setEditWineType] = useState('')
  const [editDrunkAt, setEditDrunkAt] = useState('')
  const [editGrapeVariety, setEditGrapeVariety] = useState('')
  const [editImagePosition, setEditImagePosition] = useState('50% 50%')

  const [selectedFoods, setSelectedFoods] = useState<string[]>([])
  const [foodOpen, setFoodOpen] = useState(false)
  const [customFood, setCustomFood] = useState('')

  const [imageViewerOpen, setImageViewerOpen] = useState(false)

  const [tastingTags, setTastingTags] = useState<string[]>([])
  const [tastingLoading, setTastingLoading] = useState(false)

  // AI 배너 멘트
  const [bannerMsg, setBannerMsg] = useState('')
  const [bannerRec, setBannerRec] = useState('')
  const [bannerLoading, setBannerLoading] = useState(false)

  const avgRating =
    ratingJ > 0 && ratingW > 0 ? Math.round((ratingJ + ratingW) / 2 * 10) / 10
    : ratingJ > 0 ? ratingJ
    : ratingW > 0 ? ratingW : 0

  const years = ['전체기록', ...Array.from(new Set(
    wines.map(w => w.drunk_at?.slice(0, 4)).filter(Boolean)
  )).sort((a, b) => Number(b) - Number(a))]

  const filteredWines = yearFilter === '전체기록'
    ? wines
    : wines.filter(w => w.drunk_at?.startsWith(yearFilter))

  async function fetchWines() {
    const { data, error } = await supabase
      .from('wines').select('*').order('drunk_at', { ascending: false })
    if (!error && data) setWines(data)
  }

  useEffect(() => {
    fetchWines()
    fetchBanner()
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('tab') === 'analysis') setActiveTab('분석')
    }
  }, [])

  async function fetchBanner() {
    // 하루 1회 캐싱
    const cacheKey = 'banner_' + new Date().toISOString().slice(0, 10)
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { message, recommendation } = JSON.parse(cached)
      setBannerMsg(message)
      setBannerRec(recommendation)
      return
    }
    setBannerLoading(true)
    try {
      const { data } = await supabase.from('wines').select('*').order('drunk_at', { ascending: false })
      const res = await fetch('/api/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wines: data || [] }),
      })
      const result = await res.json()
      if (result.success) {
        setBannerMsg(result.message)
        setBannerRec(result.recommendation)
        localStorage.setItem(cacheKey, JSON.stringify({ message: result.message, recommendation: result.recommendation }))
      }
    } catch {}
    setBannerLoading(false)
  }

  function openDetail(wine: any) {
    setSelected(wine)
    setEditMode(false)
    try {
      const memo = JSON.parse(wine.memo || '{}')
      setMemoJ(memo.jaehyuk || '')
      setMemoW(memo.wonwoo || '')
    } catch { setMemoJ(''); setMemoW('') }
    setRatingJ(wine.rating_jaehyuk || 0)
    setRatingW(wine.rating_wonwoo || 0)
    setEditName(wine.name || '')
    setEditProducer(wine.producer || '')
    setEditCountry(wine.country || '')
    setEditRegion(wine.region || '')
    setEditVintage(wine.vintage_year ? String(wine.vintage_year) : '')
    setEditWineType(wine.wine_type || 'red')
    setEditDrunkAt(wine.drunk_at || '')
    setEditGrapeVariety(Array.isArray(wine.grape_variety) ? wine.grape_variety.join(', ') : wine.grape_variety || '')
    setEditImagePosition(wine.image_position || '50% 50%')
    setSelectedFoods(wine.food_pairings || [])
    setFoodOpen(false)
    setCustomFood('')
    setTastingTags(wine.tasting_tags || [])
    setSaveMsg('')
    setImageViewerOpen(false)
    if (!wine.tasting_tags || wine.tasting_tags.length === 0) generateTastingNotes(wine)
  }

  async function generateTastingNotes(wine: any) {
    setTastingLoading(true)
    try {
      const res = await fetch('/api/tasting', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: wine.name, producer: wine.producer, country: wine.country, region: wine.region, grape_variety: wine.grape_variety, vintage_year: wine.vintage_year, wine_type: wine.wine_type }),
      })
      const result = await res.json()
      if (result.success && result.tags) {
        setTastingTags(result.tags)
        await supabase.from('wines').update({ tasting_tags: result.tags }).eq('id', wine.id)
      }
    } catch {}
    setTastingLoading(false)
  }

  function toggleFood(food: string) {
    setSelectedFoods(prev => prev.includes(food) ? prev.filter(f => f !== food) : [...prev, food])
  }

  function addCustomFood() {
    const f = customFood.trim()
    if (!f || selectedFoods.includes(f)) return
    setSelectedFoods(prev => [...prev, f])
    setCustomFood('')
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    const updateData: any = {
      memo: JSON.stringify({ jaehyuk: memoJ, wonwoo: memoW }),
      rating_jaehyuk: ratingJ > 0 ? ratingJ : null,
      rating_wonwoo: ratingW > 0 ? ratingW : null,
      rating: avgRating > 0 ? avgRating : null,
    }
    if (editMode) {
      Object.assign(updateData, {
        name: editName, producer: editProducer || null,
        country: editCountry || null, region: editRegion || null,
        vintage_year: editVintage ? parseInt(editVintage) : null,
        wine_type: editWineType, drunk_at: editDrunkAt || null,
        grape_variety: editGrapeVariety ? editGrapeVariety.split(',').map((s: string) => s.trim()) : null,
        food_pairings: selectedFoods.length > 0 ? selectedFoods : null,
        tasting_tags: tastingTags.length > 0 ? tastingTags : null,
        image_position: editImagePosition,
      })
    }
    const { error } = await supabase.from('wines').update(updateData).eq('id', selected.id)
    setSaving(false)
    if (error) { setSaveMsg('저장 실패 😢 ' + error.message) }
    else {
      setSaveMsg('저장 완료! ✓')
      await fetchWines()
      setTimeout(() => { setSelected(null); setSaveMsg('') }, 800)
    }
  }

  async function handleDelete() {
    if (!selected) return
    if (!confirm(`"${selected.name}" 을 삭제할까요?`)) return
    setDeleting(true)
    const { error } = await supabase.from('wines').delete().eq('id', selected.id)
    setDeleting(false)
    if (error) { setSaveMsg('삭제 실패 😢 ' + error.message) }
    else { await fetchWines(); setSelected(null) }
  }

  return (
    <div id="app-container">

      {/* 헤더 — 글래스 X, 사진 위 텍스트만 */}
      <div style={{ padding: '64px 24px 28px', position: 'relative' }}>
        <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '6px', textShadow: '0 1px 8px rgba(244,239,230,0.7)' }}>JAEHYEOK &amp; WONWOO</div>
        <h1 className="type-display-1" style={{ color: 'var(--ink-charcoal)', margin: '0 0 6px', textShadow: '0 1px 12px rgba(244,239,230,0.85)' }}>
          Wine Archive<span style={{ color: 'var(--ink-bordeaux)' }}>.</span>
        </h1>
        <p className="type-body" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', margin: '0 0 18px', textShadow: '0 1px 8px rgba(244,239,230,0.7)' }}>
          기록으로 완성되는 우리의 셀러
        </p>

        {/* AI 배너 멘트 — 글래스 카드 */}
        {bannerLoading ? (
          <div className="glass-card glass-card--light" style={{ padding: '14px 16px' }}>
            <div className="type-micro" style={{ color: 'var(--ink-mist)' }}>✨ 오늘의 와인 멘트 준비 중...</div>
          </div>
        ) : bannerMsg ? (
          <div className="glass-card glass-card--light" style={{ padding: '14px 16px' }}>
            <div className="type-body" style={{ color: 'var(--ink-charcoal)', lineHeight: '1.6', marginBottom: bannerRec ? '8px' : '0' }}>
              {bannerMsg}
            </div>
            {bannerRec && (
              <div className="type-micro" style={{ color: 'var(--ink-bordeaux)', fontStyle: 'italic' }}>
                🍾 {bannerRec}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* 탭 — italic serif + underline */}
      <div style={{ display: 'flex', gap: '28px', padding: '0 24px', borderBottom: '1px solid rgba(200,184,154,0.4)' }}>
        {['홈', '분석'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-btn ${activeTab === tab ? 'is-active' : ''}`}
            aria-selected={activeTab === tab}
          >
            {tab === '홈' ? 'Home' : 'Analysis'}
          </button>
        ))}
      </div>

      {/* 홈 탭 */}
      {activeTab === '홈' && (
        <>
          {/* 연도 필터 */}
          <div style={{ padding: '20px 16px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {years.map(y => (
              <button key={y} onClick={() => setYearFilter(y)} className="year-btn btn-ripple" style={{
                padding: '7px 16px', borderRadius: '20px',
                border: yearFilter === y ? '1.5px solid var(--ink-bordeaux)' : '1px solid rgba(200,184,154,0.6)',
                background: yearFilter === y ? 'var(--ink-bordeaux)' : 'rgba(250,246,238,0.6)',
                color: yearFilter === y ? '#fff' : 'var(--ink-mist)',
                fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                letterSpacing: '0.06em',
                fontFamily: 'var(--font-sans)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}>{y}</button>
            ))}
          </div>

          {filteredWines.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🍷</div>
              <div className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', marginBottom: '8px' }}>기록된 와인이 없어요</div>
              <div className="type-micro" style={{ color: 'var(--ink-mist)' }}>+ 버튼으로 와인을 기록해보세요</div>
            </div>
          ) : (
            <div style={{ padding: '20px 24px 120px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {filteredWines.map((wine, index) => (
                <WineCard key={wine.id} wine={wine} index={index} onClick={() => openDetail(wine)} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === '분석' && <Analytics wines={wines} />}

      {/* + 버튼 — Bordeaux solid */}
      <button onClick={() => setShowAdd(true)} aria-label="와인 추가" style={{
        position: 'fixed', bottom: '32px', right: 'calc(50% - 215px + 16px)',
        width: '56px', height: '56px', borderRadius: '50%',
        background: 'var(--ink-bordeaux)',
        border: 'none', color: '#fff', fontSize: '26px', cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(107,31,42,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 300, lineHeight: 1, zIndex: 50,
        transition: 'transform var(--dur-base) var(--ease-out-soft), box-shadow var(--dur-base) var(--ease-out-soft)',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(107,31,42,0.45), inset 0 1px 0 rgba(255,255,255,0.2)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(107,31,42,0.35), inset 0 1px 0 rgba(255,255,255,0.15)' }}
      >+</button>

      {showAdd && <AddWineModal onClose={() => setShowAdd(false)} onSaved={() => fetchWines()} />}

      {/* 이미지 전체화면 뷰어 */}
      {imageViewerOpen && selected?.image_url && (
        <div onClick={() => setImageViewerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}>
          <button onClick={() => setImageViewerOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <img src={selected.image_url} alt={selected.name} onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px' }}/>
        </div>
      )}

      {/* 상세 모달 — Bottom sheet over hero photo */}
      {selected && (
        <div onClick={() => setSelected(null)} className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(42,36,32,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} className="modal-sheet" style={{
            width: '100%', maxWidth: '430px', maxHeight: '95vh', overflowY: 'auto',
            background: 'var(--bg-paper)',
            borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)',
            boxShadow: '0 -8px 40px rgba(107,31,42,0.18)',
            position: 'relative',
          }}>

            {/* Sticky 닫기 버튼 — 스크롤해도 우상단 고정 */}
            <div style={{ position: 'sticky', top: 0, height: 0, zIndex: 20, pointerEvents: 'none' }}>
              <button onClick={e => { e.stopPropagation(); setSelected(null) }} aria-label="닫기" style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(42,36,32,0.55)', border: 'none', borderRadius: 'var(--radius-full)',
                width: 36, height: 36, color: '#fff', fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'auto',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}>
                ✕
              </button>
            </div>

            {/* Hero 사진 (50vh) — 사진과 본문 일자로 이어짐 */}
            <div onClick={() => selected.image_url && setImageViewerOpen(true)} style={{
              height: '50vh', minHeight: '280px',
              background: selected.image_url ? 'none' : 'linear-gradient(160deg, rgba(107,31,42,0.85), rgba(140,42,58,0.75))',
              borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)',
              position: 'relative', overflow: 'hidden',
              cursor: selected.image_url ? 'zoom-in' : 'default',
            }}>
              {selected.image_url && <img src={selected.image_url} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: selected.image_position || '50% 50%' }}/>}
              {selected.image_url && (
                <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(42,36,32,0.45)', borderRadius: 'var(--radius-full)', padding: '5px 12px', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                  <span className="type-micro" style={{ color: '#fff' }}>🔍 크게 보기</span>
                </div>
              )}
            </div>

            {/* Sheet 본문 — 사진과 일자로 연결 */}
            <div style={{ background: 'var(--bg-paper)' }}>
            <div style={{ padding: '24px 24px 40px' }}>

              {/* ── 읽기 모드 ── */}
              {!editMode && (
                <>
                  {/* 헤더 — 중앙 정렬 editorial 블록 */}
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h2 className="type-display-2" style={{ color: 'var(--ink-charcoal)', margin: '0 0 10px', fontSize: '32px' }}>{selected.name}</h2>
                    {selected.producer && (
                      <p className="type-body" style={{ fontStyle: 'italic', color: 'var(--ink-mist)', margin: '0 0 6px' }}>{selected.producer}</p>
                    )}
                    <p className="type-caption" style={{ color: 'var(--ink-sand)', margin: '0 0 10px' }}>
                      {[selected.region, selected.country].filter(Boolean).join(' · ')}{selected.vintage_year ? ` · ${selected.vintage_year}` : ''}
                    </p>
                    <p className="type-body" style={{ fontStyle: 'italic', color: 'var(--ink-mist)', margin: '0 0 14px' }}>
                      — {formatEditorialDate(selected.drunk_at)} —
                    </p>
                    <div style={{ display: 'inline-flex' }}>
                      <Stars rating={Math.round(avgRating)} size={22} />
                    </div>
                  </div>

                  {selected.grape_variety?.length > 0 && (
                    <p className="type-caption" style={{ color: 'var(--ink-olive)', textAlign: 'center', margin: '0 0 20px' }}>
                      🍇 {Array.isArray(selected.grape_variety) ? selected.grape_variety.join(' · ') : selected.grape_variety}
                    </p>
                  )}

                  <div style={{ height: 1, background: 'rgba(200,184,154,0.5)', marginBottom: '20px' }}/>

                  {/* 테이스팅 노트 */}
                  <div style={{ marginBottom: '20px' }}>
                    <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '12px' }}>Tasting Notes</div>
                    {tastingLoading ? (
                      <div className="type-body" style={{ color: 'var(--ink-mist)', fontStyle: 'italic', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(244,239,230,0.6)' }}>✨ AI가 테이스팅 노트를 생성 중…</div>
                    ) : tastingTags.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {tastingTags.map((tag, i) => (
                          <span key={i} className="type-micro" style={{
                            padding: '6px 14px', borderRadius: 'var(--radius-full)',
                            background: 'rgba(107,31,42,0.06)',
                            color: 'var(--ink-bordeaux)',
                            border: '1px solid rgba(107,31,42,0.15)',
                            letterSpacing: '0.08em',
                          }}>{tag}</span>
                        ))}
                      </div>
                    ) : (
                      <button onClick={() => generateTastingNotes(selected)} className="type-micro" style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px dashed rgba(107,31,42,0.35)', color: 'var(--ink-bordeaux)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>✨ AI 테이스팅 노트 생성</button>
                    )}
                  </div>

                  {/* 페어링 읽기 */}
                  {selected.food_pairings?.length > 0 && (
                    <>
                      <div style={{ height: 1, background: 'rgba(200,184,154,0.4)', marginBottom: '20px' }}/>
                      <div style={{ marginBottom: '20px' }}>
                        <div className="type-caption" style={{ color: 'var(--ink-olive)', marginBottom: '12px' }}>Paired With</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {selected.food_pairings.map((food: string) => (
                            <span key={food} className="type-micro" style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(92,107,63,0.08)', border: '1px solid rgba(92,107,63,0.2)', color: 'var(--ink-olive)', letterSpacing: '0.08em' }}>{food}</span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div style={{ height: 1, background: 'rgba(200,184,154,0.4)', marginBottom: '20px' }}/>

                  {/* 한줄평 — 재혁 */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <Avatar name="재혁" gradient="linear-gradient(135deg, var(--ink-bordeaux), var(--ink-burgundy))" />
                      <Stars rating={ratingJ} size={20} onChange={setRatingJ} />
                      <span className="type-micro" style={{ color: 'var(--ink-mist)' }}>{ratingJ > 0 ? ratingJ + '.0' : '—'}</span>
                    </div>
                    <textarea value={memoJ} onChange={e => setMemoJ(e.target.value)} placeholder="재혁의 한 줄 평…" style={{ width: '100%', height: '70px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(200,184,154,0.5)', padding: '12px 14px', fontSize: '14px', resize: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box', color: 'var(--ink-charcoal)', background: 'rgba(250,246,238,0.7)', outline: 'none', lineHeight: 1.5 }}/>
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <Avatar name="원우" gradient="linear-gradient(135deg, var(--ink-olive), #7A8E54)" />
                      <Stars rating={ratingW} size={20} onChange={setRatingW} />
                      <span className="type-micro" style={{ color: 'var(--ink-mist)' }}>{ratingW > 0 ? ratingW + '.0' : '—'}</span>
                    </div>
                    <textarea value={memoW} onChange={e => setMemoW(e.target.value)} placeholder="원우의 한 줄 평…" style={{ width: '100%', height: '70px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(200,184,154,0.5)', padding: '12px 14px', fontSize: '14px', resize: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box', color: 'var(--ink-charcoal)', background: 'rgba(250,246,238,0.7)', outline: 'none', lineHeight: 1.5 }}/>
                  </div>

                  {saveMsg && (
                    <div className="type-caption" style={{ textAlign: 'center', marginBottom: '14px', color: saveMsg.includes('실패') ? '#B53E2A' : 'var(--ink-olive)' }}>{saveMsg}</div>
                  )}

                  {/* 편집하기 + 저장하기 */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setEditMode(true)} className="type-caption" style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid rgba(200,184,154,0.6)', color: 'var(--ink-mist)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Edit</button>
                    <button onClick={handleSave} disabled={saving} className="type-caption" style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-md)', background: saving ? 'rgba(138,126,109,0.4)' : 'var(--ink-bordeaux)', border: 'none', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)' }}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </>
              )}

              {/* ── 편집 모드 ── */}
              {editMode && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)' }}>Edit Wine</div>
                    <button onClick={() => setEditMode(false)} className="type-micro" style={{ background: 'none', border: 'none', color: 'var(--ink-mist)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>← 뒤로</button>
                  </div>

                  {selected.image_url && (
                    <div style={{ marginBottom: '18px' }}>
                      <span style={labelStyle}>사진 위치 조정</span>
                      <ImagePositioner src={selected.image_url} value={editImagePosition} onChange={setEditImagePosition} />
                    </div>
                  )}

                  <div style={{ marginBottom: '14px' }}>
                    <span style={labelStyle}>와인 종류</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {WINE_TYPES.map(t => (
                        <button key={t.value} onClick={() => setEditWineType(t.value)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', border: editWineType === t.value ? '1.5px solid var(--ink-bordeaux)' : '1px solid rgba(200,184,154,0.5)', background: editWineType === t.value ? 'rgba(107,31,42,0.08)' : 'rgba(250,246,238,0.6)', color: editWineType === t.value ? 'var(--ink-bordeaux)' : 'var(--ink-mist)', fontSize: '11px', fontWeight: '500', cursor: 'pointer', fontFamily: 'var(--font-sans)', letterSpacing: '0.04em' }}>{t.emoji} {t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}><span style={labelStyle}>와인 이름</span><input value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle}/></div>
                  <div style={{ marginBottom: '10px' }}><span style={labelStyle}>생산자</span><input value={editProducer} onChange={e => setEditProducer(e.target.value)} style={inputStyle}/></div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}><span style={labelStyle}>국가</span><input value={editCountry} onChange={e => setEditCountry(e.target.value)} style={inputStyle}/></div>
                    <div style={{ flex: 1 }}><span style={labelStyle}>지역</span><input value={editRegion} onChange={e => setEditRegion(e.target.value)} style={inputStyle}/></div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}><span style={labelStyle}>빈티지</span><input value={editVintage} onChange={e => setEditVintage(e.target.value)} type="number" style={inputStyle}/></div>
                    <div style={{ flex: 1 }}><span style={labelStyle}>마신 날짜</span><input value={editDrunkAt} onChange={e => setEditDrunkAt(e.target.value)} style={inputStyle}/></div>
                  </div>
                  <div style={{ marginBottom: '16px' }}><span style={labelStyle}>품종</span><input value={editGrapeVariety} onChange={e => setEditGrapeVariety(e.target.value)} placeholder="예) Pinot Noir, Cabernet" style={inputStyle}/></div>

                  <div style={{ height: 1, background: 'rgba(200,184,154,0.4)', marginBottom: '18px' }}/>

                  {/* 페어링 편집 */}
                  <div style={{ marginBottom: '18px' }}>
                    <div className="type-caption" style={{ color: 'var(--ink-olive)', marginBottom: '12px' }}>Paired With</div>
                    {selectedFoods.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                        {selectedFoods.map(food => (
                          <span key={food} onClick={() => toggleFood(food)} className="type-micro" style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(92,107,63,0.1)', border: '1px solid rgba(92,107,63,0.3)', color: 'var(--ink-olive)', cursor: 'pointer', letterSpacing: '0.08em' }}>{food} ✕</span>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setFoodOpen(v => !v)} className="type-micro" style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px dashed rgba(200,184,154,0.7)', color: 'var(--ink-mist)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>+ 음식 추가 {foodOpen ? '▲' : '▼'}</button>
                    {foodOpen && (
                      <div style={{ marginTop: '12px', padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(244,239,230,0.7)', border: '1px solid rgba(200,184,154,0.4)' }}>
                        {FOOD_KEYWORDS.map(group => (
                          <div key={group.group} style={{ marginBottom: '12px' }}>
                            <div className="type-micro" style={{ color: 'var(--ink-mist)', marginBottom: '6px' }}>{group.group}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {group.items.map(food => (
                                <span key={food} onClick={() => toggleFood(food)} className="type-micro" style={{
                                  padding: '6px 12px', borderRadius: 'var(--radius-full)',
                                  background: selectedFoods.includes(food) ? 'rgba(92,107,63,0.12)' : 'rgba(250,246,238,0.8)',
                                  border: selectedFoods.includes(food) ? '1px solid rgba(92,107,63,0.4)' : '1px solid rgba(200,184,154,0.5)',
                                  color: selectedFoods.includes(food) ? 'var(--ink-olive)' : 'var(--ink-mist)',
                                  cursor: 'pointer', letterSpacing: '0.08em',
                                }}>{food}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                          <input value={customFood} onChange={e => setCustomFood(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomFood()} placeholder="직접 입력…" style={{ ...inputStyle, flex: 1, padding: '8px 10px', fontSize: '12px' }}/>
                          <button onClick={addCustomFood} className="type-micro" style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', background: 'var(--ink-bordeaux)', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>추가</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ height: 1, background: 'rgba(200,184,154,0.4)', marginBottom: '18px' }}/>

                  {/* 테이스팅 재생성 */}
                  <div style={{ marginBottom: '20px' }}>
                    <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '12px' }}>Tasting Notes</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                      {tastingTags.map((tag, i) => (
                        <span key={i} className="type-micro" style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(107,31,42,0.06)', border: '1px solid rgba(107,31,42,0.15)', color: 'var(--ink-bordeaux)', letterSpacing: '0.08em' }}>{tag}</span>
                      ))}
                    </div>
                    <button onClick={() => generateTastingNotes(selected)} disabled={tastingLoading} className="type-micro" style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px dashed rgba(200,184,154,0.7)', color: 'var(--ink-mist)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      {tastingLoading ? '생성 중…' : '↺ 재생성'}
                    </button>
                  </div>

                  {saveMsg && (
                    <div className="type-caption" style={{ textAlign: 'center', marginBottom: '14px', color: saveMsg.includes('실패') ? '#B53E2A' : 'var(--ink-olive)' }}>{saveMsg}</div>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleDelete} disabled={deleting} className="type-caption" style={{ flex: 1, padding: '16px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid rgba(181,62,42,0.4)', color: '#B53E2A', cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)' }}>
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                    <button onClick={handleSave} disabled={saving} className="type-caption" style={{ flex: 1, padding: '16px', borderRadius: 'var(--radius-md)', background: saving ? 'rgba(138,126,109,0.4)' : 'var(--ink-bordeaux)', border: 'none', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)' }}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}