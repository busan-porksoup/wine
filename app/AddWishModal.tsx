'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const WINE_TYPES = [
  { value: 'red',       label: '레드',   emoji: '🍷' },
  { value: 'white',     label: '화이트', emoji: '🥂' },
  { value: 'sparkling', label: '샴페인', emoji: '🍾' },
  { value: 'rosé',      label: '로제',   emoji: '🌸' },
  { value: 'dessert',   label: '디저트', emoji: '🍯' },
]

const PRIORITIES = [
  { value: 3, label: 'Next Gathering', sub: '다음 모임', color: 'var(--ink-bordeaux)' },
  { value: 2, label: 'Soon',           sub: '곧 마시고 싶어',   color: 'var(--ink-ochre)' },
  { value: 1, label: 'Someday',        sub: '언젠가는',       color: 'var(--ink-mist)' },
]

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid rgba(200,184,154,0.5)', fontSize: '14px',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box' as const,
  color: 'var(--ink-charcoal)', background: 'rgba(250,246,238,0.7)', outline: 'none',
}

const labelStyle = {
  fontSize: '11px', fontWeight: 500 as const, color: 'var(--ink-mist)',
  letterSpacing: '0.14em', textTransform: 'uppercase' as const,
  marginBottom: '8px', display: 'block',
  fontFamily: 'var(--font-sans)',
}

type Props = { onClose: () => void; onSaved: () => void }

