import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { type User } from '@/lib/data'

/**
 * API สำหรับจัดการผู้ใช้แต่ละคน
 */

/**
 * PUT - อัพเดทข้อมูลผู้ใช้
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updatedData: Partial<User> = await req.json()

    const users = store.getUsers()
    const user = users.find(u => u.id === id)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบผู้ใช้นี้'
      }, { status: 404 })
    }

    // อัพเดทข้อมูล
    const updated = store.updateUser(id, updatedData)
    const updatedUser = updated.find(u => u.id === id)

    return NextResponse.json({
      success: true,
      message: 'อัพเดทสำเร็จ',
      user: updatedUser,
      users: updated
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}

/**
 * DELETE - ลบผู้ใช้
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const users = store.getUsers()
    const user = users.find(u => u.id === id)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบผู้ใช้นี้'
      }, { status: 404 })
    }

    // ลบผู้ใช้
    const updated = store.deleteUser(id)

    // ถ้าผู้ใช้กำลังเช่าเครื่องอยู่ ให้ปล่อยเครื่องด้วย
    if (user.rentingMachine) {
      const machines = store.getMachines()
      const machine = machines.find(m => m.name === user.rentingMachine)
      if (machine) {
        store.updateMachine(machine.id, {
          status: 'available',
          user: undefined,
          rentedAt: undefined,
          expiresAt: undefined
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'ลบผู้ใช้สำเร็จ',
      deleted: user,
      users: updated
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}
