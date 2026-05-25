'use client'

import { useMemo, useState } from 'react'
import { MiniWineCard } from './MiniWineCard'

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

// 노트 카테고리 매핑
const NOTE_CATEGORIES: { name: string; keywords: string[] }[] = [
  {
    name: '과일·꽃·허브',
    keywords: [
      // 검은/붉은/흰 과일
      '블랙커런트','블랙체리','블랙베리','자두','검은체리','체리','딸기','라즈베리','크랜베리','석류',
      '사과','배','복숭아','살구','레몬','자몽','오렌지','라임','파인애플','망고','패션프루트','리치',
      '말린과일','잼','잼처럼','잼같은',
      // 꽃·허브
      '장미','제비꽃','라벤더','아카시아','엘더플라워','꽃향','꽃','민트','바질','타임','유칼립투스','솔잎','허브',
    ],
  },
  {
    name: '향신료·오크·숙성',
    keywords: [
      '오크','바닐라','토스트','시가','담배','가죽','삼나무','시더','계피','시나몬','카다멈',
      '아니스','정향','후추','검은후추','핑크페퍼','스파이시','향신료',
      '커피','카카오','다크초콜릿','초콜릿','캐러멜','버터','버터스카치','꿀',
    ],
  },
  {
    name: '미네랄·흙',
    keywords: [
      '미네랄','미네랄리티','흑연','화약','부싯돌','점토','백악','석회','젖은돌','젖은','돌','이끼',
      '버섯','트러플','흙','낙엽','삼림','숲',
    ],
  },
  {
    name: '구조·질감',
    keywords: [
      '탄닌감','탄닌','풀바디','미디엄바디','라이트바디','바디감','바디',
      '산도','신맛','크리미','실키','벨벳','부드러움','부드러운','거칠음','거친',
      '드라이','오프드라이','스위트','단맛','리치한','응축감','농축감','농밀',
    ],
  },
  {
    name: '여운·종합',
    keywords: [
      '긴 여운','짧은 여운','깔끔한 여운','여운','마무리','피니시',
      '복합적','복합미','단순한','우아함','강건함','균형','균형감','모던','클래식',
      '신선함','신선한','응집된','조화로움',
    ],
  },
]

function categorizeNote(note: string): string {
  for (const cat of NOTE_CATEGORIES) {
    if (cat.keywords.some(k => note === k || note.includes(k))) return cat.name
  }
  return '기타'
}

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
    const nc: Record<string, number> = {}
    wines.forEach(w => {
      if (w.country) {
        const c = normalizeCountry(w.country)
        if (c) cc[c] = (cc[c] || 0) + 1
      }
      if (Array.isArray(w.tasting_tags)) {
        w.tasting_tags.forEach((t: string) => {
          if (t) nc[t] = (nc[t] || 0) + 1
        })
      }
    })
    return {
      countryCount: cc,
      noteCount: nc,
      sortedCountries: Object.entries(cc).sort((a, b) => b[1] - a[1]).map(([c]) => c),
      sortedNotes: Object.entries(nc).sort((a, b) => b[1] - a[1]).map(([n]) => n),
    }
  }, [wines])

  // 필터링: 종류·국가는 각 그룹 내 OR, 그룹 간 AND. 노트는 모두 만족(AND)
  const filtered = wines.filter(w => {
    const typeMatch = types.length === 0 || types.includes(w.wine_type)
    const countryMatch = countries.length === 0 || (w.country && countries.includes(normalizeCountry(w.country)))
    const notesMatch = notes.length === 0 || notes.every(n => Array.isArray(w.tasting_tags) && w.tasting_tags.includes(n))
    return typeMatch && countryMatch && notesMatch
  }).sort((a, b) => (b.drunk_at || '').localeCompare(a.drunk_at || ''))

  const hasFilter = types.length + countries.length + notes.length > 0

  return (
    <div style={{ paddingBottom: '120px' }}>
      {/* Hero */}
      <div style={{ padding: '20px 24px 4px' }}>
        <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '4px' }}>SEARCH</div>
        <p className="type-body" style={{
          fontStyle: 'italic', color: 'var(--ink-mist)', margin: 0,
          textTransform: 'none', letterSpacing: 0,
        }}>
          종류 · 국가 · 노트 키워드로 와인 찾기
        </p>
      </div>

      {/* 필터 카드 */}
      <div style={{ padding: '16px 16px 0' }}>
        <div className="glass-card glass-card--light" style={{ padding: '20px 18px' }}>

          {/* 종류 */}
          <div style={{ marginBottom: '14px' }}>
            <div className="type-caption" style={{ color: 'var(--ink-mist)', marginBottom: '10px', fontSize: '10px' }}>종류</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {(['red', 'white', 'sparkling', 'rosé', 'dessert'] as const).map(t => (
                <Chip key={t} active={types.includes(t)} onClick={() => toggle(types, t, setTypes)}>
                  {TYPE_LABEL[t]}
                </Chip>
              ))}
            </div>
          </div>

          {sortedCountries.length > 0 && (
            <>
              <div style={{ height: 1, background: 'rgba(200,184,154,0.4)', margin: '14px 0' }}/>
              <div style={{ marginBottom: '14px' }}>
                <div className="type-caption" style={{ color: 'var(--ink-mist)', marginBottom: '10px', fontSize: '10px' }}>국가</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {sortedCountries.map(c => (
                    <Chip key={c} active={countries.includes(c)} onClick={() => toggle(countries, c, setCountries)}>
                      <span title={c} style={{ fontSize: '16px', lineHeight: 1 }}>{COUNTRY_FLAG[c] || '🍾'}</span>
                    </Chip>
                  ))}
                </div>
              </div>
            </>
          )}

          {sortedNotes.length > 0 && (() => {
            // 카테고리별 그룹핑
            const byCat: Record<string, string[]> = {}
            sortedNotes.forEach(n => {
              const cat = categorizeNote(n)
              if (!byCat[cat]) byCat[cat] = []
              byCat[cat].push(n)
            })
            // 카테고리 순서 (사전 정의 순 + 기타는 마지막)
            const orderedCats = [
              ...NOTE_CATEGORIES.map(c => c.name).filter(n => byCat[n]?.length),
              ...(byCat['기타']?.length ? ['기타'] : []),
            ]
            return (
              <>
                <div style={{ height: 1, background: 'rgba(200,184,154,0.4)', margin: '14px 0' }}/>
                <div>
                  <div className="type-caption" style={{ color: 'var(--ink-mist)', marginBottom: '12px', fontSize: '10px' }}>
                    노트 <span style={{ fontSize: '9px', color: 'var(--ink-sand)' }}>(모두 만족하는 와인)</span>
                  </div>
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
                              {byCat[cat].map(n => (
                                <Chip key={n} active={notes.includes(n)} onClick={() => toggle(notes, n, setNotes)}>
                                  {n} <span style={{ opacity: 0.7, marginLeft: '2px', fontSize: '10px' }}>({noteCount[n]})</span>
                                </Chip>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
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
