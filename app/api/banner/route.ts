import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// 기념일 데이터 (월-일 형식)
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
  if (nearest && nearest.daysUntil <= 14) return nearest
  return null
}

function getCurrentMonth(): number {
  return new Date().getMonth() + 1
}

function getSeasonalContext(month: number): string {
  const seasonal: Record<number, string> = {
    1:  '1월 - 굴, 방어, 과메기가 제철',
    2:  '2월 - 딸기, 봄나물이 시작되는 계절',
    3:  '3월 - 봄 제철 봄나물, 주꾸미가 한창',
    4:  '4월 - 주꾸미, 도다리, 봄 채소가 풍성',
    5:  '5월 - 참다랑어, 멍게, 성게가 제철',
    6:  '6월 - 민어, 오징어, 참외가 제철',
    7:  '7월 - 장어, 복숭아, 수박이 한창',
    8:  '8월 - 전복, 옥수수, 토마토가 풍성',
    9:  '9월 - 꽃게, 전어, 포도가 제철',
    10: '10월 - 낙지, 고등어, 사과, 배가 제철',
    11: '11월 - 굴, 대하, 김장 김치 시즌',
    12: '12월 - 방어, 대게, 귤이 제철',
  }
  return seasonal[month] || ''
}

export async function POST(req: NextRequest) {
  try {
    const { wines, location } = await req.json()

    const month = getCurrentMonth()
    const seasonalInfo = getSeasonalContext(month)
    const anniversary = getUpcomingAnniversary()

    // 최근 한 달 와인 기록
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const recentWines = (wines || []).filter((w: any) => {
      if (!w.drunk_at) return false
      return new Date(w.drunk_at) >= oneMonthAgo
    })

    const recentSummary = recentWines.length > 0
      ? recentWines.slice(0, 5).map((w: any) =>
          `${w.name}(${w.wine_type}, ${w.region || w.country || ''})`
        ).join(', ')
      : '최근 기록 없음'

    // 기념일 컨텍스트
    const anniversaryContext = anniversary
      ? `${anniversary.daysUntil === 0 ? '오늘이' : `${anniversary.daysUntil}일 후`} ${anniversary.label}이에요.`
      : ''

    const prompt = `당신은 와인 소믈리에이자 다정한 친구예요. 재혁과 원우 커플의 와인 일지 앱 상단에 표시될 짧은 AI 멘트를 작성해주세요.

현재 정보:
- 현재 월: ${month}월
- 제철 음식: ${seasonalInfo}
- 최근 한 달 마신 와인: ${recentSummary}
- 총 와인 기록: ${(wines || []).length}병
${anniversaryContext ? `- 기념일 정보: ${anniversaryContext}` : ''}
${location ? `- 현재 위치: ${location}` : ''}

규칙:
- 2~3문장으로 자연스럽고 따뜻하게 작성
- 제철 음식, 날씨 느낌, 최근 마신 와인 경향, 기념일(있을 경우) 중 1~2가지를 자연스럽게 섞어서
- 마지막에 와인 추천 한 줄 포함 (구체적인 와인 스타일이나 품종 언급)
- 한국어로, 반말 금지, 존댓말도 아닌 친근한 어투
- 이모지 1~2개만 사용
- JSON 형식으로 반환: { "message": "멘트 내용", "recommendation": "추천 와인 한 줄" }`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

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