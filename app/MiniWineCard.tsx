'use client'

import { parseImagePosition } from './ImagePositioner'

const TYPE_EMOJI: Record<string, string> = {
  red: '🍷', white: '🥂', sparkling: '🍾', rosé: '🌸', dessert: '🍯',
}

function fmtMD(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

export function MiniWineCard({ wine, onClick }: { wine: any; onClick?: () => void }) {
  const p = parseImagePosition(wine.image_position)
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        aspectRatio: '4 / 5',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-soft)',
        cursor: onClick ? 'pointer' : 'default',
        background: wine.image_url ? 'none' : 'linear-gradient(135deg, rgba(107,31,42,0.85), rgba(140,42,58,0.65))',
        border: 'none',
        padding: 0,
        textAlign: 'left',
        fontFamily: 'inherit',
        color: 'inherit',
      }}
    >
      {wine.image_url ? (
        <img
          src={wine.image_url}
          alt={wine.name}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: `${p.x}% ${p.y}%`,
            transform: p.zoom > 1.005 ? `scale(${p.zoom})` : undefined,
            transformOrigin: 'center center',
          }}
        />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '40px', opacity: 0.4,
        }}>{TYPE_EMOJI[wine.wine_type] || '🍷'}</div>
      )}
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
        }}>{fmtMD(wine.drunk_at)}</div>
        <div style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: '12px',
          color: 'var(--ink-charcoal)',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>{wine.name}</div>
      </div>
    </button>
  )
}
