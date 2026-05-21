'use client'

import { useState } from 'react'

export default function SamplesDetailUI() {
  return (
    <div id="app-container" style={{ paddingBottom: '80px' }}>
      <div style={{ padding: '48px 24px 16px' }}>
        <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '6px', textShadow: '0 1px 8px rgba(244,239,230,0.7)' }}>SAMPLES · ROUND 3</div>
        <h1 className="type-display-2" style={{ color: 'var(--ink-charcoal)', margin: '0 0 12px', fontSize: '32px', textShadow: '0 1px 12px rgba(244,239,230,0.85)' }}>
          No more circles.
        </h1>
        <p className="type-body" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', margin: 0, textShadow: '0 1px 8px rgba(244,239,230,0.7)' }}>
          Linear / Arc / Notion / Substack 댓글 레퍼런스. M1 구조(좌측 마커 + 우측 본문) 유지, 마커 형태만 다양화.
        </p>
      </div>

      {/* 토글 (확정) */}
      <div style={{ padding: '32px 16px 8px' }}>
        <div className="type-micro" style={{ color: 'var(--ink-mist)', marginBottom: '10px', textTransform: 'none', letterSpacing: 0, paddingLeft: '8px' }}>✓ 토글 (확정 — T1)</div>
        <div className="glass-card glass-card--light" style={{ padding: '20px 18px' }}>
          <ConfirmedToggle />
        </div>
      </div>

      {/* ─── 최종안 ─── */}
      <div style={{ padding: '40px 16px 8px' }}>
        <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '10px', paddingLeft: '8px' }}>✓ FINAL · 확정안</div>
        <div className="glass-card glass-card--light" style={{ padding: '20px 18px' }}>
          <CommentFinal />
        </div>
        <div className="type-micro" style={{ color: 'var(--ink-mist)', marginTop: '10px', textTransform: 'none', letterSpacing: 0, paddingLeft: '8px', fontStyle: 'italic' }}>
          N1 베이스 · 이름 라벨 (Pretendard 600) · textarea에 cream 톤온톤 bg · 좌측 컬러 바
        </div>
      </div>

      <SectionHeader title="이전 시안 (참고)" sub="비교용으로 남겨둠" />

      <SampleBlock label="N1 · Accent Bar (이름 없음 버전)">
        <CommentN1 />
      </SampleBlock>

      <SampleBlock label="N2 · Squircle Monogram (Arc/Read.cv 스타일 — 둥근 사각형 인장)">
        <CommentN2 />
      </SampleBlock>

      <SampleBlock label="N3 · Signature Byline (신문 칼럼 — 본문 아래 italic 시그니처)">
        <CommentN3 />
      </SampleBlock>

      <SampleBlock label="N4 · Quill (만년필 같은 italic 작은 이름 + 가는 선, 와인 라벨 텍스트 느낌)">
        <CommentN4 />
      </SampleBlock>

      <div style={{ padding: '24px 24px 16px', textAlign: 'center' }}>
        <p className="type-micro" style={{ color: 'var(--ink-mist)', textTransform: 'none', letterSpacing: 0, fontStyle: 'italic' }}>
          N번호 알려주세요. 다 별로면 다시 가져오겠습니다.
        </p>
      </div>
    </div>
  )
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ padding: '40px 24px 8px' }}>
      <div className="type-caption" style={{ color: 'var(--ink-ochre)', marginBottom: '4px' }}>SECTION</div>
      <div className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', fontSize: '22px' }}>{title}</div>
      <div className="type-micro" style={{ color: 'var(--ink-mist)', textTransform: 'none', letterSpacing: 0, marginTop: '2px', fontStyle: 'italic' }}>{sub}</div>
    </div>
  )
}

function SampleBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '12px 16px' }}>
      <div className="type-micro" style={{ color: 'var(--ink-mist)', marginBottom: '10px', textTransform: 'none', letterSpacing: 0, paddingLeft: '8px' }}>{label}</div>
      <div className="glass-card glass-card--light" style={{ padding: '20px 18px' }}>
        {children}
      </div>
    </div>
  )
}

function ConfirmedToggle() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', padding: '14px 0',
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid rgba(200,184,154,0.5)',
        borderBottom: '1px solid rgba(200,184,154,0.5)',
        fontFamily: 'var(--font-sans)',
      }}>
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
        <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(250,246,238,0.55)', border: '1px dashed rgba(200,184,154,0.4)', marginTop: '12px' }}>
          <p className="type-body" style={{ color: 'var(--ink-mist)', fontStyle: 'italic', margin: 0, fontSize: '13px' }}>
            ⋯ 떼루아 / 생산자 / 양조 디테일 ⋯
          </p>
        </div>
      )}
    </>
  )
}

// ─────────────────────────────────────────────
// 컬러 토큰
// ─────────────────────────────────────────────
const J_COLOR = 'var(--ink-bordeaux)'
const W_COLOR = 'var(--ink-olive)'

