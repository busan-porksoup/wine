import { NextRequest, NextResponse } from 'next/server'
import { update, remove } from '../../../../lib/server/store'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await update('wines', id, await req.json())
    return NextResponse.json({ data: { id } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await remove('wines', id)
    return NextResponse.json({ data: { id } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
