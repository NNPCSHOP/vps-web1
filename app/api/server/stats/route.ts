import { NextResponse } from 'next/server'
import os from 'os'

/**
 * 📊 API สำหรับดึงสถานะเครื่องแม่ (Server Stats)
 * - CPU Usage
 * - RAM Usage
 * - Uptime
 * - Network Info
 */
export async function GET() {
  try {
    // CPU Usage
    const cpus = os.cpus()
    let totalIdle = 0
    let totalTick = 0

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times]
      }
      totalIdle += cpu.times.idle
    })

    const cpuUsage = Math.round(100 - (100 * totalIdle / totalTick))

    // RAM Usage
    const totalRAM = os.totalmem()
    const freeRAM = os.freemem()
    const usedRAM = totalRAM - freeRAM
    const ramPercent = Math.round((usedRAM / totalRAM) * 100)

    // Uptime
    const uptimeSeconds = os.uptime()
    const uptimeFormatted = formatUptime(uptimeSeconds)

    // System Info
    const platform = os.platform()
    const hostname = os.hostname()
    const arch = os.arch()

    return NextResponse.json({
      success: true,
      stats: {
        cpu: cpuUsage,
        ramUsed: parseFloat((usedRAM / (1024 ** 3)).toFixed(2)),
        ramTotal: parseFloat((totalRAM / (1024 ** 3)).toFixed(2)),
        ramPercent,
        uptime: uptimeFormatted,
        platform,
        hostname,
        arch,
        timestamp: Date.now()
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * แปลง uptime (วินาที) เป็นรูปแบบที่อ่านง่าย
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}
