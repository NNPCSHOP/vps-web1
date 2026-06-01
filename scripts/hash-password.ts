/**
 * สคริปต์สำหรับเข้ารหัสรหัสผ่าน Admin
 * รันด้วย: npx tsx scripts/hash-password.ts
 */

import { hashPassword } from '../lib/auth'

async function main() {
  console.log('\n🔐 ===== ADMIN PASSWORD HASH GENERATOR =====\n')

  // รหัสผ่านที่ต้องการเข้ารหัส
  const plainPassword = process.argv[2] || 'NO02071993' // ค่า default

  if (!process.argv[2]) {
    console.log('⚠️  ไม่ได้ระบุรหัสผ่าน จะใช้ค่า default: NO02071993')
    console.log('💡 วิธีใช้: npx tsx scripts/hash-password.ts [รหัสผ่านของคุณ]\n')
  }

  console.log(`📝 รหัสผ่านต้นฉบับ: ${plainPassword}`)
  console.log(`📏 ความยาว: ${plainPassword.length} ตัวอักษร\n`)

  console.log('⏳ กำลังเข้ารหัส...\n')

  const hashed = await hashPassword(plainPassword)

  console.log('✅ เข้ารหัสเสร็จแล้ว!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔑 HASHED PASSWORD (นำไปตั้งใน Vercel):')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log(hashed)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('📋 วิธีตั้งค่าบน Vercel:')
  console.log('1. ไปที่ Settings → Environment Variables')
  console.log('2. เพิ่มตัวแปร 2 ตัว:\n')
  console.log('   Key: ADMIN_USERNAME')
  console.log('   Value: NO02072536\n')
  console.log('   Key: ADMIN_PASSWORD')
  console.log(`   Value: ${hashed}\n`)
  console.log('3. เลือก Environment: Production, Preview, Development (ทั้งหมด)')
  console.log('4. กด Save')
  console.log('5. Redeploy โปรเจค\n')

  console.log('💾 สำหรับ Local Development (.env.local):')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('ADMIN_USERNAME=NO02072536')
  console.log(`ADMIN_PASSWORD=${hashed}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main().catch(console.error)
