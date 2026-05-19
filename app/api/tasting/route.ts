import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { name, producer, country, region, grape_variety, vintage_year, wine_type } = await req.json()

    const wineInfo = [
      name && `이름: ${name}`,
      producer && `생산자: ${producer}`,
      country && `국가: ${country}`,
      region && `지역: ${region}`,
      grape_variety && `품종: ${Array.isArray(grape_variety) ? grape_variety.join(', ') : grape_variety}`,
      vintage_year && `빈티지: ${vintage_year}`,
      wine_type && `종류: ${wine_type}`,
    ].filter(Boolean).join('\n')

    const message = await client.messages.create({
      model: (process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6') as string,
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `다음 와인의 테이스팅 노트를 짧은 키워드 태그 형식으로 생성해줘.

${wineInfo}

규칙:
- 향(아로마), 맛(플레이버), 질감(텍스처) 관련 키워드를 합쳐 8~12개 생성
- 각 키워드는 2~5글자의 짧은 단어 또는 짧은 표현
- 예시: 체리, 바닐라, 탄닌감, 산도, 오크, 블랙베리, 후추, 미네랄, 긴 여운, 풀바디
- JSON 배열만 반환, 다른 텍스트 없이

응답 형식: ["키워드1", "키워드2", ...]`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    let tags: string[] = []
    try {
      tags = JSON.parse(text)
    } catch {
      // JSON 파싱 실패 시 텍스트에서 추출
      const match = text.match(/\[.*\]/s)
      if (match) tags = JSON.parse(match[0])
    }

    return NextResponse.json({ success: true, tags })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}