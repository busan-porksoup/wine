'use client'

import { useMemo, useState } from 'react'
import { NOTES_VOCABULARY, normalizeNote, categorizeNote, wineMatchesFilterTag, isUmbrellaTag } from '../notesVocabulary'

// ─────────────────────────────────────────────
// Mock 데이터
// ─────────────────────────────────────────────

const MOCK_WINES = [
  { id: '1', name: 'Château Margaux 2015', wine_type: 'red', country: 'France', drunk_at: '2026-03-15', image_url: null, tasting_tags: ['카시스', '참나무', '탄닌감', '풀바디', '담배', '바이올렛'] },
  { id: '2', name: 'Chablis Premier Cru 2020', wine_type: 'white', country: 'France', drunk_at: '2026-04-08', image_url: null, tasting_tags: ['미네랄', '산도', '긴 여운', '레몬', '캐모마일'] },
  { id: '3', name: 'Sassicaia 2018', wine_type: 'red', country: 'Italy', drunk_at: '2026-05-04', image_url: null, tasting_tags: ['카시스', '서양삼나무', '담배', '풀바디', '자스민'] },
  { id: '4', name: 'Ruinart Champagne Blanc de Blancs', wine_type: 'sparkling', country: 'France', drunk_at: '2026-05-16', image_url: null, tasting_tags: ['미네랄', '높은 산도', '비스킷', '브리오슈', '아카시아', '섬세한 거품'] },
  { id: '5', name: 'Cheval Blanc 2015', wine_type: 'red', country: 'France', drunk_at: '2026-05-12', image_url: null, tasting_tags: ['자두', '참나무', '탄닌감', '스파이시', '풀바디', '장미'] },
  { id: '6', name: 'Apothic Red', wine_type: 'red', country: 'USA', drunk_at: '2026-04-15', image_url: null, tasting_tags: ['자두', '스파이시', '바닐라'] },
  { id: '7', name: 'Sancerre 2022', wine_type: 'white', country: 'France', drunk_at: '2026-05-01', image_url: null, tasting_tags: ['미네랄', '활발한 산도', '흑연', '자몽'] },
  { id: '8', name: 'Tignanello 2019', wine_type: 'red', country: 'Italy', drunk_at: '2026-03-20', image_url: null, tasting_tags: ['카시스', '참나무', '담배', '풀바디', '가죽'] },
  { id: '9', name: 'Provence Rosé', wine_type: 'rosé', country: 'France', drunk_at: '2026-06-01', image_url: null, tasting_tags: ['활발한 산도', '딸기', '인동초'] },
  { id: '10', name: 'Ridge Monte Bello', wine_type: 'red', country: 'USA', drunk_at: '2026-02-14', image_url: null, tasting_tags: ['카시스', '참나무', '풀바디', '긴 여운', '시나몬'] },
  { id: '11', name: 'Mosel Riesling', wine_type: 'white', country: 'Germany', drunk_at: '2026-01-12', image_url: null, tasting_tags: ['라임', '꿀', '석유', '높은 산도'] },
  { id: '12', name: 'Rioja Gran Reserva', wine_type: 'red', country: 'Spain', drunk_at: '2026-02-22', image_url: null, tasting_tags: ['자두', '바닐라', '가죽', '담배', '시나몬'] },
]

const TYPE_LABEL: Record<string, string> = {
  red: '레드', white: '화이트', sparkling: '샴페인', rosé: '로제', dessert: '디저트',
}
const TYPE_EMOJI: Record<string, string> = {
  red: '🍷', white: '🥂', sparkling: '🍾', rosé: '🌸', dessert: '🍯',
}

