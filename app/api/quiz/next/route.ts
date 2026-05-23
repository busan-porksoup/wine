import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const DIFFICULTY_LEVELS = ['초급', '중급', '고급', '마스터'] as const
type Difficulty = typeof DIFFICULTY_LEVELS[number]

// 사용자별 난이도 → 실제 시험 레벨 매핑
const DIFFICULTY_REF_BY_USER: Record<string, Record<Difficulty, string>> = {
  '원우': {
    '초급': '대중 상식 — 와인 입문 (레드/화이트 구분, 샴페인 원산지 등)',
    '중급': 'WSET Level 2 — 주요 산지·품종·양조 기본 (Cuvée 의미, AOC 개념)',
    '고급': 'WSET Level 3 / CMS Introductory — 클리마·등급 체계·양조 디테일',
    '마스터': '미사용 (원우 최대 고급)',
  },
  '재혁': {
    '초급': 'WSET Level 3 — 클리마·등급 체계·양조 디테일',
    '중급': 'WSET Diploma / CMS Advanced — 학술 수준의 깊이, 비교 분석',
    '고급': 'Master of Wine / Master Sommelier — 세계 최고 수준, 합격률 10% 이하',
    '마스터': 'MW with Honors / Krug Cup / PhD in Viticulture & Enology — 사실상 학술/표창급',
  },
}

const CATEGORIES = [
  '떼루아', '품종', '양조', '발음·용어', '페어링', '와인 역사·문화', '분류·등급', '빈티지·생산자',
]

const START_DIFFICULTY: Record<string, Difficulty> = {
  '재혁': '고급',
  '원우': '초급',
}

// 사용자별 최대 도달 가능 난이도
const MAX_DIFFICULTY: Record<string, Difficulty> = {
  '재혁': '마스터',
  '원우': '고급',
}

async function determineDifficulty(userName: string): Promise<Difficulty> {
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('difficulty, is_correct, attempted_at')
    .eq('user_name', userName)
    .order('attempted_at', { ascending: false })
    .limit(50)

  const startLevel = START_DIFFICULTY[userName] ?? '초급'
  const startIdx = DIFFICULTY_LEVELS.indexOf(startLevel)
  const maxLevel = MAX_DIFFICULTY[userName] ?? '고급'
  const maxIdx = DIFFICULTY_LEVELS.indexOf(maxLevel)
  let level: Difficulty = startLevel

  if (!attempts || attempts.length === 0) {
    return level
  }

  // 승급 체크: 시작 레벨부터 MAX 레벨까지, 각 레벨에서 최근 5문제 80%↑ 정답률이면 다음 레벨로
  for (let i = startIdx; i < maxIdx; i++) {
    const lvl = DIFFICULTY_LEVELS[i]
    const lvlAttempts = attempts.filter(a => a.difficulty === lvl).slice(0, 5)
    if (lvlAttempts.length < 5) break
    const acc = lvlAttempts.filter(a => a.is_correct).length / lvlAttempts.length
    if (acc >= 0.8) {
      level = DIFFICULTY_LEVELS[i + 1]
    } else {
      break
    }
  }

  // 강등 체크: 현재 레벨(승급 후)에서 최근 5문제 40% 미만이면 한 단계 강등 (최저 초급)
  const curIdx = DIFFICULTY_LEVELS.indexOf(level)
  if (curIdx > 0) {
    const curAttempts = attempts.filter(a => a.difficulty === level).slice(0, 5)
    if (curAttempts.length >= 5) {
      const acc = curAttempts.filter(a => a.is_correct).length / curAttempts.length
      if (acc < 0.4) {
        level = DIFFICULTY_LEVELS[curIdx - 1]
      }
    }
  }

  return level
}

async function fetchUserWines() {
  const { data } = await supabase
    .from('wines')
    .select('id, name, producer, region, country, vintage_year, grape_variety, drunk_at, wine_type')
    .order('drunk_at', { ascending: false })
    .limit(50)
  return data || []
}

