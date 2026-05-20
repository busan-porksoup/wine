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

type WineForm = {
  name: string; producer: string; country: string; region: string;
  vintage_year: string; wine_type: string; drunk_at: string; grape_variety: string;
}

const emptyForm = (): WineForm => ({
  name: '', producer: '', country: '', region: '',
  vintage_year: '', wine_type: 'red', drunk_at: '', grape_variety: '',
})

export default function AddWineModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState<'single' | 'multi'>('single')

  // 단일 모드
  const [form, setForm] = useState<WineForm>(emptyForm())
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [recognizing, setRecognizing] = useState(false)
  const [error, setError] = useState('')
  const [aiMsg, setAiMsg] = useState('')

  // 다중 모드
  const [multiFiles, setMultiFiles] = useState<File[]>([])
  const [multiProgress, setMultiProgress] = useState<{ file: string; status: 'pending' | 'recognizing' | 'saving' | 'done' | 'error'; name?: string }[]>([])
  const [multiRunning, setMultiRunning] = useState(false)
  const [multiDone, setMultiDone] = useState(false)

  function setF(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSingleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setAiMsg('')
    const d = new Date(file.lastModified)
    setF('drunk_at', `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)
  }

  function handleMultiImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setMultiFiles(files)
    setMultiProgress(files.map(f => ({ file: f.name, status: 'pending' })))
    setMultiDone(false)
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function recognizeOne(file: File): Promise<WineForm | null> {
    try {
      const base64 = await fileToBase64(file)
      const d = new Date(file.lastModified)
      const drunk_at = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

      const res = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type, exifDate: drunk_at }),
      })
      const result = await res.json()
      if (!result.success) return null
      const d2 = result.data
      return {
        name: d2.name || '',
        producer: d2.producer || '',
        country: d2.country || '',
        region: d2.region || '',
        vintage_year: d2.vintage_year ? String(d2.vintage_year) : '',
        wine_type: d2.wine_type || 'red',
        drunk_at: d2.drunk_at || drunk_at,
        grape_variety: d2.grape_variety || '',
      }
    } catch { return null }
  }

  async function saveOne(formData: WineForm, file: File): Promise<boolean> {
    try {
      let image_url = null
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('wine-images').upload(fileName, file)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('wine-images').getPublicUrl(fileName)
        image_url = urlData.publicUrl
      }
      const { error } = await supabase.from('wines').insert({
        name: formData.name,
        producer: formData.producer || null,
        country: formData.country || null,
        region: formData.region || null,
        vintage_year: formData.vintage_year ? parseInt(formData.vintage_year) : null,
        wine_type: formData.wine_type,
        drunk_at: formData.drunk_at || null,
        grape_variety: formData.grape_variety ? formData.grape_variety.split(',').map(s => s.trim()) : null,
        image_url,
      })
      return !error
    } catch { return false }
  }

  async function handleMultiStart() {
    if (!multiFiles.length) return
    setMultiRunning(true)

    for (let i = 0; i < multiFiles.length; i++) {
      const file = multiFiles[i]

      // AI 인식 중
      setMultiProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'recognizing' } : p))
      const formData = await recognizeOne(file)

      if (!formData || !formData.name) {
        setMultiProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error' } : p))
        continue
      }

      // 저장 중
      setMultiProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'saving', name: formData.name } : p))
      const ok = await saveOne(formData, file)

      setMultiProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: ok ? 'done' : 'error', name: formData.name } : p))
    }

    setMultiRunning(false)
    setMultiDone(true)
    onSaved()
  }

  async function handleSingleRecognize() {
    if (!imageFile) { setError('사진을 먼저 선택해주세요!'); return }
    setRecognizing(true)
    setAiMsg('AI가 라벨을 분석 중이에요...')
    setError('')
    try {
      const base64 = await fileToBase64(imageFile)
      const res = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: imageFile.type, exifDate: form.drunk_at }),
      })
      const result = await res.json()
      if (!result.success) {
        setError('AI 인식 실패: ' + result.error)
        setAiMsg('')
      } else {
        const d = result.data
        setForm({
          name: d.name || '', producer: d.producer || '',
          country: d.country || '', region: d.region || '',
          vintage_year: d.vintage_year ? String(d.vintage_year) : '',
          wine_type: d.wine_type || 'red',
          drunk_at: d.drunk_at || form.drunk_at,
          grape_variety: d.grape_variety || '',
        })
        setAiMsg('✓ AI 인식 완료! 내용을 확인하고 수정해주세요.')
      }
    } catch (e: any) {
      setError('오류 발생: ' + e.message)
      setAiMsg('')
    }
    setRecognizing(false)
  }

  async function handleSingleSave() {
    if (!form.name) { setError('와인 이름은 필수예요!'); return }
    setSaving(true)
    setError('')
    const ok = await saveOne(form, imageFile!)
    setSaving(false)
    if (!ok) { setError('저장 실패!'); return }
    onSaved()
    onClose()
  }

  const statusIcon = (s: string) => ({ pending: '⏳', recognizing: '🔍', saving: '💾', done: '✅', error: '❌' }[s] || '⏳')
  const statusText = (s: string, name?: string) => ({
    pending: '대기 중',
    recognizing: 'AI 인식 중...',
    saving: '저장 중...',
    done: name || '완료',
    error: '실패',
  }[s] || '')

  return (
    <div onClick={onClose} className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(42,36,32,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-paper)',
        borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '430px', maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 -8px 40px rgba(107,31,42,0.18)',
      }}>

        {/* 헤더 */}
        <div style={{ padding: '24px 24px 16px', position: 'relative', textAlign: 'center' }}>
          {/* drag handle */}
          <div style={{ width: 44, height: 4, borderRadius: 2, background: 'var(--ink-sand)', opacity: 0.6, margin: '0 auto 18px' }}/>

          <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '6px' }}>Add New</div>
          <h2 className="type-display-2" style={{ color: 'var(--ink-charcoal)', margin: '0 0 20px', fontSize: '32px' }}>A new bottle.</h2>

          {/* 모드 선택 — underline pills */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {(['single', 'multi'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} className="type-caption" style={{
                padding: '8px 16px', borderRadius: 'var(--radius-full)',
                border: mode === m ? '1.5px solid var(--ink-bordeaux)' : '1px solid rgba(200,184,154,0.5)',
                background: mode === m ? 'rgba(107,31,42,0.06)' : 'transparent',
                color: mode === m ? 'var(--ink-bordeaux)' : 'var(--ink-mist)',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}>
                {m === 'single' ? '📷 1장' : '📚 여러 장'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(200,184,154,0.5)', margin: '0 24px' }}/>

        <div style={{ padding: '24px 24px 40px' }}>

          {/* 단일 모드 */}
          {mode === 'single' && (
            <>
              <div style={{ marginBottom: '18px' }}>
                <span style={labelStyle}>와인 사진</span>
                <label style={{ display: 'block', cursor: 'pointer' }}>
                  <input type="file" accept="image/*" onChange={handleSingleImage} style={{ display: 'none' }}/>
                  {imagePreview ? (
                    <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '160px', border: '1px solid var(--glass-border)' }}>
                      <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(42,36,32,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="type-caption" style={{ color: '#fff', background: 'rgba(42,36,32,0.5)', padding: '6px 14px', borderRadius: 'var(--radius-full)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>사진 변경</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: '110px', borderRadius: 'var(--radius-md)', border: '1.5px dashed rgba(200,184,154,0.7)', background: 'rgba(250,246,238,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '24px', opacity: 0.6 }}>📷</div>
                      <div className="type-caption" style={{ color: 'var(--ink-mist)' }}>사진 추가하기</div>
                    </div>
                  )}
                </label>
              </div>

              {imageFile && (
                <button onClick={handleSingleRecognize} disabled={recognizing} className="type-caption" style={{
                  width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '18px',
                  background: recognizing ? 'rgba(200,184,154,0.4)' : 'var(--ink-charcoal)',
                  border: 'none', color: recognizing ? 'var(--ink-mist)' : '#fff',
                  cursor: recognizing ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}>
                  {recognizing ? '⏳ AI 분석 중…' : '✨ AI로 라벨 자동 인식'}
                </button>
              )}

              {aiMsg && (
                <div className="type-body" style={{ marginBottom: '18px', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(92,107,63,0.08)', border: '1px solid rgba(92,107,63,0.2)', color: 'var(--ink-olive)' }}>
                  {aiMsg}
                </div>
              )}

              {/* 와인 종류 */}
              <div style={{ marginBottom: '18px' }}>
                <span style={labelStyle}>와인 종류</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {WINE_TYPES.map(t => (
                    <button key={t.value} onClick={() => setF('wine_type', t.value)} className="type-micro" style={{
                      padding: '7px 13px', borderRadius: 'var(--radius-full)',
                      border: form.wine_type === t.value ? '1.5px solid var(--ink-bordeaux)' : '1px solid rgba(200,184,154,0.5)',
                      background: form.wine_type === t.value ? 'rgba(107,31,42,0.08)' : 'rgba(250,246,238,0.6)',
                      color: form.wine_type === t.value ? 'var(--ink-bordeaux)' : 'var(--ink-mist)',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    }}>{t.emoji} {t.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <span style={labelStyle}>와인 이름 *</span>
                <input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="예) Château Margaux" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <span style={labelStyle}>생산자</span>
                <input value={form.producer} onChange={e => setF('producer', e.target.value)} placeholder="예) Domaine Chavy-Chouet" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <div style={{ flex: 1 }}>
                  <span style={labelStyle}>국가</span>
                  <input value={form.country} onChange={e => setF('country', e.target.value)} placeholder="예) France" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={labelStyle}>지역</span>
                  <input value={form.region} onChange={e => setF('region', e.target.value)} placeholder="예) Bordeaux" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <div style={{ flex: 1 }}>
                  <span style={labelStyle}>빈티지</span>
                  <input value={form.vintage_year} onChange={e => setF('vintage_year', e.target.value)} placeholder="예) 2021" type="number" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={labelStyle}>마신 날짜</span>
                  <input value={form.drunk_at} onChange={e => setF('drunk_at', e.target.value)} placeholder="예) 2026-04-12" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <span style={labelStyle}>품종</span>
                <input value={form.grape_variety} onChange={e => setF('grape_variety', e.target.value)} placeholder="예) Aligoté" style={inputStyle} />
              </div>

              {error && (
                <div className="type-caption" style={{ marginBottom: '14px', color: '#B53E2A', textAlign: 'center' }}>{error}</div>
              )}

              <button onClick={handleSingleSave} disabled={saving} className="type-caption" style={{
                width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
                background: saving ? 'rgba(138,126,109,0.4)' : 'var(--ink-bordeaux)',
                border: 'none', color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
              }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          )}

          {/* 다중 모드 */}
          {mode === 'multi' && (
            <>
              {!multiRunning && !multiDone && (
                <>
                  <label style={{ display: 'block', cursor: 'pointer', marginBottom: '20px' }}>
                    <input type="file" accept="image/*" multiple onChange={handleMultiImages} style={{ display: 'none' }}/>
                    <div style={{ height: '130px', borderRadius: 'var(--radius-md)', border: '1.5px dashed rgba(200,184,154,0.7)', background: 'rgba(250,246,238,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '32px', opacity: 0.6 }}>📚</div>
                      <div className="type-caption" style={{ color: 'var(--ink-mist)' }}>여러 사진 한번에 선택</div>
                      <div className="type-micro" style={{ color: 'var(--ink-sand)' }}>갤러리에서 여러 장 가능</div>
                    </div>
                  </label>

                  {multiFiles.length > 0 && (
                    <>
                      <div className="type-body" style={{ marginBottom: '18px', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(244,239,230,0.7)', border: '1px solid rgba(200,184,154,0.4)', color: 'var(--ink-charcoal)' }}>
                        📷 {multiFiles.length}장 선택됨 — AI가 순서대로 인식하고 자동 저장해요
                      </div>
                      <button onClick={handleMultiStart} className="type-caption" style={{
                        width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
                        background: 'var(--ink-bordeaux)',
                        border: 'none', color: '#fff',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      }}>
                        ✨ AI 자동 인식 &amp; 저장 시작
                      </button>
                    </>
                  )}
                </>
              )}

              {/* 진행 상황 */}
              {(multiRunning || multiDone) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', marginBottom: '12px' }}>
                    {multiDone ? `✅ 완료 — ${multiProgress.filter(p => p.status === 'done').length}/${multiProgress.length}장` : '⏳ 처리 중…'}
                  </div>
                  {multiProgress.map((p, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: p.status === 'done' ? 'rgba(92,107,63,0.06)'
                                : p.status === 'error' ? 'rgba(181,62,42,0.06)'
                                : 'rgba(244,239,230,0.7)',
                      border: `1px solid ${
                        p.status === 'done' ? 'rgba(92,107,63,0.25)'
                        : p.status === 'error' ? 'rgba(181,62,42,0.25)'
                        : 'rgba(200,184,154,0.4)'
                      }`,
                    }}>
                      <span style={{ fontSize: '16px' }}>{statusIcon(p.status)}</span>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div className="type-body" style={{ color: 'var(--ink-charcoal)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
                          {p.name || p.file}
                        </div>
                        <div className="type-micro" style={{ color: 'var(--ink-mist)' }}>{statusText(p.status, p.name)}</div>
                      </div>
                    </div>
                  ))}

                  {multiDone && (
                    <button onClick={onClose} className="type-caption" style={{
                      marginTop: '12px', width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
                      background: 'var(--ink-bordeaux)',
                      border: 'none', color: '#fff',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    }}>
                      완료 — 홈으로 돌아가기
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}