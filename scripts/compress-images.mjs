#!/usr/bin/env node
/**
 * Re-encode public/*.webp with high quality + strip metadata.
 * Goal: reduce file size without visible quality loss.
 *
 * Settings:
 * - Quality 90 (visually near-lossless for photos)
 * - effort 6 (slowest, best compression)
 * - No resize (preserve original dimensions)
 * - Strip EXIF/ICC metadata
 *
 * Usage: node scripts/compress-images.mjs
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const PUBLIC_DIR = new URL('../public/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const QUALITY = 90
const EFFORT = 6
const MAX_DIMENSION = 2000 // 가장 긴 변. 모바일/데스크탑 어떤 화면에도 충분

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function main() {
  const files = (await readdir(PUBLIC_DIR)).filter(f => f.toLowerCase().endsWith('.webp'))
  if (files.length === 0) {
    console.log('No .webp files found in public/')
    return
  }

  let totalBefore = 0
  let totalAfter = 0
  let skipped = 0

  for (const file of files) {
    const filepath = join(PUBLIC_DIR, file)
    const before = (await stat(filepath)).size
    totalBefore += before

    const input = await readFile(filepath)
    const meta = await sharp(input).metadata()
    const longest = Math.max(meta.width ?? 0, meta.height ?? 0)
    const needsResize = longest > MAX_DIMENSION

    let pipeline = sharp(input)
    if (needsResize) {
      pipeline = pipeline.resize({
        width: meta.width >= meta.height ? MAX_DIMENSION : undefined,
        height: meta.height > meta.width ? MAX_DIMENSION : undefined,
        fit: 'inside',
        withoutEnlargement: true,
      })
    }
    const output = await pipeline
      .webp({ quality: QUALITY, effort: EFFORT })
      .withMetadata({ exif: {}, icc: undefined })
      .toBuffer()

    if (output.length >= before) {
      console.log(`  ${file}: ${formatBytes(before)} → 그대로 (압축 효과 없음, skip)`)
      totalAfter += before
      skipped++
      continue
    }

    await writeFile(filepath, output)
    totalAfter += output.length
    const pct = ((1 - output.length / before) * 100).toFixed(1)
    console.log(`  ${file} (${meta.width}×${meta.height}): ${formatBytes(before)} → ${formatBytes(output.length)} (-${pct}%)`)
  }

  console.log('')
  console.log(`총 ${files.length}개 파일 (skipped: ${skipped})`)
  console.log(`합계: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} (-${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`)
}

main().catch(e => { console.error(e); process.exit(1) })