export async function POST(req: NextRequest) {
  try {
    const { user_name } = await req.json()
    if (!user_name || (user_name !== '재혁' && user_name !== '원우')) {
      return NextResponse.json({ success: false, error: 'invalid user_name' }, { status: 400 })
    }

    const difficulty = await determineDifficulty(user_name)
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]

    // 재혁은 와인 컨텍스트 무시 — 순수 지식 문제
    const wines = user_name === '재혁' ? [] : await fetchUserWines()

    const winesContext = user_name === '재혁'
      ? '(재혁은 와인 전문가 — 마신 와인 무관하게 출제)'
      : wines.length === 0
      ? '(사용자가 마신 와인 정보 없음)'
      : wines.slice(0, 30).map((w: any) => {
          const grapes = Array.isArray(w.grape_variety) ? w.grape_variety.join(', ') : (w.grape_variety || '')
          return `- id:${w.id} | ${w.name}${w.vintage_year ? ` ${w.vintage_year}` : ''} | ${[w.region, w.country].filter(Boolean).join(', ')} | ${grapes} | drunk_at:${w.drunk_at || 'unknown'}`
        }).join('\n')

    const difficultyLabel = DIFFICULTY_REF_BY_USER[user_name]?.[difficulty] ?? ''
    const prompt = `너는 소믈리에 자격시험 출제 위원이야. 다음 조건으로 와인 객관식 4지선다 문제 하나를 만들어줘.

[조건]
- 응시자 이름: ${user_name}  ⚠️ 매우 중요 — 응시자는 정확히 "${user_name}"이야. comment_if_correct, comment_if_wrong 모두 반드시 "${user_name}님"으로 시작하거나 호명할 것. 다른 이름(재혁, 원우 등) 절대 사용 금지.
- 라벨 난이도: ${difficulty}
- 실제 출제 수준: ${difficultyLabel}  ⚠️ 반드시 이 수준에 맞춰서 출제. 라벨 이름은 같아도 응시자에 따라 실제 출제 수준 다름.
- 카테고리: ${category}

[사용자가 마신 와인 — 컨텍스트]
${winesContext}

[규칙]
1. 문제는 국제 와인 자격시험(WSET·CMS) 톤. 허접하지 않게 깊이 있는 문제로.
2. 4개 보기 중 정답 1개, 오답 3개. 오답도 그럴듯하게.
3. 해설은 1~3문장. 단순히 정답 설명이 아니라 개념 이해 도움 되게.
4. 마신 와인 중 문제와 관련된 와인이 있으면 해설에 자연스럽게 1문장 언급. 도입부 필수 — "지난 5월에 마신 ~", "최근 마신 ~", "지난주에 마신 ~" 같이 시간 표현 동반. "마신 ~" 같이 갑작스러운 시작 금지. 관련 와인 없으면 언급 X.
   ⚠️ 마신 와인을 언급할 때는 반드시 [[wine:UUID|와인이름]] 형식으로 감싸 — UUID는 위 컨텍스트의 id 값. 예: 컨텍스트에 "id:abc-123 | Domaine Chavy-Chouet" 있으면 explanation에서 "[[wine:abc-123|Domaine Chavy-Chouet]]" 라고 표기. 이 마커가 있어야 프론트에서 클릭 가능한 링크로 렌더됨.
5. AI 코멘트 톤:
   - 응시자명 호명 ("${user_name}님, ...")
   - 정답 시: 칭찬 + 핵심 한 줄
   - 오답 시: 정답 알려주기 + 핵심 개념 짧게
   - ⚠️ 클리셰 종료 금지: "소믈리에 시험장에서도 빛나실 거예요", "소믈리에 응시하셔도 되겠어요" 같은 표현 반복 금지. 매 코멘트마다 다른 마무리. 짧고 담백하게.
   - 절대로 응시자가 아닌 다른 이름 사용 금지.
6. 정답·해설·코멘트는 반드시 한국어로.
7. 마크다운 금지. 순수 JSON으로만.
${user_name === '원우' ? `
[응시자별 추가 규칙 — 원우]
- 응시자가 원우이므로 학습 편의를 위해 외국어 용어·지명·품종에 한글 발음을 괄호로 같이 표기.
- 적용 위치: question_text, choices, explanation 모두.
- 예시:
  · "Bourgogne(부르고뉴)" / "Sangiovese(산지오베제)" / "Cuvée(퀴베)" / "AOC(아오쎄)"
  · "Château Margaux(샤토 마고)" / "Pinot Noir(피노 누아)"
- 이미 한국어가 익숙한 단어(예: 보르도, 샤르도네)는 그냥 한글만 써도 OK.` : ''}
${user_name === '재혁' ? `
[응시자별 추가 규칙 — 재혁]
재혁은 와인 전문가 수준. 다음 원칙으로 출제:
1. 마신 와인 무관 — 순수 와인 지식·이론 위주로 자유롭게 출제. explanation에 마신 와인 언급 금지 (related_wine_ids = []).
2. 객관식 보기 4개 모두 그럴듯하게 설계 — 명확히 틀린 보기 만들지 말 것. 추론으로 소거하기 어렵게.
3. 흔히 헷갈리는 개념 / 자주 틀리는 함정 중심:
   · 비슷한 AOC끼리 차이 (예: Pommard vs Volnay, Saint-Julien vs Saint-Estèphe)
   · 미세한 빈티지 특성 (예: 2009 vs 2010 Bordeaux 차이)
   · 품종 동의어 (예: Tempranillo = Tinta Roriz = Aragonez)
   · 양조 디테일 (배럴 종류·토스트 레벨·바토나주 영향)
   · 등급 체계의 예외 (Saint-Émilion 재심사 주기, Burgundy 그랑크뤼 면적 분할 등)
   · 와인 평론·역사적 사건 (1976 파리의 심판, 2003 클래시피케이션 변경 등)
4. CMS Advanced / WSET Diploma 수준 까다로움. 표면적 지식 X, 디테일 O.
5. 정답은 약간 의외이거나, 흔한 오해를 뒤집는 것.` : ''}

[응답 JSON 형식]
{
  "category": "${category}",
  "difficulty": "${difficulty}",
  "question_text": "문제 본문",
  "choices": ["보기1", "보기2", "보기3", "보기4"],
  "correct_index": 0~3 정수,
  "explanation": "해설 (마신 와인 관련 있으면 자연스럽게 언급)",
  "comment_if_correct": "정답일 때 응시자명 호명 코멘트",
  "comment_if_wrong": "오답일 때 응시자명 호명 코멘트",
  "related_wine_ids": ["uuid1", "uuid2"]  // 해설에서 언급한 와인 id (없으면 빈 배열)
}`

    const response = await client.messages.create({
      model: (process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6') as string,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    // 안전장치: Claude가 다른 값 반환해도 우리가 결정한 난이도/카테고리로 강제 덮어쓰기
    return NextResponse.json({ success: true, ...parsed, difficulty, difficulty_label: difficultyLabel, category })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
