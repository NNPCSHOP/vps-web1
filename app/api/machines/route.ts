import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { type Machine } from '@/lib/data'

/**
 * API สำหรับจัดการข้อมูลเครื่อง
 * ใช้ in-memory storage (จะรีเซ็ตเมื่อ restart server)
 */

/**
 * GET - ดึงข้อมูลเครื่องทั้งหมด
 */
export async function GET() {
  const machines = store.getMachines()
  return NextResponse.json({ machines })
}

/**
 * POST - เพิ่มเครื่องใหม่
 */
export async function POST(req: NextRequest) {
  try {
    const newMachine: Machine = await req.json()

    // ตรวจสอบว่ามี ID ซ้ำไหม
    const machines = store.getMachines()
    if (machines.find(m => m.id === newMachine.id)) {
      return NextResponse.json({
        success: false,
        message: 'ID เครื่องซ้ำ'
      }, { status: 400 })
    }

    const updated = store.addMachine(newMachine)

    return NextResponse.json({
      success: true,
      message: 'เพิ่มเครื่องสำเร็จ',
      machines: updated
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}

/**
 * DELETE - รีเซ็ตข้อมูลทั้งหมด
 */
export async function DELETE() {
  store.reset()
  return NextResponse.json({
    success: true,
    message: 'รีเซ็ตข้อมูลสำเร็จ',
    machines: store.getMachines()
  })
}
