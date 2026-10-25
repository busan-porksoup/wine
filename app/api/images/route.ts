import { NextRequest, NextResponse } from 'next/server'
import { env } from 'cloudflare:workers'

// 사진 원본을 그대로 R2에 저장 (본문 = 파일 바이트, ?ext=jpg). 반환 url은 /images/<파일명>
export async function POST(req: NextRequest) {
  try {
    const ext = (req.nextUrl.searchParams.get('ext') || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg'
    const key = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const contentType = req.headers.get('content-type') || 'application/octet-stream'
    if (!req.body) return NextResponse.json({ error: 'empty body' }, { status: 400 })
    await env.IMAGES.put(key, req.body, { httpMetadata: { contentType } })
    return NextResponse.json({ data: { url: `/images/${key}` } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
