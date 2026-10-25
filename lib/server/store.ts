// 서버 전용: D1(wines·wishlist) 읽기/쓰기. 화면 코드는 lib/db.ts → /api/* 를 통해서만 접근
import { env } from 'cloudflare:workers'

type Table = 'wines' | 'wishlist'

const COLUMNS: Record<Table, string[]> = {
  wines: ['name', 'producer', 'country', 'region', 'grape_variety', 'vintage_year', 'wine_type', 'image_url', 'image_position',
    'memo', 'rating', 'rating_jaehyuk', 'rating_wonwoo', 'drunk_at', 'tasting_tags', 'food_pairings', 'wine_info'],
  wishlist: ['name', 'vintage_year', 'region', 'country', 'varietal', 'wine_type', 'priority', 'source', 'photo_url', 'note'],
}
// D1엔 TEXT로 저장, 주고받을 땐 배열·객체
const JSON_COLUMNS: Record<Table, string[]> = {
  wines: ['grape_variety', 'tasting_tags', 'food_pairings', 'wine_info'],
  wishlist: [],
}
const ORDER: Record<Table, string> = {
  wines: 'drunk_at DESC, created_at DESC',
  wishlist: 'priority DESC, added_at DESC',
}

function decode(table: Table, row: Record<string, any>) {
  for (const c of JSON_COLUMNS[table]) if (typeof row[c] === 'string') row[c] = JSON.parse(row[c])
  return row
}

// 허용된 컬럼만 골라 D1에 넣을 값으로 변환
function encode(table: Table, data: Record<string, any>) {
  const cols = COLUMNS[table].filter(c => c in data)
  const vals = cols.map(c => {
    const v = data[c]
    if (v === undefined || v === null) return null
    return JSON_COLUMNS[table].includes(c) ? JSON.stringify(v) : v
  })
  return { cols, vals }
}

export async function list(table: Table) {
  const { results } = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY ${ORDER[table]}`).all()
  return results.map(r => decode(table, r as Record<string, any>))
}

export async function insert(table: Table, data: Record<string, any>) {
  const id = crypto.randomUUID()
  const { cols, vals } = encode(table, data)
  if (!cols.includes('name')) throw new Error('name required')
  await env.DB.prepare(`INSERT INTO ${table} (id, ${cols.join(', ')}) VALUES (?, ${cols.map(() => '?').join(', ')})`)
    .bind(id, ...vals).run()
  return id
}

export async function update(table: Table, id: string, data: Record<string, any>) {
  const { cols, vals } = encode(table, data)
  if (!cols.length) return
  await env.DB.prepare(`UPDATE ${table} SET ${cols.map(c => `${c} = ?`).join(', ')} WHERE id = ?`).bind(...vals, id).run()
}

export async function remove(table: Table, id: string) {
  await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run()
}
