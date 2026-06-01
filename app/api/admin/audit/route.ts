import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs, verifyToken } from '@/lib/auth'

/**
 * 📝 API สำหรับดู Audit Logs
 * - ต้องล็อกอินก่อนถึงจะดูได้
 * - แสดงประวัติการเข้าสู่ระบบทั้งหมด
 */
export async function GET(req: NextRequest) {
  try {
    // ดึง Token จาก Header
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบ Token - กรุณาเข้าสู่ระบบ'
      }, { status: 401 })
    }

    // ตรวจสอบ Token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({
        success: false,
        message: 'Token ไม่ถูกต้องหรือหมดอายุ'
      }, { status: 401 })
    }

    // ดึง Query Parameters
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // ดึง Audit Logs
    const logs = getAuditLogs(limit)

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
      user: payload.username
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
