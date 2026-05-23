# Quiz 탭 기획서

> 와인 지식 학습용 퀴즈 기능. WSET·CMS 국제 시험 톤으로 문제 생성, 응시자별 적응형 난이도, 마신 와인 자연 통합.

## 1. 위치 & 진입

- **탭 이름**: `Quiz`
- **탭 순서**: `Home · Analysis · Blog · Quiz`
- **활성화 방식**: 기존 패턴 동일 — `activeTab` state 토글, 별도 라우트 X

## 2. 응시자 (Respondent) 선택

페이지 상단에 응시자 선택 토글:
```
   응시자
  [ 재혁 ] [ 원우 ]    ← segmented control
```

- localStorage에 마지막 선택 저장 (`quiz_respondent`)
- 첫 방문 또는 미선택 시 응시자 선택 강제 화면
- 응시자 전환 시 진행 중인 문제는 폐기, 새 응시자로 다음 문제 출제

## 3. 난이도 시스템 (적응형)

**3단계**:
- `초급` — 대중적 상식 (예: 샴페인 원산지, 레드/화이트 차이)
- `중급` — WSET Level 2 수준 (예: 주요 AOC, 품종 특성, Cuvée 의미)
- `고급` — WSET Level 3 / CMS Intro 수준 (예: 클리마 분류, 양조 디테일)

**초기 시작값:**
- 재혁: `중급`부터
- 원우: `초급`부터

**난이도 조정 규칙** (응시자별 독립):
- 현재 난이도에서 **최근 5문제 정답률 80% 이상** → 다음 난이도 승급
- 현재 난이도에서 **최근 5문제 정답률 40% 미만** → 이전 난이도 강등 (최저 초급)
- 초급 정답률 80% 이상이면 중급으로, 중급 80% 이상이면 고급으로
- 5문제 미만이면 시작 난이도 유지 (재혁=중급, 원우=초급)

**서버 측 계산**: 매 문제 요청 시 DB에서 응시자의 최근 시도 조회 → 현재 난이도 결정 → 그 난이도로 문제 생성

## 4. 카테고리

문제 출제 카테고리 (랜덤 분배):
- 떼루아 (지역·토양·기후)
- 품종 (향·산지 특성)
- 양조 (오크·발효·숙성)
- 발음·용어 (Bourgogne, AOC, Cuvée 등 — 사용자가 약점이라 명시)
- 페어링
- 와인 역사·문화
- 분류·등급 (AOC, DOCG, AVA, Premier Cru 등)
- 빈티지·생산자

서버에서 매 문제 무작위 카테고리 선정. 추후 사용자가 카테고리 필터링 가능하게 확장 가능.

## 5. 문제 형식

**객관식 4지선다 (기본 형식)** — 일관성을 위해 단일 포맷 유지.

문제 카드 구성:
```
┌─────────────────────────────────┐
│ 중급 · 떼루아                    │  ← 난이도 + 카테고리 메타
│                                 │
│ Q. Burgundy 지방의 주된           │
│    레드 와인 품종은?             │
│                                 │
│ ○ Cabernet Sauvignon            │
│ ○ Merlot                        │
│ ● Pinot Noir         ← 선택     │
│ ○ Syrah                         │
│                                 │
│ [재혁 · 답안 제출]               │  ← 현재 응시자 명 표시
└─────────────────────────────────┘
```

응시자명은 상단 토글에서 이미 선택했으므로 제출 버튼에는 확인 차원에서만 표기.

## 6. 채점 & 해설 화면

제출 후:
```
┌─────────────────────────────────┐
│ ✓ 정답입니다                     │
│                                 │
│ 재혁님, 부르고뉴는 피노 누아의   │
│ 본고장이죠. 이 정도면 WSET        │
│ Level 2 합격선입니다.            │
│                                 │
│ ── 해설 ──                       │
│ Burgundy(부르고뉴)는 프랑스       │
│ 동부의 와인 산지. 레드는 100%    │
│ 피노 누아(Côte de Nuits 중심),   │
│ 화이트는 100% 샤르도네           │
│ (Côte de Beaune 중심)로 만들어요. │
│ 마신 Domaine Chavy-Chouet도      │
│ 이 지역 와인.                    │
│                                 │
│ [다음 문제 →]                    │
└─────────────────────────────────┘
```

**핵심:**
- 응시자명 호명 + 정답·오답에 따른 AI 톤 변화 ("소믈리에 시험 응시하셔도 되겠어요" 등)
- 해설 내에 자연스럽게 마신 와인 언급 (별도 카드 X)
- 마신 와인 언급 시 클릭하면 해당 와인 상세 모달 열림 (inline link)

## 7. 마신 와인 통합 방식

- 문제 생성 시 사용자의 와인 리스트(이름 + drunk_at)를 AI 컨텍스트로 전달
- AI 지침:
  - "해설에 마신 와인 중 관련 와인이 있으면 자연스럽게 1~2문장으로 언급. 없으면 언급 안 해도 됨"
  - **언급 시 도입부 필수** — "마신 X도..." 같이 갑자기 시작하지 말 것.
    - 좋은 예: "지난 5월에 마신 Domaine Chavy-Chouet도 이 지역 와인이에요."
    - 좋은 예: "최근 마신 Château Margaux도 이 등급에 속해요."
    - 좋은 예: "지난주에 마신 ~"
    - 나쁜 예: "마신 ~도 이 지역."  ← 갑작스럽고 어색
  - 날짜 포맷: "지난 N월에", "최근", "지난주에" 같이 한국어 자연스럽게. ISO 날짜 그대로 X
