/**
 * 🗄️ Prisma Client Instance
 * ใช้สำหรับเชื่อมต่อ Database (Singleton Pattern)
 * Neon Serverless Adapter
 */

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

// ป้องกันการสร้าง Instance ซ้ำใน Development (Hot Reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables')
    }

    // PrismaNeon รับ PoolConfig object
    const adapter = new PrismaNeon({
      connectionString: databaseUrl
    })

    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }

  return globalForPrisma.prisma
}

// Export แบบ lazy - ไม่สร้าง client จนกว่าจะถูกเรียกใช้
let _prismaInstance: PrismaClient | undefined

export function getPrisma(): PrismaClient {
  if (!_prismaInstance) {
    _prismaInstance = getPrismaClient()
  }
  return _prismaInstance
}

// สำหรับ compatibility กับโค้ดเดิม
export const prisma = new Proxy({} as PrismaClient, {
  get: (_, prop) => {
    return (getPrisma() as any)[prop]
  }
})

export default prisma
