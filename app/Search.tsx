'use client'

import { useMemo, useState } from 'react'
import { MiniWineCard } from './MiniWineCard'
import { NOTES_VOCABULARY, normalizeNote, categorizeNote, wineMatchesFilterTag, isUmbrellaTag } from './notesVocabulary'

const TYPE_LABEL: Record<string, string> = {
  red: '레드', white: '화이트', sparkling: '샴페인', rosé: '로제', dessert: '디저트',
}

const COUNTRY_FLAG: Record<string, string> = {
  'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Germany': '🇩🇪',
  'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Australia': '🇦🇺', 'Chile': '🇨🇱',
  'Argentina': '🇦🇷', 'Portugal': '🇵🇹', 'Austria': '🇦🇹', 'New Zealand': '🇳🇿',
  'South Africa': '🇿🇦', 'Greece': '🇬🇷', 'Hungary': '🇭🇺', 'Romania': '🇷🇴',
  'Bulgaria': '🇧🇬', 'Croatia': '🇭🇷', 'Slovenia': '🇸🇮', 'Georgia': '🇬🇪',
  'Lebanon': '🇱🇧', 'Israel': '🇮🇱', 'Japan': '🇯🇵', 'China': '🇨🇳',
  'South Korea': '🇰🇷',
}

const COUNTRY_ALIASES: Record<string, string> = {
  'us': 'United States', 'usa': 'United States', 'u.s.': 'United States',
  'u.s.a.': 'United States', 'united states': 'United States',
  'united states of america': 'United States', '미국': 'United States',
  'uk': 'United Kingdom', 'u.k.': 'United Kingdom', 'great britain': 'United Kingdom',
  'britain': 'United Kingdom', 'united kingdom': 'United Kingdom', '영국': 'United Kingdom',
  'korea': 'South Korea', 'south korea': 'South Korea', '한국': 'South Korea',
  '대한민국': 'South Korea',
  '프랑스': 'France', '이탈리아': 'Italy', '스페인': 'Spain', '독일': 'Germany',
  '호주': 'Australia', '칠레': 'Chile', '아르헨티나': 'Argentina', '포르투갈': 'Portugal',
  '오스트리아': 'Austria', '뉴질랜드': 'New Zealand', '남아프리카': 'South Africa',
  '그리스': 'Greece', '일본': 'Japan',
}

function normalizeCountry(name?: string): string {
  if (!name) return ''
  const key = name.trim().toLowerCase()
  return COUNTRY_ALIASES[key] || COUNTRY_ALIASES[name.trim()] || name.trim()
}

// 노트 카테고리·정규화 로직은 ./notesVocabulary 모듈에서 import

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

type Props = {
  wines: any[]
  onOpenWine?: (wine: any) => void
}

export default function Search({ wines, onOpenWine }: Props) {
  const [types, setTypes] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [openCats, setOpenCats] = useState<Set<string>>(new Set())

  function toggleCat(cat: string) {
    setOpenCats(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const toggle = (arr: string[], v: string, setter: (next: string[]) => void) => {
    setter(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  }

  const { countryCount, noteCount, sortedCountries, sortedNotes } = useMemo(() => {
    const cc: Record<string, number> = {}
    const nc: Record<string, number> = {}  // canonical 기준 카운트

    wines.forEach(w => {
      // 국가 (이미 normalize 적용)
      if (w.country) {
        const c = normalizeCountry(w.country)
        if (c) cc[c] = (cc[c] || 0) + 1
      }
      // 노트: 각 wine의 태그를 canonical로 정규화한 unique set 만들고 카운트
      if (Array.isArray(w.tasting_tags)) {
        const canonicalSet = new Set<string>()
        w.tasting_tags.forEach((t: string) => {
          if (t) canonicalSet.add(normalizeNote(t))
        })
        canonicalSet.forEach(c => { nc[c] = (nc[c] || 0) + 1 })
      }
    })

    // umbrella entries: 자식 태그가 있으면 expanded count 추가 (UNION으로 계산)
    // 사용자가 umbrella 칩 누르면 자식 와인까지 매칭되므로, 카운트도 그 기준
    NOTES_VOCABULARY.forEach(cat => {
      cat.tags.forEach(entry => {
        if (entry.includes && entry.includes.length > 0) {
          // 이 umbrella가 매칭할 와인 수 계산
          let count = 0
          wines.forEach(w => {
            if (!Array.isArray(w.tasting_tags)) return
            const canonicalTags = w.tasting_tags.map((t: string) => normalizeNote(t))
            const matches =
              canonicalTags.includes(entry.ko) ||
              entry.includes!.some(child => canonicalTags.includes(child))
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
  }, [wines])

  // 필터링: 종류·국가는 각 그룹 내 OR, 그룹 간 AND. 노트는 모두 만족(AND) + umbrella expansion
  const filtered = wines.filter(w => {
    const typeMatch = types.length === 0 || types.includes(w.wine_type)
    const countryMatch = countries.length === 0 || (w.country && countries.includes(normalizeCountry(w.country)))
    const notesMatch = notes.length === 0 || (Array.isArray(w.tasting_tags) && notes.every(n => wineMatchesFilterTag(w.tasting_tags, n)))
    return typeMatch && countryMatch && notesMatch
  }).sort((a, b) => (b.drunk_at || '').localeCompare(a.drunk_at || ''))

  const hasFilter = types.length + countries.length + notes.length > 0

  return (
    <div style={{ paddingBottom: '120px' }}>
      {/* Hero — 컴팩트 */}
      <div style={{ padding: '16px 24px 4px' }}>
        <div className="type-caption" style={{ color: 'var(--ink-bordeaux)' }}>SEARCH</div>
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

          {/* 국가 — 가로 스크롤, 라벨 없음 */}
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

          {/* 노트 — 라벨 없음, 카테고리 토글만 */}
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
                          {idx > 0 && <div style={{ height: 1, background: 'rgba(200,184,154,0.3)' }}/>}
                          <button
                            onClick={() => toggleCat(cat)}
                            aria-expanded={isOpen}
                            style={{
                              width: '100%', padding: '10px 0',
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
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', paddingBottom: '12px' }}>
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

      {/* 결과 */}
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
            <div className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', marginBottom: '6px' }}>
              {hasFilter ? '일치하는 와인 없음' : '아직 와인 없음'}
            </div>
            <div className="type-micro" style={{ color: 'var(--ink-mist)' }}>
              {hasFilter ? '필터를 조정해보세요' : '홈에서 와인을 추가해보세요'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {filtered.map(wine => (
              <MiniWineCard key={wine.id} wine={wine} onClick={() => onOpenWine?.(wine)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
