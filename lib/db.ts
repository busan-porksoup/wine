// 화면 코드용 데이터 접근 — 서버 /api/* (D1·R2) 호출. 실패하면 { error }로 돌려줌 (예전 supabase 호출 모양과 비슷하게)
type Result<T> = { data: T | null; error: { message: string } | null }

async function call<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const res = await fetch(path, init)
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return { data: null, error: { message: json.error || `HTTP ${res.status}` } }
    return { data: json.data as T, error: null }
  } catch (e: any) {
    return { data: null, error: { message: e?.message || '네트워크 오류' } }
  }
}

const jsonBody = (method: string, body: unknown): RequestInit =>
  ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export const db = {
  listWines: () => call<any[]>('/api/wines'),
  addWine: (data: Record<string, any>) => call<{ id: string }>('/api/wines', jsonBody('POST', data)),
  updateWine: (id: string, data: Record<string, any>) => call<{ id: string }>(`/api/wines/${id}`, jsonBody('PATCH', data)),
  deleteWine: (id: string) => call<{ id: string }>(`/api/wines/${id}`, { method: 'DELETE' }),

  listWishlist: () => call<any[]>('/api/wishlist'),
  addWish: (data: Record<string, any>) => call<{ id: string }>('/api/wishlist', jsonBody('POST', data)),
  deleteWish: (id: string) => call<{ id: string }>(`/api/wishlist/${id}`, { method: 'DELETE' }),

  // 사진 원본 그대로 업로드 → { url: '/images/<파일명>' }
  uploadImage: (file: File) => {
    const ext = file.name.split('.').pop() || 'jpg'
    return call<{ url: string }>(`/api/images?ext=${encodeURIComponent(ext)}`,
      { method: 'POST', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file })
  },
}