// ─────────────────────────────────────────────
// FINAL · N1 베이스 + 이름 라벨 + 톤온톤 bg
// ─────────────────────────────────────────────
function CommentFinal() {
  const PEOPLE = [
    { name: '재혁', color: J_COLOR, placeholder: '한 줄 평을 적어주세요…' },
    { name: '원우', color: W_COLOR, placeholder: '한 줄 평을 적어주세요…' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {PEOPLE.map((p, i) => (
        <div key={i}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '13px',
            color: 'var(--ink-charcoal)',
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}>{p.name}</div>
          <div style={{
            display: 'flex',
            background: 'rgba(200,184,154,0.10)',
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            overflow: 'hidden',
          }}>
            <div style={{ width: 3, background: p.color, flexShrink: 0, opacity: 0.85 }}/>
            <textarea placeholder={p.placeholder} style={{
              flex: 1, minHeight: '56px',
              border: 'none', background: 'transparent',
              padding: '12px 14px',
              fontSize: '14px', resize: 'none',
              fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
              color: 'var(--ink-charcoal)',
              outline: 'none', lineHeight: 1.6,
            }}/>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// N1 · Accent Bar — 색상바만 (Linear/Notion 인용구)
// 아이콘 없음. 색이 곧 신원.
// ─────────────────────────────────────────────
function CommentN1() {
  const PEOPLE = [
    { color: J_COLOR, placeholder: '한 줄 평을 적어주세요…' },
    { color: W_COLOR, placeholder: '한 줄 평을 적어주세요…' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {PEOPLE.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'stretch' }}>
          <div style={{ width: 2, background: p.color, borderRadius: 1, flexShrink: 0, opacity: 0.7 }}/>
          <textarea placeholder={p.placeholder} style={{
            flex: 1, minHeight: '52px',
            border: 'none', background: 'transparent',
            padding: '4px 0',
            fontSize: '14px', resize: 'none',
            fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
            color: 'var(--ink-charcoal)',
            outline: 'none', lineHeight: 1.6,
          }}/>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// N2 · Squircle Monogram — 둥근 사각형 인장
// (Arc, Linear, Read.cv 스타일)
// ─────────────────────────────────────────────
function CommentN2() {
  const PEOPLE = [
    { char: '재', color: J_COLOR, placeholder: '한 줄 평을 적어주세요…' },
    { char: '원', color: W_COLOR, placeholder: '한 줄 평을 적어주세요…' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {PEOPLE.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5,
            background: p.color, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', color: '#fff', fontWeight: 600,
            fontFamily: 'var(--font-sans)', letterSpacing: 0,
            marginTop: '4px',
          }}>{p.char}</div>
          <textarea placeholder={p.placeholder} style={{
            flex: 1, minHeight: '52px',
            border: 'none', background: 'transparent',
            padding: '4px 0',
            fontSize: '14px', resize: 'none',
            fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
            color: 'var(--ink-charcoal)',
            outline: 'none', lineHeight: 1.6,
            borderBottom: '1px solid rgba(200,184,154,0.3)',
          }}/>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// N3 · Signature Byline — 본문 아래 italic 시그니처
// (Substack, Medium 인용 후 byline 패턴)
// ─────────────────────────────────────────────
function CommentN3() {
  const PEOPLE = [
    { name: '재혁', color: J_COLOR, placeholder: '한 줄 평을 적어주세요…' },
    { name: '원우', color: W_COLOR, placeholder: '한 줄 평을 적어주세요…' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {PEOPLE.map((p, i) => (
        <div key={i}>
          <textarea placeholder={p.placeholder} style={{
            width: '100%', minHeight: '52px',
            border: 'none', background: 'transparent',
            padding: '0',
            fontSize: '15px', resize: 'none',
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            boxSizing: 'border-box',
            color: 'var(--ink-charcoal)',
            outline: 'none', lineHeight: 1.6,
          }}/>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <div style={{ width: '20px', height: 1, background: p.color, opacity: 0.6 }}/>
            <span style={{
              fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              fontSize: '13px', color: p.color,
            }}>{p.name}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// N4 · Quill — 만년필 같은 italic 작은 이름 + 가는 선
// (와인 라벨 텍스트, 잡지 인용 도입부 느낌)
// ─────────────────────────────────────────────
function CommentN4() {
  const PEOPLE = [
    { name: '재혁', color: J_COLOR, placeholder: '한 줄 평을 적어주세요…' },
    { name: '원우', color: W_COLOR, placeholder: '한 줄 평을 적어주세요…' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {PEOPLE.map((p, i) => (
        <div key={i}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              fontSize: '14px', color: p.color,
              letterSpacing: '0.02em',
            }}>{p.name}</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(200,184,154,0.45)' }}/>
          </div>
          <textarea placeholder={p.placeholder} style={{
            width: '100%', minHeight: '54px',
            border: 'none', background: 'transparent',
            padding: '0',
            fontSize: '14px', resize: 'none',
            fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
            color: 'var(--ink-charcoal)',
            outline: 'none', lineHeight: 1.6,
          }}/>
        </div>
      ))}
    </div>
  )
}
