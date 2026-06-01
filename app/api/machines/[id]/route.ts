import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { type Machine } from '@/lib/data'

/**
 * API สำหรับจัดการเครื่องแต่ละตัว (Database)
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

    // ตรวจสอบว่ามีเครื่องนี้อยู่หรือไม่
    const machine = await prisma.machine.findUnique({
      where: { id }
    })

    if (!machine) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบเครื่องนี้'
      }, { status: 404 })
    }

    // อัพเดทข้อมูล
    const updatedMachine = await prisma.machine.update({
      where: { id },
      data: updatedData
    })

    return NextResponse.json({
      success: true,
      message: 'อัพเดทสำเร็จ',
      machine: updatedMachine
    })
  } catch (error) {
    console.error('Error updating machine:', error)
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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // ตรวจสอบว่ามีเครื่องนี้อยู่หรือไม่
    const machine = await prisma.machine.findUnique({
      where: { id }
    })

    if (!machine) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบเครื่องนี้'
      }, { status: 404 })
    }

    // ลบเครื่อง
    await prisma.machine.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'ลบเครื่องสำเร็จ',
      deleted: machine
    })
  } catch (error) {
    console.error('Error deleting machine:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}
