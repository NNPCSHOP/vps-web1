// Agent ยืนยันว่าดำเนินการ command เสร็จแล้ว
import { NextRequest, NextResponse } from 'next/server'
import { agentStore } from '@/lib/agentStore'

export async function POST(req: NextRequest) {
  const { commandId } = await req.json()
  if (!commandId) return NextResponse.json({ error: 'ต้องมี commandId' }, { status: 400 })
  agentStore.confirmCommand(commandId)
  return NextResponse.json({ success: true })
}
