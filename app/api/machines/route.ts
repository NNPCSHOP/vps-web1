import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { type Machine } from '@/lib/data'

/**
 * API สำหรับจัดการข้อมูลเครื่อง
 * ใช้ Neon Postgres Database
 */

/**
 * GET - ดึงข้อมูลเครื่องทั้งหมด
 */
export async function GET() {
  try {
    const machines = await prisma.machine.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ machines })
  } catch (error) {
    console.error('Error fetching machines:', error)
    return NextResponse.json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลได้'
    }, { status: 500 })
  }
}

/**
 * POST - เพิ่มเครื่องใหม่
 */
export async function POST(req: NextRequest) {
  try {
    const data: Omit<Machine, 'id'> = await req.json()

    // ตรวจสอบว่ามีชื่อเครื่องซ้ำไหม
    const existing = await prisma.machine.findUnique({
      where: { name: data.name }
    })

    if (existing) {
      return NextResponse.json({
        success: false,
        message: 'ชื่อเครื่องซ้ำ'
      }, { status: 400 })
    }

    const newMachine = await prisma.machine.create({
      data: {
        name: data.name,
        status: data.status,
        user: data.user,
        ip: data.ip,
        mac: data.mac,
        sshPort: data.sshPort,
        sshUser: data.sshUser,
        sshPass: data.sshPass,
        priceWeekly: data.priceWeekly,
        priceMonthly: data.priceMonthly,
        rentedAt: data.rentedAt,
        expiresAt: data.expiresAt,
        specCPU: data.specCPU,
        specGPU: data.specGPU,
        specRAM: data.specRAM,
        specSSD: data.specSSD,
        anydeskId: data.anydeskId,
        anydeskPass: data.anydeskPass,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'เพิ่มเครื่องสำเร็จ',
      machine: newMachine
    })
  } catch (error) {
    console.error('Error creating machine:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 })
  }
}
