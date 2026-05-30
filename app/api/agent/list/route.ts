// ดึงรายชื่อ agent ทั้งหมดที่ลงทะเบียน (สำหรับ admin panel)
import { NextResponse } from 'next/server'
import { agentStore } from '@/lib/store'

export async function GET() {
  const agents = agentStore.getAll()
  return NextResponse.json({ agents })
}
