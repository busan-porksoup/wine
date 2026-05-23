'use client'

import { useEffect, useState } from 'react'

type Respondent = '재혁' | '원우'

type QuizQuestion = {
  category: string
  difficulty: string
  difficulty_label?: string
  question_text: string
  choices: string[]
  correct_index: number
  explanation: string
  comment_if_correct: string
  comment_if_wrong: string
  related_wine_ids: string[]
}

// 폴백 (API에서 difficulty_label 안 오는 경우)
const DIFFICULTY_REF_FALLBACK: Record<string, string> = {
  '초급': '대중 상식',
  '중급': 'WSET Level 2',
  '고급': 'WSET Level 3',
  '마스터': 'MW / MS+',
}

const STORAGE_KEY = 'quiz_respondent'

type Props = {
  wines?: any[]
  onOpenWine?: (wine: any) => void
}

function renderExplanation(text: string, wines: any[], onOpen?: (w: any) => void): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /\[\[wine:([^|\]]+)\|([^\]]+)\]\]/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const wineId = match[1]
    const wineName = match[2]
    const wine = wines.find(w => w.id === wineId)
    if (wine && onOpen) {
      parts.push(
        <a
          key={key++}
          onClick={e => { e.preventDefault(); onOpen(wine) }}
          style={{
            color: 'var(--ink-bordeaux)',
            textDecoration: 'underline',
            textDecorationColor: 'rgba(107,31,42,0.4)',
            textUnderlineOffset: '3px',
            cursor: 'pointer',
            fontStyle: 'italic',
          }}
        >{wineName}</a>
      )
    } else {
      // 와인을 못 찾으면 그냥 이름만 표시 (링크 X)
      parts.push(<em key={key++} style={{ color: 'var(--ink-charcoal)' }}>{wineName}</em>)
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts
}

