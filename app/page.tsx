'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import AddWineModal from './AddWineModal'

const TYPE_BADGE: Record<string, { emoji: string; label: string; bg: string; color: string }> = {
  red:      { emoji: '🍷', label: '레드',   bg: 'rgba(139,38,53,0.1)',  color: '#8B2635' },
  white:    { emoji: '🥂', label: '화이트', bg: 'rgba(200,169,81,0.1)', color: '#9A7D2E' },
  sparkling:{ emoji: '🍾', label: '샴페인', bg: 'rgba(100,160,200,0.1)',color: '#3A7FA0' },
  rosé:     { emoji: '🌸', label: '로제',   bg: 'rgba(220,130,130,0.1)',color: '#B05060' },
  dessert:  { emoji: '🍯', label: '디저트', bg: 'rgba(200,132,90,0.1)', color: '#A05A30' },
}

const STAR_COLOR = '#D4A843'
const STAR_EMPTY = '#E5DDD0'

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
  const [memoJ, setMemoJ] = useState('')
  const [memoW, setMemoW] = useState('')
  const [ratingJ, setRatingJ] = useState(0)
  const [ratingW, setRatingW] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const avgRating =
    ratingJ > 0 && ratingW > 0 ? Math.round((ratingJ + ratingW) / 2 * 10) / 10
    : ratingJ > 0 ? ratingJ
    : ratingW > 0 ? ratingW : 0

  const badge = selected ? TYPE_BADGE[selected.wine_type] : null

  async function fetchWines() {
    const { data, error } = await supabase
      .from('wines')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setWines(data)
  }

  useEffect(() => { fetchWines() }, [])

  function openDetail(wine: any) {
    setSelected(wine)
    // 기존 메모 불러오기
    try {
      const memo = JSON.parse(wine.memo || '{}')
      setMemoJ(memo.jaehyuk || '')
      setMemoW(memo.wonwoo || '')
    } catch {
      setMemoJ('')
      setMemoW('')
    }
    setRatingJ(wine.rating || 0)
    setRatingW(wine.rating || 0)
    setSaveMsg('')
  }

  // 메모 + 별점 업데이트
  async function handleSave() {
    if (!selected) return
    setSaving(true)

    const { error } = await supabase
      .from('wines')
      .update({
        memo: JSON.stringify({ jaehyuk: memoJ, wonwoo: memoW }),
        rating: avgRating > 0 ? avgRating : null,
      })
      .eq('id', selected.id)

    setSaving(false)
    if (error) {
      setSaveMsg('저장 실패 😢 ' + error.message)
    } else {
      setSaveMsg('저장 완료! ✓')
      await fetchWines()
      setTimeout(() => {
        setSelected(null)
        setSaveMsg('')
      }, 800)
    }
  }

  // 삭제
  async function handleDelete() {
    if (!selected) return
    if (!confirm(`"${selected.name}" 을 삭제할까요?`)) return
    setDeleting(true)

    const { error } = await supabase
      .from('wines')
      .delete()
      .eq('id', selected.id)

    setDeleting(false)
    if (error) {
      setSaveMsg('삭제 실패 😢 ' + error.message)
    } else {
      await fetchWines()
      setSelected(null)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F7F3EE',
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      maxWidth: '430px', margin: '0 auto',
    }}>

      {/* 헤더 */}
      <div style={{
        background: 'linear-gradient(160deg, #1A1A2E 0%, #2D1B35 50%, #4A2040 100%)',
        padding: '56px 24px 32px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(139,38,53,0.15)' }}/>
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(168,200,232,0.08)' }}/>
        <div style={{ position: 'relative' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 4px', letterSpacing: '-0.5px' }}>JW WineLog</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 24px' }}>우리의 와인 일지</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            {[
              [String(wines.length), '기록'],
              [wines.length > 0 ? String(Math.round(wines.reduce((a, w) => a + (w.rating || 0), 0) / wines.length * 10) / 10) : '—', '평균별점'],
              [String(new Set(wines.map(w => w.country)).size), '나라'],
            ].map(([val, lbl]) => (
              <div key={lbl}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>{val}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{lbl}</div>
              </div>
            ))}
          </div>
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
          <div style={{ padding: '20px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A1A' }}>최근 기록</div>
            <div style={{ fontSize: '12px', color: '#8B2635', fontWeight: '600' }}>전체보기</div>
          </div>

          {wines.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🍷</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>아직 기록된 와인이 없어요</div>
              <div style={{ fontSize: '13px', color: '#AAA' }}>+ 버튼으로 첫 와인을 기록해보세요</div>
            </div>
          ) : (
            <div style={{ padding: '0 16px 100px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {wines.map(wine => {
                const b = TYPE_BADGE[wine.wine_type]
                return (
                  <div key={wine.id} onClick={() => openDetail(wine)}
                    style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer', border: '1px solid #F0EAE0' }}>
                    <div style={{
                      height: '140px', position: 'relative',
                      background: wine.image_url ? 'none' : 'linear-gradient(135deg, #2D1B35 0%, #4A2040 100%)',
                    }}>
                      {wine.image_url && (
                        <img src={wine.image_url} alt={wine.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      )}
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

      {/* 분석 탭 */}
      {activeTab === '분석' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>분석 준비 중</div>
          <div style={{ fontSize: '13px', color: '#AAA' }}>와인을 더 기록하면 분석이 시작돼요</div>
        </div>
      )}

      {/* + 버튼 */}
      <button onClick={() => setShowAdd(true)} style={{
        position: 'fixed', bottom: '32px', right: 'calc(50% - 215px + 16px)',
        width: '52px', height: '52px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #8B2635, #C0394D)',
        border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(139,38,53,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>+</button>

      {/* 와인 추가 모달 */}
      {showAdd && (
        <AddWineModal
          onClose={() => setShowAdd(false)}
          onSaved={() => fetchWines()}
        />
      )}

      {/* 상세 모달 */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          zIndex: 100, backdropFilter: 'blur(4px)',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: '24px 24px 0 0',
            width: '100%', maxWidth: '430px', maxHeight: '88vh', overflowY: 'auto',
          }}>

            {/* 모달 이미지 */}
            <div style={{
              height: '220px',
              background: selected.image_url ? 'none' : 'linear-gradient(160deg, #1A1A2E, #4A2040)',
              borderRadius: '24px 24px 0 0', position: 'relative', overflow: 'hidden',
            }}>
              {selected.image_url && (
                <img src={selected.image_url} alt={selected.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              )}
              <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }}/>
              {/* 삭제 버튼 */}
              <button onClick={handleDelete} disabled={deleting} style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(0,0,0,0.4)', border: 'none',
                borderRadius: '20px', padding: '6px 12px',
                color: '#fff', fontSize: '12px', fontWeight: '600',
                cursor: 'pointer', fontFamily: "'Pretendard', sans-serif",
              }}>
                {deleting ? '삭제 중...' : '🗑 삭제'}
              </button>
              <div style={{ position: 'absolute', bottom: 16, left: 20, display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: '600' }}>
                  {badge?.emoji} {badge?.label}
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{selected.drunk_at}</span>
              </div>
            </div>

            <div style={{ padding: '20px 24px 40px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', margin: '0 0 4px' }}>{selected.name}</h2>
              <p style={{ color: '#AAA', fontSize: '13px', margin: '0 0 2px' }}>{selected.producer}</p>
              <p style={{ color: '#AAA', fontSize: '13px', margin: '0 0 16px' }}>{selected.region}, {selected.country} · {selected.vintage_year}</p>

              <div style={{ height: 1, background: '#F0EAE0', marginBottom: '20px' }}/>

              {/* 총점 */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#AAA', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>Total Rating</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Stars rating={Math.round(avgRating)} size={28} />
                  <span style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A' }}>
                    {avgRating > 0 ? avgRating : '—'}
                  </span>
                </div>
              </div>

              <div style={{ height: 1, background: '#F0EAE0', marginBottom: '20px' }}/>

              {/* 재혁 */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <Avatar name="재혁" gradient="linear-gradient(135deg, #8B2635, #C0394D)" />
                  <Stars rating={ratingJ} size={22} onChange={setRatingJ} />
                  <span style={{ fontSize: '12px', color: '#AAA' }}>{ratingJ > 0 ? ratingJ + '.0' : '—'}</span>
                </div>
                <textarea value={memoJ} onChange={e => setMemoJ(e.target.value)}
                  placeholder="재혁의 한 줄 평..."
                  style={{
                    width: '100%', height: '68px', borderRadius: '12px',
                    border: '1.5px solid #F0EAE0', padding: '10px 14px',
                    fontSize: '14px', resize: 'none',
                    fontFamily: "'Pretendard', sans-serif",
                    boxSizing: 'border-box', color: '#1A1A1A',
                    background: '#FAFAF8', outline: 'none',
                  }}/>
              </div>

              {/* 원우 */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <Avatar name="원우" gradient="linear-gradient(135deg, #3A7FA0, #5BA8C8)" />
                  <Stars rating={ratingW} size={22} onChange={setRatingW} />
                  <span style={{ fontSize: '12px', color: '#AAA' }}>{ratingW > 0 ? ratingW + '.0' : '—'}</span>
                </div>
                <textarea value={memoW} onChange={e => setMemoW(e.target.value)}
                  placeholder="원우의 한 줄 평..."
                  style={{
                    width: '100%', height: '68px', borderRadius: '12px',
                    border: '1.5px solid #F0EAE0', padding: '10px 14px',
                    fontSize: '14px', resize: 'none',
                    fontFamily: "'Pretendard', sans-serif",
                    boxSizing: 'border-box', color: '#1A1A1A',
                    background: '#FAFAF8', outline: 'none',
                  }}/>
              </div>

              {saveMsg && (
                <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: saveMsg.includes('실패') ? '#E74C3C' : '#27AE60' }}>
                  {saveMsg}
                </div>
              )}

              <button onClick={handleSave} disabled={saving} style={{
                width: '100%', padding: '16px', borderRadius: '14px',
                background: saving ? '#CCC' : 'linear-gradient(135deg, #8B2635, #C0394D)',
                border: 'none', color: '#fff', fontSize: '15px', fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: "'Pretendard', sans-serif",
              }}>
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}