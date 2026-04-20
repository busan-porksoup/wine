import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `이 와인 라벨 이미지에서 정보를 추출해줘.
반드시 아래 JSON 형식으로만 응답해. 다른 텍스트는 절대 포함하지 마.
정보를 알 수 없으면 null로 반환해.

{
  "name": "와인 이름",
  "producer": "생산자",
  "country": "국가 (영어로)",
  "region": "지역 (영어로)",
  "grape_variety": "품종 (쉼표로 구분)",
  "vintage_year": 연도숫자,
  "wine_type": "red 또는 white 또는 rosé 또는 sparkling 또는 dessert"
}`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ success: true, data: parsed })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}