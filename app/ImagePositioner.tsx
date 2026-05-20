'use client'

import { useRef, useState, useEffect } from 'react'

type Props = {
  src: string
  value?: string
  onChange: (position: string) => void
  aspectRatio?: number
  height?: number
}

function parsePos(str: string): { x: number; y: number } {
  const parts = (str || '50% 50%').split(/\s+/)
  return {
    x: parseFloat(parts[0]) || 50,
    y: parseFloat(parts[1]) || 50,
  }
}

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v))

export function ImagePositioner({ src, value = '50% 50%', onChange, aspectRatio = 4 / 5, height = 360 }: Props) {
  const [pos, setPos] = useState(() => parsePos(value))
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; startPos: { x: number; y: number } } | null>(null)

  useEffect(() => {
    setPos(parsePos(value))
  }, [value])

  const start = (clientX: number, clientY: number) => {
    dragRef.current = { startX: clientX, startY: clientY, startPos: pos }
  }

  const move = (clientX: number, clientY: number) => {
    const d = dragRef.current
    const el = containerRef.current
    if (!d || !el) return
    const rect = el.getBoundingClientRect()
    // Drag image with finger: dx>0 (drag right) → see more LEFT of image → object-position-x decreases
    const dxPct = ((clientX - d.startX) / rect.width) * 100
    const dyPct = ((clientY - d.startY) / rect.height) * 100
    const next = {
      x: clamp(d.startPos.x - dxPct),
      y: clamp(d.startPos.y - dyPct),
    }
    setPos(next)
    onChange(`${next.x.toFixed(1)}% ${next.y.toFixed(1)}%`)
  }

  const end = () => { dragRef.current = null }

  return (
    <div style={{ width: '100%' }}>
      <div
        ref={containerRef}
        onMouseDown={e => { e.preventDefault(); start(e.clientX, e.clientY) }}
        onMouseMove={e => { if (dragRef.current) move(e.clientX, e.clientY) }}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={e => start(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={e => { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY) }}
        onTouchEnd={end}
        style={{
          position: 'relative',
          width: '100%',
          height: `${height}px`,
          aspectRatio: `${aspectRatio}`,
          maxHeight: `${height}px`,
          overflow: 'hidden',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(42,36,32,0.08)',
          touchAction: 'none',
          cursor: dragRef.current ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${pos.x}% ${pos.y}%`,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />

        {/* Grid + hint overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Rule-of-thirds grid */}
          <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.25)' }}/>
          <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.25)' }}/>
          <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.25)' }}/>
          <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.25)' }}/>
          {/* Hint badge */}
          <div className="type-micro" style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(42,36,32,0.55)', color: '#fff',
            padding: '5px 12px', borderRadius: 'var(--radius-full)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            letterSpacing: '0.08em',
          }}>
            드래그해서 위치 조정
          </div>
        </div>
      </div>
    </div>
  )
}
