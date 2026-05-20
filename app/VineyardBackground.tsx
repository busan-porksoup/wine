'use client'

import { useEffect, useState } from 'react'

const VINEYARD_BACKGROUNDS = [
  '/71d350178084297.64e28376ce709.webp',
  '/c6e6ac178084297.64e28378c0a8d.webp',
  '/ffbbe2178084297.64e28377bdb75.webp',
  '/1b8993178084297.64e3d87e3b2c1.webp',
  '/718df2178084297.64e3d87e3c4ce.webp',
  '/65d074178084297.64e6431f3f83d.webp',
  '/850f44178084297.64e6431f3c0d3.webp',
  '/ba742d178084297.64e3d87fde8f0.webp',
  '/c86c0c178084297.64e3dcf50c70e.webp',
  '/1215de178084297.64e6477057b14.webp',
]

export function VineyardBackground() {
  const [bgUrl, setBgUrl] = useState<string | null>(null)

  useEffect(() => {
    setBgUrl(VINEYARD_BACKGROUNDS[Math.floor(Math.random() * VINEYARD_BACKGROUNDS.length)])
  }, [])

  return (
    <div
      className="bg-vineyard"
      aria-hidden="true"
      style={bgUrl ? { backgroundImage: `url('${bgUrl}')` } : undefined}
    />
  )
}
