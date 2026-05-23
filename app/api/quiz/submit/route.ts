import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      user_name,
      category,
      difficulty,
      question_text,
      choices,
      selected_index,
      correct_index,
      is_correct,
      explanation,
      ai_comment,
      related_wine_ids,
    } = body

    if (!user_name || typeof selected_index !== 'number' || typeof correct_index !== 'number') {
      return NextResponse.json({ success: false, error: 'invalid payload' }, { status: 400 })
    }

    const { error } = await supabase.from('quiz_attempts').insert({
      user_name,
      category: category || null,
      difficulty: difficulty || null,
      question_text: question_text || null,
      choices: choices || null,
      selected_index,
      correct_index,
      is_correct: !!is_correct,
      explanation: explanation || null,
      ai_comment: ai_comment || null,
      related_wine_ids: Array.isArray(related_wine_ids) ? related_wine_ids : null,
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
