import { NextRequest, NextResponse } from 'next/server'
import { list, insert } from '../../../lib/server/store'

export async function GET() {
  try {
    return NextResponse.json({ data: await list('wishlist') })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const id = await insert('wishlist', await req.json())
    return NextResponse.json({ data: { id } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