const COUNTRY_FLAG: Record<string, string> = {
  France: '🇫🇷', Italy: '🇮🇹', USA: '🇺🇸', Spain: '🇪🇸', Japan: '🇯🇵', Germany: '🇩🇪',
  'South Africa': '🇿🇦', Chile: '🇨🇱', Australia: '🇦🇺', Argentina: '🇦🇷', Portugal: '🇵🇹',
  'United Kingdom': '🇬🇧', 'South Korea': '🇰🇷',
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
        flexShrink: 0,
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
  const [openCats, setOpenCats] = useState<Set<string>>(new Set())

  const toggle = (arr: string[], v: string, setter: (next: string[]) => void) => {
    setter(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  }

  function toggleCat(cat: string) {
    setOpenCats(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const { countryCount, noteCount, sortedCountries, sortedNotes } = useMemo(() => {
    const cc: Record<string, number> = {}
    const nc: Record<string, number> = {}
    MOCK_WINES.forEach(w => {
      if (w.country) cc[w.country] = (cc[w.country] || 0) + 1
      if (Array.isArray(w.tasting_tags)) {
        const canonicalSet = new Set<string>()
        w.tasting_tags.forEach(t => { if (t) canonicalSet.add(normalizeNote(t)) })
        canonicalSet.forEach(c => { nc[c] = (nc[c] || 0) + 1 })
      }
    })
    // umbrella union counts
    NOTES_VOCABULARY.forEach(cat => {
      cat.tags.forEach(entry => {
        if (entry.includes && entry.includes.length > 0) {
          let count = 0
          MOCK_WINES.forEach(w => {
            if (!Array.isArray(w.tasting_tags)) return
            const tags = w.tasting_tags.map(t => normalizeNote(t))
            const matches = tags.includes(entry.ko) || entry.includes!.some(c => tags.includes(c))
            if (matches) count++
          })
          if (count > 0) nc[entry.ko] = count
        }
      })
    })
    return {
      countryCount: cc,
      noteCount: nc,
      sortedCountries: Object.entries(cc).sort((a, b) => b[1] - a[1]).map(([c]) => c),
      sortedNotes: Object.entries(nc).sort((a, b) => b[1] - a[1]).map(([n]) => n),
    }
  }, [])

  const filtered = MOCK_WINES.filter(w => {
    const typeMatch = types.length === 0 || types.includes(w.wine_type)
    const countryMatch = countries.length === 0 || countries.includes(w.country)
    const notesMatch = notes.length === 0 || (Array.isArray(w.tasting_tags) && notes.every(n => wineMatchesFilterTag(w.tasting_tags, n)))
    return typeMatch && countryMatch && notesMatch
  }).sort((a, b) => (b.drunk_at || '').localeCompare(a.drunk_at || ''))

  const hasFilter = types.length + countries.length + notes.length > 0

  return (
    <div id="app-container" style={{ paddingBottom: '80px' }}>
      {/* Hero — 컴팩트 */}
      <div style={{ padding: '36px 24px 8px' }}>
        <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '4px', textShadow: '0 1px 8px rgba(244,239,230,0.7)' }}>SAMPLES · SEARCH</div>
        <h1 className="type-display-2" style={{ color: 'var(--ink-charcoal)', margin: '0 0 4px', fontSize: '28px', textShadow: '0 1px 12px rgba(244,239,230,0.85)' }}>
          Find your wine.
        </h1>
      </div>

      {/* 필터 카드 — 라벨 제거, 여백 축소 */}
      <div style={{ padding: '8px 16px 0' }}>
        <div className="glass-card glass-card--light" style={{ padding: '14px 14px' }}>

          {/* 종류 — 라벨 없음 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {(['red', 'white', 'sparkling', 'rosé', 'dessert'] as const).map(t => (
              <Chip key={t} active={types.includes(t)} onClick={() => toggle(types, t, setTypes)}>
                {TYPE_LABEL[t]}
              </Chip>
            ))}
          </div>

          {/* 국가 — 가로 스크롤 + 라벨 없음 */}
          {sortedCountries.length > 0 && (
            <>
              <div style={{ height: 1, background: 'rgba(200,184,154,0.35)', margin: '10px 0' }}/>
              <div
                className="hide-scrollbar"
                style={{
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  WebkitOverflowScrolling: 'touch',
                  // bleed to card edges for "swipe me" affordance
                  margin: '0 -14px',
                  padding: '0 14px',
                }}
              >
                {sortedCountries.map(c => (
                  <Chip key={c} active={countries.includes(c)} onClick={() => toggle(countries, c, setCountries)}>
                    <span title={c} style={{ fontSize: '16px', lineHeight: 1 }}>{COUNTRY_FLAG[c] || '🍾'}</span>
                  </Chip>
                ))}
              </div>
            </>
          )}

          {/* 노트 — 라벨 없음, 카테고리만 표시 */}
          {sortedNotes.length > 0 && (() => {
            const byCat: Record<string, string[]> = {}
            sortedNotes.forEach(n => {
              const cat = categorizeNote(n)
              if (!byCat[cat]) byCat[cat] = []
              byCat[cat].push(n)
            })
            const orderedCats = [
              ...NOTES_VOCABULARY.map(c => c.name_ko).filter(n => byCat[n]?.length),
              ...(byCat['기타']?.length ? ['기타'] : []),
            ]
            return (
              <>
                <div style={{ height: 1, background: 'rgba(200,184,154,0.35)', margin: '10px 0' }}/>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {orderedCats.map((cat, idx) => {
                    const isOpen = openCats.has(cat)
                    const selectedInCat = byCat[cat].filter(n => notes.includes(n)).length
                    return (
                      <div key={cat}>
                        {idx > 0 && <div style={{ height: 1, background: 'rgba(200,184,154,0.25)' }}/>}
                        <button
                          onClick={() => toggleCat(cat)}
                          aria-expanded={isOpen}
                          style={{
                            width: '100%', padding: '8px 0',
                            background: 'none', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--ink-charcoal)',
                            letterSpacing: '-0.01em',
                          }}>
                            {cat}
                            <span style={{
                              color: 'var(--ink-mist)',
                              fontWeight: 400,
                              marginLeft: '6px',
                              fontSize: '11px',
                            }}>
                              ({byCat[cat].length})
                            </span>
                            {selectedInCat > 0 && (
                              <span style={{
                                color: 'var(--ink-bordeaux)',
                                fontSize: '11px',
                                marginLeft: '6px',
                                fontWeight: 600,
                              }}>
                                · {selectedInCat} 선택
                              </span>
                            )}
                          </span>
                          <span style={{
                            width: 22, height: 22, borderRadius: '50%',
                            border: '1px solid rgba(107,31,42,0.35)',
                            background: isOpen ? 'var(--ink-bordeaux)' : 'rgba(107,31,42,0.06)',
                            color: isOpen ? '#fff' : 'var(--ink-bordeaux)',
                            fontSize: '12px', fontWeight: 400,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            lineHeight: 1, paddingBottom: '1px',
                            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                            transition: 'transform var(--dur-base) var(--ease-out-soft), background var(--dur-base) ease, color var(--dur-base) ease',
                            flexShrink: 0,
                          }}>+</span>
                        </button>
                        {isOpen && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', paddingBottom: '10px' }}>
                            {byCat[cat]
                              .slice()
                              .sort((a, b) => {
                                const au = isUmbrellaTag(a)
                                const bu = isUmbrellaTag(b)
                                if (au && !bu) return -1
                                if (!au && bu) return 1
                                return (noteCount[b] ?? 0) - (noteCount[a] ?? 0)
                              })
                              .map(n => {
                                const umbrella = isUmbrellaTag(n)
                                return (
                                  <Chip key={n} active={notes.includes(n)} onClick={() => toggle(notes, n, setNotes)}>
                                    {umbrella && <span style={{ marginRight: '3px', opacity: 0.6 }}>◆</span>}
                                    {n}
                                    <span style={{ opacity: 0.7, marginLeft: '2px', fontSize: '10px' }}>({noteCount[n]})</span>
                                  </Chip>
                                )
                              })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )
          })()}

          {hasFilter && (
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
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

      {/* 결과 */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ padding: '0 8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="type-caption" style={{ color: 'var(--ink-bordeaux)' }}>
            {hasFilter ? '필터 결과' : '전체 와인'}
          </div>
          <div className="type-micro" style={{ color: 'var(--ink-mist)' }}>
            {filtered.length}병
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card glass-card--light" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px', opacity: 0.5 }}>🔍</div>
            <div className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', marginBottom: '4px' }}>일치하는 와인 없음</div>
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

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
