'use client'

import { useEffect, useRef, useState } from 'react'

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
  const elRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setBgUrl(VINEYARD_BACKGROUNDS[Math.floor(Math.random() * VINEYARD_BACKGROUNDS.length)])
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = elRef.current
    if (!el) return

    let ticking = false
    let scrollY = 0

    function update() {
      const y = scrollY
      const translate = y * -0.35
      const blurProgress = Math.min(y / 400, 1)
      const blur = 6 + blurProgress * 14
      el!.style.transform = `translate3d(0, ${translate}px, 0)`
      el!.style.filter = `saturate(0.88) brightness(1.02) blur(${blur}px)`
      ticking = false
    }

    function onScroll() {
      scrollY = window.scrollY
      if (!ticking) {
        requestAnimationFrame(update)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => window.removeEventListener('scroll', onScroll)
  }, [bgUrl])

  return (
    <div
      ref={elRef}
      className="bg-vineyard"
      aria-hidden="true"
      style={bgUrl ? { backgroundImage: `url('${bgUrl}')` } : undefined}
    />
  )
}
