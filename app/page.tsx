'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import AddWineModal from './AddWineModal'
import Analytics from './Analytics'

const TYPE_BADGE: Record<string, { emoji: string; label: string; bg: string; color: string }> = {
  red:      { emoji: '🍷', label: '레드',   bg: 'rgba(139,38,53,0.1)',  color: '#8B2635' },
  white:    { emoji: '🥂', label: '화이트', bg: 'rgba(200,169,81,0.1)', color: '#9A7D2E' },
  sparkling:{ emoji: '🍾', label: '샴페인', bg: 'rgba(100,160,200,0.1)',color: '#3A7FA0' },
  rosé:     { emoji: '🌸', label: '로제',   bg: 'rgba(220,130,130,0.1)',color: '#B05060' },
  dessert:  { emoji: '🍯', label: '디저트', bg: 'rgba(200,132,90,0.1)', color: '#A05A30' },
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

const STAR_COLOR = '#D4A843'
const STAR_EMPTY = '#E5DDD0'

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: '10px',
  border: '1.5px solid #F0EAE0', fontSize: '13px',
  fontFamily: "'Pretendard', sans-serif",
  boxSizing: 'border-box' as const,
  color: '#1A1A1A', background: '#FAFAF8', outline: 'none',
}

const labelStyle = {
  fontSize: '10px', fontWeight: '600' as const, color: '#BBB',
  letterSpacing: '1px', textTransform: 'uppercase' as const,
  marginBottom: '6px', display: 'block',
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

  const [selectedFoods, setSelectedFoods] = useState<string[]>([])
  const [foodOpen, setFoodOpen] = useState(false)
  const [customFood, setCustomFood] = useState('')

  const [imageViewerOpen, setImageViewerOpen] = useState(false)

  const [tastingTags, setTastingTags] = useState<string[]>([])
  const [tastingLoading, setTastingLoading] = useState(false)

  const avgRating =
    ratingJ > 0 && ratingW > 0 ? Math.round((ratingJ + ratingW) / 2 * 10) / 10
    : ratingJ > 0 ? ratingJ
    : ratingW > 0 ? ratingW : 0

  const badge = selected ? TYPE_BADGE[editMode ? editWineType : selected.wine_type] : null

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

  useEffect(() => { fetchWines() }, [])

  function openDetail(wine: any) {
    setSelected(wine)
    setEditMode(false)
    try {
      const memo = JSON.parse(wine.memo || '{}')
      setMemoJ(memo.jaehyuk || '')
      setMemoW(memo.wonwoo || '')
    } catch { setMemoJ(''); setMemoW('') }
    setRatingJ(wine.rating || 0)
    setRatingW(wine.rating || 0)
    setEditName(wine.name || '')
    setEditProducer(wine.producer || '')
    setEditCountry(wine.country || '')
    setEditRegion(wine.region || '')
    setEditVintage(wine.vintage_year ? String(wine.vintage_year) : '')
    setEditWineType(wine.wine_type || 'red')
    setEditDrunkAt(wine.drunk_at || '')
    setEditGrapeVariety(Array.isArray(wine.grape_variety) ? wine.grape_variety.join(', ') : wine.grape_variety || '')
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
    <div style={{ minHeight: '100vh', background: '#F7F3EE', fontFamily: "'Pretendard', -apple-system, sans-serif", maxWidth: '430px', margin: '0 auto' }}>

      {/* 헤더 — 타이틀만 */}
      <div style={{ background: 'linear-gradient(160deg, #1A1A2E 0%, #2D1B35 50%, #4A2040 100%)', padding: '56px 24px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(139,38,53,0.15)' }}/>
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(168,200,232,0.08)' }}/>
        <div style={{ position: 'relative' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 4px', letterSpacing: '-0.5px' }}>JW WineLog</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>우리의 와인 일지</p>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0EAE0', padding: '0 24px' }}>
        {['홈', '분석'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '14px 0', marginRight: '24px', background: 'none', border: 'none',
            borderBottom: activeTab === tab ? '2px solid #8B2635' : '2px solid transparent',
            color: activeTab === tab ? '#8B2635' : '#AAA',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            fontFamily: "'Pretendard', sans-serif",
          }}>{tab}</button>
        ))}
      </div>

      {/* 홈 탭 */}
      {activeTab === '홈' && (
        <>
          {/* 연도 필터 */}
          <div style={{ padding: '16px 16px 8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {years.map(y => (
              <button key={y} onClick={() => setYearFilter(y)} style={{
                padding: '7px 16px', borderRadius: '20px',
                border: yearFilter === y ? '2px solid #8B2635' : '1.5px solid #E0D8D0',
                background: yearFilter === y ? '#8B2635' : '#fff',
                color: yearFilter === y ? '#fff' : '#888',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                fontFamily: "'Pretendard', sans-serif",
              }}>{y}</button>
            ))}
          </div>

          {filteredWines.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🍷</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>기록된 와인이 없어요</div>
              <div style={{ fontSize: '13px', color: '#AAA' }}>+ 버튼으로 와인을 기록해보세요</div>
            </div>
          ) : (
            <div style={{ padding: '8px 16px 100px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {filteredWines.map(wine => {
                const b = TYPE_BADGE[wine.wine_type]
                return (
                  <div key={wine.id} onClick={() => openDetail(wine)}
                    style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer', border: '1px solid #F0EAE0' }}>
                    <div style={{ height: '140px', position: 'relative', background: wine.image_url ? 'none' : 'linear-gradient(135deg, #2D1B35 0%, #4A2040 100%)' }}>
                      {wine.image_url && <img src={wine.image_url} alt={wine.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
                      <div style={{ position: 'absolute', top: 8, left: 8, fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.35)', padding: '2px 7px', borderRadius: '6px' }}>
                        {wine.drunk_at}
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px 12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#1A1A1A', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b?.emoji} {wine.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#AAA', marginBottom: '8px' }}>{wine.vintage_year} · {wine.region}</div>
                      <Stars rating={wine.rating || 0} size={11} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === '분석' && <Analytics wines={wines} />}

      {/* + 버튼 */}
      <button onClick={() => setShowAdd(true)} style={{
        position: 'fixed', bottom: '32px', right: 'calc(50% - 215px + 16px)',
        width: '52px', height: '52px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #8B2635, #C0394D)',
        border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(139,38,53,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>+</button>

      {showAdd && <AddWineModal onClose={() => setShowAdd(false)} onSaved={() => fetchWines()} />}

      {/* 이미지 전체화면 뷰어 */}
      {imageViewerOpen && selected?.image_url && (
        <div onClick={() => setImageViewerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}>
          <button onClick={() => setImageViewerOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <img src={selected.image_url} alt={selected.name} onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px' }}/>
        </div>
      )}

      {/* 상세 모달 */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '430px', maxHeight: '92vh', overflowY: 'auto' }}>

            {/* 사진 */}
            <div onClick={() => selected.image_url && setImageViewerOpen(true)} style={{ height: '220px', background: selected.image_url ? 'none' : 'linear-gradient(160deg, #1A1A2E, #4A2040)', borderRadius: '24px 24px 0 0', position: 'relative', overflow: 'hidden', cursor: selected.image_url ? 'zoom-in' : 'default' }}>
              {selected.image_url && <img src={selected.image_url} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
              {selected.image_url && (
                <div style={{ position: 'absolute', bottom: 12, right: 14, background: 'rgba(0,0,0,0.35)', borderRadius: '20px', padding: '4px 10px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>🔍 크게 보기</span>
                </div>
              )}
              <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }}/>
              <button onClick={e => { e.stopPropagation(); handleDelete() }} disabled={deleting} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '20px', padding: '6px 12px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Pretendard', sans-serif" }}>
                {deleting ? '삭제 중...' : '🗑 삭제'}
              </button>
              <div style={{ position: 'absolute', bottom: 14, left: 20, display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: '600' }}>{badge?.emoji} {badge?.label}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{selected.drunk_at}</span>
              </div>
            </div>

            <div style={{ padding: '20px 24px 40px' }}>

              {/* ── 읽기 모드 ── */}
              {!editMode && (
                <>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', margin: '0 0 4px' }}>{selected.name}</h2>
                  <p style={{ color: '#AAA', fontSize: '13px', margin: '0 0 2px' }}>{selected.producer}</p>
                  <p style={{ color: '#AAA', fontSize: '13px', margin: '0 0 4px' }}>
                    {[selected.region, selected.country].filter(Boolean).join(', ')}{selected.vintage_year ? ` · ${selected.vintage_year}` : ''}
                  </p>
                  {selected.grape_variety?.length > 0 && (
                    <p style={{ color: '#BBB', fontSize: '12px', margin: '0 0 16px' }}>
                      🍇 {Array.isArray(selected.grape_variety) ? selected.grape_variety.join(', ') : selected.grape_variety}
                    </p>
                  )}

                  <div style={{ height: 1, background: '#F0EAE0', marginBottom: '16px' }}/>

                  {/* 테이스팅 노트 */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#AAA', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>🍇 Tasting Notes</div>
                    {tastingLoading ? (
                      <div style={{ fontSize: '12px', color: '#AAA', padding: '10px', borderRadius: '10px', background: '#F7F3EE' }}>✨ AI가 테이스팅 노트를 생성 중...</div>
                    ) : tastingTags.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {tastingTags.map((tag, i) => (
                          <span key={i} style={{
                            padding: '5px 12px', borderRadius: '20px',
                            background: i % 3 === 0 ? 'rgba(139,38,53,0.08)' : i % 3 === 1 ? 'rgba(107,142,58,0.08)' : 'rgba(58,127,160,0.08)',
                            color: i % 3 === 0 ? '#8B2635' : i % 3 === 1 ? '#4A6B2A' : '#2A6B8B',
                            fontSize: '12px', fontWeight: '600',
                            border: `1px solid ${i % 3 === 0 ? 'rgba(139,38,53,0.15)' : i % 3 === 1 ? 'rgba(107,142,58,0.15)' : 'rgba(58,127,160,0.15)'}`,
                          }}>{tag}</span>
                        ))}
                      </div>
                    ) : (
                      <button onClick={() => generateTastingNotes(selected)} style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(139,38,53,0.06)', border: '1px dashed rgba(139,38,53,0.3)', color: '#8B2635', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Pretendard', sans-serif" }}>✨ AI 테이스팅 노트 생성</button>
                    )}
                  </div>

                  {/* 페어링 읽기 */}
                  {selected.food_pairings?.length > 0 && (
                    <>
                      <div style={{ height: 1, background: '#F0EAE0', marginBottom: '16px' }}/>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#AAA', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>🍽 Food Pairing</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {selected.food_pairings.map((food: string) => (
                            <span key={food} style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(107,142,58,0.08)', border: '1px solid rgba(107,142,58,0.2)', color: '#4A6B2A', fontSize: '12px', fontWeight: '600' }}>{food}</span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div style={{ height: 1, background: '#F0EAE0', marginBottom: '16px' }}/>

                  {/* 별점 */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#AAA', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>Total Rating</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Stars rating={Math.round(avgRating)} size={28} />
                      <span style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A' }}>{avgRating > 0 ? avgRating : '—'}</span>
                    </div>
                  </div>

                  <div style={{ height: 1, background: '#F0EAE0', marginBottom: '20px' }}/>

                  {/* 한줄평 */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <Avatar name="재혁" gradient="linear-gradient(135deg, #8B2635, #C0394D)" />
                      <Stars rating={ratingJ} size={22} onChange={setRatingJ} />
                      <span style={{ fontSize: '12px', color: '#AAA' }}>{ratingJ > 0 ? ratingJ + '.0' : '—'}</span>
                    </div>
                    <textarea value={memoJ} onChange={e => setMemoJ(e.target.value)} placeholder="재혁의 한 줄 평..." style={{ width: '100%', height: '68px', borderRadius: '12px', border: '1.5px solid #F0EAE0', padding: '10px 14px', fontSize: '14px', resize: 'none', fontFamily: "'Pretendard', sans-serif", boxSizing: 'border-box', color: '#1A1A1A', background: '#FAFAF8', outline: 'none' }}/>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <Avatar name="원우" gradient="linear-gradient(135deg, #3A7FA0, #5BA8C8)" />
                      <Stars rating={ratingW} size={22} onChange={setRatingW} />
                      <span style={{ fontSize: '12px', color: '#AAA' }}>{ratingW > 0 ? ratingW + '.0' : '—'}</span>
                    </div>
                    <textarea value={memoW} onChange={e => setMemoW(e.target.value)} placeholder="원우의 한 줄 평..." style={{ width: '100%', height: '68px', borderRadius: '12px', border: '1.5px solid #F0EAE0', padding: '10px 14px', fontSize: '14px', resize: 'none', fontFamily: "'Pretendard', sans-serif", boxSizing: 'border-box', color: '#1A1A1A', background: '#FAFAF8', outline: 'none' }}/>
                  </div>

                  {saveMsg && <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: saveMsg.includes('실패') ? '#E74C3C' : '#27AE60' }}>{saveMsg}</div>}

                  {/* 편집하기 + 저장하기 */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setEditMode(true)} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: '#F7F3EE', border: '1.5px solid #E0D8D0', color: '#555', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Pretendard', sans-serif" }}>✏️ 편집하기</button>
                    <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: saving ? '#CCC' : 'linear-gradient(135deg, #8B2635, #C0394D)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Pretendard', sans-serif" }}>
                      {saving ? '저장 중...' : '저장하기'}
                    </button>
                  </div>
                </>
              )}

              {/* ── 편집 모드 ── */}
              {editMode && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A' }}>✏️ 와인 정보 편집</div>
                    <button onClick={() => setEditMode(false)} style={{ background: 'none', border: 'none', color: '#AAA', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Pretendard', sans-serif" }}>← 뒤로</button>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <span style={labelStyle}>와인 종류</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {WINE_TYPES.map(t => (
                        <button key={t.value} onClick={() => setEditWineType(t.value)} style={{ padding: '5px 10px', borderRadius: '20px', border: editWineType === t.value ? '2px solid #8B2635' : '1.5px solid #F0EAE0', background: editWineType === t.value ? 'rgba(139,38,53,0.08)' : '#FAFAF8', color: editWineType === t.value ? '#8B2635' : '#AAA', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Pretendard', sans-serif" }}>{t.emoji} {t.label}</button>
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

                  <div style={{ height: 1, background: '#F0EAE0', marginBottom: '16px' }}/>

                  {/* 페어링 편집 */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#AAA', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>🍽 Food Pairing</div>
                    {selectedFoods.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                        {selectedFoods.map(food => (
                          <span key={food} onClick={() => toggleFood(food)} style={{ padding: '5px 10px', borderRadius: '20px', background: 'rgba(107,142,58,0.1)', border: '1.5px solid rgba(107,142,58,0.3)', color: '#4A6B2A', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{food} ✕</span>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setFoodOpen(v => !v)} style={{ padding: '8px 14px', borderRadius: '10px', background: '#F7F3EE', border: '1.5px solid #F0EAE0', color: '#888', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Pretendard', sans-serif" }}>+ 음식 추가 {foodOpen ? '▲' : '▼'}</button>
                    {foodOpen && (
                      <div style={{ marginTop: '10px', padding: '14px', borderRadius: '14px', background: '#F7F3EE', border: '1px solid #F0EAE0' }}>
                        {FOOD_KEYWORDS.map(group => (
                          <div key={group.group} style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '10px', color: '#BBB', fontWeight: '600', marginBottom: '6px' }}>{group.group}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {group.items.map(food => (
                                <span key={food} onClick={() => toggleFood(food)} style={{ padding: '5px 10px', borderRadius: '20px', background: selectedFoods.includes(food) ? 'rgba(107,142,58,0.12)' : '#fff', border: selectedFoods.includes(food) ? '1.5px solid rgba(107,142,58,0.4)' : '1.5px solid #EEE', color: selectedFoods.includes(food) ? '#4A6B2A' : '#666', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{food}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                          <input value={customFood} onChange={e => setCustomFood(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomFood()} placeholder="직접 입력..." style={{ ...inputStyle, flex: 1, padding: '8px 10px', fontSize: '12px' }}/>
                          <button onClick={addCustomFood} style={{ padding: '8px 12px', borderRadius: '10px', background: '#8B2635', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Pretendard', sans-serif" }}>추가</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ height: 1, background: '#F0EAE0', marginBottom: '16px' }}/>

                  {/* 테이스팅 재생성 */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#AAA', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>🍇 Tasting Notes</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {tastingTags.map((tag, i) => (
                        <span key={i} style={{ padding: '5px 12px', borderRadius: '20px', background: i % 3 === 0 ? 'rgba(139,38,53,0.08)' : i % 3 === 1 ? 'rgba(107,142,58,0.08)' : 'rgba(58,127,160,0.08)', color: i % 3 === 0 ? '#8B2635' : i % 3 === 1 ? '#4A6B2A' : '#2A6B8B', fontSize: '12px', fontWeight: '600' }}>{tag}</span>
                      ))}
                    </div>
                    <button onClick={() => generateTastingNotes(selected)} disabled={tastingLoading} style={{ padding: '7px 14px', borderRadius: '10px', background: 'transparent', border: '1px dashed #DDD', color: '#BBB', fontSize: '11px', cursor: 'pointer', fontFamily: "'Pretendard', sans-serif" }}>
                      {tastingLoading ? '생성 중...' : '↺ 재생성'}
                    </button>
                  </div>

                  {saveMsg && <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: saveMsg.includes('실패') ? '#E74C3C' : '#27AE60' }}>{saveMsg}</div>}

                  <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '16px', borderRadius: '14px', background: saving ? '#CCC' : 'linear-gradient(135deg, #8B2635, #C0394D)', border: 'none', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Pretendard', sans-serif" }}>
                    {saving ? '저장 중...' : '저장하기'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}