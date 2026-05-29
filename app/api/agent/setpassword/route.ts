// Admin สั่งเปลี่ยน AnyDesk password ของเครื่องลูก
import { NextRequest, NextResponse } from 'next/server'
import { agentStore } from '@/lib/agentStore'

// สร้างรหัส 8 ตัวแบบสุ่ม
function randomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: NextRequest) {
  const { machineId, password } = await req.json()
  if (!machineId) return NextResponse.json({ error: 'ต้องมี machineId' }, { status: 400 })

  const newPass = password?.trim() || randomPassword()
  const cmd     = agentStore.addCommand(machineId, 'setPassword', newPass)
  return NextResponse.json({ success: true, commandId: cmd.id, password: newPass })
}
