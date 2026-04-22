'use client'
import { useState, useEffect, useRef } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts'

const COLORS = ['#8B2635', '#3A7FA0', '#6B8E3A', '#C8A951', '#9B59B6', '#E67E22']

const WINE_TYPE_LABEL: Record<string, string> = {
  red: '레드 🍷', white: '화이트 🥂', sparkling: '샴페인 🍾', rosé: '로제 🌸', dessert: '디저트 🍯',
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

// 음식 이모지 매핑
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
  }, [])
  return { ref, visible }
}

function AnimCard({ children, delay = 0, noPad }: { children: React.ReactNode; delay?: number; noPad?: boolean }) {
  const { ref, visible } = useScrollVisible()
  return (
    <div ref={ref} style={{
      background: '#fff', borderRadius: '16px', padding: noPad ? '0' : '16px', marginBottom: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0', overflow: 'hidden',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
    }}>{children}</div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid #F0EAE0' }}>
      {title}
    </div>
  )
}

// 그라데이션 커스텀 바
function GradBar({ data, gradient, unit = '병', labelEmoji, visible, delay = 0 }: {
  data: { name: string; count: number | string }[]
  gradient: string
  unit?: string
  labelEmoji?: Record<string, string>
  visible: boolean
  delay?: number
}) {
  const max = Math.max(...data.map(d => d.count as number))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map((item, i) => {
        const pct = Math.round(((item.count as number) / max) * 100)
        const emoji = labelEmoji?.[item.name] || ''
        return (
          <div key={i} style={{ opacity: visible ? 1 : 0, transition: `opacity 0.4s ease ${delay + i * 50}ms` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ fontSize: '13px', color: '#333' }}>{emoji ? `${emoji} ${item.name}` : item.name}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#555', background: '#F7F3EE', padding: '2px 8px', borderRadius: '10px' }}>
                {item.count as number}{unit}
              </span>
            </div>
            <div style={{ height: '9px', borderRadius: '5px', background: '#F0EAE0', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: visible ? `${pct}%` : '0%',
                borderRadius: '5px',
                background: gradient,
                transition: `width 0.7s cubic-bezier(0.4,0,0.2,1) ${delay + i * 60}ms`,
                boxShadow: `0 2px 6px ${gradient.includes('8B2635') ? 'rgba(139,38,53,0.3)' : 'rgba(0,0,0,0.15)'}`,
              }}/>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BarSection({ title, data, gradient, unit = '병', labelEmoji, delay = 0 }: {
  title: string
  data: { name: string; count: number | string }[]
  gradient: string
  unit?: string
  labelEmoji?: Record<string, string>
  delay?: number
}) {
  const { ref, visible } = useScrollVisible()
  return (
    <div ref={ref} style={{
      background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
    }}>
      <SectionTitle title={title} />
      <GradBar data={data} gradient={gradient} unit={unit} labelEmoji={labelEmoji} visible={visible} delay={delay} />
    </div>
  )
}

// 빈티지 버블/타임라인 인포그래픽
function VintageTimeline({ data, visible }: { data: { name: string; count: number }[]; visible: boolean }) {
  const max = Math.max(...data.map(d => d.count))
  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', minWidth: `${data.length * 52}px`, padding: '8px 4px 0' }}>
        {data.map((item, i) => {
          const heightPct = Math.round((item.count / max) * 100)
          const barH = Math.max(16, Math.round((item.count / max) * 100))
          const isMax = item.count === max
          return (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: '0 0 44px',
              opacity: visible ? 1 : 0,
              transition: `opacity 0.4s ease ${i * 40}ms`,
            }}>
              {/* 버블 수치 */}
              <div style={{
                fontSize: '11px', fontWeight: '700',
                color: isMax ? '#fff' : '#8B2635',
                background: isMax ? '#8B2635' : 'rgba(139,38,53,0.08)',
                borderRadius: '10px', padding: '2px 6px',
                minWidth: '20px', textAlign: 'center',
              }}>{item.count}</div>
              {/* 바 */}
              <div style={{
                width: '32px',
                height: visible ? `${barH}px` : '0px',
                borderRadius: '6px 6px 2px 2px',
                background: isMax
                  ? 'linear-gradient(180deg, #C0394D, #8B2635)'
                  : `linear-gradient(180deg, rgba(139,38,53,${0.3 + (heightPct / 100) * 0.5}), rgba(139,38,53,${0.2 + (heightPct / 100) * 0.3}))`,
                transition: `height 0.6s cubic-bezier(0.4,0,0.2,1) ${i * 50}ms`,
                boxShadow: isMax ? '0 4px 12px rgba(139,38,53,0.35)' : 'none',
              }}/>
              {/* 연도 */}
              <div style={{ fontSize: '9px', color: '#AAA', fontWeight: '600', whiteSpace: 'nowrap' }}>
                {String(item.name).replace('년', '')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Analytics({ wines }: { wines: any[] }) {
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>분석 준비 중</div>
        <div style={{ fontSize: '13px', color: '#AAA' }}>와인을 더 기록하면 분석이 시작돼요</div>
      </div>
    )
  }

  const typeData = Object.entries(
    wines.reduce((acc, w) => { acc[w.wine_type] = (acc[w.wine_type] || 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([type, count]) => ({ name: WINE_TYPE_LABEL[type] || type, value: count as number }))

  const regionData = Object.entries(
    wines.reduce((acc, w) => { if (w.region) acc[w.region] = (acc[w.region] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8).map(([name, count]) => ({ name, count }))

  const countryData = Object.entries(
    wines.reduce((acc, w) => { if (w.country) acc[w.country] = (acc[w.country] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8)
    .map(([name, count]) => ({ name: countryWithFlag(name), count }))

  const grapeData = Object.entries(
    wines.reduce((acc, w) => {
      if (w.grape_variety?.length > 0) {
        const p = Array.isArray(w.grape_variety) ? w.grape_variety[0] : w.grape_variety
        if (p) acc[p] = (acc[p] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8).map(([name, count]) => ({ name, count }))

  const monthData = Object.entries(
    wines.reduce((acc, w) => {
      if (w.drunk_at) { const m = w.drunk_at.slice(0, 7); acc[m] = (acc[m] || 0) + 1 }
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => a[0].localeCompare(b[0])).map(([month, count]) => ({ name: month.slice(2), count }))

  const vintageData = Object.entries(
    wines.reduce((acc, w) => { if (w.vintage_year) acc[w.vintage_year] = (acc[w.vintage_year] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => Number(a[0]) - Number(b[0])).map(([name, count]) => ({ name: name + '년', count: count as number }))

  const foodData = Object.entries(
    wines.reduce((acc, w) => {
      if (w.food_pairings?.length > 0) w.food_pairings.forEach((f: string) => { acc[f] = (acc[f] || 0) + 1 })
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 10).map(([name, count]) => ({ name, count }))

  const avgRating = wines.filter(w => w.rating).length > 0
    ? (wines.reduce((a, w) => a + (w.rating || 0), 0) / wines.filter(w => w.rating).length).toFixed(1) : '—'

  return (
    <div style={{ padding: '16px 16px 100px', fontFamily: "'Pretendard', sans-serif" }}>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        {[
          { label: '총 기록', value: wines.length + '병', emoji: '🍷', grad: 'linear-gradient(135deg, #8B2635, #C0394D)' },
          { label: '평균 별점', value: avgRating, emoji: '⭐', grad: 'linear-gradient(135deg, #C8A951, #E0B84A)' },
          { label: '방문 나라', value: new Set(wines.map(w => w.country).filter(Boolean)).size + '개국', emoji: '🌍', grad: 'linear-gradient(135deg, #3A7FA0, #5BA8C8)' },
          { label: '탐험 지역', value: new Set(wines.map(w => w.region).filter(Boolean)).size + '곳', emoji: '📍', grad: 'linear-gradient(135deg, #6B8E3A, #8FB84E)' },
        ].map((item, i) => (
          <SummaryCard key={item.label} item={item} delay={i * 80} />
        ))}
      </div>

      {/* 종류별 도넛 */}
      <AnimCard delay={0}>
        <SectionTitle title="🍷 와인 종류별" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <PieChart width={130} height={130}>
            <Pie data={typeData} cx={65} cy={65} innerRadius={34} outerRadius={54} paddingAngle={3} dataKey="value">
              {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => [v + '병', '']} />
          </PieChart>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {typeData.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }}/>
                <span style={{ flex: 1, color: '#555' }}>{item.name}</span>
                <span style={{ fontWeight: '700', color: '#1A1A1A', background: '#F7F3EE', padding: '1px 7px', borderRadius: '8px', fontSize: '11px' }}>{item.value}병</span>
              </div>
            ))}
          </div>
        </div>
      </AnimCard>

      {/* 월별 추이 — 그라데이션 Area 차트, 꽉 차게 */}
      <AnimCard delay={60} noPad>
        <div style={{ padding: '16px 16px 0' }}>
          <SectionTitle title="📅 월별 추이" />
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: Math.max(monthData.length * 52, 320) + 'px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B2635" stopOpacity={0.35}/>
                    <stop offset="100%" stopColor="#8B2635" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE0" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#AAA' }} axisLine={false} tickLine={false} interval={0}/>
                <YAxis tick={{ fontSize: 10, fill: '#AAA' }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  formatter={(v) => [v + '병', '와인 수']}
                />
                <Area type="monotone" dataKey="count" stroke="#8B2635" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: '#8B2635', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#C0394D' }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </AnimCard>

      {/* 국가별 */}
      {countryData.length > 0 && (
        <BarSection title="🌍 국가별" data={countryData}
          gradient="linear-gradient(90deg, #2D6A8C, #5BA8C8)"
          delay={0} />
      )}

      {/* 지역별 */}
      {regionData.length > 0 && (
        <BarSection title="📍 지역별" data={regionData}
          gradient="linear-gradient(90deg, #4A7028, #8FB84E)"
          delay={60} />
      )}

      {/* 품종별 */}
      {grapeData.length > 0 && (
        <BarSection title="🍇 품종별 (주품종 기준)" data={grapeData}
          gradient="linear-gradient(90deg, #A8852A, #E0C97A)"
          delay={0} />
      )}

      {/* 빈티지 분포 */}
      {vintageData.length > 0 && <VintageSection data={vintageData} />}

      {/* 페어링 음식 */}
      {foodData.length > 0 && (
        <BarSection title="🍽 페어링 음식 Top 10" data={foodData}
          gradient="linear-gradient(90deg, #C05A10, #F0A050)"
          unit="회"
          labelEmoji={FOOD_EMOJI}
          delay={0} />
      )}

      {/* AI 인사이트 */}
      <AIInsight insight={insight} loading={loading} insightError={insightError} onFetch={fetchInsight} />
    </div>
  )
}

// 빈티지용 별도 훅 (IIFE 안에서 호출 불가하므로 컴포넌트화)
function VintageSection({ data }: { data: { name: string; count: number }[] }) {
  const { ref, visible } = useScrollVisible()
  return (
    <div ref={ref} style={{
      background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      <SectionTitle title="🗓 빈티지 분포" />
      <VintageTimeline data={data} visible={visible} />
    </div>
  )
}

function SummaryCard({ item, delay }: { item: { label: string; value: any; emoji: string; grad: string }; delay: number }) {
  const { ref, visible } = useScrollVisible()
  return (
    <div ref={ref} style={{
      borderRadius: '14px', padding: '14px', overflow: 'hidden', position: 'relative',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.1)',
      background: item.grad,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
      transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
    }}>
      <div style={{ position: 'absolute', top: -10, right: -10, fontSize: '48px', opacity: 0.15 }}>{item.emoji}</div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', fontWeight: '600' }}>{item.label}</div>
      <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>{item.value}</div>
    </div>
  )
}

function AIInsight({ insight, loading, insightError, onFetch }: any) {
  const { ref, visible } = useScrollVisible()
  return (
    <div ref={ref} style={{
      background: 'linear-gradient(160deg, #1A1A2E, #4A2040)',
      borderRadius: '16px', padding: '20px', marginBottom: '12px',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: 'opacity 0.6s ease, transform 0.6s ease',
    }}>
      <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>✨ AI 와인 인사이트</div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>Claude가 두 분의 취향을 분석해드려요</div>
      {!insight && !loading && (
        <button onClick={onFetch} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Pretendard', sans-serif" }}>
          🔍 취향 분석 시작하기
        </button>
      )}
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🍷</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Claude가 와인 기록을 분석 중이에요...</div>
        </div>
      )}
      {insightError && <div style={{ fontSize: '13px', color: '#FF6B6B', padding: '10px', background: 'rgba(255,107,107,0.1)', borderRadius: '8px' }}>{insightError}</div>}
      {insight && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>총평</div>
            <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.6' }}>{insight.overall}</div>
          </div>
          {[
            { key: 'jaehyuk', label: '재혁의 취향', bg: 'rgba(139,38,53,0.3)', border: 'rgba(139,38,53,0.4)', grad: 'linear-gradient(135deg, #8B2635, #C0394D)' },
            { key: 'wonwoo',  label: '원우의 취향',  bg: 'rgba(58,127,160,0.3)', border: 'rgba(58,127,160,0.4)', grad: 'linear-gradient(135deg, #3A7FA0, #5BA8C8)' },
          ].map(p => (
            <div key={p.key} style={{ background: p.bg, borderRadius: '12px', padding: '14px', border: `1px solid ${p.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: p.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', fontWeight: '700' }}>
                  {p.key === 'jaehyuk' ? '재혁' : '원우'}
                </div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{p.label}</div>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', marginBottom: '8px' }}>{insight[p.key]?.taste_profile}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>💡 {insight[p.key]?.insight}</div>
            </div>
          ))}
          <div style={{ background: 'rgba(107,142,58,0.3)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(107,142,58,0.4)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>🥂 함께 즐기기 좋은 와인</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>{insight.pairing}</div>
          </div>
          <div style={{ background: 'rgba(200,169,81,0.2)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(200,169,81,0.3)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#C8A951', marginBottom: '6px' }}>🎯 발견한 사실</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>{insight.fun_fact}</div>
          </div>
          <button onClick={onFetch} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer', fontFamily: "'Pretendard', sans-serif" }}>
            🔄 다시 분석하기
          </button>
        </div>
      )}
    </div>
  )
}