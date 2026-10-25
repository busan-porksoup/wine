import { NextRequest } from 'next/server'
import { env } from 'cloudflare:workers'

// R2 "wine-images"의 사진을 /images/<파일명> 으로 서비스. 파일명이 매번 새로 생기므로 영구 캐시
export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const obj = await env.IMAGES.get(decodeURIComponent(key))
  if (!obj) return new Response('Not found', { status: 404 })
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('etag', obj.httpEtag)
  headers.set('cache-control', 'public, max-age=31536000, immutable')
  return new Response(obj.body, { headers })
}
