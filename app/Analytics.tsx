'use client'
import { useState, useEffect, useRef } from 'react'
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { supabase } from '../lib/supabase'
import { parseImagePosition } from './ImagePositioner'

const WINE_TYPE_LABEL: Record<string, string> = {
  red: 'Red', white: 'White', sparkling: 'Champagne', rosé: 'Rosé', dessert: 'Dessert',
}
const WINE_TYPE_EMOJI: Record<string, string> = {
  red: '🍷', white: '🥂', sparkling: '🍾', rosé: '🌸', dessert: '🍯',
}
const WINE_TYPE_COLOR: Record<string, string> = {
  red: '#6B1F2A',     // bordeaux
  white: '#5C6B3F',   // olive
  sparkling: '#B8860B', // ochre
  rosé: '#A45560',
  dessert: '#A06A1A',
}

// 같은 나라의 다른 표기를 표준 이름으로 통일
const COUNTRY_ALIASES: Record<string, string> = {
  // United States
  'us': 'United States',
  'usa': 'United States',
  'u.s.': 'United States',
  'u.s.a.': 'United States',
  'united states': 'United States',
  'united states of america': 'United States',
  '미국': 'United States',
  // United Kingdom
  'uk': 'United Kingdom',
  'u.k.': 'United Kingdom',
  'great britain': 'United Kingdom',
  'britain': 'United Kingdom',
  'united kingdom': 'United Kingdom',
  '영국': 'United Kingdom',
  // South Korea
  'korea': 'South Korea',
  'south korea': 'South Korea',
  '한국': 'South Korea',
  '대한민국': 'South Korea',
  // 흔한 영-한 매핑 (한글 표기 → 영문 표준)
  '프랑스': 'France',
  '이탈리아': 'Italy',
  '스페인': 'Spain',
  '독일': 'Germany',
  '호주': 'Australia',
  '칠레': 'Chile',
  '아르헨티나': 'Argentina',
  '포르투갈': 'Portugal',
  '오스트리아': 'Austria',
  '뉴질랜드': 'New Zealand',
  '남아프리카': 'South Africa',
  '그리스': 'Greece',
  '일본': 'Japan',
}

function normalizeCountry(name?: string): string {
  if (!name) return ''
  const key = name.trim().toLowerCase()
  return COUNTRY_ALIASES[key] || COUNTRY_ALIASES[name.trim()] || name.trim()
}

const COUNTRY_FLAG: Record<string, string> = {
  'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Germany': '🇩🇪',
  'USA': '🇺🇸', 'United States': '🇺🇸', 'Australia': '🇦🇺', 'Chile': '🇨🇱',
  'Argentina': '🇦🇷', 'Portugal': '🇵🇹', 'Austria': '🇦🇹', 'New Zealand': '🇳🇿',
  'South Africa': '🇿🇦', 'Greece': '🇬🇷', 'Hungary': '🇭🇺', 'Romania': '🇷🇴',
  'Bulgaria': '🇧🇬', 'Croatia': '🇭🇷', 'Slovenia': '🇸🇮', 'Georgia': '🇬🇪',
  'Lebanon': '🇱🇧', 'Israel': '🇮🇱', 'Japan': '🇯🇵', 'China': '🇨🇳',
  '프랑스': '🇫🇷', '이탈리아': '🇮🇹', '스페인': '🇪🇸', '독일': '🇩🇪',
  '미국': '🇺🇸', '호주': '🇦🇺', '칠레': '🇨🇱', '아르헨티나': '🇦🇷',
  '포르투갈': '🇵🇹', '오스트리아': '🇦🇹', '뉴질랜드': '🇳🇿', '남아프리카': '🇿🇦',
  '그리스': '🇬🇷', '일본': '🇯🇵', '한국': '🇰🇷',
}

const FOOD_EMOJI: Record<string, string> = {
  '소고기': '🥩', '돼지고기': '🍖', '양고기': '🫀', '닭고기': '🍗', '샤퀴테리': '🥓',
  '해산물': '🦞', '생선회': '🐟', '굴': '🦪', '생선': '🐠',
  '피자': '🍕', '햄버거': '🍔', '파스타': '🍝',
  '마라탕': '🌶️', '베이징덕': '🦆', '딤섬': '🥟',
  '치즈': '🧀', '샐러드': '🥗', '디저트': '🍰', '케이크': '🎂',
  '회': '🍣',
}

