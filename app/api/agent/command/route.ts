// Agent ดึง command ที่รอดำเนินการ (เช่น เปลี่ยนรหัส AnyDesk)
import { NextRequest, NextResponse } from 'next/server'
import { commandStore } from '@/lib/store'

/**
 * GET /api/agent/command?machineId=xxx
 * Agent ดึงคำสั่งที่รอดำเนินการ
 */
export async function GET(req: NextRequest) {
  try {
    const machineId = req.nextUrl.searchParams.get('machineId') || req.nextUrl.searchParams.get('id')

    if (!machineId) {
      return NextResponse.json({ hasCommand: false, command: null })
    }

    const command = commandStore.getPendingCommand(machineId)

    if (command) {
      return NextResponse.json({
        hasCommand: true,
        command: {
          id: command.id,
          type: command.type,
          payload: command.payload
        }
      })
    } else {
      return NextResponse.json({
        hasCommand: false,
        command: null
      })
    }
  } catch (error) {
    return NextResponse.json({ hasCommand: false, command: null })
  }
}

/**
 * POST /api/agent/command/confirm
 * Agent ยืนยันว่าทำคำสั่งเสร็จแล้ว
 */
export async function POST(req: NextRequest) {
  try {
    const { commandId } = await req.json()

    if (!commandId) {
      return NextResponse.json({ success: false, message: 'ต้องมี commandId' }, { status: 400 })
    }

    const confirmed = commandStore.confirmCommand(commandId)

    return NextResponse.json({
      success: confirmed,
      message: confirmed ? 'ยืนยันคำสั่งสำเร็จ' : 'ไม่พบคำสั่งนี้'
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
