import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { type User } from '@/lib/data'

/**
 * API สำหรับจัดการข้อมูลผู้ใช้ (Database)
 */

/**
 * GET - ดึงข้อมูลผู้ใช้ทั้งหมด
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { username: 'asc' }
    })
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลได้'
    }, { status: 500 })
  }
}

/**
 * POST - เพิ่มผู้ใช้ใหม่ (สมัครสมาชิก)
 */
export async function POST(req: NextRequest) {
  try {
    const data: Omit<User, 'id'> = await req.json()

    // ตรวจสอบว่ามี username ซ้ำไหม
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username }
    })

    if (existingUsername) {
      return NextResponse.json({
        success: false,
        message: 'Username นี้มีผู้ใช้แล้ว'
      }, { status: 400 })
    }

    // ตรวจสอบว่ามี email ซ้ำไหม
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingEmail) {
      return NextResponse.json({
        success: false,
        message: 'Email นี้ถูกใช้งานแล้ว'
      }, { status: 400 })
    }

    const newUser = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: data.password,
        balance: data.balance,
        totalSpent: data.totalSpent,
        registeredAt: data.registeredAt,
        status: data.status,
        rentingMachine: data.rentingMachine,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      user: newUser
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}
