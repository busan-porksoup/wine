'use client'

// 샘플 mock 데이터
const sampleWine = {
  name: 'Château Cheval Blanc',
  vintage_year: 2015,
  region: 'Saint-Émilion',
  country: 'France',
  classification: 'Premier Grand Cru Classé A',
  terroir: {
    region_label: 'Saint-Émilion · Bordeaux, France',
    description: 'Bordeaux 우안의 동북단, Pomerol과 경계를 맞댄 자갈·모래·점토 혼합 토양. 좌안 보르도의 카베르네 소비뇽 중심 와인과는 결이 완전히 다르다. 메를로의 짙은 과실과 카베르네 프랑의 후추·연필심 향이 이 토양에서만 균형을 잡는다.',
    vineyard: {
      headline: '단일 39ha — 6개 소구획의 모자이크',
      body: '포도밭은 자갈층 위 점토 비율이 다른 6개 소구획으로 나뉜다. 평균 수령 45년의 고목들이 깊은 뿌리로 자갈층 아래 점토 수분을 끌어올려, 가뭄 해에도 안정적인 과즙 농축을 만든다. 카베르네 프랑이 49%를 차지하는 보르도에서 가장 이례적인 식재 비율.',
    },
    vintage_note: {
      headline: '2015 — 21세기 우안 최고 해 중 하나',
      body: '6월 따뜻한 개화기로 균일한 결실, 7월 후반 가뭄으로 농축, 8-9월 적당한 강우로 신선도 보존. 메를로가 과숙하지 않고 카베르네 프랑이 완숙에 도달한 흔치 않은 균형. 장기 숙성형 빈티지로 평가.',
    },
  },
  producer: {
    name: 'Château Cheval Blanc',
    founded: 1832,
    owner: 'LVMH (since 1998)',
    description: '카베르네 프랑을 절반 가까이 사용하는 우안의 유일한 정체성. 19세기 후반 분할된 포도밭을 통합한 이후 단일 도멘으로 운영. 신축 와이너리는 Christian de Portzamparc 설계로 6개 소구획별로 별도 발효 가능한 콘크리트 탱크 시스템 도입.',
    winemaking: {
      blend:     'Merlot 51% · Cabernet Franc 49%',
      fermentation: '18개 콘크리트 탱크, 소구획 별도',
      aging:     'New French oak 100%, 18개월',
      abv:       '14.0%',
      production:'~ 120,000 병 / 년',
    },
  },
}

// Google Maps iframe embed — API 키 불필요한 공개 검색 URL
function MiniMap({ query, zoom = 9 }: { query: string; zoom?: number }) {
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

export default function SamplesWineInfo() {
  return (
    <div id="app-container" style={{ paddingBottom: '80px' }}>
      <div style={{ padding: '48px 24px 16px' }}>
        <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '6px', textShadow: '0 1px 8px rgba(244,239,230,0.7)' }}>SAMPLES</div>
        <h1 className="type-display-2" style={{ color: 'var(--ink-charcoal)', margin: '0 0 12px', fontSize: '32px', textShadow: '0 1px 12px rgba(244,239,230,0.85)' }}>
          Wine Information Layouts
        </h1>
        <p className="type-body" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', margin: 0, textShadow: '0 1px 8px rgba(244,239,230,0.7)' }}>
          상세 모달에 들어갈 산지/생산자/라인업 표현 비교
        </p>
      </div>

      <div style={{ padding: '32px 16px 16px' }}>
        <div className="glass-card glass-card--light" style={{ padding: '24px 22px' }}>
          {/* 와인 헤더 */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '6px' }}>WINE INFORMATION</div>
            <h3 className="type-display-2" style={{ color: 'var(--ink-charcoal)', margin: '0 0 4px', fontSize: '26px' }}>{sampleWine.name}</h3>
            <div className="type-micro" style={{ color: 'var(--ink-mist)' }}>{sampleWine.vintage_year}</div>
          </div>

          <div style={{ height: 1, background: 'rgba(200,184,154,0.4)', marginBottom: '20px' }}/>

          {/* TERROIR */}
          <div style={{ marginBottom: '24px' }}>
            <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '14px' }}>Terroir · 떼루아</div>

            <div style={{
              width: '100%',
              aspectRatio: '16 / 10',
              marginBottom: '14px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid rgba(200,184,154,0.4)',
              background: 'rgba(250,246,238,0.6)',
            }}>
              <MiniMap query={`${sampleWine.region}, ${sampleWine.country}`} zoom={9} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', fontSize: '18px' }}>
                {sampleWine.terroir.region_label}
              </div>
              <div className="type-micro" style={{ color: 'var(--ink-bordeaux)', marginTop: '4px' }}>
                {sampleWine.classification}
              </div>
            </div>

            <p className="type-body" style={{ color: 'var(--ink-charcoal)', lineHeight: 1.65, margin: '0 0 16px', fontStyle: 'italic' }}>
              {sampleWine.terroir.description}
            </p>

            {/* 구체 밭 이야기 (AI가 찾으면) */}
            {sampleWine.terroir.vineyard && (
              <NoteCard
                badge="Vineyard · 밭"
                headline={sampleWine.terroir.vineyard.headline}
                body={sampleWine.terroir.vineyard.body}
              />
            )}

            {/* 빈티지 날씨 */}
            {sampleWine.terroir.vintage_note && (
              <NoteCard
                badge={`Vintage ${sampleWine.vintage_year} · 이 해`}
                headline={sampleWine.terroir.vintage_note.headline}
                body={sampleWine.terroir.vintage_note.body}
                accent="ochre"
              />
            )}
          </div>

          <div style={{ height: 1, background: 'rgba(200,184,154,0.4)', marginBottom: '20px' }}/>

          {/* PRODUCER */}
          <div>
            <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '14px' }}>Producer · 생산자</div>

            <div style={{ marginBottom: '12px' }}>
              <div className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', fontSize: '18px' }}>{sampleWine.producer.name}</div>
              <div className="type-micro" style={{ color: 'var(--ink-mist)', marginTop: '2px' }}>
                founded {sampleWine.producer.founded} · {sampleWine.producer.owner}
              </div>
            </div>

            <p className="type-body" style={{ color: 'var(--ink-charcoal)', lineHeight: 1.65, margin: '0 0 16px', fontStyle: 'italic' }}>
              {sampleWine.producer.description}
            </p>

            {/* 양조 디테일 */}
            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(250,246,238,0.55)',
              border: '1px solid rgba(200,184,154,0.35)',
            }}>
              <div className="type-micro" style={{ color: 'var(--ink-ochre)', marginBottom: '10px' }}>Winemaking · 양조</div>
              <SpecRow label="BLEND"        value={sampleWine.producer.winemaking.blend} />
              <SpecRow label="FERMENTATION" value={sampleWine.producer.winemaking.fermentation} />
              <SpecRow label="AGING"        value={sampleWine.producer.winemaking.aging} />
              <SpecRow label="ABV"          value={sampleWine.producer.winemaking.abv} />
              <SpecRow label="PRODUCTION"   value={sampleWine.producer.winemaking.production} last />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 24px 16px', textAlign: 'center' }}>
        <p className="type-micro" style={{ color: 'var(--ink-mist)', textTransform: 'none', letterSpacing: 0, fontStyle: 'italic' }}>
          Terroir(지도 + 떼루아 + 밭 + 빈티지 날씨) + Producer(설명 + 양조 디테일)
        </p>
      </div>
    </div>
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
