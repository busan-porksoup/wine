// 일회성: Supabase(wines·wishlist·wine-images) → D1 SQL 파일 + 사진 원본 다운로드
// 사용: node scripts/migrate-supabase.mjs <출력폴더>
//   → <출력폴더>/data.sql (D1에 넣을 INSERT), <출력폴더>/images/<파일명> (R2에 올릴 원본), <출력폴더>/summary.json
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const out = process.argv[2]
if (!out) { console.error('출력 폴더를 지정하세요'); process.exit(1) }
mkdirSync(join(out, 'images'), { recursive: true })

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter(l => l.includes('='))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }))
const U = env.NEXT_PUBLIC_SUPABASE_URL, K = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const H = { apikey: K, Authorization: `Bearer ${K}` }
const PUBLIC_PREFIX = `${U}/storage/v1/object/public/wine-images/`

async function rows(table) {
  const r = await fetch(`${U}/rest/v1/${table}?select=*`, { headers: H })
  if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`)
  return r.json()
}

const sqlVal = v => v === null || v === undefined ? 'NULL'
  : typeof v === 'number' ? String(v)
  : typeof v === 'object' ? `'${JSON.stringify(v).replace(/'/g, "''")}'`
  : `'${String(v).replace(/'/g, "''")}'`

const images = new Set()
function localUrl(url) {
  if (!url) return null
  if (!url.startsWith(PUBLIC_PREFIX)) throw new Error('예상 밖 사진 주소: ' + url)
  const key = decodeURIComponent(url.slice(PUBLIC_PREFIX.length))
  images.add(key)
  return `/images/${key}`
}

const WINE_COLS = ['id', 'name', 'producer', 'country', 'region', 'grape_variety', 'vintage_year', 'wine_type', 'image_url',
  'image_position', 'memo', 'rating', 'rating_jaehyuk', 'rating_wonwoo', 'drunk_at', 'created_at', 'tasting_tags', 'food_pairings', 'wine_info']
const WISH_COLS = ['id', 'name', 'vintage_year', 'region', 'country', 'varietal', 'wine_type', 'priority', 'source', 'photo_url', 'note', 'added_at']

const wines = await rows('wines')
const wishlist = await rows('wishlist')
const lines = []
for (const w of wines) {
  w.image_url = localUrl(w.image_url)
  lines.push(`INSERT INTO wines (${WINE_COLS.join(',')}) VALUES (${WINE_COLS.map(c => sqlVal(w[c])).join(',')});`)
}
for (const w of wishlist) {
  w.photo_url = localUrl(w.photo_url)
  lines.push(`INSERT INTO wishlist (${WISH_COLS.join(',')}) VALUES (${WISH_COLS.map(c => sqlVal(w[c])).join(',')});`)
}
writeFileSync(join(out, 'data.sql'), lines.join('\n') + '\n')

// 사진: DB가 참조하는 것 + 저장소에 있는 것 전부 (참조 안 되는 사진도 원본 보존)
const listed = await (await fetch(`${U}/storage/v1/object/list/wine-images`, { method: 'POST', headers: { ...H, 'content-type': 'application/json' },
  body: JSON.stringify({ prefix: '', limit: 10000 }) })).json()
for (const f of listed) if (f.id) images.add(f.name)

let bytes = 0, downloaded = 0
for (const key of images) {
  const dest = join(out, 'images', key)
  if (existsSync(dest) && statSync(dest).size > 0) { bytes += statSync(dest).size; continue }
  const r = await fetch(PUBLIC_PREFIX + encodeURIComponent(key))
  if (!r.ok) throw new Error(`사진 다운로드 실패 ${key}: ${r.status}`)
  const buf = Buffer.from(await r.arrayBuffer())
  writeFileSync(dest, buf); bytes += buf.length; downloaded++
}
const summary = { wines: wines.length, wishlist: wishlist.length, images: images.size, referenced: wines.filter(w => w.image_url).length + wishlist.filter(w => w.photo_url).length, downloaded, mb: +(bytes / 1e6).toFixed(1) }
writeFileSync(join(out, 'summary.json'), JSON.stringify(summary, null, 2))
console.log(summary)
