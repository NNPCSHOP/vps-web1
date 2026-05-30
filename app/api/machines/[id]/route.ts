import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { type Machine } from '@/lib/data'

/**
 * API สำหรับจัดการเครื่องแต่ละตัว
 */

/**
 * PUT - อัพเดทข้อมูลเครื่อง
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updatedData: Partial<Machine> = await req.json()

    const machines = store.getMachines()
    const machine = machines.find(m => m.id === id)
    if (!machine) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบเครื่องนี้'
      }, { status: 404 })
    }

    // อัพเดทข้อมูล
    const updated = store.updateMachine(id, updatedData)
    const updatedMachine = updated.find(m => m.id === id)

    return NextResponse.json({
      success: true,
      message: 'อัพเดทสำเร็จ',
      machine: updatedMachine,
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
 * DELETE - ลบเครื่อง
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const machines = store.getMachines()
    const machine = machines.find(m => m.id === id)
    if (!machine) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบเครื่องนี้'
      }, { status: 404 })
    }

    // ลบเครื่อง
    const updated = store.deleteMachine(id)

    return NextResponse.json({
      success: true,
      message: 'ลบเครื่องสำเร็จ',
      deleted: machine,
      machines: updated
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}
