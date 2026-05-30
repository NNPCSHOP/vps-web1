import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { type User } from '@/lib/data'

/**
 * API สำหรับจัดการข้อมูลผู้ใช้
 */

/**
 * GET - ดึงข้อมูลผู้ใช้ทั้งหมด
 */
export async function GET() {
  const users = store.getUsers()
  return NextResponse.json({ users })
}

/**
 * POST - เพิ่มผู้ใช้ใหม่ (สมัครสมาชิก)
 */
export async function POST(req: NextRequest) {
  try {
    const newUser: User = await req.json()

    // ตรวจสอบว่ามี username หรือ email ซ้ำไหม
    const users = store.getUsers()
    if (users.find(u => u.username === newUser.username)) {
      return NextResponse.json({
        success: false,
        message: 'Username นี้มีผู้ใช้แล้ว'
      }, { status: 400 })
    }

    if (users.find(u => u.email === newUser.email)) {
      return NextResponse.json({
        success: false,
        message: 'Email นี้ถูกใช้งานแล้ว'
      }, { status: 400 })
    }

    const updated = store.addUser(newUser)

    return NextResponse.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
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
 * DELETE - รีเซ็ตข้อมูลทั้งหมด
 */
export async function DELETE() {
  store.reset()
  return NextResponse.json({
    success: true,
    message: 'รีเซ็ตข้อมูลสำเร็จ',
    users: store.getUsers()
  })
}