function countryWithFlag(name: string) {
  return `${COUNTRY_FLAG[name] || '🍾'} ${name}`
}

const NUMBER_WORDS: Record<number, string> = {
  0: 'Zero', 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten',
  11: 'Eleven', 12: 'Twelve', 13: 'Thirteen', 14: 'Fourteen', 15: 'Fifteen', 16: 'Sixteen', 17: 'Seventeen', 18: 'Eighteen', 19: 'Nineteen',
}
const TENS: Record<number, string> = { 20: 'Twenty', 30: 'Thirty', 40: 'Forty', 50: 'Fifty', 60: 'Sixty', 70: 'Seventy', 80: 'Eighty', 90: 'Ninety' }
function numberToWord(n: number): string {
  if (n <= 19) return NUMBER_WORDS[n] || String(n)
  if (n < 100) {
    const t = Math.floor(n / 10) * 10
    const r = n % 10
    return r === 0 ? TENS[t] : `${TENS[t]}-${NUMBER_WORDS[r].toLowerCase()}`
  }
  return String(n)
}

function useScrollVisible(threshold = 0.12) {
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
  }, [threshold])
  return { ref, visible }
}

function CountUp({ to, decimals = 0, duration = 900 }: { to: number; decimals?: number; duration?: number }) {
  const [value, setValue] = useState(0)
  const startedRef = useRef(false)
  useEffect(() => {
    if (startedRef.current || to === 0) return
    startedRef.current = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to); return
    }
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(to * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, duration])
  return <>{decimals > 0 ? value.toFixed(decimals) : Math.floor(value)}</>
}

function Section({ caption, title, children, delay = 0 }: { caption: string; title?: string; children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useScrollVisible()
  return (
    <section ref={ref} className="glass-card glass-card--light" style={{
      padding: '24px 22px',
      marginBottom: '20px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: `opacity 0.55s var(--ease-out-soft) ${delay}ms, transform 0.55s var(--ease-out-soft) ${delay}ms`,
    }}>
      <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '14px' }}>{caption}</div>
      {title && <h3 className="type-display-2" style={{ color: 'var(--ink-charcoal)', margin: '0 0 18px', fontSize: '32px' }}>{title}</h3>}
      {children}
    </section>
  )
}

