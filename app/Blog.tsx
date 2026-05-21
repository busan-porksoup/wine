'use client'

import { useEffect, useState } from 'react'

type Post = {
  title: string
  link: string
  pubDate: string
  thumbnail: string | null
  preview: string
}

const BLOG_URL = 'https://m.blog.naver.com/kr_jaehyuk_choi'

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Post | null>(null)

  useEffect(() => {
    fetch('/api/blog')
      .then(r => r.json())
      .then(d => {
        if (d.success) setPosts(d.items)
        else setError(d.error || '블로그 글을 불러오지 못했어요')
      })
      .catch(e => setError(e.message))
  }, [])

  // ESC로 모달 닫기
  useEffect(() => {
    if (!selected) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected])

  return (
    <div style={{ padding: '20px 16px 120px' }}>
      {/* 헤더 */}
      <div style={{ padding: '4px 8px 18px' }}>
        <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '4px' }}>JAEHYEOK · NAVER BLOG</div>
        <a href={BLOG_URL} target="_blank" rel="noopener noreferrer" className="type-micro" style={{
          color: 'var(--ink-mist)', textTransform: 'none', letterSpacing: 0,
          fontStyle: 'italic', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: '4px',
        }}>
          @kr_jaehyuk_choi <span style={{ fontStyle: 'normal' }}>→</span>
        </a>
      </div>

      {/* 상태별 렌더 */}
      {error ? (
        <div className="glass-card glass-card--light" style={{ padding: '24px', textAlign: 'center' }}>
          <div className="type-body" style={{ color: '#B53E2A', marginBottom: '10px' }}>{error}</div>
          <a href={BLOG_URL} target="_blank" rel="noopener noreferrer" className="type-micro" style={{
            color: 'var(--ink-bordeaux)', textDecoration: 'none',
          }}>
            블로그 바로가기 →
          </a>
        </div>
      ) : !posts ? (
        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
          <div className="type-micro" style={{ color: 'var(--ink-mist)' }}>블로그 글 불러오는 중…</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card glass-card--light" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', marginBottom: '8px' }}>아직 글이 없어요</div>
          <div className="type-micro" style={{ color: 'var(--ink-mist)' }}>FIRST POST PENDING</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {posts.map((p, i) => (
            <button
              key={i}
              onClick={() => setSelected(p)}
              className="glass-card"
              style={{
                display: 'flex',
                gap: '14px',
                padding: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                border: '1px solid var(--glass-border)',
                fontFamily: 'inherit',
                color: 'inherit',
              }}
            >
              {p.thumbnail && (
                <div style={{
                  width: 88, height: 88, flexShrink: 0,
                  borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(244,239,230,0.5)',
                }}>
                  <img src={p.thumbnail} alt="" referrerPolicy="no-referrer" style={{
                    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  }}/>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div className="type-micro" style={{ color: 'var(--ink-mist)', marginBottom: '6px' }}>
                  {formatDate(p.pubDate)}
                </div>
                <div className="type-title-md" style={{
                  fontStyle: 'italic', color: 'var(--ink-charcoal)',
                  fontSize: '15px', lineHeight: 1.3, marginBottom: '6px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {p.title}
                </div>
                {p.preview && (
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--ink-mist)',
                    fontSize: '11px',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {p.preview}…
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && <BlogPostModal post={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function BlogPostModal({ post, onClose }: { post: Post; onClose: () => void }) {
  return (
    <div onClick={onClose} className="modal-backdrop" style={{
      position: 'fixed', inset: 0, background: 'rgba(42,36,32,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
    }}>
      <div onClick={e => e.stopPropagation()} className="modal-sheet" style={{
        width: '100%', maxWidth: '430px', height: '95vh',
        background: 'var(--bg-paper)',
        borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -8px 40px rgba(107,31,42,0.18)',
      }}>
        {/* 헤더 — 원본 링크 + 닫기 */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(200,184,154,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '12px',
          background: 'var(--bg-paper)',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '2px', fontSize: '10px' }}>NAVER BLOG</div>
            <div className="type-micro" style={{
              color: 'var(--ink-charcoal)',
              fontSize: '12px',
              textTransform: 'none',
              letterSpacing: 0,
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {post.title}
            </div>
          </div>
          <a href={post.link} target="_blank" rel="noopener noreferrer" className="type-micro" style={{
            color: 'var(--ink-mist)', textTransform: 'none', letterSpacing: 0,
            fontStyle: 'italic', textDecoration: 'none', flexShrink: 0,
            padding: '6px 10px', borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(200,184,154,0.5)',
            fontSize: '11px',
          }}>
            원본 ↗
          </a>
          <button onClick={onClose} aria-label="닫기" style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(42,36,32,0.55)', border: 'none',
            color: '#fff', fontSize: '12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          }}>✕</button>
        </div>

        {/* iframe */}
        <iframe
          src={post.link}
          title={post.title}
          referrerPolicy="no-referrer-when-downgrade"
          style={{ flex: 1, width: '100%', border: 0, background: 'rgba(244,239,230,0.5)' }}
        />
      </div>
    </div>
  )
}
