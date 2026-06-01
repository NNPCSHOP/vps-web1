import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { type Payment } from '@/lib/data'

/**
 * API สำหรับจัดการประวัติการชำระเงิน (Database)
 */

/**
 * GET - ดึงข้อมูลการชำระเงินทั้งหมด
 */
export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAtDb: 'desc' }
    })
    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลได้'
    }, { status: 500 })
  }
}

/**
 * POST - เพิ่มการชำระเงินใหม่
 */
export async function POST(req: NextRequest) {
  try {
    const data: Omit<Payment, 'id'> = await req.json()

    const newPayment = await prisma.payment.create({
      data: {
        username: data.username,
        amount: data.amount,
        method: data.method,
        status: data.status,
        createdAt: data.createdAt,
        note: data.note,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'เพิ่มการชำระเงินสำเร็จ',
      payment: newPayment
    })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}
