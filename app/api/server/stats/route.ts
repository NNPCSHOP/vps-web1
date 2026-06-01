import { NextResponse } from 'next/server'
import os from 'os'
import si from 'systeminformation'

/**
 * 📊 API สำหรับดึงสถานะเครื่องแม่ (Server Stats)
 * - CPU Usage
 * - RAM Usage
 * - GPU Usage (VGA)
 * - VRAM Usage
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

    // GPU & VRAM Usage
    let gpuData: {
      gpuName: string
      gpuUsage: number
      vramUsed: number
      vramTotal: number
      vramPercent: number
      temperature?: number
    } | null = null

    try {
      const graphics = await si.graphics()
      if (graphics.controllers && graphics.controllers.length > 0) {
        const gpu = graphics.controllers[0]

        // ดึงข้อมูล GPU Load
        const gpuLoad = await si.currentLoad()

        gpuData = {
          gpuName: gpu.model || 'Unknown GPU',
          gpuUsage: Math.round(gpuLoad.currentLoad || 0),
          vramUsed: gpu.memoryUsed || 0,
          vramTotal: gpu.vram || 0,
          vramPercent: gpu.vram && gpu.memoryUsed
            ? Math.round((gpu.memoryUsed / gpu.vram) * 100)
            : 0,
          temperature: gpu.temperatureGpu
        }
      }
    } catch (gpuError) {
      console.warn('GPU info not available:', gpuError)
      // ไม่ throw error เพื่อให้ส่วนอื่นทำงานต่อได้
    }

    // Power Consumption & Battery
    let powerData: {
      powerConsumption: number // Watt
      hasBattery: boolean
      batteryPercent?: number
      isCharging?: boolean
      acConnected: boolean
    } | null = null

    try {
      const battery = await si.battery()
      const currentLoad = await si.currentLoad()

      // คำนวณการใช้ไฟประมาณการ (Watt)
      // สูตรคร่าวๆ: Base TDP + (CPU Load * CPU TDP) + (GPU Load * GPU TDP)
      const basePower = 50 // Idle power ~50W
      const cpuPower = (currentLoad.currentLoad / 100) * 65 // CPU TDP ~65W
      const gpuPower = gpuData ? (gpuData.gpuUsage / 100) * 120 : 0 // GPU TDP ~120W
      const estimatedPower = Math.round(basePower + cpuPower + gpuPower)

      powerData = {
        powerConsumption: estimatedPower,
        hasBattery: battery.hasBattery,
        batteryPercent: battery.hasBattery ? battery.percent : undefined,
        isCharging: battery.hasBattery ? battery.isCharging : undefined,
        acConnected: battery.hasBattery ? battery.acConnected : true
      }
    } catch (powerError) {
      console.warn('Power info not available:', powerError)
    }

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
        gpu: gpuData,
        power: powerData,
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
