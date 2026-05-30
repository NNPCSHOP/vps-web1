import { NextRequest, NextResponse } from 'next/server'

/**
 * API สำหรับตรวจสอบรหัส Admin
 * ใช้ Environment Variables เท่านั้น (ไม่มี default เพื่อความปลอดภัย)
 */
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    // ดึงข้อมูลจาก Environment Variables เท่านั้น (บังคับต้องตั้งค่า)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

    // ถ้าไม่ได้ตั้งค่า Environment Variables
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      return NextResponse.json({
        success: false,
        message: 'ระบบยังไม่ได้กำหนดรหัส Admin'
      }, { status: 500 })
    }

    // ตรวจสอบ
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return NextResponse.json({
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง'
      }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}
