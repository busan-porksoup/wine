import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ALL_CANONICAL_TAGS } from '../../notesVocabulary'

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
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: `다음 와인의 테이스팅 노트를 짧은 키워드 태그 형식으로 생성해줘.

${wineInfo}

[규칙]
1. 향·맛·질감·여운 관련 키워드 8~12개 생성
2. ⚠️ 반드시 아래 [표준 어휘] 목록에서만 골라. 목록에 없는 단어는 절대 만들지 마.
3. 정확한 향이 불확실하면 일반명 사용 가능 (캐모마일 대신 "흰꽃", 캐슈넛 대신 "견과류")
4. 같은 의미 다른 표현 중복 금지 (꿀과 꿀향 동시 사용 X)
5. JSON 배열만 반환, 다른 텍스트 없이

[표준 어휘 — 반드시 이 목록에서만 선택]
${ALL_CANONICAL_TAGS.join(', ')}

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