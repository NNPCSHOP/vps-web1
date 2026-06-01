import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { type User } from '@/lib/data'

/**
 * API สำหรับจัดการผู้ใช้แต่ละคน (Database)
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

    // ตรวจสอบว่ามีผู้ใช้นี้อยู่หรือไม่
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบผู้ใช้นี้'
      }, { status: 404 })
    }

    // อัพเดทข้อมูล
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updatedData
    })

    return NextResponse.json({
      success: true,
      message: 'อัพเดทสำเร็จ',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating user:', error)
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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // ตรวจสอบว่ามีผู้ใช้นี้อยู่หรือไม่
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบผู้ใช้นี้'
      }, { status: 404 })
    }

    // ถ้าผู้ใช้กำลังเช่าเครื่องอยู่ ให้ปล่อยเครื่องด้วย
    if (user.rentingMachine) {
      const machine = await prisma.machine.findUnique({
        where: { name: user.rentingMachine }
      })

      if (machine) {
        await prisma.machine.update({
          where: { id: machine.id },
          data: {
            status: 'available',
            user: null,
            rentedAt: null,
            expiresAt: null
          }
        })
      }
    }

    // ลบผู้ใช้
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'ลบผู้ใช้สำเร็จ',
      deleted: user
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}
