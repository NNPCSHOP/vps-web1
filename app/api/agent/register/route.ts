// Agent ส่งข้อมูลลงทะเบียนตัวเองกับเซิร์ฟเวอร์
import { NextRequest, NextResponse } from 'next/server'
import { agentStore } from '@/lib/agentStore'

export async function POST(req: NextRequest) {
  const { machineId, name, ip, anydeskId } = await req.json()
  if (!machineId) return NextResponse.json({ error: 'ต้องมี machineId' }, { status: 400 })

  agentStore.register({ machineId, name: name || machineId, ip: ip || '', anydeskId: anydeskId || '', lastSeen: Date.now() })
  return NextResponse.json({ success: true })
}
