import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { name, producer, region, country, vintage_year, grape_variety, wine_type } = await req.json()

    if (!name) {
      return NextResponse.json({ success: false, error: '와인 이름이 필요합니다' }, { status: 400 })
    }

    const grapes = Array.isArray(grape_variety) ? grape_variety.join(', ') : (grape_variety || '')

    const prompt = `너는 와인 전문가야. 다음 와인의 떼루아·생산자·양조 정보를 네 지식으로 채워서 한국어로 작성해줘.

[와인 정보]
- 이름: ${name}
- 생산자: ${producer || '(미상)'}
- 지역: ${region || '(미상)'}${country ? `, ${country}` : ''}
- 빈티지: ${vintage_year || '(미상)'}
- 품종: ${grapes || '(미상)'}
- 종류: ${wine_type || '(미상)'}

[규칙]
1. 정확하게 알고 있는 내용만 작성해. 추측은 자제하고, 모르는 정보는 null 또는 필드 자체를 omit
2. description은 단순 정보 나열이 아니라 "이 토양/기후/제작방식이 어떤 맛을 만드는지" 맛 관점에서 설명
3. vintage_note는 해당 빈티지의 날씨와 그것이 와인 캐릭터에 미친 영향 (한국 와인 평단 평가 톤)
4. vineyard는 구체적인 밭 정보(단일 구획 여부, 면적, 수령 등)를 알고 있을 때만 채우고, 모르면 vineyard 필드 자체를 omit
5. winemaking 각 필드는 구체적 정보 있을 때만 채우기 (예: 블렌드 비율을 모르면 blend 필드 omit)
6. korean_labels는 반드시 채워. 와인 이름·생산자·지역·국가·품종을 자연스러운 한글 표기로 변환 (예: "Bourgogne" → "부르고뉴", "Chenin Blanc" → "셰닌 블랑", "Western Cape" → "웨스턴 케이프", "South Africa" → "남아프리카공화국"). 한국 와인 시장에서 통용되는 표기 우선, 없으면 외래어 표기법 기준.
7. 마크다운 절대 금지. 순수 JSON만.

[map_query / map_zoom 결정 규칙 — 매우 중요]
와인의 성격에 따라 구글맵에서 보여줄 지역을 다르게 결정해.

A) 광역 블렌드 / 네고시앙 / 여러 지역 포도 사용 (예: DECOY Sauvignon Blanc, Apothic Red)
   → map_query: 광역 지역명 (예: "California, USA" / "Napa County, California")
   → map_zoom: 7~9

B) AOC/DOCG 마을·구역 단위 (예: Saint-Émilion 평범한 등급, Chablis village wine)
   → map_query: 그 마을/구역 이름 + 큰 지역 (예: "Saint-Émilion, Bordeaux, France")
   → map_zoom: 11~12

C) 특정 도멘·샤토·에스테이트 (예: Château Margaux, Domaine de la Romanée-Conti, Antinori Tignanello)
   → map_query: 도멘/샤토 정식 명칭 + 위치 (예: "Château Margaux, Margaux, France")
   → map_zoom: 14~15

D) 싱글 빈야드 / 클리마·크뤼 (예: La Tâche, Clos de Tart, Le Montrachet)
   → map_query: 빈야드 이름 + 마을 (예: "La Tâche Vineyard, Vosne-Romanée, France")
   → map_zoom: 15~16

판단 기준: producer가 도멘/샤토면 C 또는 D, 단순 브랜드/네고시앙이면 A, 라벨이 마을·AOC만 표시하면 B

[응답 JSON 형식]
{
  "classification": "AOC/DOCG/AVA 등급 또는 null",
  "korean_labels": {
    "name": "와인 이름 한글 표기 (외래어 표기법 기준, 한국 와인 시장에서 통용되는 표기 우선)",
    "producer": "생산자 한글 표기",
    "region": "지역 한글 표기",
    "country": "국가 한글 표기",
    "grape_variety": "품종 한글 표기 (여러 개면 ' · '로 구분)"
  },
  "terroir": {
    "region_label": "지역명 · 큰지역, 국가",
    "description": "떼루아 종합 설명 2-3문장 (토양, 기후가 맛에 미치는 영향). 와인 성격(광역 블렌드/마을/도멘/싱글빈야드)에 따라 떼루아 설명 범위도 맞춰. 광역이면 큰 지역 특성, 도멘/싱글빈야드면 그 구체 떼루아.",
    "map_query": "구글맵 검색 쿼리 (위 규칙 A-D 중 해당하는 형식)",
    "map_zoom": 줌숫자 (7-16),
    "vineyard": {
      "headline": "밭 특징 짧은 헤드라인",
      "body": "구체적 밭 정보 2-3문장"
    },
    "vintage_note": {
      "headline": "이 빈티지 짧은 헤드라인 (예: '2015 — 21세기 우안 최고 해')",
      "body": "이 해의 날씨와 와인 캐릭터의 관계 2-3문장"
    }
  },
  "producer": {
    "name": "정확한 와이너리명",
    "founded": 설립연도숫자,
    "owner": "현 소유주",
    "description": "와이너리 정체성, 스타일, 역사적 맥락 2-3문장",
    "winemaking": {
      "blend": "블렌드 비율 (예: Merlot 51% · Cabernet Franc 49%)",
      "fermentation": "발효 방식",
      "aging": "숙성 정보 (오크 종류, % 새 오크, 기간)",
      "abv": "알코올 도수 (예: 14.0%)",
      "production": "생산량 (예: ~120,000 병/년)"
    }
  }
}`

    const response = await client.messages.create({
      model: (process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6') as string,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ success: true, wine_info: parsed })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
