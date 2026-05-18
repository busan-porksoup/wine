import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { wines } = await req.json()

    const wineList = wines.map((w: any) => {
      let memo = {}
      try { memo = JSON.parse(w.memo || '{}') } catch {}
      return {
        name: w.name,
        type: w.wine_type,
        region: w.region,
        country: w.country,
        grape: w.grape_variety,
        vintage: w.vintage_year,
        rating: w.rating,
        jaehyuk_memo: (memo as any).jaehyuk || null,
        jaehyuk_rating: w.rating,
        wonwoo_memo: (memo as any).wonwoo || null,
      }
    })

    const response = await client.messages.create({
      model: '(process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6') as string',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `너는 와인 소믈리에이자 데이터 분석가야. 아래는 재혁과 원우 두 사람의 와인 기록이야.

${JSON.stringify(wineList, null, 2)}

아래 JSON 형식으로만 응답해줘. 마크다운 절대 금지.

{
  "overall": "전체적인 두 사람의 와인 여정 총평 (2-3문장, 따뜻하고 흥미롭게)",
  "jaehyuk": {
    "taste_profile": "재혁의 취향 프로필 (2문장)",
    "insight": "재혁에게 추천하는 다음 와인과 이유 (2문장)"
  },
  "wonwoo": {
    "taste_profile": "원우의 취향 프로필 (2문장)",
    "insight": "원우에게 추천하는 다음 와인과 이유 (2문장)"
  },
  "pairing": "두 사람이 함께 즐기기 좋은 와인 추천과 이유 (2문장)",
  "fun_fact": "이 데이터에서 발견한 재미있는 사실 하나 (1문장)"
}`
        }
      ]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ success: true, data: parsed })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}