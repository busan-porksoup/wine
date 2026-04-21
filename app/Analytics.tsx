'use client'
import { useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const COLORS = ['#8B2635', '#3A7FA0', '#6B8E3A', '#C8A951', '#9B59B6', '#E67E22']

const WINE_TYPE_LABEL: Record<string, string> = {
  red: '레드 🍷',
  white: '화이트 🥂',
  sparkling: '샴페인 🍾',
  rosé: '로제 🌸',
  dessert: '디저트 🍯',
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
      if (result.success) {
        setInsight(result.data)
      } else {
        setInsightError('분석 실패: ' + result.error)
      }
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

  const countryData = Object.entries(
    wines.reduce((acc, w) => { if (w.country) acc[w.country] = (acc[w.country] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8).map(([name, count]) => ({ name, count }))

  const grapeData = Object.entries(
    wines.reduce((acc, w) => {
      if (w.grape_variety) w.grape_variety.forEach((g: string) => { acc[g] = (acc[g] || 0) + 1 })
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8).map(([name, count]) => ({ name, count }))

  const monthData = Object.entries(
    wines.reduce((acc, w) => { if (w.drunk_at) { const m = w.drunk_at.slice(0, 7); acc[m] = (acc[m] || 0) + 1 } return acc }, {} as Record<string, number>)
  ).sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([month, count]) => ({ name: month.slice(2), count }))

  const vintageData = Object.entries(
    wines.reduce((acc, w) => { if (w.vintage_year) acc[w.vintage_year] = (acc[w.vintage_year] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => Number(a[0]) - Number(b[0])).map(([name, count]) => ({ name, count }))

  const avgRating = wines.filter(w => w.rating).length > 0
    ? (wines.reduce((a, w) => a + (w.rating || 0), 0) / wines.filter(w => w.rating).length).toFixed(1)
    : '—'

  const sectionTitle = (title: string) => (
    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid #F0EAE0' }}>
      {title}
    </div>
  )

  const card = (children: React.ReactNode, noPad?: boolean) => (
    <div style={{ background: '#fff', borderRadius: '16px', padding: noPad ? '0' : '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0', overflow: 'hidden' }}>
      {children}
    </div>
  )

  return (
    <div style={{ padding: '16px 16px 100px', fontFamily: "'Pretendard', sans-serif" }}>

      {/* 요약 카드 4개 */}
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

      {/* 와인 종류 도넛 + 월별 추이 나란히 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        {/* 도넛 */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>종류별</div>
          <PieChart width={140} height={120}>
            <Pie data={typeData} cx={70} cy={55} innerRadius={32} outerRadius={52} paddingAngle={3} dataKey="value">
              {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => [v + '병', '']} />
          </PieChart>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
            {typeData.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#555' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }}/>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                <span style={{ marginLeft: 'auto', fontWeight: '600' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 월별 추이 */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>월별 추이</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={monthData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v + '병', '']} />
              <Line type="monotone" dataKey="count" stroke="#8B2635" strokeWidth={2} dot={{ fill: '#8B2635', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 국가별 */}
      {countryData.length > 0 && card(<>
        {sectionTitle('🌍 국가별')}
        <ResponsiveContainer width="100%" height={countryData.length * 32 + 16}>
          <BarChart data={countryData} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={56} />
            <Tooltip formatter={(v) => [v + '병', '']} />
            <Bar dataKey="count" fill="#3A7FA0" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </>)}

      {/* 지역별 */}
      {regionData.length > 0 && card(<>
        {sectionTitle('📍 지역별')}
        <ResponsiveContainer width="100%" height={regionData.length * 32 + 16}>
          <BarChart data={regionData} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={64} />
            <Tooltip formatter={(v) => [v + '병', '']} />
            <Bar dataKey="count" fill="#6B8E3A" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </>)}

      {/* 품종별 */}
      {grapeData.length > 0 && card(<>
        {sectionTitle('🍇 품종별')}
        <ResponsiveContainer width="100%" height={grapeData.length * 32 + 16}>
          <BarChart data={grapeData} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={72} />
            <Tooltip formatter={(v) => [v + '병', '']} />
            <Bar dataKey="count" fill="#C8A951" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </>)}

      {/* 빈티지 분포 */}
      {vintageData.length > 0 && card(<>
        {sectionTitle('📅 빈티지 분포')}
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={vintageData} margin={{ left: -16, right: 8 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip formatter={(v) => [v + '병', '']} />
            <Bar dataKey="count" fill="#9B59B6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </>)}

      {/* AI 인사이트 섹션 */}
      <div style={{ background: 'linear-gradient(160deg, #1A1A2E, #4A2040)', borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>✨ AI 와인 인사이트</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>Claude가 두 분의 취향을 분석해드려요</div>

        {!insight && !loading && (
          <button onClick={fetchInsight} style={{
            width: '100%', padding: '12px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            fontFamily: "'Pretendard', sans-serif",
          }}>
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
          <div style={{ fontSize: '13px', color: '#FF6B6B', padding: '10px', background: 'rgba(255,107,107,0.1)', borderRadius: '8px' }}>
            {insightError}
          </div>
        )}

        {insight && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* 총평 */}
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>총평</div>
              <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.6' }}>{insight.overall}</div>
            </div>

            {/* 재혁 취향 */}
            <div style={{ background: 'rgba(139,38,53,0.3)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(139,38,53,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B2635, #C0394D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', fontWeight: '700' }}>재혁</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>재혁의 취향</div>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', marginBottom: '8px' }}>{insight.jaehyuk?.taste_profile}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', lineHeight: '1.5' }}>💡 {insight.jaehyuk?.insight}</div>
            </div>

            {/* 원우 취향 */}
            <div style={{ background: 'rgba(58,127,160,0.3)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(58,127,160,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #3A7FA0, #5BA8C8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', fontWeight: '700' }}>원우</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>원우의 취향</div>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', marginBottom: '8px' }}>{insight.wonwoo?.taste_profile}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', lineHeight: '1.5' }}>💡 {insight.wonwoo?.insight}</div>
            </div>

            {/* 함께 추천 */}
            <div style={{ background: 'rgba(107,142,58,0.3)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(107,142,58,0.4)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>🥂 함께 즐기기 좋은 와인</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>{insight.pairing}</div>
            </div>

            {/* 재미있는 사실 */}
            <div style={{ background: 'rgba(200,169,81,0.2)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(200,169,81,0.3)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#C8A951', marginBottom: '6px' }}>🎯 발견한 사실</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>{insight.fun_fact}</div>
            </div>

            {/* 다시 분석 */}
            <button onClick={fetchInsight} style={{
              padding: '10px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer',
              fontFamily: "'Pretendard', sans-serif",
            }}>
              🔄 다시 분석하기
            </button>
          </div>
        )}
      </div>

    </div>
  )
}