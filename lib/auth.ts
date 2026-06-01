/**
 * ระบบรักษาความปลอดภัยสำหรับ Admin Panel
 * - เข้ารหัส Password ด้วย bcrypt
 * - JWT Token สำหรับ Session
 * - Rate Limiting & Brute Force Protection
 * - Audit Logging
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// ==========================
// ⚙️ CONFIGURATION
// ==========================

const JWT_SECRET = process.env.JWT_SECRET || 'vps-ultra-secure-secret-2026-change-me'
const JWT_EXPIRES_IN = '8h' // Session หมดอายุใน 8 ชั่วโมง
const MAX_LOGIN_ATTEMPTS = 5 // จำนวนครั้งที่ login ผิดได้
const LOCKOUT_DURATION = 5 * 60 * 1000 // ล็อค IP เป็นเวลา 5 นาที

// ==========================
// 📊 IN-MEMORY STORE
// ==========================

interface LoginAttempt {
  count: number
  lastAttempt: number
  lockedUntil?: number
}

interface AuditLog {
  timestamp: number
  ip: string
  username: string
  success: boolean
  userAgent?: string
}

// เก็บข้อมูลการ login ผิดแต่ละ IP (In-Memory - จะหายเมื่อ restart server)
const loginAttempts = new Map<string, LoginAttempt>()

// เก็บ Audit Logs (ล่าสุด 100 รายการ)
const auditLogs: AuditLog[] = []

// ==========================
// 🔐 PASSWORD HASHING
// ==========================

/**
 * เข้ารหัสรหัสผ่านด้วย bcrypt
 * @param password รหัสผ่านที่ต้องการเข้ารหัส
 * @returns รหัสผ่านที่เข้ารหัสแล้ว
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12) // ความแข็งแกร่ง 12 rounds
  return bcrypt.hash(password, salt)
}

/**
 * ตรวจสอบรหัสผ่าน
 * @param password รหัสผ่านที่กรอก
 * @param hashedPassword รหัสผ่านที่เข้ารหัสแล้ว
 * @returns true ถ้าตรงกัน
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// ==========================
// 🎫 JWT TOKEN
// ==========================

interface TokenPayload {
  username: string
  role: 'admin'
  iat?: number
  exp?: number
}

/**
 * สร้าง JWT Token
 */
export function generateToken(username: string): string {
  const payload: TokenPayload = {
    username,
    role: 'admin'
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * ตรวจสอบ JWT Token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

// ==========================
// 🛡️ BRUTE FORCE PROTECTION
// ==========================

/**
 * เช็คว่า IP นี้ถูกล็อคหรือเปล่า
 */
export function isIPLocked(ip: string): boolean {
  const attempt = loginAttempts.get(ip)
  if (!attempt) return false

  // เช็คว่ายังถูกล็อคอยู่หรือเปล่า
  if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
    return true
  }

  // ถ้าหมดเวลาล็อคแล้ว ให้รีเซ็ต
  if (attempt.lockedUntil && Date.now() >= attempt.lockedUntil) {
    loginAttempts.delete(ip)
    return false
  }

  return false
}

/**
 * บันทึกการ login ผิด
 */
export function recordFailedLogin(ip: string): { locked: boolean; remainingAttempts: number; lockDuration?: number } {
  const now = Date.now()
  const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: now }

  // เพิ่มจำนวนครั้งที่ login ผิด
  attempt.count += 1
  attempt.lastAttempt = now

  // ถ้าเกินจำนวนที่กำหนด ให้ล็อค
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = now + LOCKOUT_DURATION
    loginAttempts.set(ip, attempt)
    return {
      locked: true,
      remainingAttempts: 0,
      lockDuration: LOCKOUT_DURATION
    }
  }

  loginAttempts.set(ip, attempt)
  return {
    locked: false,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - attempt.count
  }
}

/**
 * ล้างข้อมูลการ login ผิดเมื่อ login สำเร็จ
 */
export function clearFailedAttempts(ip: string): void {
  loginAttempts.delete(ip)
}

/**
 * ดึงข้อมูล lock status
 */
export function getLockStatus(ip: string): { locked: boolean; remainingTime?: number; attempts?: number } {
  const attempt = loginAttempts.get(ip)
  if (!attempt) return { locked: false }

  if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
    return {
      locked: true,
      remainingTime: attempt.lockedUntil - Date.now(),
      attempts: attempt.count
    }
  }

  return {
    locked: false,
    attempts: attempt.count
  }
}

// ==========================
// 📝 AUDIT LOGGING
// ==========================

/**
 * บันทึก Audit Log
 */
export function logAudit(params: {
  ip: string
  username: string
  success: boolean
  userAgent?: string
}): void {
  auditLogs.push({
    timestamp: Date.now(),
    ip: params.ip,
    username: params.username,
    success: params.success,
    userAgent: params.userAgent
  })

  // เก็บไว้แค่ 100 รายการล่าสุด
  if (auditLogs.length > 100) {
    auditLogs.shift()
  }
}

/**
 * ดึง Audit Logs
 */
export function getAuditLogs(limit = 50): AuditLog[] {
  return auditLogs.slice(-limit).reverse()
}

// ==========================
// 🔑 ADMIN CREDENTIAL VERIFICATION
// ==========================

/**
 * ตรวจสอบข้อมูล Admin (รองรับทั้ง Plain Text และ Hashed)
 */
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    throw new Error('Admin credentials not configured')
  }

  // เช็ค username
  if (username.trim() !== ADMIN_USERNAME.trim()) {
    return false
  }

  // เช็ค password
  // ถ้า ADMIN_PASSWORD ขึ้นต้นด้วย $2a$ หรือ $2b$ แสดงว่าเป็น bcrypt hash
  if (ADMIN_PASSWORD.startsWith('$2a$') || ADMIN_PASSWORD.startsWith('$2b$')) {
    return verifyPassword(password, ADMIN_PASSWORD)
  } else {
    // ถ้าเป็น plain text (backward compatible)
    return password.trim() === ADMIN_PASSWORD.trim()
  }
}

// ==========================
// 🛠️ UTILITY FUNCTIONS
// ==========================

/**
 * ดึง IP Address จาก Request
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * สร้าง Hashed Password สำหรับไปตั้งใน Environment Variable
 * (ใช้ครั้งเดียวตอนตั้งค่าระบบ)
 */
export async function generateHashedPassword(plainPassword: string): Promise<void> {
  const hashed = await hashPassword(plainPassword)
  console.log('\n🔐 Hashed Password (ใช้ค่านี้ไปตั้งใน ADMIN_PASSWORD):')
  console.log(hashed)
  console.log('\nตัวอย่าง .env.local:')
  console.log(`ADMIN_PASSWORD=${hashed}\n`)
}
