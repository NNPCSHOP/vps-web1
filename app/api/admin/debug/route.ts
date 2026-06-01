import { NextResponse } from 'next/server'

/**
 * API สำหรับเช็คว่า Environment Variables โหลดหรือเปล่า
 * ⚠️ ใช้เฉพาะตอน Development เท่านั้น!
 */
export async function GET() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD

  return NextResponse.json({
    hasUsername: !!username,
    hasPassword: !!password,
    usernameLength: username?.length || 0,
    passwordLength: password?.length || 0,
    // แสดง 3 ตัวแรกและ 3 ตัวท้าย (เพื่อความปลอดภัย)
    usernamePreview: username ? `${username.substring(0, 3)}...${username.substring(username.length - 3)}` : 'ไม่มี',
    passwordPreview: password ? `${password.substring(0, 3)}...${password.substring(password.length - 3)}` : 'ไม่มี',
    env: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(k => k.startsWith('ADMIN')),
  })
}
