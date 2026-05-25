'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────
// Mock 데이터
// ─────────────────────────────────────────────

const MOCK_WINES = [
  { id: '1', name: 'Château Margaux 2015', wine_type: 'red', country: 'France', drunk_at: '2026-03-15', image_url: null, tasting_tags: ['블랙커런트', '오크', '탄닌감', '풀바디', '담배'] },
  { id: '2', name: 'Chablis Premier Cru 2020', wine_type: 'white', country: 'France', drunk_at: '2026-04-08', image_url: null, tasting_tags: ['미네랄', '산도', '긴 여운'] },
  { id: '3', name: 'Sassicaia 2018', wine_type: 'red', country: 'Italy', drunk_at: '2026-05-04', image_url: null, tasting_tags: ['블랙커런트', '삼나무', '담배', '풀바디'] },
  { id: '4', name: 'Ruinart Champagne Blanc de Blancs', wine_type: 'sparkling', country: 'France', drunk_at: '2026-05-16', image_url: null, tasting_tags: ['미네랄', '산도', '오크'] },
  { id: '5', name: 'Cheval Blanc 2015', wine_type: 'red', country: 'France', drunk_at: '2026-05-12', image_url: null, tasting_tags: ['자두', '오크', '탄닌감', '스파이시', '풀바디'] },
  { id: '6', name: 'Apothic Red', wine_type: 'red', country: 'USA', drunk_at: '2026-04-15', image_url: null, tasting_tags: ['자두', '스파이시'] },
  { id: '7', name: 'Sancerre 2022', wine_type: 'white', country: 'France', drunk_at: '2026-05-01', image_url: null, tasting_tags: ['미네랄', '산도', '흑연'] },
  { id: '8', name: 'Tignanello 2019', wine_type: 'red', country: 'Italy', drunk_at: '2026-03-20', image_url: null, tasting_tags: ['블랙커런트', '오크', '담배', '풀바디'] },
  { id: '9', name: 'Provence Rosé', wine_type: 'rosé', country: 'France', drunk_at: '2026-06-01', image_url: null, tasting_tags: ['산도', '자두'] },
  { id: '10', name: 'Ridge Monte Bello', wine_type: 'red', country: 'USA', drunk_at: '2026-02-14', image_url: null, tasting_tags: ['블랙커런트', '오크', '풀바디', '긴 여운'] },
]

const TYPE_LABEL: Record<string, string> = {
  red: '레드', white: '화이트', sparkling: '샴페인', rosé: '로제', dessert: '디저트',
}
const TYPE_EMOJI: Record<string, string> = {
  red: '🍷', white: '🥂', sparkling: '🍾', rosé: '🌸', dessert: '🍯',
}

const COUNTRY_FLAG: Record<string, string> = {
  France: '🇫🇷', Italy: '🇮🇹', USA: '🇺🇸', Spain: '🇪🇸', Japan: '🇯🇵',
  'South Africa': '🇿🇦', Chile: '🇨🇱', Australia: '🇦🇺', Argentina: '🇦🇷', Portugal: '🇵🇹',
}

function fmtMD(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

// ─────────────────────────────────────────────
// 미니 와인 카드 (2열)
// ─────────────────────────────────────────────

function MiniWineCard({ wine, onClick }: { wine: any; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      position: 'relative',
      aspectRatio: '4 / 5',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-soft)',
      cursor: 'pointer',
      background: wine.image_url ? 'none' : 'linear-gradient(135deg, rgba(107,31,42,0.85), rgba(140,42,58,0.65))',
      border: 'none', padding: 0, textAlign: 'left',
      fontFamily: 'inherit', color: 'inherit',
    }}>
      {wine.image_url ? (
        <img src={wine.image_url} alt={wine.name} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        }}/>
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '40px', opacity: 0.4,
        }}>{TYPE_EMOJI[wine.wine_type] || '🍷'}</div>
      )}
      <div style={{
        position: 'absolute', left: 8, right: 8, bottom: 8,
        background: 'rgba(250,246,238,0.78)',
        backdropFilter: 'blur(18px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.15)',
        border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 10px',
      }}>
        <div className="type-micro" style={{
          color: 'var(--ink-mist)', marginBottom: '2px',
          fontSize: '9px', letterSpacing: '0.1em',
        }}>{fmtMD(wine.drunk_at)}</div>
        <div style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: '12px', color: 'var(--ink-charcoal)',
          lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{wine.name}</div>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────
// 알약 칩
// ─────────────────────────────────────────────

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 13px',
        borderRadius: 'var(--radius-full)',
        border: active ? '1.5px solid var(--ink-bordeaux)' : '1px solid rgba(200,184,154,0.6)',
        background: active ? 'var(--ink-bordeaux)' : 'rgba(250,246,238,0.6)',
        color: active ? '#fff' : 'var(--ink-mist)',
        fontSize: '12px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        letterSpacing: '-0.01em',
        transition: 'all var(--dur-base) var(--ease-out-soft)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────

