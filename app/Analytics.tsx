'use client'
import { useState, useEffect, useRef } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts'

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

function countryWithFlag(name: string) {
  return `${COUNTRY_FLAG[name] || '🍾'} ${name}`
}

// 스크롤 진입 감지 훅
function useScrollVisible() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, visible }
}

// 애니메이션 카드 래퍼
function AnimCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useScrollVisible()
  return (
    <div ref={ref} style={{
      background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0', overflow: 'hidden',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

// 커스텀 바 차트
function CustomBar({
  data, color, unit = '병', visible,
}: {
  data: { name: string; count: number | string }[]
  color: string
  unit?: string
  visible: boolean
}) {
  const max = Math.max(...data.map(d => d.count as number))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map((item, i) => {
        const pct = Math.round(((item.count as number) / max) * 100)
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '13px', color: '#333' }}>{item.name}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color }}>{item.count as number}{unit}</span>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', background: '#F0EAE0', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: visible ? `${pct}%` : '0%',
                borderRadius: '4px',
                background: color,
                transition: `width 0.7s cubic-bezier(0.4,0,0.2,1) ${i * 60}ms`,
              }}/>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 섹션 타이틀
function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid #F0EAE0' }}>
      {title}
    </div>
  )
}

// 애니메이션 바 섹션
function BarSection({ title, data, color, unit = '병', delay = 0 }: {
  title: string; data: { name: string; count: number | string }[]; color: string; unit?: string; delay?: number
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
      <CustomBar data={data} color={color} unit={unit} visible={visible} />
    </div>
  )
}

export default function Analytics({ wines }: { wines: any[] }) {
  const [insight, setInsight] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [insightError, setInsightError] = useState('')

  async function fetchInsight() {
    setLoading(true)
    setInsightError('')
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
        const primary = Array.isArray(w.grape_variety) ? w.grape_variety[0] : w.grape_variety
        if (primary) acc[primary] = (acc[primary] || 0) + 1
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
  ).sort((a, b) => Number(a[0]) - Number(b[0])).map(([name, count]) => ({ name: name + '년', count }))

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

      {/* 요약 카드 4개 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        {[
          { label: '총 기록', value: wines.length + '병', emoji: '🍷' },
          { label: '평균 별점', value: avgRating, emoji: '⭐' },
          { label: '방문 나라', value: new Set(wines.map(w => w.country).filter(Boolean)).size + '개국', emoji: '🌍' },
          { label: '탐험 지역', value: new Set(wines.map(w => w.region).filter(Boolean)).size + '곳', emoji: '📍' },
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
                <span style={{ fontWeight: '700', color: '#1A1A1A' }}>{item.value}병</span>
              </div>
            ))}
          </div>
        </div>
      </AnimCard>

      {/* 월별 추이 — 가로 스크롤 */}
      <AnimCard delay={60}>
        <SectionTitle title="📅 월별 추이" />
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: Math.max(monthData.length * 52, 320) + 'px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthData} margin={{ top: 8, right: 16, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v + '병', '와인 수']} />
                <Line type="monotone" dataKey="count" stroke="#8B2635" strokeWidth={2.5} dot={{ fill: '#8B2635', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ fontSize: '10px', color: '#CCC', textAlign: 'right', marginTop: '2px' }}>← 좌우로 스크롤</div>
      </AnimCard>

      {countryData.length > 0 && <BarSection title="🌍 국가별" data={countryData} color="linear-gradient(90deg, #3A7FA0, #5BA8C8)" delay={0} />}
      {regionData.length > 0 && <BarSection title="📍 지역별" data={regionData} color="linear-gradient(90deg, #6B8E3A, #8FB84E)" delay={60} />}
      {grapeData.length > 0 && <BarSection title="🍇 품종별 (주품종 기준)" data={grapeData} color="linear-gradient(90deg, #C8A951, #E0C97A)" delay={0} />}
      {vintageData.length > 0 && <BarSection title="🗓 빈티지 분포" data={vintageData} color="linear-gradient(90deg, #9B59B6, #BF7FD0)" delay={60} />}
      {foodData.length > 0 && <BarSection title="🍽 페어링 음식 Top 10" data={foodData} color="linear-gradient(90deg, #E67E22, #F0A050)" unit="회" delay={0} />}

      {/* AI 인사이트 */}
      <AIInsight insight={insight} loading={loading} insightError={insightError} onFetch={fetchInsight} />
    </div>
  )
}

function SummaryCard({ item, delay }: { item: { label: string; value: any; emoji: string }; delay: number }) {
  const { ref, visible } = useScrollVisible()
  return (
    <div ref={ref} style={{
      background: '#fff', borderRadius: '14px', padding: '14px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
      transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
    }}>
      <div style={{ fontSize: '22px', marginBottom: '6px' }}>{item.emoji}</div>
      <div style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A' }}>{item.value}</div>
      <div style={{ fontSize: '11px', color: '#AAA', marginTop: '2px' }}>{item.label}</div>
    </div>
  )
}

function AIInsight({ insight, loading, insightError, onFetch }: any) {
  const { ref, visible } = useScrollVisible()
  return (
    <div ref={ref} style={{
      background: 'linear-gradient(160deg, #1A1A2E, #4A2040)',
      borderRadius: '16px', padding: '20px', marginBottom: '12px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
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