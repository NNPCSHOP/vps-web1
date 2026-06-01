/**
 * 🌱 Seed Database - นำข้อมูลเดิมจาก lib/data.ts เข้า Database
 * วิธีรัน: npx tsx scripts/seed-database.ts
 */

// ⚠️ IMPORTANT: โหลด .env.local ก่อนทุกอย่าง
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// ตอนนี้ค่อย import prisma (DATABASE_URL โหลดแล้ว)
import { prisma } from '../lib/prisma'
import { INIT_MACHINES, INIT_USERS, INIT_PAYMENTS } from '../lib/data'

async function main() {
  console.log('🌱 เริ่มต้น Seed Database...')

  // ลบข้อมูลเก่าทั้งหมด (ถ้ามี)
  console.log('🗑️  ลบข้อมูลเก่า...')
  await prisma.payment.deleteMany()
  await prisma.user.deleteMany()
  await prisma.machine.deleteMany()

  // เพิ่มเครื่อง (Machines)
  console.log('💻 เพิ่มข้อมูลเครื่อง...')
  for (const machine of INIT_MACHINES) {
    await prisma.machine.create({
      data: {
        id: machine.id,
        name: machine.name,
        status: machine.status,
        user: machine.user,
        ip: machine.ip,
        mac: machine.mac || '',
        sshPort: machine.sshPort,
        sshUser: machine.sshUser,
        sshPass: machine.sshPass,
        priceWeekly: machine.priceWeekly,
        priceMonthly: machine.priceMonthly,
        rentedAt: machine.rentedAt,
        expiresAt: machine.expiresAt,
        specCPU: machine.specCPU,
        specGPU: machine.specGPU,
        specRAM: machine.specRAM,
        specSSD: machine.specSSD,
        anydeskId: machine.anydeskId,
        anydeskPass: machine.anydeskPass,
      }
    })
  }
  console.log(`✅ เพิ่มเครื่อง ${INIT_MACHINES.length} เครื่อง`)

  // เพิ่มผู้ใช้ (Users)
  console.log('👤 เพิ่มข้อมูลผู้ใช้...')
  for (const user of INIT_USERS) {
    await prisma.user.create({
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
        balance: user.balance,
        totalSpent: user.totalSpent,
        registeredAt: user.registeredAt,
        status: user.status,
        rentingMachine: user.rentingMachine,
      }
    })
  }
  console.log(`✅ เพิ่มผู้ใช้ ${INIT_USERS.length} คน`)

  // เพิ่มการชำระเงิน (Payments)
  console.log('💰 เพิ่มประวัติการชำระเงิน...')
  for (const payment of INIT_PAYMENTS) {
    await prisma.payment.create({
      data: {
        id: payment.id,
        username: payment.username,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        createdAt: payment.createdAt,
        note: payment.note,
      }
    })
  }
  console.log(`✅ เพิ่มการชำระเงิน ${INIT_PAYMENTS.length} รายการ`)

  console.log('\n🎉 Seed Database สำเร็จ!')
}

main()
  .catch((e) => {
    console.error('❌ เกิดข้อผิดพลาด:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