export default function SamplesSearch() {
  const [types, setTypes] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [notes, setNotes] = useState<string[]>([])

  const toggle = (arr: string[], v: string, setter: (next: string[]) => void) => {
    setter(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  }

  // 카운트 집계
  const countryCount: Record<string, number> = {}
  const noteCount: Record<string, number> = {}
  MOCK_WINES.forEach(w => {
    if (w.country) countryCount[w.country] = (countryCount[w.country] || 0) + 1
    ;(w.tasting_tags || []).forEach((t: string) => { noteCount[t] = (noteCount[t] || 0) + 1 })
  })
  const sortedCountries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).map(([c]) => c)
  const sortedNotes = Object.entries(noteCount).sort((a, b) => b[1] - a[1]).map(([n]) => n)

  // 필터링
  // 종류와 국가는 각 그룹 내 OR, 그룹 간 AND
  // 노트는 AND (선택한 노트 모두 있어야 함)
  const filtered = MOCK_WINES.filter(w => {
    const typeMatch = types.length === 0 || types.includes(w.wine_type)
    const countryMatch = countries.length === 0 || (w.country && countries.includes(w.country))
    const notesMatch = notes.length === 0 || notes.every(n => (w.tasting_tags || []).includes(n))
    return typeMatch && countryMatch && notesMatch
  })

  const hasFilter = types.length + countries.length + notes.length > 0

  return (
    <div id="app-container" style={{ paddingBottom: '80px' }}>
      {/* Hero */}
      <div style={{ padding: '48px 24px 16px' }}>
        <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '6px', textShadow: '0 1px 8px rgba(244,239,230,0.7)' }}>SAMPLES · SEARCH</div>
        <h1 className="type-display-2" style={{ color: 'var(--ink-charcoal)', margin: '0 0 12px', fontSize: '32px', textShadow: '0 1px 12px rgba(244,239,230,0.85)' }}>
          Find your wine.
        </h1>
        <p className="type-body" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', margin: 0, textShadow: '0 1px 8px rgba(244,239,230,0.7)' }}>
          종류 · 국가 · 노트 키워드로 필터링
        </p>
      </div>

      {/* 필터 카드 */}
      <div style={{ padding: '12px 16px' }}>
        <div className="glass-card glass-card--light" style={{ padding: '20px 18px' }}>

          {/* 종류 — 한 줄에 다 보이도록 emoji 제외 */}
          <div style={{ marginBottom: '16px' }}>
            <div className="type-caption" style={{ color: 'var(--ink-mist)', marginBottom: '10px', fontSize: '10px' }}>종류</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {(['red', 'white', 'sparkling', 'rosé', 'dessert'] as const).map(t => (
                <Chip key={t} active={types.includes(t)} onClick={() => toggle(types, t, setTypes)}>
                  {TYPE_LABEL[t]}
                </Chip>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(200,184,154,0.4)', margin: '14px 0' }}/>

          {/* 국가 */}
          <div style={{ marginBottom: '16px' }}>
            <div className="type-caption" style={{ color: 'var(--ink-mist)', marginBottom: '10px', fontSize: '10px' }}>국가</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {sortedCountries.map(c => (
                <Chip key={c} active={countries.includes(c)} onClick={() => toggle(countries, c, setCountries)}>
                  {COUNTRY_FLAG[c] || '🍾'} {c} <span style={{ opacity: 0.7, marginLeft: '2px', fontSize: '10px' }}>({countryCount[c]})</span>
                </Chip>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(200,184,154,0.4)', margin: '14px 0' }}/>

          {/* 노트 */}
          <div>
            <div className="type-caption" style={{ color: 'var(--ink-mist)', marginBottom: '10px', fontSize: '10px' }}>
              노트 <span style={{ fontSize: '9px', color: 'var(--ink-sand)' }}>(모두 만족하는 와인)</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {sortedNotes.map(n => (
                <Chip key={n} active={notes.includes(n)} onClick={() => toggle(notes, n, setNotes)}>
                  {n} <span style={{ opacity: 0.7, marginLeft: '2px', fontSize: '10px' }}>({noteCount[n]})</span>
                </Chip>
              ))}
            </div>
          </div>

          {/* Reset */}
          {hasFilter && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                onClick={() => { setTypes([]); setCountries([]); setNotes([]) }}
                className="type-micro"
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--ink-mist)', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  textTransform: 'none', letterSpacing: 0,
                  fontStyle: 'italic',
                }}
              >
                모든 필터 초기화
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 결과 카드 */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ padding: '0 8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="type-caption" style={{ color: 'var(--ink-bordeaux)' }}>
            {hasFilter ? '필터 결과' : '전체 와인'}
          </div>
          <div className="type-micro" style={{ color: 'var(--ink-mist)' }}>
            {filtered.length}병
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card glass-card--light" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}>🔍</div>
            <div className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', marginBottom: '6px' }}>일치하는 와인 없음</div>
            <div className="type-micro" style={{ color: 'var(--ink-mist)' }}>필터를 조정해보세요</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {filtered.map(wine => (
              <MiniWineCard key={wine.id} wine={wine} onClick={() => alert(`${wine.name} 상세 모달 (실제 구현 시)`)} />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '24px 24px 16px', textAlign: 'center' }}>
        <p className="type-micro" style={{ color: 'var(--ink-mist)', textTransform: 'none', letterSpacing: 0, fontStyle: 'italic' }}>
          종류·국가는 그룹 내 OR (여러 개 선택 가능), 그룹 간 AND<br/>
          노트는 모두 만족 (AND)
        </p>
      </div>
    </div>
  )
}
