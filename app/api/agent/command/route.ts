// Agent ดึง command ที่รอดำเนินการ (เช่น เปลี่ยนรหัส AnyDesk)
import { NextRequest, NextResponse } from 'next/server'
import { agentStore } from '@/lib/agentStore'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ command: null })

  // อัปเดต lastSeen
  const agents = agentStore.getAll()
  const agent  = agents.find(a => a.machineId === id)
  if (agent) agentStore.register({ ...agent, lastSeen: Date.now() })

  const command = agentStore.getPending(id)
  return NextResponse.json({ command })
}
