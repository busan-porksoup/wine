'use client'

import { useState } from 'react'
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

// ─────────────────────────────────────────────
// Mock 데이터
// ─────────────────────────────────────────────

const QUIZ_STATS = {
  재혁: {
    total: 23,
    accuracy: 78,
    strong: ['떼루아', '분류·등급'],
    weak: ['발음·용어', '양조'],
  },
  원우: {
    total: 15,
    accuracy: 62,
    strong: ['페어링'],
    weak: ['빈티지·생산자', '양조'],
  },
}

const MOCK_MONTHS = [
  { name: '25-12', count: 4 },
  { name: '26-01', count: 6 },
  { name: '26-02', count: 5 },
  { name: '26-03', count: 8 },
  { name: '26-04', count: 7 },
  { name: '26-05', count: 5 },
]

const MOCK_WINES_BY_MONTH: Record<string, any[]> = {
  '26-05': [
    { id: '1', name: 'Ruinart Champagne Blanc de Blancs', region: 'Champagne', country: 'France', wine_type: 'sparkling', drunk_at: '2026-05-16', image_url: null },
    { id: '2', name: 'Château Cheval Blanc 2015', region: 'Saint-Émilion', country: 'France', wine_type: 'red', drunk_at: '2026-05-12', image_url: null },
    { id: '3', name: 'Domaine Chavy-Chouet 2020', region: 'Bourgogne', country: 'France', wine_type: 'white', drunk_at: '2026-05-08', image_url: null },
    { id: '4', name: 'Sassicaia 2018', region: 'Tuscany', country: 'Italy', wine_type: 'red', drunk_at: '2026-05-04', image_url: null },
    { id: '5', name: 'Sancerre 2022', region: 'Loire', country: 'France', wine_type: 'white', drunk_at: '2026-05-01', image_url: null },
  ],
  '26-04': [
    { id: '6', name: 'Château Margaux 2010', region: 'Margaux', country: 'France', wine_type: 'red', drunk_at: '2026-04-22', image_url: null },
    { id: '7', name: 'Apothic Red', region: 'California', country: 'USA', wine_type: 'red', drunk_at: '2026-04-15', image_url: null },
  ],
}

const TYPE_EMOJI: Record<string, string> = {
  red: '🍷', white: '🥂', sparkling: '🍾', rosé: '🌸', dessert: '🍯',
}

function formatEditorialDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

// ─────────────────────────────────────────────
// Quiz 통계 카드 (응시자별 컴팩트)
// ─────────────────────────────────────────────

function QuizStatColumn({ name }: { name: '재혁' | '원우' }) {
  const s = QUIZ_STATS[name]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 이름 */}
      <div style={{
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        fontSize: '14px',
        color: 'var(--ink-charcoal)',
        letterSpacing: '-0.01em',
      }}>{name}</div>

      {/* 누적 + 정답률 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span className="type-title-md" style={{
          fontStyle: 'italic',
          color: 'var(--ink-bordeaux)',
          fontSize: '24px',
          letterSpacing: 0,
        }}>
          {s.accuracy}<span style={{ fontSize: '13px', color: 'var(--ink-mist)' }}>%</span>
        </span>
        <span className="type-micro" style={{ color: 'var(--ink-mist)' }}>
          / {s.total}문항
        </span>
      </div>

      {/* 강점 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ color: 'var(--ink-olive)', fontSize: '11px' }}>↑</span>
          <span className="type-micro" style={{ color: 'var(--ink-mist)', textTransform: 'none', letterSpacing: 0, fontSize: '10px' }}>강점</span>
        </div>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
          color: 'var(--ink-charcoal)',
          lineHeight: 1.4,
        }}>
          {s.strong.join(' · ')}
        </span>
      </div>

      {/* 약점 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ color: '#B53E2A', fontSize: '11px' }}>↓</span>
          <span className="type-micro" style={{ color: 'var(--ink-mist)', textTransform: 'none', letterSpacing: 0, fontSize: '10px' }}>약점</span>
        </div>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
          color: 'var(--ink-charcoal)',
          lineHeight: 1.4,
        }}>
          {s.weak.join(' · ')}
        </span>
      </div>
    </div>
  )
}

function QuizStatsCard() {
  return (
    <div className="glass-card glass-card--light" style={{ padding: '22px', marginBottom: '20px' }}>
      <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '16px' }}>Quiz · 응시 통계</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1px 1fr',
        gap: '18px',
        alignItems: 'stretch',
      }}>
        <QuizStatColumn name="재혁" />
        <div style={{ background: 'rgba(200,184,154,0.4)' }}/>
        <QuizStatColumn name="원우" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 미니 와인 카드 (2열 그리드용)
// ─────────────────────────────────────────────

function MiniWineCard({ wine, onClick }: { wine: any; onClick: () => void }) {
  const emoji = TYPE_EMOJI[wine.wine_type] || '🍷'
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        aspectRatio: '4 / 5',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-soft)',
        cursor: 'pointer',
        background: wine.image_url ? 'none' : 'linear-gradient(135deg, rgba(107,31,42,0.85), rgba(140,42,58,0.65))',
        border: 'none',
        padding: 0,
        textAlign: 'left',
        fontFamily: 'inherit',
        color: 'inherit',
      }}
    >
      {wine.image_url ? (
        <img src={wine.image_url} alt={wine.name} style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
        }}/>
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '40px', opacity: 0.4,
        }}>
          {emoji}
        </div>
      )}

      {/* 하단 글래스 패널 */}
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
          color: 'var(--ink-mist)',
          marginBottom: '2px',
          fontSize: '9px',
          letterSpacing: '0.1em',
        }}>
          {formatEditorialDate(wine.drunk_at)}
        </div>
        <div style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: '12px',
          color: 'var(--ink-charcoal)',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {wine.name}
        </div>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────
