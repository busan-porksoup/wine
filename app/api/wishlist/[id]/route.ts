import { NextRequest, NextResponse } from 'next/server'
import { remove } from '../../../../lib/server/store'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await remove('wishlist', id)
    return NextResponse.json({ data: { id } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
