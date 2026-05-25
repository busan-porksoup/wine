'use client'

import { useState } from 'react'

export type WineInfoData = {
  classification?: string
  korean_labels?: {
    name?: string
    producer?: string
    region?: string
    country?: string
    grape_variety?: string
  }
  terroir?: {
    region_label?: string
    description?: string
    map_query?: string       // 구글맵 검색 쿼리 (AI가 와인 성격에 맞춰 결정)
    map_zoom?: number        // 줌 레벨 (광역 7-9 / 마을 11-13 / 단일 밭 14-16)
    vineyard?: { headline: string; body: string }
    vintage_note?: { headline: string; body: string }
  }
  producer?: {
    name?: string
    founded?: number
    owner?: string
    description?: string
    winemaking?: {
      blend?: string
      fermentation?: string
      aging?: string
      abv?: string
      production?: string
    }
  }
}

type WineInfoProps = {
  data: WineInfoData | null
  region?: string
  country?: string
  vintageYear?: number | null
  onGenerate?: () => void
  generating?: boolean
  loading?: boolean
}

export function MiniMap({ query, zoom = 9 }: { query: string; zoom?: number }) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed&z=${zoom}&hl=ko`
  return (
    <iframe
      src={src}
      title={`${query} 위치 지도`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      style={{
        width: '100%',
        height: '100%',
        border: 0,
        display: 'block',
        borderRadius: 'var(--radius-md)',
        filter: 'saturate(0.85)',
      }}
    />
  )
}

function NoteCard({ badge, headline, body, accent }: { badge: string; headline: string; body: string; accent?: 'ochre' | 'bordeaux' }) {
  const accentColor = accent === 'ochre' ? 'var(--ink-ochre)' : 'var(--ink-bordeaux)'
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 'var(--radius-md)',
      background: 'rgba(250,246,238,0.55)',
      border: '1px solid rgba(200,184,154,0.35)',
      position: 'relative',
      marginBottom: '12px',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 14, bottom: 14,
        width: 3, borderRadius: 2,
        background: accentColor, opacity: 0.55,
      }}/>
      <div className="type-micro" style={{ color: accentColor, marginBottom: '6px', paddingLeft: '8px' }}>
        {badge}
      </div>
      <div className="type-title-md" style={{
        fontStyle: 'italic', color: 'var(--ink-charcoal)',
        fontSize: '16px', marginBottom: '6px', paddingLeft: '8px', lineHeight: 1.3,
      }}>
        {headline}
      </div>
      <p className="type-body" style={{
        color: 'var(--ink-charcoal)', lineHeight: 1.65,
        margin: 0, paddingLeft: '8px', fontSize: '13.5px',
      }}>
        {body}
      </p>
    </div>
  )
}

function SpecRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      gap: '12px',
      paddingBottom: last ? 0 : '8px',
      marginBottom: last ? 0 : '8px',
      borderBottom: last ? 'none' : '1px dashed rgba(200,184,154,0.3)',
    }}>
      <span style={{
        fontSize: '10px', fontWeight: 600, color: 'var(--ink-mist)',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        fontFamily: 'var(--font-sans)',
      }}>{label}</span>
      <span className="type-body" style={{
        color: 'var(--ink-charcoal)',
        fontSize: '13px',
        textAlign: 'right',
        fontStyle: 'italic',
      }}>
        {value}
      </span>
    </div>
  )
}

export function WineInfo({ data, region, country, vintageYear, onGenerate, generating, loading }: WineInfoProps) {
  // 로딩 중 (자동 호출 진행)
  if (loading && !data) {
    return (
      <div style={{
        padding: '24px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(250,246,238,0.4)',
        border: '1px dashed rgba(200,184,154,0.5)',
        textAlign: 'center',
      }}>
        <div className="type-body" style={{ color: 'var(--ink-mist)', fontStyle: 'italic' }}>
          ✨ AI가 와인 정보를 가져오고 있어요…
        </div>
      </div>
    )
  }

  // 데이터 없음 + 로딩도 아님 (에러나 미생성 상태)
  if (!data) {
    return (
      <div style={{
        padding: '20px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(250,246,238,0.4)',
        border: '1px dashed rgba(200,184,154,0.5)',
        textAlign: 'center',
      }}>
        <div className="type-body" style={{ color: 'var(--ink-mist)', fontStyle: 'italic', marginBottom: '12px' }}>
          ✨ AI 와인 정보가 아직 없어요
        </div>
        {onGenerate && (
          <button onClick={onGenerate} disabled={generating} className="type-caption" style={{
            padding: '10px 18px', borderRadius: 'var(--radius-md)',
            background: generating ? 'rgba(138,126,109,0.4)' : 'var(--ink-bordeaux)',
            border: 'none', color: '#fff',
            cursor: generating ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)',
          }}>
            {generating ? '생성 중…' : 'AI로 정보 가져오기'}
          </button>
        )}
      </div>
    )
  }

  const t = data.terroir
  const p = data.producer
  const wm = p?.winemaking
  // AI가 결정한 map_query 우선, 없으면 region/country fallback
  const mapQuery = t?.map_query
    || (region && country ? `${region}, ${country}` : region || country || '')
  const mapZoom = t?.map_zoom ?? 9

  return (
    <div>
      {/* TERROIR */}
      {t && (
        <>
          <div style={{ marginBottom: '24px' }}>
            <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '14px' }}>Terroir · 떼루아</div>

            {mapQuery && (
              <div style={{
                width: '100%',
                aspectRatio: '16 / 10',
                marginBottom: '14px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid rgba(200,184,154,0.4)',
                background: 'rgba(250,246,238,0.6)',
              }}>
                <MiniMap query={mapQuery} zoom={mapZoom} />
              </div>
            )}

            {(t.region_label || data.classification) && (
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                {t.region_label && (
                  <div className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', fontSize: '18px' }}>
                    {t.region_label}
                  </div>
                )}
                {data.classification && (
                  <div className="type-micro" style={{ color: 'var(--ink-bordeaux)', marginTop: '4px' }}>
                    {data.classification}
                  </div>
                )}
              </div>
            )}

            {t.description && (
              <p className="type-body" style={{ color: 'var(--ink-charcoal)', lineHeight: 1.65, margin: '0 0 16px', fontStyle: 'italic' }}>
                {t.description}
              </p>
            )}

            {t.vineyard && (
              <NoteCard badge="Vineyard · 밭" headline={t.vineyard.headline} body={t.vineyard.body} />
            )}

            {t.vintage_note && (
              <NoteCard
                badge={`Vintage ${vintageYear ?? ''} · 이 해`.trim()}
                headline={t.vintage_note.headline}
                body={t.vintage_note.body}
                accent="ochre"
              />
            )}
          </div>

          {p && <div style={{ height: 1, background: 'rgba(200,184,154,0.4)', marginBottom: '20px' }}/>}
        </>
      )}

      {/* PRODUCER */}
      {p && (
        <div>
          <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '14px' }}>Producer · 생산자</div>

          {(p.name || p.founded || p.owner) && (
            <div style={{ marginBottom: '12px' }}>
              {p.name && (
                <div className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', fontSize: '18px' }}>{p.name}</div>
              )}
              {(p.founded || p.owner) && (
                <div className="type-micro" style={{ color: 'var(--ink-mist)', marginTop: '2px' }}>
                  {[p.founded ? `founded ${p.founded}` : null, p.owner].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          )}

          {p.description && (
            <p className="type-body" style={{ color: 'var(--ink-charcoal)', lineHeight: 1.65, margin: '0 0 16px', fontStyle: 'italic' }}>
              {p.description}
            </p>
          )}

          {wm && (wm.blend || wm.fermentation || wm.aging || wm.abv || wm.production) && (
            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(250,246,238,0.55)',
              border: '1px solid rgba(200,184,154,0.35)',
            }}>
              <div className="type-micro" style={{ color: 'var(--ink-ochre)', marginBottom: '10px' }}>Winemaking · 양조</div>
              {(() => {
                const rows = [
                  wm.blend        && { label: 'BLEND',        value: wm.blend },
                  wm.fermentation && { label: 'FERMENTATION', value: wm.fermentation },
                  wm.aging        && { label: 'AGING',        value: wm.aging },
                  wm.abv          && { label: 'ABV',          value: wm.abv },
                  wm.production   && { label: 'PRODUCTION',   value: wm.production },
                ].filter(Boolean) as { label: string; value: string }[]
                return rows.map((r, i) => (
                  <SpecRow key={r.label} label={r.label} value={r.value} last={i === rows.length - 1} />
                ))
              })()}
            </div>
          )}
        </div>
      )}

      {/* 재생성 — 데이터 있을 때만 표시 */}
      {onGenerate && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={onGenerate}
            disabled={generating}
            className="type-micro"
            style={{
              background: 'none', border: 'none',
              color: generating ? 'var(--ink-sand)' : 'var(--ink-mist)',
              textTransform: 'none', letterSpacing: 0, fontStyle: 'italic',
              cursor: generating ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              textDecorationColor: 'rgba(200,184,154,0.5)',
            }}
          >
            {generating ? '다시 가져오는 중…' : '↻ AI로 다시 가져오기'}
          </button>
        </div>
      )}
    </div>
  )
}

export function WineInfoToggle({ children }: { children: (open: boolean) => React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        style={{
          width: '100%', padding: '14px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid rgba(200,184,154,0.5)',
          borderBottom: '1px solid rgba(200,184,154,0.5)',
          fontFamily: 'var(--font-sans)',
          marginBottom: open ? '20px' : '20px',
        }}
      >
        <span className="type-caption" style={{ color: 'var(--ink-bordeaux)' }}>Wine Information</span>
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          border: '1px solid rgba(107,31,42,0.35)',
          background: open ? 'var(--ink-bordeaux)' : 'rgba(107,31,42,0.06)',
          color: open ? '#fff' : 'var(--ink-bordeaux)',
          fontSize: '13px', fontWeight: 400,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1, paddingBottom: '1px',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform var(--dur-base) var(--ease-out-soft), background var(--dur-base) ease, color var(--dur-base) ease',
        }}>+</span>
      </button>
      {open && (
        <>
          <div style={{ marginBottom: '20px' }}>{children(open)}</div>
          <div style={{ height: 1, background: 'rgba(200,184,154,0.5)', marginBottom: '20px' }}/>
        </>
      )}
    </>
  )
}