// A YEAR IN WINE 확장 가능 차트
// ─────────────────────────────────────────────

function YearInWineExpandable() {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)
  const wines = expandedMonth ? (MOCK_WINES_BY_MONTH[expandedMonth] || []) : []

  return (
    <div className="glass-card glass-card--light" style={{ padding: '22px', marginBottom: '20px' }}>
      <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '18px' }}>A Year in Wine</div>

      {/* 차트 */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -8px' }}>
        <div style={{ minWidth: Math.max(MOCK_MONTHS.length * 48, 320) + 'px' }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_MONTHS} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#areaGrad)"
                dot={(props: any) => {
                  const isExpanded = props.payload.name === expandedMonth
                  const monthName = props.payload.name
                  return (
                    <g style={{ cursor: 'pointer' }} onClick={() => setExpandedMonth(expandedMonth === monthName ? null : monthName)}>
                      {/* 투명 큰 hit area — 모바일 터치 친화 */}
                      <circle cx={props.cx} cy={props.cy} r={18} fill="transparent" />
                      {/* 보이는 dot */}
                      <circle
                        cx={props.cx}
                        cy={props.cy}
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

      {/* 확장 영역 — 와인 카드 2열 */}
      {expandedMonth && wines.length > 0 && (
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(200,184,154,0.4)',
        }}>
          <div className="type-micro" style={{ color: 'var(--ink-mist)', textTransform: 'none', letterSpacing: 0, marginBottom: '12px', fontStyle: 'italic' }}>
            {expandedMonth}에 마신 {wines.length}병
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}>
            {wines.map(wine => (
              <MiniWineCard
                key={wine.id}
                wine={wine}
                onClick={() => alert(`실제 구현에서는 ${wine.name} 상세 모달 열림`)}
              />
            ))}
          </div>
        </div>
      )}

      {expandedMonth && wines.length === 0 && (
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(200,184,154,0.4)',
          textAlign: 'center',
        }}>
          <div className="type-micro" style={{ color: 'var(--ink-mist)', fontStyle: 'italic' }}>
            (mock 데이터에 이 월 와인 없음 — 26-05나 26-04 눌러보세요)
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────

export default function SamplesAnalyticsExtra() {
  return (
    <div id="app-container" style={{ paddingBottom: '80px' }}>
      <div style={{ padding: '48px 24px 16px' }}>
        <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '6px', textShadow: '0 1px 8px rgba(244,239,230,0.7)' }}>SAMPLES</div>
        <h1 className="type-display-2" style={{ color: 'var(--ink-charcoal)', margin: '0 0 12px', fontSize: '32px', textShadow: '0 1px 12px rgba(244,239,230,0.85)' }}>
          Analytics — Extras.
        </h1>
        <p className="type-body" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', margin: 0, textShadow: '0 1px 8px rgba(244,239,230,0.7)' }}>
          ① Quiz 통계 카드 ② A Year in Wine 월별 확장
        </p>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        <QuizStatsCard />
        <YearInWineExpandable />
      </div>

      <div style={{ padding: '8px 24px 16px', textAlign: 'center' }}>
        <p className="type-micro" style={{ color: 'var(--ink-mist)', textTransform: 'none', letterSpacing: 0, fontStyle: 'italic' }}>
          차트 점 또는 아래 월 칩 클릭 → 확장됨 (26-05, 26-04에 mock 와인 있음)
        </p>
      </div>
    </div>
  )
}
