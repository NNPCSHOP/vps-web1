// Admin สั่งเปลี่ยน AnyDesk password ของเครื่องลูก
import { NextRequest, NextResponse } from 'next/server'
import { store, commandStore } from '@/lib/store'

// สร้างรหัส 8 ตัวแบบสุ่ม
function randomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: NextRequest) {
  try {
    const { machineId, password } = await req.json()
    if (!machineId) return NextResponse.json({ error: 'ต้องมี machineId' }, { status: 400 })

    const newPass = password?.trim() || randomPassword()

    // อัพเดทรหัสในฐานข้อมูล
    const machines = store.getMachines()
    const machine = machines.find(m => m.id === machineId)
    if (!machine) {
      return NextResponse.json({ error: 'ไม่พบเครื่องนี้' }, { status: 404 })
    }

    // บันทึกรหัสใหม่
    store.updateMachine(machineId, { anydeskPass: newPass })

    // ส่งคำสั่งไปยัง Agent
    const cmd = commandStore.addCommand(machineId, 'setPassword', newPass)

    return NextResponse.json({
      success: true,
      password: newPass,
      commandId: cmd.id,
      message: 'ส่งคำสั่งไปยังเครื่องแล้ว'
    })
  } catch (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
