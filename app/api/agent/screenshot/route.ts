// Agent ส่งภาพหน้าจอมาบันทึก
import { NextRequest, NextResponse } from 'next/server'
import { agentStore } from '@/lib/agentStore'

export async function POST(req: NextRequest) {
  const { machineId, screenshot } = await req.json()
  if (!machineId || !screenshot) return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })

  // อัปเดต lastSeen ด้วย
  const agents = agentStore.getAll()
  const agent  = agents.find(a => a.machineId === machineId)
  if (agent) agentStore.register({ ...agent, lastSeen: Date.now() })

  agentStore.saveScreenshot(machineId, screenshot)
  return NextResponse.json({ success: true })
}
