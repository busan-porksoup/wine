/**
 * 모든 와인의 tasting_tags를 우리 동의어 사전과 대조.
 * 사전에 없는 태그를 빈도순으로 출력.
 *
 * 실행: npx tsx scripts/check-tags.ts  (배포된 사이트의 /api/wines를 읽음. 다른 주소: SITE=http://localhost:3001)
 */
import { SYNONYM_MAP } from '../app/notesVocabulary'

const SITE = process.env.SITE || 'https://wine.onewoo90.workers.dev'

async function main() {
  const res = await fetch(`${SITE}/api/wines`)
  const { data, error } = await res.json() as { data?: { name: string; tasting_tags: string[] | null }[]; error?: string }

  if (!res.ok || !data) {
    console.error('Error fetching wines:', error || res.status)
    process.exit(1)
  }

  console.log(`\n총 ${data.length}개 와인 조회됨\n`)

  // 태그 빈도 집계
  const tagCount: Record<string, number> = {}
  let winesWithTags = 0
  data.forEach(w => {
    if (Array.isArray(w.tasting_tags) && w.tasting_tags.length > 0) {
      winesWithTags++
      w.tasting_tags.forEach((t: string) => {
        if (t) tagCount[t.trim()] = (tagCount[t.trim()] || 0) + 1
      })
    }
  })

  console.log(`tasting_tags 있는 와인: ${winesWithTags}개`)

  const totalUnique = Object.keys(tagCount).length

  // 사전 매핑 여부 분류
  const mapped: { tag: string; count: number; canonical: string }[] = []
  const unmapped: { tag: string; count: number }[] = []
  Object.entries(tagCount).forEach(([tag, count]) => {
    const canonical = SYNONYM_MAP[tag]
    if (canonical) {
      mapped.push({ tag, count, canonical })
    } else {
      unmapped.push({ tag, count })
    }
  })

  console.log(`\n=== 통계 ===`)
  console.log(`총 unique 태그: ${totalUnique}개`)
  console.log(`사전 매핑됨: ${mapped.length}개`)
  console.log(`사전 없음: ${unmapped.length}개`)

  // 정규화로 실제 변경될 태그
  const willChange = mapped.filter(m => m.tag !== m.canonical)
  if (willChange.length > 0) {
    console.log(`\n=== 정규화로 변경될 태그 (${willChange.length}개, 빈도순) ===`)
    willChange.sort((a, b) => b.count - a.count).forEach(t => {
      console.log(`  ${t.tag.padEnd(20)} → ${t.canonical.padEnd(20)} (${t.count}회)`)
    })
  }

  // 사전에 없는 태그
  if (unmapped.length > 0) {
    console.log(`\n=== 사전에 없는 태그 (${unmapped.length}개, 빈도순) ===`)
    unmapped.sort((a, b) => b.count - a.count).forEach(t => {
      console.log(`  ${t.tag.padEnd(20)} (${t.count}회)`)
    })
  }

  console.log()
}

main().catch(e => { console.error(e); process.exit(1) })
