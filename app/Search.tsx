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
                      {COUNTRY_FLAG[c] || '🍾'} {c} <span style={{ opacity: 0.7, marginLeft: '2px', fontSize: '10px' }}>({countryCount[c]})</span>
                    </Chip>
                  ))}
                </div>
              </div>
            </>
          )}

          {sortedNotes.length > 0 && (
            <>
              <div style={{ height: 1, background: 'rgba(200,184,154,0.4)', margin: '14px 0' }}/>
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
            </>
          )}

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
