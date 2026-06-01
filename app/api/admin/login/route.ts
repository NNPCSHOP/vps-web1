import { NextRequest, NextResponse } from 'next/server'
import {
  verifyAdminCredentials,
  generateToken,
  isIPLocked,
  recordFailedLogin,
  clearFailedAttempts,
  getLockStatus,
  logAudit,
  getClientIP
} from '@/lib/auth'

/**
 * 🔐 API สำหรับตรวจสอบรหัส Admin
 * - รองรับ Password เข้ารหัสด้วย bcrypt
 * - Brute Force Protection (ล็อค 5 นาทีหลัง login ผิด 5 ครั้ง)
 * - JWT Token-based Session
 * - Audit Logging
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const { username, password } = await req.json()
    const ip = getClientIP(req.headers)
    const userAgent = req.headers.get('user-agent') || undefined

    // ตรวจสอบว่า IP ถูกล็อคหรือเปล่า
    if (isIPLocked(ip)) {
      const lockStatus = getLockStatus(ip)
      const remainingMinutes = Math.ceil((lockStatus.remainingTime || 0) / 60000)

      // บันทึก Audit Log
      logAudit({ ip, username: username || 'unknown', success: false, userAgent })

      return NextResponse.json({
        success: false,
        message: `🔒 IP ถูกล็อคชั่วคราว`,
        locked: true,
        remainingMinutes,
        hint: `ลอง login ผิดเกินจำนวนที่กำหนด กรุณารออีก ${remainingMinutes} นาที`
      }, { status: 429 }) // 429 Too Many Requests
    }

    // ตรวจสอบว่ามี Environment Variables หรือเปล่า
    const hasCredentials = process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD
    if (!hasCredentials) {
      return NextResponse.json({
        success: false,
        message: '⚠️ ระบบยังไม่ได้กำหนดรหัส Admin',
        hint: 'ตั้งค่า ADMIN_USERNAME และ ADMIN_PASSWORD ใน Environment Variables'
      }, { status: 500 })
    }

    // ตรวจสอบข้อมูล Admin
    const isValid = await verifyAdminCredentials(username, password)

    if (isValid) {
      // ล้างข้อมูลการ login ผิด
      clearFailedAttempts(ip)

      // สร้าง JWT Token
      const token = generateToken(username)

      // บันทึก Audit Log
      logAudit({ ip, username, success: true, userAgent })

      const responseTime = Date.now() - startTime

      return NextResponse.json({
        success: true,
        message: '✓ เข้าสู่ระบบสำเร็จ',
        token,
        user: {
          username,
          role: 'admin'
        },
        meta: {
          loginTime: new Date().toISOString(),
          responseTime: `${responseTime}ms`
        }
      })
    } else {
      // บันทึกการ login ผิด
      const result = recordFailedLogin(ip)

      // บันทึก Audit Log
      logAudit({ ip, username, success: false, userAgent })

      if (result.locked) {
        const lockMinutes = Math.ceil((result.lockDuration || 0) / 60000)
        return NextResponse.json({
          success: false,
          message: '🔒 ข้อมูลไม่ถูกต้อง - IP ถูกล็อค',
          locked: true,
          lockDuration: lockMinutes,
          hint: `ลอง login ผิดเกินจำนวนที่กำหนด ระบบล็อค IP เป็นเวลา ${lockMinutes} นาที`
        }, { status: 429 })
      }

      return NextResponse.json({
        success: false,
        message: '✕ ข้อมูลไม่ถูกต้อง',
        remainingAttempts: result.remainingAttempts,
        hint: result.remainingAttempts === 1
          ? '⚠️ เหลือโอกาสอีก 1 ครั้ง หลังจากนั้น IP จะถูกล็อค 5 นาที'
          : `เหลืออีก ${result.remainingAttempts} ครั้ง`
      }, { status: 401 })
    }
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({
      success: false,
      message: '💥 เกิดข้อผิดพลาดของระบบ',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