- 별도 "관련 와인" 섹션 X
- 사용자가 마신 와인이 문제와 직접 관련이 있을 때만 explanation에 wine_id 포함 → 프론트에서 inline 링크로 렌더

## 8. AI 코멘트 톤 가이드

응시자명 + 정오답 + 난이도 조합:

| 상황 | 톤 예시 |
|---|---|
| 재혁 · 고급 정답 | "재혁님, 정답입니다. 이건 CMS Introductory 수준 — 소믈리에 시험 응시하셔도 되겠는걸요?" |
| 재혁 · 중급 정답 | "재혁님, 정답이에요. 부드럽게 풀어내시네요." |
| 원우 · 초급 정답 | "원우님, 정답입니다. 기본기 탄탄해요." |
| 원우 · 중급 정답 | "원우님, 잘하셨어요. 한 단계 올라갈 준비가 됐어요." |
| 재혁 · 오답 | "재혁님, 정답은 X였어요. 이 문제는 의외로 헷갈리는 포인트죠." |
| 원우 · 고급 오답 | "원우님, 정답은 X예요. 고급 난이도라 어려웠을 거예요. 이 개념은 ~." |
| 연속 정답 streak | "재혁님, 또 정답! 3연속이네요." |
| 연속 오답 | "원우님, 다시 한 번. 비슷한 개념을 조금 더 익혀볼게요." |

## 9. DB 스키마

```sql
CREATE TABLE quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,           -- '재혁' or '원우'
  category TEXT,                      -- '떼루아', '품종', '발음' 등
  difficulty TEXT,                    -- '초급' / '중급' / '고급'
  question_text TEXT,
  choices JSONB,                      -- [{ text: '...', isCorrect: true/false }, ...]
  selected_index INTEGER,             -- 0~3
  correct_index INTEGER,              -- 0~3
  is_correct BOOLEAN,
  explanation TEXT,                   -- AI가 생성한 해설
  ai_comment TEXT,                    -- 응시자명 호명한 개인 코멘트
  related_wine_ids UUID[],            -- 해설에서 inline 링크 걸 와인 id
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read quiz_attempts" ON quiz_attempts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert quiz_attempts" ON quiz_attempts FOR INSERT WITH CHECK (true);
```

각 시도 한 줄씩 기록. 통계는 이 테이블 집계로 산출.

## 10. API 엔드포인트

> **보안 방침**: 개인 학습용이라 정답을 평문으로 전달. 사용자가 F12로 컨닝하면 본인 손해.

### `POST /api/quiz/next`

다음 문제 요청. Claude API 1회 호출로 모든 내용 생성.

**Request:**
```json
{
  "user_name": "재혁"
}
```

**서버 처리:**
1. 최근 시도(최근 30건) 조회 → 현재 난이도 산출
2. 사용자 와인 리스트 fetch (이름·지역·품종 추출)
3. 카테고리 랜덤 선정
4. Claude API 호출 — 난이도·카테고리·와인 컨텍스트로 문제 + 양쪽 코멘트 모두 생성

**Response:**
```json
{
  "category": "떼루아",
  "difficulty": "중급",
  "question_text": "...",
  "choices": ["옵션 A", "옵션 B", "옵션 C", "옵션 D"],
  "correct_index": 2,
  "explanation": "...",
  "comment_if_correct": "재혁님, 정답입니다. ...",
  "comment_if_wrong": "재혁님, 정답은 X였어요. ...",
  "related_wine_ids": ["uuid1", "uuid2"]
}
```

클라이언트는 `correct_index`를 메모리에만 저장, 화면에 노출 X. 사용자 제출 시 로컬에서 비교 → 적절한 코멘트와 해설 표시.

### `POST /api/quiz/submit`

답안 기록만. Claude 호출 없음.

**Request:**
```json
{
  "user_name": "재혁",
  "category": "떼루아",
  "difficulty": "중급",
  "question_text": "...",
  "choices": [...],
  "selected_index": 2,
  "correct_index": 2,
  "is_correct": true,
  "explanation": "...",
  "ai_comment": "재혁님, 정답입니다. ...",
  "related_wine_ids": ["uuid1"]
}
```

서버: `quiz_attempts` 테이블에 insert만. 응답은 `{ success: true }` 정도.

## 11. 통계 화면 (Phase 2 — MVP 이후)

추후 추가 가능:
- 응시자별 누적 정답률
- 카테고리별 정답률
- 최근 30일 추세 그래프
- "약점 카테고리 집중 출제" 토글

MVP 단계에서는 기본 풀이 흐름만 구현, 통계는 단순 카운트 정도만 표시.

## 12. 구현 단계

1. **DB**: 사용자가 SQL 실행 (위 quiz_attempts 테이블)
2. **`/api/quiz/next`**: 다음 문제 생성
3. **`/api/quiz/submit`**: 답안 채점 + AI 코멘트
4. **`app/Quiz.tsx`**: 컴포넌트 (응시자 선택 + 문제 카드 + 채점 화면)
5. **`app/page.tsx`**: 탭 추가 + 렌더링
6. **테스트 & 톤 조정**

## 13. 미결정 항목 (구현 중 고려)

- **연속 시도 제한**: 한 번 풀고 바로 다음 문제? 또는 일정 시간 쿨다운?
- **건너뛰기**: 풀기 싫은 문제 패스 가능 여부?
- **타이머**: 게임화 요소 — 일단 MVP에서는 X
- **카테고리 필터**: MVP에서는 랜덤만, 추후 사용자 선택 가능하게 확장
