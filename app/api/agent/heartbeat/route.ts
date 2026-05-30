import { NextRequest, NextResponse } from 'next/server'
import { agentStore } from '@/lib/store'

/**
 * API รับ heartbeat จากเครื่องลูกค้า
 * เครื่องลูกค้าจะส่งข้อมูลมาทุก 5 วินาที
 */

/**
 * POST - รับ heartbeat จากเครื่องลูกค้า
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    // บันทึก heartbeat
    agentStore.register({
      machineId: data.machineId,
      name: data.name,
      ip: data.ip,
      anydeskId: data.anydeskId,
      lastSeen: Date.now()
    })

    return NextResponse.json({
      success: true,
      message: 'Heartbeat received'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Invalid data'
    }, { status: 400 })
  }
}
