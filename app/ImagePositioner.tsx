'use client'

import { useRef, useState, useEffect } from 'react'

type Props = {
  src: string
  value?: string
  onChange: (position: string) => void
  aspectRatio?: number
  height?: number
}

const MIN_ZOOM = 1.0
const MAX_ZOOM = 3.0

export function parseImagePosition(str?: string): { x: number; y: number; zoom: number } {
  const parts = (str || '50% 50%').split(/\s+/)
  return {
    x: parseFloat(parts[0]) || 50,
    y: parseFloat(parts[1]) || 50,
    zoom: parts[2] ? Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, parseFloat(parts[2]) || 1)) : 1,
  }
}

function formatImagePosition(x: number, y: number, zoom: number): string {
  if (zoom <= 1.005) return `${x.toFixed(1)}% ${y.toFixed(1)}%`
  return `${x.toFixed(1)}% ${y.toFixed(1)}% ${zoom.toFixed(2)}`
}

const clampPct = (v: number) => Math.max(0, Math.min(100, v))
const clampZoom = (v: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v))

function touchDistance(touches: React.TouchList | TouchList): number {
  if (touches.length < 2) return 0
  const a = touches[0]
  const b = touches[1]
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

export function ImagePositioner({ src, value = '50% 50%', onChange, aspectRatio = 4 / 5, height = 360 }: Props) {
  const [pos, setPos] = useState(() => parseImagePosition(value))
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; startPos: { x: number; y: number; zoom: number } } | null>(null)
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null)
  const posRef = useRef(pos)
  useEffect(() => { posRef.current = pos }, [pos])

  useEffect(() => {
    setPos(parseImagePosition(value))
  }, [value])

  const emit = (next: { x: number; y: number; zoom: number }) => {
    setPos(next)
    onChange(formatImagePosition(next.x, next.y, next.zoom))
  }

  const startDrag = (clientX: number, clientY: number) => {
    dragRef.current = { startX: clientX, startY: clientY, startPos: posRef.current }
  }

  const moveDrag = (clientX: number, clientY: number) => {
    const d = dragRef.current
    const el = containerRef.current
    if (!d || !el) return
    const rect = el.getBoundingClientRect()
    const dxPct = ((clientX - d.startX) / rect.width) * 100
    const dyPct = ((clientY - d.startY) / rect.height) * 100
    emit({
      x: clampPct(d.startPos.x - dxPct),
      y: clampPct(d.startPos.y - dyPct),
      zoom: d.startPos.zoom,
    })
  }

  const endDrag = () => { dragRef.current = null }

  // 비-패시브 wheel 리스너 (PC 마우스 휠 줌)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = -e.deltaY * 0.0015
      const cur = posRef.current
      emit({ ...cur, zoom: clampZoom(cur.zoom + delta * cur.zoom) })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ width: '100%' }}>
      <div
        ref={containerRef}
        onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
        onMouseMove={e => { if (dragRef.current) moveDrag(e.clientX, e.clientY) }}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={e => {
          if (e.touches.length === 2) {
            pinchRef.current = { startDist: touchDistance(e.touches), startZoom: posRef.current.zoom }
            dragRef.current = null
          } else if (e.touches.length === 1) {
            pinchRef.current = null
            startDrag(e.touches[0].clientX, e.touches[0].clientY)
          }
        }}
        onTouchMove={e => {
          e.preventDefault()
          if (e.touches.length === 2 && pinchRef.current) {
            const newDist = touchDistance(e.touches)
            if (pinchRef.current.startDist > 0) {
              const ratio = newDist / pinchRef.current.startDist
              const newZoom = clampZoom(pinchRef.current.startZoom * ratio)
              emit({ ...posRef.current, zoom: newZoom })
            }
          } else if (e.touches.length === 1 && dragRef.current) {
            moveDrag(e.touches[0].clientX, e.touches[0].clientY)
          }
        }}
        onTouchEnd={e => {
          // 두 손가락 → 한 손가락으로 전환 시 드래그 재시작
          if (e.touches.length === 1) {
            pinchRef.current = null
            startDrag(e.touches[0].clientX, e.touches[0].clientY)
          } else {
            pinchRef.current = null
            endDrag()
          }
        }}
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
            transform: pos.zoom > 1.005 ? `scale(${pos.zoom})` : undefined,
            transformOrigin: 'center center',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />

        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Rule-of-thirds grid */}
          <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.25)' }}/>
          <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.25)' }}/>
          <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.25)' }}/>
          <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.25)' }}/>
          <div className="type-micro" style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(42,36,32,0.55)', color: '#fff',
            padding: '5px 12px', borderRadius: 'var(--radius-full)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
          }}>
            드래그 · 핀치/휠로 줌
          </div>
          {pos.zoom > 1.005 && (
            <div className="type-micro" style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(42,36,32,0.55)', color: '#fff',
              padding: '4px 10px', borderRadius: 'var(--radius-full)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              letterSpacing: 0, textTransform: 'none', fontSize: '10px',
            }}>
              {pos.zoom.toFixed(1)}×
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
