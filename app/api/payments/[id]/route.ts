import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API สำหรับอนุมัติ/ปฏิเสธ การชำระเงิน
 */

/**
 * PUT - อัพเดทสถานะการชำระเงิน
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status, note }: { status: 'approved' | 'rejected', note?: string } = await req.json()

    // ตรวจสอบว่ามีรายการนี้อยู่หรือไม่
    const payment = await prisma.payment.findUnique({
      where: { id }
    })

    if (!payment) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบรายการนี้'
      }, { status: 404 })
    }

    // อัพเดทสถานะ
    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status,
        note: note || payment.note
      }
    })

    return NextResponse.json({
      success: true,
      message: status === 'approved' ? 'อนุมัติสำเร็จ' : 'ปฏิเสธสำเร็จ',
      payment: updated
    })
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}

/**
 * DELETE - ลบรายการชำระเงิน
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const payment = await prisma.payment.findUnique({
      where: { id }
    })

    if (!payment) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบรายการนี้'
      }, { status: 404 })
    }

    await prisma.payment.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'ลบรายการสำเร็จ',
      deleted: payment
    })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}
