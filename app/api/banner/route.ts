import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const ANNIVERSARIES = [
  { month: 11, day: 10, label: '재혁 생일 🎂' },
  { month: 1,  day: 25, label: '원우 생일 🎂' },
  { month: 10, day: 6,  label: '첫 만남 기념일 💛' },
  { month: 10, day: 20, label: '연애 기념일 ❤️' },
]

function getUpcomingAnniversary(): { label: string; daysUntil: number } | null {
  const now = new Date()
  const currentYear = now.getFullYear()
  const upcoming = ANNIVERSARIES.map(ann => {
    let target = new Date(currentYear, ann.month - 1, ann.day)
    if (target < now) target = new Date(currentYear + 1, ann.month - 1, ann.day)
    const daysUntil = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return { label: ann.label, daysUntil }
  }).sort((a, b) => a.daysUntil - b.daysUntil)
  const nearest = upcoming[0]
  return nearest && nearest.daysUntil <= 14 ? nearest : null
}

function getSeasonalContext(month: number): string {
  const seasonal: Record<number, string> = {
    1:  '굴, 방어, 과메기',
    2:  '딸기, 봄나물',
    3:  '봄나물, 주꾸미',
    4:  '주꾸미, 도다리, 봄 채소',
    5:  '참다랑어, 멍게, 성게',
    6:  '민어, 오징어, 참외',
    7:  '장어, 복숭아',
    8:  '전복, 옥수수, 토마토',
    9:  '꽃게, 전어, 포도',
    10: '낙지, 고등어, 사과',
    11: '굴, 대하',
    12: '방어, 대게, 귤',
  }
  return seasonal[month] || ''
}

// 베리에이션 타입 — 매일 다른 방향으로
function getBannerVariant(): string {
  const day = new Date().getDate()
  const variants = ['trend', 'seasonal', 'recommendation', 'knowledge']
  return variants[day % variants.length]
}

export async function POST(req: NextRequest) {
  try {
    const { wines } = await req.json()

    const month = getCurrentMonth()
    const seasonal = getSeasonalContext(month)
    const anniversary = getUpcomingAnniversary()
    const variant = getBannerVariant()

    // 최근 마신 와인 타입 경향 (팩트 나열 X, 경향만)
    const recentWines = (wines || []).filter((w: any) => {
      if (!w.drunk_at) return false
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      return new Date(w.drunk_at) >= oneMonthAgo
    })

    const recentTypes = recentWines.reduce((acc: Record<string, number>, w: any) => {
      if (w.wine_type) acc[w.wine_type] = (acc[w.wine_type] || 0) + 1
      return acc
    }, {})
    const dominantType = Object.entries(recentTypes).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || null
    const recentRegions = [...new Set(recentWines.map((w: any) => w.region).filter(Boolean))].slice(0, 3).join(', ')

    const anniversaryContext = anniversary
      ? `${anniversary.daysUntil === 0 ? '오늘이' : `${anniversary.daysUntil}일 후`} ${anniversary.label}`
      : ''

    const variantGuide: Record<string, string> = {
      trend: `와인 업계나 소믈리에 커뮤니티에서 요즘 주목받는 트렌드(내추럴 와인, 오렌지 와인, 특정 산지 부상 등)를 한 가지 소개하고, 두 사람이 시도해볼 만한 이유를 설명해줘.`,
      seasonal: `지금 제철 음식(${seasonal})과 어울리는 와인을 추천하고, 왜 그 조합이 맛있는지 맛 과학적 이유나 전통적 페어링 근거를 짧게 설명해줘.`,
      recommendation: `${dominantType ? `최근 ${dominantType} 와인을 많이 마셨는데,` : '다양한 와인을 마셨는데,'} 지금까지와 다른 스타일의 와인을 추천하고 왜 그게 새로운 경험을 줄지 설명해줘. ${recentRegions ? `최근 ${recentRegions} 지역 와인을 즐겼으니 다른 산지를 제안해도 좋아.` : ''}`,
      knowledge: `와인에 대한 흥미로운 사실이나 잘 모르는 지식(포도 품종, 테루아, 양조 방식, 숙성 등)을 하나 알려주고, 실제로 어떤 와인에서 느낄 수 있는지 연결해줘.`,
    }

    const prompt = `당신은 와인 소믈리에이자 다정한 친구예요. 재혁과 원우 커플의 와인 일지 앱 상단 배너에 표시될 멘트를 작성해주세요.

오늘의 방향: ${variantGuide[variant]}
${anniversaryContext ? `\n특별히 오늘은 ${anniversaryContext}이에요. 자연스럽게 한 번쯤 언급해도 좋아요.` : ''}

규칙:
- 2문장 이내로 짧고 임팩트 있게
- 단순 팩트 나열 금지 — 새로운 인사이트나 추천 이유가 핵심
- 한국어, 친근하지만 지식 있는 어투
- 이모지 최대 1개
- JSON만 반환 (다른 텍스트 없이):
{ "message": "메인 멘트", "recommendation": "추천 와인 또는 시도해볼 것 한 줄" }`

    const response = await client.messages.create({
      model: '(process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6') as string',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    let data: { message: string; recommendation: string }
    try {
      const clean = text.replace(/```json|```/g, '').trim()
      data = JSON.parse(clean)
    } catch {
      data = { message: text, recommendation: '' }
    }

    return NextResponse.json({ success: true, ...data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

function getCurrentMonth(): number {
  return new Date().getMonth() + 1
}