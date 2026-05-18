import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, exifDate } = await req.json()

    const response = await client.messages.create({
      model: '(process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6') as string',
      max_tokens: 2048,
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
              text: `너는 와인 전문가야. 이 와인 라벨 이미지를 분석하고, 네가 알고 있는 와인 지식을 총동원해서 아래 JSON을 완성해줘.

규칙:
1. 라벨에서 읽을 수 있는 정보는 정확히 읽어줘
2. 라벨에서 안 보이는 정보는 와인 이름과 지역을 바탕으로 네 지식으로 반드시 채워줘 (null 금지, 모르면 추정이라도 해줘)
3. 특히 producer(생산자)는 와인 이름으로 검색해서 반드시 채워줘. 예를 들어 "Bourgogne Aligoté Les Maréchaux"면 생산자는 "Domaine Chavy-Chouet"야
4. drunk_at은 ${exifDate ? exifDate : '오늘 날짜'}로 넣어줘 (YYYY-MM-DD 형식)

반드시 아래 JSON 형식으로만 응답해. 마크다운 절대 금지. JSON만.

{
  "name": "와인 전체 이름",
  "producer": "생산자 (반드시 채워줘)",
  "country": "국가 영어",
  "region": "세부 지역까지 영어로",
  "grape_variety": "품종 쉼표 구분 (반드시 채워줘)",
  "vintage_year": 연도숫자,
  "wine_type": "red 또는 white 또는 rosé 또는 sparkling 또는 dessert",
  "drunk_at": "YYYY-MM-DD"
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