export default function Quiz({ wines = [], onOpenWine }: Props) {
  const [respondent, setRespondent] = useState<Respondent | null>(null)
  const [question, setQuestion] = useState<QuizQuestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 최초 마운트 시 localStorage에서 응시자 복원
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === '재혁' || saved === '원우') {
      setRespondent(saved)
    }
  }, [])

  // 응시자 결정되면 첫 문제 fetch
  useEffect(() => {
    if (respondent && !question && !loading) {
      fetchNext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [respondent])

  async function fetchNext() {
    if (!respondent) return
    setLoading(true)
    setError('')
    setSelected(null)
    setSubmitted(false)
    try {
      const res = await fetch('/api/quiz/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: respondent }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || '문제 생성 실패')
      } else {
        setQuestion(data)
      }
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  function switchRespondent(r: Respondent) {
    setRespondent(r)
    localStorage.setItem(STORAGE_KEY, r)
    setQuestion(null)
    setSelected(null)
    setSubmitted(false)
  }

  async function handleSubmit() {
    if (!question || !respondent || selected === null) return
    setSubmitting(true)
    setSubmitted(true)
    const isCorrect = selected === question.correct_index
    const aiComment = isCorrect ? question.comment_if_correct : question.comment_if_wrong

    // Fire-and-forget submit
    fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: respondent,
        category: question.category,
        difficulty: question.difficulty,
        question_text: question.question_text,
        choices: question.choices,
        selected_index: selected,
        correct_index: question.correct_index,
        is_correct: isCorrect,
        explanation: question.explanation,
        ai_comment: aiComment,
        related_wine_ids: question.related_wine_ids,
      }),
    }).catch(() => {})

    setSubmitting(false)
  }

  // 응시자 선택 안 됐으면 선택 화면
  if (!respondent) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '8px' }}>
          QUIZ
        </div>
        <div className="type-title-md" style={{ fontStyle: 'italic', color: 'var(--ink-charcoal)', marginBottom: '24px', fontSize: '22px' }}>
          응시자를 선택해주세요
        </div>
        <div style={{
          display: 'inline-flex',
          background: 'rgba(200,184,154,0.15)',
          borderRadius: 'var(--radius-full)',
          padding: '4px',
        }}>
          {(['재혁', '원우'] as Respondent[]).map(r => (
            <button key={r} onClick={() => switchRespondent(r)} style={{
              padding: '10px 28px',
              borderRadius: 'var(--radius-full)',
              background: 'transparent',
              color: 'var(--ink-charcoal)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 500,
            }}>{r}</button>
          ))}
        </div>
      </div>
    )
  }

  const isCorrect = submitted && question && selected === question.correct_index

  return (
    <div style={{ paddingBottom: '120px' }}>
      {/* 응시자 토글 */}
      <div style={{ padding: '20px 24px 12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', height: '36px',
          fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
          color: 'var(--ink-charcoal)', letterSpacing: '-0.01em', lineHeight: 1,
        }}>
          응시자
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
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
            >{r}</button>
          ))}
        </div>
      </div>

      {/* 로딩 / 에러 / 문제 */}
      {loading ? (
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div className="type-micro" style={{ color: 'var(--ink-mist)', fontStyle: 'italic' }}>
            ✨ AI가 문제를 출제하고 있어요…
          </div>
        </div>
      ) : error ? (
        <div style={{ padding: '40px 16px' }}>
          <div className="glass-card glass-card--light" style={{ padding: '24px', textAlign: 'center' }}>
            <div className="type-body" style={{ color: '#B53E2A', marginBottom: '12px' }}>{error}</div>
            <button onClick={fetchNext} className="type-caption" style={{
              padding: '10px 18px', borderRadius: 'var(--radius-md)',
              background: 'var(--ink-bordeaux)', border: 'none', color: '#fff',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}>다시 시도</button>
          </div>
        </div>
      ) : question ? (
        <>
          {/* 문제 카드 */}
          <div style={{ padding: '12px 16px' }}>
            <div className="glass-card glass-card--light" style={{ padding: '24px 22px' }}>
              {/* 난이도 + 카테고리 메타 */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '5px 14px', borderRadius: 'var(--radius-full)',
                background: 'rgba(107,31,42,0.08)',
                border: '1px solid rgba(107,31,42,0.2)',
                marginBottom: '18px',
              }}>
                <span className="type-caption" style={{ color: 'var(--ink-bordeaux)', fontSize: '11px' }}>
                  {question.difficulty}
                </span>
                <span style={{
                  color: 'var(--ink-mist)', fontSize: '10px',
                  fontStyle: 'italic', letterSpacing: 0, textTransform: 'none',
                  fontFamily: 'var(--font-sans)',
                }}>
                  ({question.difficulty_label || DIFFICULTY_REF_FALLBACK[question.difficulty] || question.difficulty})
                </span>
                <span style={{
                  width: 1, height: 12,
                  background: 'rgba(107,31,42,0.35)',
                  display: 'inline-block', margin: '0 2px',
                }}/>
                <span className="type-caption" style={{ color: 'var(--ink-bordeaux)', fontSize: '11px' }}>
                  {question.category}
                </span>
              </div>

              {/* 문제 */}
              <div className="type-title-md" style={{
                fontStyle: 'italic', color: 'var(--ink-charcoal)',
                fontSize: '19px', lineHeight: 1.4, marginBottom: '20px',
              }}>
                {question.question_text}
              </div>

              {/* 보기 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {question.choices.map((choice, i) => {
                  const isSelectedChoice = selected === i
                  const isCorrectChoice = i === question.correct_index
                  const showCorrect = submitted && isCorrectChoice
                  const showWrong = submitted && isSelectedChoice && !isCorrectChoice
                  return (
                    <button
                      key={i}
                      onClick={() => !submitted && setSelected(i)}
                      disabled={submitted}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: showCorrect
                          ? '1.5px solid var(--ink-olive)'
                          : showWrong
                          ? '1.5px solid #B53E2A'
                          : isSelectedChoice
                          ? '1.5px solid var(--ink-bordeaux)'
                          : '1px solid rgba(200,184,154,0.4)',
                        background: showCorrect
                          ? 'rgba(92,107,63,0.08)'
                          : showWrong
                          ? 'rgba(181,62,42,0.08)'
                          : isSelectedChoice
                          ? 'rgba(107,31,42,0.06)'
                          : 'rgba(250,246,238,0.5)',
                        cursor: submitted ? 'default' : 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--font-sans)',
                        transition: 'all var(--dur-base) var(--ease-out-soft)',
                      }}
                    >
                      <span style={{
                        width: 16, height: 16, borderRadius: '50%',
                        border: '1.5px solid',
                        borderColor: showCorrect
                          ? 'var(--ink-olive)'
                          : showWrong
                          ? '#B53E2A'
                          : isSelectedChoice
                          ? 'var(--ink-bordeaux)'
                          : 'rgba(200,184,154,0.6)',
                        flexShrink: 0,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {(isSelectedChoice || showCorrect) && (
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
                        fontWeight: isSelectedChoice ? 500 : 400,
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

              {/* 제출 / 다음 문제 */}
              {!submitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={selected === null || submitting}
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
              ) : null}
            </div>
          </div>

          {/* 채점 결과 */}
          {submitted && (
            <div style={{ padding: '12px 16px' }}>
              <div className="glass-card glass-card--light" style={{ padding: '24px 22px' }}>
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
                  color: 'var(--ink-charcoal)', lineHeight: 1.65,
                  margin: '0 0 20px', fontStyle: 'italic',
                }}>
                  {isCorrect ? question.comment_if_correct : question.comment_if_wrong}
                </p>

                <div style={{ height: 1, background: 'rgba(200,184,154,0.4)', marginBottom: '18px' }}/>

                <div className="type-caption" style={{ color: 'var(--ink-bordeaux)', marginBottom: '10px' }}>
                  해설
                </div>
                <p className="type-body" style={{
                  color: 'var(--ink-charcoal)', lineHeight: 1.7, margin: 0, fontSize: '14px',
                }}>
                  {renderExplanation(question.explanation, wines, onOpenWine)}
                </p>

                <div style={{ marginTop: '24px' }}>
                  <button
                    onClick={fetchNext}
                    className="type-caption"
                    style={{
                      width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                      background: 'var(--ink-bordeaux)',
                      border: 'none', color: '#fff',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    }}
                  >
                    다음 문제 →
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}

    </div>
  )
}