export default function AddWishModal({ onClose, onSaved }: Props) {
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState('')
  const [vintage, setVintage] = useState('')
  const [varietal, setVarietal] = useState('')
  const [wineType, setWineType] = useState('red')
  const [priority, setPriority] = useState(2)
  const [source, setSource] = useState('')
  const [note, setNote] = useState('')

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!name.trim()) { setError('와인 이름은 필수예요!'); return }
    setSaving(true)
    setError('')
    try {
      let photo_url: string | null = null
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const fileName = `wish_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage.from('wine-images').upload(fileName, imageFile)
        if (!upErr) {
          const { data } = supabase.storage.from('wine-images').getPublicUrl(fileName)
          photo_url = data.publicUrl
        }
      }
      const { error: insErr } = await supabase.from('wishlist').insert({
        name: name.trim(),
        vintage_year: vintage ? parseInt(vintage) : null,
        region: region || null,
        country: country || null,
        varietal: varietal || null,
        wine_type: wineType,
        priority,
        source: source || null,
        photo_url,
        note: note || null,
      })
      if (insErr) { setError('저장 실패: ' + insErr.message); setSaving(false); return }
      onSaved()
      onClose()
    } catch (e: any) {
      setError('오류: ' + e.message)
      setSaving(false)
    }
  }

  return (
    <div onClick={onClose} className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(42,36,32,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
      <div onClick={e => e.stopPropagation()} className="modal-sheet" style={{
        background: 'var(--bg-paper)',
        borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '430px', maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 -8px 40px rgba(107,31,42,0.18)',
      }}>
        {/* Sticky 닫기 */}
        <div style={{ position: 'sticky', top: 0, height: 0, zIndex: 20, pointerEvents: 'none' }}>
          <button onClick={onClose} aria-label="닫기" style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(42,36,32,0.55)', border: 'none', borderRadius: 'var(--radius-full)',
            width: 36, height: 36, color: '#fff', fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'auto',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          }}>✕</button>
        </div>

        {/* 헤더 */}
        <div style={{ padding: '32px 24px 16px', textAlign: 'center' }}>
          <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '6px' }}>To Drink Next</div>
          <h2 className="type-display-2" style={{ color: 'var(--ink-charcoal)', margin: '0', fontSize: '32px' }}>Add to Wishlist.</h2>
        </div>

        <div style={{ height: 1, background: 'rgba(200,184,154,0.5)', margin: '0 24px' }}/>

        <div style={{ padding: '24px 24px 40px' }}>

          {/* 사진 (선택) */}
          <div style={{ marginBottom: '18px' }}>
            <span style={labelStyle}>사진 (선택)</span>
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }}/>
              {imagePreview ? (
                <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '160px', border: '1px solid var(--glass-border)' }}>
                  <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(42,36,32,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="type-caption" style={{ color: '#fff', background: 'rgba(42,36,32,0.5)', padding: '6px 14px', borderRadius: 'var(--radius-full)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>사진 변경</span>
                  </div>
                </div>
              ) : (
                <div style={{ height: '90px', borderRadius: 'var(--radius-md)', border: '1.5px dashed rgba(200,184,154,0.7)', background: 'rgba(250,246,238,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '20px', opacity: 0.6 }}>📷</div>
                  <div className="type-micro" style={{ color: 'var(--ink-mist)' }}>사진 추가하기</div>
                </div>
              )}
            </label>
          </div>

          {/* 우선순위 */}
          <div style={{ marginBottom: '18px' }}>
            <span style={labelStyle}>우선순위</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PRIORITIES.map(p => (
                <button key={p.value} onClick={() => setPriority(p.value)} style={{
                  padding: '12px 14px', borderRadius: 'var(--radius-md)',
                  border: priority === p.value ? `1.5px solid ${p.color}` : '1px solid rgba(200,184,154,0.5)',
                  background: priority === p.value ? 'rgba(107,31,42,0.06)' : 'rgba(250,246,238,0.6)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  textAlign: 'left', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                }}>
                  <span className="type-title-md" style={{ fontStyle: 'italic', color: priority === p.value ? p.color : 'var(--ink-mist)', fontSize: '17px' }}>{p.label}</span>
                  <span className="type-micro" style={{ color: 'var(--ink-mist)' }}>{p.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 와인 종류 */}
          <div style={{ marginBottom: '18px' }}>
            <span style={labelStyle}>와인 종류</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {WINE_TYPES.map(t => (
                <button key={t.value} onClick={() => setWineType(t.value)} className="type-micro" style={{
                  padding: '7px 13px', borderRadius: 'var(--radius-full)',
                  border: wineType === t.value ? '1.5px solid var(--ink-bordeaux)' : '1px solid rgba(200,184,154,0.5)',
                  background: wineType === t.value ? 'rgba(107,31,42,0.08)' : 'rgba(250,246,238,0.6)',
                  color: wineType === t.value ? 'var(--ink-bordeaux)' : 'var(--ink-mist)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>{t.emoji} {t.label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <span style={labelStyle}>와인 이름 *</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="예) Sassicaia" style={inputStyle}/>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <span style={labelStyle}>생산자 / 품종</span>
            <input value={varietal} onChange={e => setVarietal(e.target.value)} placeholder="예) Tenuta San Guido, Cabernet Sauvignon" style={inputStyle}/>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <span style={labelStyle}>국가</span>
              <input value={country} onChange={e => setCountry(e.target.value)} placeholder="예) Italy" style={inputStyle}/>
            </div>
            <div style={{ flex: 1 }}>
              <span style={labelStyle}>지역</span>
              <input value={region} onChange={e => setRegion(e.target.value)} placeholder="예) Tuscany" style={inputStyle}/>
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <span style={labelStyle}>빈티지</span>
            <input value={vintage} onChange={e => setVintage(e.target.value)} type="number" placeholder="예) 2018" style={inputStyle}/>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <span style={labelStyle}>알게 된 곳 / 출처</span>
            <input value={source} onChange={e => setSource(e.target.value)} placeholder="예) 친구 추천, 백화점 와인샵" style={inputStyle}/>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <span style={labelStyle}>메모</span>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="짧은 메모..." style={{ ...inputStyle, height: '70px', resize: 'none', lineHeight: 1.5 }}/>
          </div>

          {error && (
            <div className="type-caption" style={{ marginBottom: '14px', color: '#B53E2A', textAlign: 'center' }}>{error}</div>
          )}

          <button onClick={handleSave} disabled={saving} className="type-caption" style={{
            width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
            background: saving ? 'rgba(138,126,109,0.4)' : 'var(--ink-bordeaux)',
            border: 'none', color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)',
          }}>
            {saving ? 'Saving…' : 'Save to Wishlist'}
          </button>
        </div>
      </div>
    </div>
  )
}
