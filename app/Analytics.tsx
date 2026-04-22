'use client'
import { useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

const COLORS = ['#8B2635', '#3A7FA0', '#6B8E3A', '#C8A951', '#9B59B6', '#E67E22']

const WINE_TYPE_LABEL: Record<string, string> = {
  red: '레드 🍷',
  white: '화이트 🥂',
  sparkling: '샴페인 🍾',
  rosé: '로제 🌸',
  dessert: '디저트 🍯',
}

// 국가명 → 국기 이모지 매핑
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
  const flag = COUNTRY_FLAG[name] || '🍾'
  return `${flag} ${name}`
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wines }),
      })
      const result = await res.json()
      if (result.success) setInsight(result.data)
      else setInsightError('분석 실패: ' + result.error)
    } catch (e: any) {
      setInsightError('오류: ' + e.message)
    }
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

  // 데이터 계산
  const typeData = Object.entries(
    wines.reduce((acc, w) => { acc[w.wine_type] = (acc[w.wine_type] || 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([type, count]) => ({ name: WINE_TYPE_LABEL[type] || type, value: count as number }))

  const regionData = Object.entries(
    wines.reduce((acc, w) => { if (w.region) acc[w.region] = (acc[w.region] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8).map(([name, count]) => ({ name, count }))

  // 국가 + 국기
  const countryData = Object.entries(
    wines.reduce((acc, w) => { if (w.country) acc[w.country] = (acc[w.country] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8)
    .map(([name, count]) => ({ name, displayName: countryWithFlag(name), count }))

  // 주품종만 카운트
  const grapeData = Object.entries(
    wines.reduce((acc, w) => {
      if (w.grape_variety && w.grape_variety.length > 0) {
        const primary = Array.isArray(w.grape_variety) ? w.grape_variety[0] : w.grape_variety
        if (primary) acc[primary] = (acc[primary] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8).map(([name, count]) => ({ name, count }))

  // 월별 추이 — 전체 기간
  const monthData = Object.entries(
    wines.reduce((acc, w) => {
      if (w.drunk_at) { const m = w.drunk_at.slice(0, 7); acc[m] = (acc[m] || 0) + 1 }
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => a[0].localeCompare(b[0])).map(([month, count]) => ({ name: month.slice(2), count }))

  const vintageData = Object.entries(
    wines.reduce((acc, w) => { if (w.vintage_year) acc[w.vintage_year] = (acc[w.vintage_year] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => Number(a[0]) - Number(b[0])).map(([name, count]) => ({ name, count }))

  // 페어링 음식
  const foodData = Object.entries(
    wines.reduce((acc, w) => {
      if (w.food_pairings?.length > 0) {
        w.food_pairings.forEach((f: string) => { acc[f] = (acc[f] || 0) + 1 })
      }
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 10).map(([name, count]) => ({ name, count }))

  const avgRating = wines.filter(w => w.rating).length > 0
    ? (wines.reduce((a, w) => a + (w.rating || 0), 0) / wines.filter(w => w.rating).length).toFixed(1)
    : '—'

  const sectionTitle = (title: string) => (
    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid #F0EAE0' }}>
      {title}
    </div>
  )

  const card = (children: React.ReactNode) => (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0', overflow: 'hidden' }}>
      {children}
    </div>
  )

  return (
    <div style={{ padding: '16px 16px 100px', fontFamily: "'Pretendard', sans-serif" }}>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        {[
          { label: '총 기록', value: wines.length + '병', emoji: '🍷' },
          { label: '평균 별점', value: avgRating, emoji: '⭐' },
          { label: '방문 나라', value: new Set(wines.map(w => w.country).filter(Boolean)).size + '개국', emoji: '🌍' },
          { label: '탐험 지역', value: new Set(wines.map(w => w.region).filter(Boolean)).size + '곳', emoji: '📍' },
        ].map(item => (
          <div key={item.label} style={{ background: '#fff', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0' }}>
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{item.emoji}</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A' }}>{item.value}</div>
            <div style={{ fontSize: '11px', color: '#AAA', marginTop: '2px' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* 종류별 도넛 */}
      {card(<>
        {sectionTitle('🍷 와인 종류별')}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <PieChart width={140} height={140}>
            <Pie data={typeData} cx={70} cy={70} innerRadius={36} outerRadius={58} paddingAngle={3} dataKey="value">
              {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => [v + '병', '']} />
          </PieChart>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {typeData.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#555' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }}/>
                <span style={{ flex: 1 }}>{item.name}</span>
                <span style={{ fontWeight: '700', color: '#1A1A1A' }}>{item.value}병</span>
              </div>
            ))}
          </div>
        </div>
      </>)}

      {/* 월별 추이 — 가로로 넓게, 스크롤 가능 */}
      {card(<>
        {sectionTitle('📅 월별 추이')}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: Math.max(monthData.length * 48, 320) + 'px' }}>
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
        <div style={{ fontSize: '10px', color: '#CCC', textAlign: 'right', marginTop: '4px' }}>← 좌우로 스크롤</div>
      </>)}

      {/* 국가별 (국기 포함) — 커스텀 바 */}
      {countryData.length > 0 && card(<>
        {sectionTitle('🌍 국가별')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {countryData.map((item, i) => {
            const max = countryData[0].count as number
            const pct = Math.round(((item.count as number) / max) * 100)
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#333' }}>{item.displayName}</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#3A7FA0' }}>{item.count as number}병</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: '#F0EAE0', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: '4px', background: 'linear-gradient(90deg, #3A7FA0, #5BA8C8)', transition: 'width 0.6s ease' }}/>
                </div>
              </div>
            )
          })}
        </div>
      </>)}

      {/* 지역별 */}
      {regionData.length > 0 && card(<>
        {sectionTitle('📍 지역별')}
        <ResponsiveContainer width="100%" height={regionData.length * 36 + 16}>
          <BarChart data={regionData} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={72} />
            <Tooltip formatter={(v) => [v + '병', '']} />
            <Bar dataKey="count" fill="#6B8E3A" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </>)}

      {/* 품종별 */}
      {grapeData.length > 0 && card(<>
        {sectionTitle('🍇 품종별 (주품종 기준)')}
        <ResponsiveContainer width="100%" height={grapeData.length * 36 + 16}>
          <BarChart data={grapeData} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
            <Tooltip formatter={(v) => [v + '병', '']} />
            <Bar dataKey="count" fill="#C8A951" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </>)}

      {/* 빈티지 분포 */}
      {vintageData.length > 0 && card(<>
        {sectionTitle('🗓 빈티지 분포')}
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={vintageData} margin={{ left: -16, right: 8 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip formatter={(v) => [v + '병', '']} />
            <Bar dataKey="count" fill="#9B59B6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </>)}

      {/* 페어링 음식 Top 10 */}
      {foodData.length > 0 && card(<>
        {sectionTitle('🍽 페어링 음식 Top 10')}
        <ResponsiveContainer width="100%" height={foodData.length * 36 + 16}>
          <BarChart data={foodData} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
            <Tooltip formatter={(v) => [v + '회', '페어링 횟수']} />
            <Bar dataKey="count" fill="#E67E22" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </>)}

      {/* AI 인사이트 */}
      <div style={{ background: 'linear-gradient(160deg, #1A1A2E, #4A2040)', borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>✨ AI 와인 인사이트</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>Claude가 두 분의 취향을 분석해드려요</div>

        {!insight && !loading && (
          <button onClick={fetchInsight} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Pretendard', sans-serif" }}>
            🔍 취향 분석 시작하기
          </button>
        )}
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🍷</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Claude가 와인 기록을 분석 중이에요...</div>
          </div>
        )}
        {insightError && (
          <div style={{ fontSize: '13px', color: '#FF6B6B', padding: '10px', background: 'rgba(255,107,107,0.1)', borderRadius: '8px' }}>{insightError}</div>
        )}
        {insight && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>총평</div>
              <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.6' }}>{insight.overall}</div>
            </div>
            <div style={{ background: 'rgba(139,38,53,0.3)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(139,38,53,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B2635, #C0394D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', fontWeight: '700' }}>재혁</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>재혁의 취향</div>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', marginBottom: '8px' }}>{insight.jaehyuk?.taste_profile}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', lineHeight: '1.5' }}>💡 {insight.jaehyuk?.insight}</div>
            </div>
            <div style={{ background: 'rgba(58,127,160,0.3)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(58,127,160,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #3A7FA0, #5BA8C8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', fontWeight: '700' }}>원우</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>원우의 취향</div>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', marginBottom: '8px' }}>{insight.wonwoo?.taste_profile}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', lineHeight: '1.5' }}>💡 {insight.wonwoo?.insight}</div>
            </div>
            <div style={{ background: 'rgba(107,142,58,0.3)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(107,142,58,0.4)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>🥂 함께 즐기기 좋은 와인</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>{insight.pairing}</div>
            </div>
            <div style={{ background: 'rgba(200,169,81,0.2)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(200,169,81,0.3)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#C8A951', marginBottom: '6px' }}>🎯 발견한 사실</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>{insight.fun_fact}</div>
            </div>
            <button onClick={fetchInsight} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer', fontFamily: "'Pretendard', sans-serif" }}>
              🔄 다시 분석하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}