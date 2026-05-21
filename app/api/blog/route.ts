import { NextResponse } from 'next/server'

const BLOG_ID = 'kr_jaehyuk_choi'
const RSS_URL = `https://rss.blog.naver.com/${BLOG_ID}.xml`

type BlogItem = {
  title: string
  link: string
  pubDate: string
  thumbnail: string | null
  preview: string
}

function unescapeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

function extractTag(block: string, tag: string): string {
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`)
  const cdata = block.match(cdataRe)
  if (cdata) return cdata[1].trim()
  const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)
  const plain = block.match(plainRe)
  return plain ? unescapeXml(plain[1]).trim() : ''
}

function toMobileLink(link: string): string {
  // iframe 호환성 위해 m.blog.naver.com 으로 변환
  return link.replace(/https?:\/\/blog\.naver\.com/, 'https://m.blog.naver.com')
}

function parseRss(xml: string): BlogItem[] {
  const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
  return itemBlocks.map(block => {
    const description = extractTag(block, 'description')
    const thumbMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i)
    const thumbnail = thumbMatch ? thumbMatch[1] : null
    const preview = description
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160)
    return {
      title: extractTag(block, 'title'),
      link: toMobileLink(extractTag(block, 'link')),
      pubDate: extractTag(block, 'pubDate'),
      thumbnail,
      preview,
    }
  })
}

export async function GET() {
  try {
    const res = await fetch(RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      next: { revalidate: 600 },
    })
    if (!res.ok) {
      return NextResponse.json({ success: false, error: `RSS ${res.status}` }, { status: 500 })
    }
    const xml = await res.text()
    const items = parseRss(xml)
    return NextResponse.json({ success: true, items, blogId: BLOG_ID })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