function HorizontalBar({ data, accent, unit = '병', labelEmoji, visible, delay = 0 }: {
  data: { name: string; count: number }[]
  accent: string
  unit?: string
  labelEmoji?: Record<string, string>
  visible: boolean
  delay?: number
}) {
  const max = Math.max(...data.map(d => d.count))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {data.map((item, i) => {
        const pct = Math.round((item.count / max) * 100)
        const emoji = labelEmoji?.[item.name] || ''
        return (
          <div key={i} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : 'translateX(-8px)',
            transition: `opacity 0.4s ease ${delay + i * 60}ms, transform 0.4s ease ${delay + i * 60}ms`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <span className="type-body" style={{ color: 'var(--ink-charcoal)', fontSize: '14px' }}>
                {emoji ? `${emoji} ${item.name}` : item.name}
              </span>
              <span className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-bordeaux)' }}>
                {item.count}<span className="type-micro" style={{ color: 'var(--ink-mist)', marginLeft: '4px' }}>{unit}</span>
              </span>
            </div>
            <div style={{ height: '2px', background: 'rgba(200,184,154,0.3)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: visible ? `${pct}%` : '0%',
                background: accent,
                transition: `width 0.8s cubic-bezier(0.4,0,0.2,1) ${delay + i * 60}ms`,
              }}/>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BarSection({ caption, data, accent, unit = '병', labelEmoji, delay = 0 }: {
  caption: string
  data: { name: string; count: number }[]
  accent: string
  unit?: string
  labelEmoji?: Record<string, string>
  delay?: number
}) {
  const { ref, visible } = useScrollVisible()
  return (
    <section ref={ref} className="glass-card glass-card--light" style={{
      padding: '22px',
      marginBottom: '20px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: `opacity 0.55s var(--ease-out-soft) ${delay}ms, transform 0.55s var(--ease-out-soft) ${delay}ms`,
    }}>
      <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '18px' }}>{caption}</div>
      <HorizontalBar data={data} accent={accent} unit={unit} labelEmoji={labelEmoji} visible={visible} delay={delay} />
    </section>
  )
}

function VintageTimeline({ data, visible }: { data: { name: string; count: number }[]; visible: boolean }) {
  const max = Math.max(...data.map(d => d.count))
  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', minWidth: `${data.length * 48}px`, padding: '8px 4px 0' }}>
        {data.map((item, i) => {
          const heightPct = Math.round((item.count / max) * 100)
          const barH = Math.max(20, Math.round((item.count / max) * 120))
          const isMax = item.count === max
          return (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: '0 0 36px',
              opacity: visible ? 1 : 0,
              transition: `opacity 0.4s ease ${i * 40}ms`,
            }}>
              <span className="type-micro" style={{
                color: isMax ? 'var(--ink-bordeaux)' : 'var(--ink-mist)',
                fontStyle: 'italic', letterSpacing: 0,
              }}>{item.count}</span>
              <div style={{
                width: '24px',
                height: visible ? `${barH}px` : '0px',
                borderRadius: '2px',
                background: isMax ? 'var(--ink-bordeaux)' : `rgba(107,31,42,${0.25 + (heightPct / 100) * 0.45})`,
                transition: `height 0.7s cubic-bezier(0.4,0,0.2,1) ${i * 50}ms`,
              }}/>
              <span style={{ fontSize: '9px', color: 'var(--ink-sand)', fontWeight: 500, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
                {String(item.name).replace('년', '')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function VintageSection({ data }: { data: { name: string; count: number }[] }) {
  const { ref, visible } = useScrollVisible()
  return (
    <section ref={ref} className="glass-card glass-card--light" style={{
      padding: '22px',
      marginBottom: '20px',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.55s var(--ease-out-soft), transform 0.55s var(--ease-out-soft)',
    }}>
      <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '18px' }}>Vintage Distribution</div>
      <VintageTimeline data={data} visible={visible} />
    </section>
  )
}

// ── 헬퍼: 미니 와인 카드 (Year in Wine 월별 확장용) ──
const TYPE_EMOJI: Record<string, string> = {
  red: '🍷', white: '🥂', sparkling: '🍾', rosé: '🌸', dessert: '🍯',
}

function fmtMD(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

function MiniWineCard({ wine, onClick }: { wine: any; onClick: () => void }) {
  const p = parseImagePosition(wine.image_position)
  return (
    <button onClick={onClick} style={{
      position: 'relative',
      aspectRatio: '4 / 5',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-soft)',
      cursor: 'pointer',
      background: wine.image_url ? 'none' : 'linear-gradient(135deg, rgba(107,31,42,0.85), rgba(140,42,58,0.65))',
      border: 'none', padding: 0,
      textAlign: 'left', fontFamily: 'inherit', color: 'inherit',
    }}>
      {wine.image_url ? (
        <img src={wine.image_url} alt={wine.name} style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: `${p.x}% ${p.y}%`,
          transform: p.zoom > 1.005 ? `scale(${p.zoom})` : undefined,
          transformOrigin: 'center center',
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

// ── 확장 가능한 A Year in Wine 차트 ──
function ExpandableYearChart({ monthData, wines, onOpenWine }: {
  monthData: { name: string; count: number }[]
  wines: any[]
  onOpenWine?: (wine: any) => void
}) {
  const { ref, visible } = useScrollVisible()
  const [expanded, setExpanded] = useState<string | null>(null)

  const expandedWines = expanded
    ? wines.filter(w => {
        if (!w.drunk_at) return false
        return w.drunk_at.slice(2, 7) === expanded
      }).sort((a, b) => (b.drunk_at || '').localeCompare(a.drunk_at || ''))
    : []

  return (
    <section ref={ref} className="glass-card glass-card--light" style={{
      padding: '22px', marginBottom: '20px',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.55s var(--ease-out-soft), transform 0.55s var(--ease-out-soft)',
    }}>
      <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '14px' }}>A Year in Wine</div>

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -8px' }}>
        <div style={{ minWidth: Math.max(monthData.length * 48, 320) + 'px' }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthData} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGradExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6B1F2A" stopOpacity={0.28}/>
                  <stop offset="100%" stopColor="#6B1F2A" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(200,184,154,0.4)" vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8A7E6D' }} axisLine={false} tickLine={false} interval={0}/>
              <YAxis tick={{ fontSize: 10, fill: '#8A7E6D' }} axisLine={false} tickLine={false} allowDecimals={false}/>
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(200,184,154,0.5)', boxShadow: '0 4px 16px rgba(107,31,42,0.10)', fontSize: '12px', background: 'rgba(250,246,238,0.95)' }}
                formatter={(v) => [v + '병', '와인 수']}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6B1F2A"
                strokeWidth={2}
                fill="url(#areaGradExp)"
                dot={(props: any) => {
                  const monthName = props.payload.name
                  const isExpanded = monthName === expanded
                  return (
                    <g key={`dot-${monthName}`} style={{ cursor: 'pointer' }} onClick={() => setExpanded(isExpanded ? null : monthName)}>
                      <circle cx={props.cx} cy={props.cy} r={18} fill="transparent" />
                      <circle
                        cx={props.cx} cy={props.cy}
                        r={isExpanded ? 7 : 4}
                        fill={isExpanded ? '#fff' : '#6B1F2A'}
                        stroke="#6B1F2A"
                        strokeWidth={isExpanded ? 2.5 : 0}
                      />
                    </g>
                  )
                }}
                activeDot={false as any}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {expanded && expandedWines.length > 0 && (
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(200,184,154,0.4)' }}>
          <div className="type-micro" style={{ color: 'var(--ink-mist)', textTransform: 'none', letterSpacing: 0, marginBottom: '12px', fontStyle: 'italic' }}>
            {expanded}에 마신 {expandedWines.length}병
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {expandedWines.map(wine => (
              <MiniWineCard key={wine.id} wine={wine} onClick={() => onOpenWine?.(wine)} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// ── Quiz 통계 카드 (응시자별 좌우 분할) ──
type QuizUserStats = {
  total: number
  accuracy: number
  strong: string[]
  weak: string[]
}

function QuizStatColumn({ name, stats }: { name: string; stats: QuizUserStats | null }) {
  if (!stats || stats.total === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px',
          color: 'var(--ink-charcoal)', letterSpacing: '-0.01em',
        }}>{name}</div>
        <div className="type-micro" style={{ color: 'var(--ink-mist)', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>
          아직 응시 기록 없음
        </div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{
        fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px',
        color: 'var(--ink-charcoal)', letterSpacing: '-0.01em',
      }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span className="type-title-md" style={{
          fontStyle: 'italic', color: 'var(--ink-bordeaux)',
          fontSize: '24px', letterSpacing: 0,
        }}>
          {stats.accuracy}<span style={{ fontSize: '13px', color: 'var(--ink-mist)' }}>%</span>
        </span>
        <span className="type-micro" style={{ color: 'var(--ink-mist)' }}>
          / {stats.total}문항
        </span>
      </div>
      {stats.strong.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ color: 'var(--ink-olive)', fontSize: '11px' }}>↑</span>
            <span className="type-micro" style={{ color: 'var(--ink-mist)', textTransform: 'none', letterSpacing: 0, fontSize: '10px' }}>강점</span>
          </div>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--ink-charcoal)', lineHeight: 1.4 }}>
            {stats.strong.join(' · ')}
          </span>
        </div>
      )}
      {stats.weak.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ color: '#B53E2A', fontSize: '11px' }}>↓</span>
            <span className="type-micro" style={{ color: 'var(--ink-mist)', textTransform: 'none', letterSpacing: 0, fontSize: '10px' }}>약점</span>
          </div>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--ink-charcoal)', lineHeight: 1.4 }}>
            {stats.weak.join(' · ')}
          </span>
        </div>
      )}
    </div>
  )
}

function QuizStatsCard() {
  const [stats, setStats] = useState<Record<string, QuizUserStats | null>>({ 재혁: null, 원우: null })

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('quiz_attempts')
        .select('user_name, category, is_correct')
      if (!data) return

      const computed: Record<string, QuizUserStats | null> = { 재혁: null, 원우: null }
      for (const name of ['재혁', '원우']) {
        const rows = data.filter(d => d.user_name === name)
        if (rows.length === 0) { computed[name] = null; continue }
        const total = rows.length
        const accuracy = Math.round(rows.filter(r => r.is_correct).length / total * 100)
        // category accuracy (min 3 attempts in that category)
        const byCat: Record<string, { total: number; correct: number }> = {}
        for (const r of rows) {
          const c = r.category || '기타'
          if (!byCat[c]) byCat[c] = { total: 0, correct: 0 }
          byCat[c].total++
          if (r.is_correct) byCat[c].correct++
        }
        const catList = Object.entries(byCat)
          .filter(([_, v]) => v.total >= 3)
          .map(([c, v]) => ({ category: c, accuracy: v.correct / v.total }))
          .sort((a, b) => b.accuracy - a.accuracy)
        computed[name] = {
          total, accuracy,
          strong: catList.slice(0, 2).map(c => c.category),
          weak: catList.slice(-2).reverse().map(c => c.category).filter(c => !catList.slice(0, 2).map(x => x.category).includes(c)),
        }
      }
      setStats(computed)
    }
    load()
  }, [])

  return (
    <section className="glass-card glass-card--light" style={{ padding: '22px', marginBottom: '20px' }}>
      <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '16px' }}>Quiz · 응시 통계</div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1px 1fr',
        gap: '18px', alignItems: 'stretch',
      }}>
        <QuizStatColumn name="재혁" stats={stats.재혁} />
        <div style={{ background: 'rgba(200,184,154,0.4)' }}/>
        <QuizStatColumn name="원우" stats={stats.원우} />
      </div>
    </section>
  )
}

