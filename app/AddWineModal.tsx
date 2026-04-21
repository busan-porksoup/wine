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
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1.5px solid #F0EAE0',
  fontSize: '14px',
  fontFamily: "'Pretendard', sans-serif",
  boxSizing: 'border-box' as const,
  color: '#1A1A1A',
  background: '#FAFAF8',
  outline: 'none',
}

const labelStyle = {
  fontSize: '11px',
  fontWeight: '600' as const,
  color: '#AAA',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  marginBottom: '8px',
  display: 'block',
}

export default function AddWineModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: '',
    producer: '',
    country: '',
    region: '',
    vintage_year: '',
    wine_type: 'red',
    drunk_at: '',
    grape_variety: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [recognizing, setRecognizing] = useState(false)
  const [error, setError] = useState('')
  const [aiMsg, setAiMsg] = useState('')

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setAiMsg('')

    // 파일 수정일에서 날짜 추출
    const lastModified = new Date(file.lastModified)
    const yyyy = lastModified.getFullYear()
    const mm = String(lastModified.getMonth() + 1).padStart(2, '0')
    const dd = String(lastModified.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`
    setForm(prev => ({ ...prev, drunk_at: dateStr }))
  }

  async function handleRecognize() {
    if (!imageFile) { setError('사진을 먼저 선택해주세요!'); return }
    setRecognizing(true)
    setAiMsg('AI가 라벨을 분석 중이에요...')
    setError('')

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(imageFile)
      })

      const res = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: imageFile.type,
          exifDate: form.drunk_at,
        }),
      })

      const result = await res.json()

      if (!result.success) {
        setError('AI 인식 실패: ' + result.error)
        setAiMsg('')
      } else {
        const d = result.data
        setForm({
          name: d.name || '',
          producer: d.producer || '',
          country: d.country || '',
          region: d.region || '',
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

  async function handleSave() {
    if (!form.name) { setError('와인 이름은 필수예요!'); return }
    setSaving(true)
    setError('')

    let image_url = null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('wine-images')
        .upload(fileName, imageFile)

      if (uploadError) {
        setError('이미지 업로드 실패: ' + uploadError.message)
        setSaving(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('wine-images')
        .getPublicUrl(fileName)
      image_url = urlData.publicUrl
    }

    const { error } = await supabase.from('wines').insert({
      name: form.name,
      producer: form.producer || null,
      country: form.country || null,
      region: form.region || null,
      vintage_year: form.vintage_year ? parseInt(form.vintage_year) : null,
      wine_type: form.wine_type,
      drunk_at: form.drunk_at || null,
      grape_variety: form.grape_variety ? form.grape_variety.split(',').map(s => s.trim()) : null,
      image_url,
    })

    setSaving(false)
    if (error) {
      setError('저장 실패: ' + error.message)
    } else {
      onSaved()
      onClose()
    }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 200, backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: '24px 24px 0 0',
        width: '100%', maxWidth: '430px', maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* 헤더 */}
        <div style={{
          background: 'linear-gradient(160deg, #1A1A2E, #4A2040)',
          borderRadius: '24px 24px 0 0', padding: '20px 24px', position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }}/>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '12px 0 4px' }}>새 와인 추가</h2>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>사진으로 AI 자동 인식하거나 직접 입력해요</p>
        </div>

        <div style={{ padding: '24px 24px 40px' }}>

          {/* 이미지 업로드 */}
          <div style={{ marginBottom: '16px' }}>
            <span style={labelStyle}>와인 사진</span>
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }}/>
              {imagePreview ? (
                <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '180px' }}>
                  <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: '600', background: 'rgba(0,0,0,0.4)', padding: '6px 14px', borderRadius: '20px' }}>사진 변경</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  height: '120px', borderRadius: '16px',
                  border: '2px dashed #F0EAE0', background: '#FAFAF8',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                  <div style={{ fontSize: '28px' }}>📷</div>
                  <div style={{ fontSize: '13px', color: '#AAA', fontWeight: '600' }}>사진 추가하기</div>
                  <div style={{ fontSize: '11px', color: '#CCC' }}>탭해서 갤러리에서 선택</div>
                </div>
              )}
            </label>
          </div>

          {/* AI 인식 버튼 */}
          {imageFile && (
            <button onClick={handleRecognize} disabled={recognizing} style={{
              width: '100%', padding: '14px', borderRadius: '12px', marginBottom: '16px',
              background: recognizing ? '#F0EAE0' : 'linear-gradient(135deg, #2D1B35, #4A2040)',
              border: 'none', color: recognizing ? '#AAA' : '#fff',
              fontSize: '14px', fontWeight: '700', cursor: recognizing ? 'not-allowed' : 'pointer',
              fontFamily: "'Pretendard', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              {recognizing ? <>⏳ AI 분석 중...</> : <>✨ AI로 라벨 자동 인식</>}
            </button>
          )}

          {/* AI 메시지 */}
          {aiMsg && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.2)', fontSize: '13px', color: '#27AE60', fontWeight: '600' }}>
              {aiMsg}
            </div>
          )}

          {/* 와인 종류 */}
          <div style={{ marginBottom: '20px' }}>
            <span style={labelStyle}>와인 종류</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {WINE_TYPES.map(t => (
                <button key={t.value} onClick={() => set('wine_type', t.value)} style={{
                  padding: '8px 14px', borderRadius: '20px',
                  border: form.wine_type === t.value ? '2px solid #8B2635' : '1.5px solid #F0EAE0',
                  background: form.wine_type === t.value ? 'rgba(139,38,53,0.08)' : '#FAFAF8',
                  color: form.wine_type === t.value ? '#8B2635' : '#AAA',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  fontFamily: "'Pretendard', sans-serif",
                }}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 와인 이름 */}
          <div style={{ marginBottom: '16px' }}>
            <span style={labelStyle}>와인 이름 *</span>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="예) Château Margaux" style={inputStyle} />
          </div>

          {/* 생산자 */}
          <div style={{ marginBottom: '16px' }}>
            <span style={labelStyle}>생산자</span>
            <input value={form.producer} onChange={e => set('producer', e.target.value)}
              placeholder="예) Domaine Chavy-Chouet" style={inputStyle} />
          </div>

          {/* 국가 + 지역 */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <span style={labelStyle}>국가</span>
              <input value={form.country} onChange={e => set('country', e.target.value)}
                placeholder="예) France" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={labelStyle}>지역</span>
              <input value={form.region} onChange={e => set('region', e.target.value)}
                placeholder="예) Bordeaux" style={inputStyle} />
            </div>
          </div>

          {/* 빈티지 + 음용일 */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <span style={labelStyle}>빈티지</span>
              <input value={form.vintage_year} onChange={e => set('vintage_year', e.target.value)}
                placeholder="예) 2021" type="number" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={labelStyle}>마신 날짜</span>
              <input value={form.drunk_at} onChange={e => set('drunk_at', e.target.value)}
                placeholder="예) 2026-04-12" style={inputStyle} />
            </div>
          </div>

          {/* 품종 */}
          <div style={{ marginBottom: '24px' }}>
            <span style={labelStyle}>품종 (여러 개면 쉼표로 구분)</span>
            <input value={form.grape_variety} onChange={e => set('grape_variety', e.target.value)}
              placeholder="예) Aligoté" style={inputStyle} />
          </div>

          {error && (
            <div style={{ marginBottom: '12px', fontSize: '13px', color: '#E74C3C', fontWeight: '600', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '16px', borderRadius: '14px',
            background: saving ? '#CCC' : 'linear-gradient(135deg, #8B2635, #C0394D)',
            border: 'none', color: '#fff', fontSize: '15px', fontWeight: '700',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: "'Pretendard', sans-serif",
          }}>
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  )
}