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
  width: '100%', padding: '12px 14px', borderRadius: '12px',
  border: '1.5px solid #F0EAE0', fontSize: '14px',
  fontFamily: "'Pretendard', sans-serif",
  boxSizing: 'border-box' as const,
  color: '#1A1A1A', background: '#FAFAF8', outline: 'none',
}

const labelStyle = {
  fontSize: '11px', fontWeight: '600' as const, color: '#AAA',
  letterSpacing: '1px', textTransform: 'uppercase' as const,
  marginBottom: '8px', display: 'block',
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '430px', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* 헤더 */}
        <div style={{ background: 'linear-gradient(160deg, #1A1A2E, #4A2040)', borderRadius: '24px 24px 0 0', padding: '20px 24px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }}/>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '12px 0 12px' }}>새 와인 추가</h2>

          {/* 모드 선택 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['single', 'multi'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px', borderRadius: '10px',
                border: mode === m ? '2px solid rgba(255,255,255,0.6)' : '1px solid rgba(255,255,255,0.2)',
                background: mode === m ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                fontFamily: "'Pretendard', sans-serif",
              }}>
                {m === 'single' ? '📷 1장 추가' : '📚 여러 장 추가'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '24px 24px 40px' }}>

          {/* 단일 모드 */}
          {mode === 'single' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <span style={labelStyle}>와인 사진</span>
                <label style={{ display: 'block', cursor: 'pointer' }}>
                  <input type="file" accept="image/*" onChange={handleSingleImage} style={{ display: 'none' }}/>
                  {imagePreview ? (
                    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '160px' }}>
                      <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#fff', fontWeight: '600', background: 'rgba(0,0,0,0.4)', padding: '6px 14px', borderRadius: '20px' }}>사진 변경</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: '100px', borderRadius: '16px', border: '2px dashed #F0EAE0', background: '#FAFAF8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '24px' }}>📷</div>
                      <div style={{ fontSize: '13px', color: '#AAA', fontWeight: '600' }}>사진 추가하기</div>
                    </div>
                  )}
                </label>
              </div>

              {imageFile && (
                <button onClick={handleSingleRecognize} disabled={recognizing} style={{
                  width: '100%', padding: '12px', borderRadius: '12px', marginBottom: '16px',
                  background: recognizing ? '#F0EAE0' : 'linear-gradient(135deg, #2D1B35, #4A2040)',
                  border: 'none', color: recognizing ? '#AAA' : '#fff',
                  fontSize: '14px', fontWeight: '700', cursor: recognizing ? 'not-allowed' : 'pointer',
                  fontFamily: "'Pretendard', sans-serif",
                }}>
                  {recognizing ? '⏳ AI 분석 중...' : '✨ AI로 라벨 자동 인식'}
                </button>
              )}

              {aiMsg && (
                <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.2)', fontSize: '13px', color: '#27AE60', fontWeight: '600' }}>
                  {aiMsg}
                </div>
              )}

              {/* 와인 종류 */}
              <div style={{ marginBottom: '16px' }}>
                <span style={labelStyle}>와인 종류</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {WINE_TYPES.map(t => (
                    <button key={t.value} onClick={() => setF('wine_type', t.value)} style={{
                      padding: '6px 12px', borderRadius: '20px',
                      border: form.wine_type === t.value ? '2px solid #8B2635' : '1.5px solid #F0EAE0',
                      background: form.wine_type === t.value ? 'rgba(139,38,53,0.08)' : '#FAFAF8',
                      color: form.wine_type === t.value ? '#8B2635' : '#AAA',
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      fontFamily: "'Pretendard', sans-serif",
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

              {error && <div style={{ marginBottom: '12px', fontSize: '13px', color: '#E74C3C', fontWeight: '600', textAlign: 'center' }}>{error}</div>}

              <button onClick={handleSingleSave} disabled={saving} style={{
                width: '100%', padding: '16px', borderRadius: '14px',
                background: saving ? '#CCC' : 'linear-gradient(135deg, #8B2635, #C0394D)',
                border: 'none', color: '#fff', fontSize: '15px', fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: "'Pretendard', sans-serif",
              }}>
                {saving ? '저장 중...' : '저장하기'}
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
                    <div style={{ height: '120px', borderRadius: '16px', border: '2px dashed #F0EAE0', background: '#FAFAF8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '32px' }}>📚</div>
                      <div style={{ fontSize: '14px', color: '#AAA', fontWeight: '600' }}>여러 사진 한번에 선택</div>
                      <div style={{ fontSize: '11px', color: '#CCC' }}>갤러리에서 여러 장 선택 가능</div>
                    </div>
                  </label>

                  {multiFiles.length > 0 && (
                    <>
                      <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '12px', background: '#F7F3EE', fontSize: '13px', color: '#555' }}>
                        📷 {multiFiles.length}장 선택됨 — AI가 순서대로 인식하고 자동 저장해요
                      </div>
                      <button onClick={handleMultiStart} style={{
                        width: '100%', padding: '16px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #8B2635, #C0394D)',
                        border: 'none', color: '#fff', fontSize: '15px', fontWeight: '700',
                        cursor: 'pointer', fontFamily: "'Pretendard', sans-serif",
                      }}>
                        ✨ AI 자동 인식 & 저장 시작
                      </button>
                    </>
                  )}
                </>
              )}

              {/* 진행 상황 */}
              {(multiRunning || multiDone) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>
                    {multiDone ? `✅ 완료! (${multiProgress.filter(p => p.status === 'done').length}/${multiProgress.length}장)` : '⏳ 처리 중...'}
                  </div>
                  {multiProgress.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: p.status === 'done' ? 'rgba(39,174,96,0.06)' : p.status === 'error' ? 'rgba(231,76,60,0.06)' : '#F7F3EE', border: `1px solid ${p.status === 'done' ? 'rgba(39,174,96,0.2)' : p.status === 'error' ? 'rgba(231,76,60,0.2)' : '#F0EAE0'}` }}>
                      <span style={{ fontSize: '16px' }}>{statusIcon(p.status)}</span>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name || p.file}
                        </div>
                        <div style={{ fontSize: '10px', color: '#AAA' }}>{statusText(p.status, p.name)}</div>
                      </div>
                    </div>
                  ))}

                  {multiDone && (
                    <button onClick={onClose} style={{
                      marginTop: '8px', width: '100%', padding: '14px', borderRadius: '14px',
                      background: 'linear-gradient(135deg, #8B2635, #C0394D)',
                      border: 'none', color: '#fff', fontSize: '15px', fontWeight: '700',
                      cursor: 'pointer', fontFamily: "'Pretendard', sans-serif",
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