export default function Analytics({ wines, onOpenWine }: { wines: any[]; onOpenWine?: (wine: any) => void }) {
  const [insight, setInsight] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [insightError, setInsightError] = useState('')

  async function fetchInsight() {
    setLoading(true); setInsightError('')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wines }),
      })
      const result = await res.json()
      if (result.success) setInsight(result.data)
      else setInsightError('분석 실패: ' + result.error)
    } catch (e: any) { setInsightError('오류: ' + e.message) }
    setLoading(false)
  }

  if (wines.length === 0) {
    return (
      <div style={{ padding: '40px 24px' }}>
        <div className="glass-card glass-card--light" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.6 }}>📊</div>
          <div className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', marginBottom: '8px' }}>분석 준비 중</div>
          <div className="type-micro" style={{ color: 'var(--ink-mist)' }}>WINES MUST BE LOGGED FIRST</div>
        </div>
      </div>
    )
  }

  const typeData = Object.entries(
    wines.reduce((acc, w) => { acc[w.wine_type] = (acc[w.wine_type] || 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([type, count]) => ({ type, name: WINE_TYPE_LABEL[type] || type, value: count as number, color: WINE_TYPE_COLOR[type] || '#6B1F2A', emoji: WINE_TYPE_EMOJI[type] || '🍷' }))

  const regionData = Object.entries(
    wines.reduce((acc, w) => { if (w.region) acc[w.region] = (acc[w.region] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8).map(([name, count]) => ({ name, count: count as number }))

  const countryData = Object.entries(
    wines.reduce((acc, w) => {
      const key = normalizeCountry(w.country)
      if (key) acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8)
    .map(([name, count]) => ({ name: countryWithFlag(name), count: count as number }))

  const grapeData = Object.entries(
    wines.reduce((acc, w) => {
      if (w.grape_variety?.length > 0) {
        const p = Array.isArray(w.grape_variety) ? w.grape_variety[0] : w.grape_variety
        if (p) acc[p] = (acc[p] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8).map(([name, count]) => ({ name, count: count as number }))

  const monthData = Object.entries(
    wines.reduce((acc, w) => {
      if (w.drunk_at) { const m = w.drunk_at.slice(0, 7); acc[m] = (acc[m] || 0) + 1 }
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => a[0].localeCompare(b[0])).map(([month, count]) => ({ name: month.slice(2), count: count as number }))

  const vintageData = Object.entries(
    wines.reduce((acc, w) => { if (w.vintage_year) acc[w.vintage_year] = (acc[w.vintage_year] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => Number(a[0]) - Number(b[0])).map(([name, count]) => ({ name: name + '년', count: count as number }))

  const foodData = Object.entries(
    wines.reduce((acc, w) => {
      if (w.food_pairings?.length > 0) w.food_pairings.forEach((f: string) => { acc[f] = (acc[f] || 0) + 1 })
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 10).map(([name, count]) => ({ name, count: count as number }))

  const countriesCount = new Set(wines.map(w => normalizeCountry(w.country)).filter(Boolean)).size
  const regionsCount = new Set(wines.map(w => w.region).filter(Boolean)).size

  return (
    <div style={{ padding: '24px 16px 120px', fontFamily: 'var(--font-sans)' }}>

      {/* The Cellar — 큰 숫자 헤로 */}
      <section className="glass-card glass-card--light" style={{ padding: '28px 22px', marginBottom: '20px' }}>
        <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '14px' }}>The Cellar</div>
        <h2 className="type-display-1" style={{ color: 'var(--ink-charcoal)', margin: '0 0 6px', fontSize: '56px' }}>
          {numberToWord(wines.length)}
        </h2>
        <p className="type-display-2" style={{ color: 'var(--ink-charcoal)', margin: 0, fontSize: '32px', fontStyle: 'italic', fontWeight: 300 }}>
          bottles.
        </p>
      </section>

      {/* 요약 수치 — 2개 글래스 카드 */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div className="glass-card glass-card--light" style={{ padding: '20px' }}>
          <div className="type-micro" style={{ color: 'var(--ink-mist)', marginBottom: '6px' }}>COUNTRIES</div>
          <div className="type-display-2" style={{ color: 'var(--ink-charcoal)', fontSize: '40px' }}><CountUp to={countriesCount} /></div>
        </div>
        <div className="glass-card glass-card--light" style={{ padding: '20px' }}>
          <div className="type-micro" style={{ color: 'var(--ink-mist)', marginBottom: '6px' }}>REGIONS</div>
          <div className="type-display-2" style={{ color: 'var(--ink-charcoal)', fontSize: '40px' }}><CountUp to={regionsCount} /></div>
        </div>
      </section>

      {/* A Year in Wine — 월별 추이 (월 클릭 시 와인 카드 확장) */}
      <ExpandableYearChart monthData={monthData} wines={wines} onOpenWine={onOpenWine} />

      {/* By Type — 가로 막대 (도넛 대체) */}
      <section className="glass-card glass-card--light" style={{ padding: '22px', marginBottom: '20px' }}>
        <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '18px' }}>By Type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {(() => {
            const max = Math.max(...typeData.map(d => d.value))
            return typeData.map(item => {
              const pct = Math.round((item.value / max) * 100)
              return (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <span className="type-body" style={{ color: 'var(--ink-charcoal)' }}>{item.emoji} {item.name}</span>
                    <span className="type-title-md" style={{ fontStyle: 'italic', color: item.color }}>
                      {item.value}<span className="type-micro" style={{ color: 'var(--ink-mist)', marginLeft: '4px' }}>병</span>
                    </span>
                  </div>
                  <div style={{ height: '2px', background: 'rgba(200,184,154,0.3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: item.color, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }}/>
                  </div>
                </div>
              )
            })
          })()}
        </div>
      </section>

      {countryData.length > 0 && (
        <BarSection caption="By Country" data={countryData} accent="var(--ink-bordeaux)" delay={0} />
      )}

      {regionData.length > 0 && (
        <BarSection caption="By Region" data={regionData} accent="var(--ink-olive)" delay={60} />
      )}

      {grapeData.length > 0 && (
        <BarSection caption="The Grapes" data={grapeData} accent="var(--ink-ochre)" delay={0} />
      )}

      {vintageData.length > 0 && <VintageSection data={vintageData} />}

      {foodData.length > 0 && (
        <BarSection caption="Paired Most Often" data={foodData} accent="var(--ink-ochre)" unit="회" labelEmoji={FOOD_EMOJI} delay={0} />
      )}

      <QuizStatsCard />

      <AIInsight insight={insight} loading={loading} insightError={insightError} onFetch={fetchInsight} />
    </div>
  )
}

function AIInsight({ insight, loading, insightError, onFetch }: any) {
  const { ref, visible } = useScrollVisible()
  return (
    <section ref={ref} className="glass-card glass-card--strong" style={{
      padding: '24px', marginBottom: '20px',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.6s var(--ease-out-soft), transform 0.6s var(--ease-out-soft)',
    }}>
      <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '8px' }}>AI Insight</div>
      <h3 className="type-title-lg" style={{ color: 'var(--ink-charcoal)', margin: '0 0 6px' }}>
        Claude reads your cellar.
      </h3>
      <p className="type-body" style={{ fontStyle: 'italic', color: 'var(--ink-mist)', margin: '0 0 20px' }}>
        두 분의 취향을 분석해드려요.
      </p>

      {!insight && !loading && (
        <button onClick={onFetch} className="type-caption" style={{
          width: '100%', padding: '14px',
          borderRadius: 'var(--radius-md)', background: 'var(--ink-bordeaux)',
          border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)',
        }}>
          🔍 취향 분석 시작
        </button>
      )}
      {loading && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🍷</div>
          <div className="type-body" style={{ fontStyle: 'italic', color: 'var(--ink-mist)' }}>Claude가 와인 기록을 분석 중…</div>
        </div>
      )}
      {insightError && (
        <div className="type-body" style={{ padding: '10px 14px', background: 'rgba(181,62,42,0.08)', border: '1px solid rgba(181,62,42,0.2)', borderRadius: 'var(--radius-md)', color: '#B53E2A' }}>{insightError}</div>
      )}
      {insight && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div className="type-micro" style={{ color: 'var(--ink-mist)', marginBottom: '8px' }}>OVERVIEW</div>
            <p className="type-body" style={{ color: 'var(--ink-charcoal)', margin: 0, lineHeight: 1.65 }}>{insight.overall}</p>
          </div>
          <div style={{ height: 1, background: 'rgba(200,184,154,0.4)' }}/>
          {[
            { key: 'jaehyuk', label: 'Jaehyeok', color: 'var(--ink-bordeaux)' },
            { key: 'wonwoo',  label: 'Wonwoo',   color: 'var(--ink-olive)' },
          ].map(p => (
            <div key={p.key}>
              <div className="type-caption" style={{ color: p.color, marginBottom: '8px' }}>{p.label}</div>
              <p className="type-body" style={{ color: 'var(--ink-charcoal)', margin: '0 0 6px', lineHeight: 1.65 }}>{insight[p.key]?.taste_profile}</p>
              <p className="type-body" style={{ fontStyle: 'italic', color: 'var(--ink-mist)', margin: 0 }}>💡 {insight[p.key]?.insight}</p>
            </div>
          ))}
          <div style={{ height: 1, background: 'rgba(200,184,154,0.4)' }}/>
          <div>
            <div className="type-micro" style={{ color: 'var(--ink-olive)', marginBottom: '8px' }}>PAIRING SUGGESTION</div>
            <p className="type-body" style={{ color: 'var(--ink-charcoal)', margin: 0, lineHeight: 1.65 }}>🥂 {insight.pairing}</p>
          </div>
          <div>
            <div className="type-micro" style={{ color: 'var(--ink-ochre)', marginBottom: '8px' }}>FUN FACT</div>
            <p className="type-body" style={{ color: 'var(--ink-charcoal)', margin: 0, lineHeight: 1.65 }}>🎯 {insight.fun_fact}</p>
          </div>
          <button onClick={onFetch} className="type-micro" style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px dashed rgba(200,184,154,0.7)', color: 'var(--ink-mist)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            ↻ 다시 분석하기
          </button>
        </div>
      )}
    </section>
  )
}
