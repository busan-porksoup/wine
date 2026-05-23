'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────
// Mock 데이터
// ─────────────────────────────────────────────

const DIFFICULTY_REF: Record<string, string> = {
  '초급': '대중 상식',
  '중급': 'WSET Level 2',
  '고급': 'WSET Level 3',
}

const MOCK_QUESTION = {
  category: '떼루아',
  difficulty: '중급',
  question_text: 'Burgundy 지방의 주된 레드 와인 품종은?',
  choices: ['Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah'],
  correct_index: 2,
  explanation:
    'Burgundy(부르고뉴)는 프랑스 동부의 와인 산지. 레드는 100% 피노 누아(Côte de Nuits 중심), 화이트는 100% 샤르도네(Côte de Beaune 중심)로 만들어집니다. 단일 품종 정책이 이 지역의 정체성이에요. 지난 5월에 마신 Domaine Chavy-Chouet도 이 지역 와인이에요.',
  related_wines: [
    { name: 'Domaine Chavy-Chouet', vintage: 2020 },
  ],
}

const COMMENTS = {
  재혁: {
    correct: '재혁님, 정답입니다. 부르고뉴의 피노 누아는 와인 공부의 출발점이죠. WSET Level 2 합격선이에요.',
    wrong: '재혁님, 정답은 Pinot Noir였어요. 보르도와 부르고뉴는 프랑스 양대 산지지만 주품종이 정반대 — 보르도는 카베르네/메를로 블렌드, 부르고뉴는 피노 누아 단일.',
  },
  원우: {
    correct: '원우님, 정답입니다. 잘하셨어요. 부르고뉴의 정체성을 잡으셨네요.',
    wrong: '원우님, 정답은 Pinot Noir였어요. 보르도 = 블렌드, 부르고뉴 = 단일 품종. 이 차이부터 익혀두면 좋아요.',
  },
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

type Respondent = '재혁' | '원우'

export default function SamplesQuiz() {
  const [respondent, setRespondent] = useState<Respondent>('재혁')
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const isCorrect = submitted && selected === MOCK_QUESTION.correct_index

  function reset() {
    setSelected(null)
    setSubmitted(false)
  }

  function switchRespondent(r: Respondent) {
    setRespondent(r)
    reset()
  }

  return (
    <div id="app-container" style={{ paddingBottom: '80px' }}>
      {/* Hero */}
      <div style={{ padding: '48px 24px 16px' }}>
        <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '6px', textShadow: '0 1px 8px rgba(244,239,230,0.7)' }}>SAMPLES · QUIZ</div>
        <h1 className="type-display-2" style={{ color: 'var(--ink-charcoal)', margin: '0 0 12px', fontSize: '32px', textShadow: '0 1px 12px rgba(244,239,230,0.85)' }}>
          Quiz Mockup.
        </h1>
        <p className="type-body" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', margin: 0, textShadow: '0 1px 8px rgba(244,239,230,0.7)' }}>
          한 문제 풀이 흐름. 응시자 전환하면서 톤 차이 확인 가능
        </p>
      </div>

      {/* 응시자 선택 — 라벨과 토글이 같은 라인 */}
      <div style={{ padding: '20px 24px 12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: '36px',
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--ink-charcoal)',
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}>
          응시자
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'rgba(200,184,154,0.15)',
          borderRadius: 'var(--radius-full)',
          padding: '4px',
        }}>
          {(['재혁', '원우'] as Respondent[]).map(r => (
            <button
              key={r}
              onClick={() => switchRespondent(r)}
              className="type-caption"
              style={{
                padding: '7px 20px',
                borderRadius: 'var(--radius-full)',
                background: respondent === r ? 'var(--ink-bordeaux)' : 'transparent',
                color: respondent === r ? '#fff' : 'var(--ink-mist)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                letterSpacing: '-0.01em',
                transition: 'all var(--dur-base) var(--ease-out-soft)',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 문제 카드 */}
      <div style={{ padding: '12px 16px' }}>
        <div className="glass-card glass-card--light" style={{ padding: '24px 22px' }}>

          {/* 난이도 + 시험 레벨 + 카테고리 메타 */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(107,31,42,0.08)',
            border: '1px solid rgba(107,31,42,0.2)',
            marginBottom: '18px',
          }}>
            <span className="type-caption" style={{ color: 'var(--ink-bordeaux)', fontSize: '11px' }}>
              {MOCK_QUESTION.difficulty}
            </span>
            <span style={{
              color: 'var(--ink-mist)',
              fontSize: '10px',
              fontStyle: 'italic',
              letterSpacing: 0,
              textTransform: 'none',
              fontFamily: 'var(--font-sans)',
            }}>
              ({DIFFICULTY_REF[MOCK_QUESTION.difficulty]})
            </span>
            <span style={{
              width: 1,
              height: 12,
              background: 'rgba(107,31,42,0.35)',
              display: 'inline-block',
              margin: '0 2px',
            }}/>
            <span className="type-caption" style={{ color: 'var(--ink-bordeaux)', fontSize: '11px' }}>
              {MOCK_QUESTION.category}
            </span>
          </div>

          {/* 문제 */}
          <div className="type-title-md" style={{
            fontStyle: 'italic',
            color: 'var(--ink-charcoal)',
            fontSize: '19px',
            lineHeight: 1.4,
            marginBottom: '20px',
          }}>
            {MOCK_QUESTION.question_text}
          </div>

          {/* 보기 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {MOCK_QUESTION.choices.map((choice, i) => {
              const isSelected = selected === i
              const isCorrectChoice = i === MOCK_QUESTION.correct_index
              const showCorrect = submitted && isCorrectChoice
              const showWrong = submitted && isSelected && !isCorrectChoice

              return (
                <button
                  key={i}
                  onClick={() => !submitted && setSelected(i)}
                  disabled={submitted}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: showCorrect
                      ? '1.5px solid var(--ink-olive)'
                      : showWrong
                      ? '1.5px solid #B53E2A'
                      : isSelected
                      ? '1.5px solid var(--ink-bordeaux)'
                      : '1px solid rgba(200,184,154,0.4)',
                    background: showCorrect
                      ? 'rgba(92,107,63,0.08)'
                      : showWrong
                      ? 'rgba(181,62,42,0.08)'
                      : isSelected
                      ? 'rgba(107,31,42,0.06)'
                      : 'rgba(250,246,238,0.5)',
                    cursor: submitted ? 'default' : 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all var(--dur-base) var(--ease-out-soft)',
                  }}
                >
                  {/* 라디오 마커 */}
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '1.5px solid',
                    borderColor: showCorrect
                      ? 'var(--ink-olive)'
                      : showWrong
                      ? '#B53E2A'
                      : isSelected
                      ? 'var(--ink-bordeaux)'
                      : 'rgba(200,184,154,0.6)',
                    flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {(isSelected || showCorrect) && (
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: showCorrect
                          ? 'var(--ink-olive)'
                          : showWrong
                          ? '#B53E2A'
                          : 'var(--ink-bordeaux)',
                      }}/>
                    )}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    color: 'var(--ink-charcoal)',
                    fontWeight: isSelected ? 500 : 400,
                  }}>
                    {choice}
                  </span>
                  {showCorrect && (
                    <span style={{ marginLeft: 'auto', color: 'var(--ink-olive)', fontSize: '14px' }}>✓</span>
                  )}
                  {showWrong && (
                    <span style={{ marginLeft: 'auto', color: '#B53E2A', fontSize: '14px' }}>✗</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* 제출 / 다음 */}
          {!submitted ? (
            <button
              onClick={() => setSubmitted(true)}
              disabled={selected === null}
              className="type-caption"
              style={{
                width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                background: selected === null ? 'rgba(138,126,109,0.4)' : 'var(--ink-bordeaux)',
                border: 'none', color: '#fff',
                cursor: selected === null ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              답안 제출
            </button>
          ) : (
            <button
              onClick={reset}
              className="type-caption"
              style={{
                width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                background: 'transparent',
                border: '1px solid rgba(200,184,154,0.6)',
                color: 'var(--ink-mist)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              다시 풀어보기 (mockup용)
            </button>
          )}
        </div>
      </div>

      {/* 채점 결과 */}
      {submitted && (
        <div style={{ padding: '12px 16px' }}>
          <div className="glass-card glass-card--light" style={{ padding: '24px 22px' }}>

            {/* 정답 / 오답 배지 */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '5px 14px', borderRadius: 'var(--radius-full)',
              background: isCorrect ? 'rgba(92,107,63,0.12)' : 'rgba(181,62,42,0.08)',
              border: `1px solid ${isCorrect ? 'rgba(92,107,63,0.4)' : 'rgba(181,62,42,0.3)'}`,
              marginBottom: '16px',
            }}>
              <span style={{ fontSize: '13px', color: isCorrect ? 'var(--ink-olive)' : '#B53E2A' }}>
                {isCorrect ? '✓' : '✗'}
              </span>
              <span className="type-caption" style={{ color: isCorrect ? 'var(--ink-olive)' : '#B53E2A' }}>
                {isCorrect ? '정답' : '오답'}
              </span>
            </div>

            {/* AI 코멘트 */}
            <p className="type-body" style={{
              color: 'var(--ink-charcoal)',
              lineHeight: 1.65,
              margin: '0 0 20px',
              fontStyle: 'italic',
            }}>
              {COMMENTS[respondent][isCorrect ? 'correct' : 'wrong']}
            </p>

            <div style={{ height: 1, background: 'rgba(200,184,154,0.4)', marginBottom: '18px' }}/>

            {/* 해설 */}
            <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '10px' }}>
              해설
            </div>
            <p className="type-body" style={{
              color: 'var(--ink-charcoal)',
              lineHeight: 1.7,
              margin: 0,
              fontSize: '14px',
            }}>
              {MOCK_QUESTION.explanation.split('Domaine Chavy-Chouet').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <a
                      href="#"
                      onClick={e => { e.preventDefault(); alert('실제 구현에서는 해당 와인 상세 모달 열림') }}
                      style={{
                        color: 'var(--ink-bordeaux)',
                        textDecoration: 'underline',
                        textDecorationColor: 'rgba(107,31,42,0.4)',
                        textUnderlineOffset: '3px',
                        fontStyle: 'italic',
                      }}
                    >
                      Domaine Chavy-Chouet
                    </a>
                  )}
                </span>
              ))}
            </p>

            {/* 다음 문제 (실제 구현에서) */}
            <div style={{ marginTop: '24px' }}>
              <button
                onClick={reset}
                className="type-caption"
                style={{
                  width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                  background: 'var(--ink-bordeaux)',
                  border: 'none', color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                다음 문제 →
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '24px 24px 16px', textAlign: 'center' }}>
        <p className="type-micro" style={{ color: 'var(--ink-mist)', textTransform: 'none', letterSpacing: 0, fontStyle: 'italic' }}>
          응시자 토글 · 답 선택 · 제출까지 인터랙티브. 정답은 Pinot Noir.
        </p>
      </div>
    </div>
  )
}
