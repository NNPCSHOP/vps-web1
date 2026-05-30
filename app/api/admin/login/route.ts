import { NextRequest, NextResponse } from 'next/server'

/**
 * API สำหรับตรวจสอบรหัส Admin
 * ใช้ Environment Variables เพื่อความปลอดภัย
 */
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    // ดึงข้อมูลจาก Environment Variables
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234'

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
