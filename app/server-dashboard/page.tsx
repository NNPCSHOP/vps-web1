'use client'

/**
 * 🖥️ Server Dashboard - หน้า Monitor สำหรับเครื่องแม่
 * แสดงสถานะเครื่องทั้งหมด, Monitor ระบบ, จัดการเครื่องลูก
 */

import { useState, useEffect } from 'react'

interface ServerStats {
  cpu: number
  ramUsed: number
  ramTotal: number
  ramPercent: number
  uptime: string
  timestamp: number
  gpu?: {
    gpuName: string
    gpuUsage: number
    vramUsed: number
    vramTotal: number
    vramPercent: number
    temperature?: number
  }
  power?: {
    powerConsumption: number
    hasBattery: boolean
    batteryPercent?: number
    isCharging?: boolean
    acConnected: boolean
  }
}

interface MachineStatus {
  id: string
  name: string
  ip: string
  status: 'online' | 'offline'
  cpu?: number
  ram?: number
  lastSeen?: number
  anydeskId?: string
}

export default function ServerDashboardPage() {
  const [serverStats, setServerStats] = useState<ServerStats | null>(null)
  const [machines, setMachines] = useState<MachineStatus[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  // อัพเดทเวลาทุกวินาที
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // โหลดสถานะเครื่องแม่
  useEffect(() => {
    async function loadServerStats() {
      try {
        const res = await fetch('/api/server/stats')
        const data = await res.json()
        if (data.success) {
          setServerStats(data.stats)
        }
      } catch (error) {
        console.error('Failed to load server stats:', error)
      }
    }

    loadServerStats()
    const interval = setInterval(loadServerStats, 2000) // อัพเดททุก 2 วินาที
    return () => clearInterval(interval)
  }, [])

  // โหลดสถานะเครื่องลูก
  useEffect(() => {
    async function loadMachines() {
      try {
        const res = await fetch('/api/agent/list')
        const data = await res.json()
        if (data.agents) {
          setMachines(data.agents.map((a: any) => ({
            id: a.machineId,
            name: a.name,
            ip: a.ip,
            status: a.online ? 'online' : 'offline',
            cpu: a.cpu,
            ram: a.ramPercent,
            lastSeen: a.lastSeen,
            anydeskId: a.anydeskId
          })))
        }
      } catch (error) {
        console.error('Failed to load machines:', error)
      }
    }

    loadMachines()
    const interval = setInterval(loadMachines, 5000) // อัพเดททุก 5 วินาที
    return () => clearInterval(interval)
  }, [])

  const onlineCount = machines.filter(m => m.status === 'online').length
  const offlineCount = machines.filter(m => m.status === 'offline').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">

      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-xl">
                🖥️
              </div>
              <div>
                <h1 className="text-2xl font-black">NNVPS Server Dashboard</h1>
                <p className="text-sm text-gray-400">เครื่องแม่ - Monitor & Control</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-green-400">
                {currentTime.toLocaleTimeString('th-TH')}
              </div>
              <div className="text-xs text-gray-400">
                {currentTime.toLocaleDateString('th-TH', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Server Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* CPU */}
          <StatCard
            icon="⚡"
            label="CPU Usage"
            value={serverStats?.cpu ? `${serverStats.cpu}%` : '—'}
            color={getColorByCPU(serverStats?.cpu || 0)}
            loading={!serverStats}
          />

          {/* RAM */}
          <StatCard
            icon="💾"
            label="RAM Usage"
            value={serverStats?.ramPercent ? `${serverStats.ramPercent}%` : '—'}
            subValue={serverStats ? `${serverStats.ramUsed}/${serverStats.ramTotal} GB` : undefined}
            color={getColorByRAM(serverStats?.ramPercent || 0)}
            loading={!serverStats}
          />

          {/* GPU */}
          {serverStats?.gpu && (
            <StatCard
              icon="🎮"
              label="GPU Usage"
              value={`${serverStats.gpu.gpuUsage}%`}
              subValue={serverStats.gpu.gpuName}
              color={getColorByCPU(serverStats.gpu.gpuUsage)}
              loading={!serverStats}
            />
          )}

          {/* VRAM */}
          {serverStats?.gpu && serverStats.gpu.vramTotal > 0 && (
            <StatCard
              icon="🎨"
              label="VRAM Usage"
              value={`${serverStats.gpu.vramPercent}%`}
              subValue={`${(serverStats.gpu.vramUsed / 1024).toFixed(1)}/${(serverStats.gpu.vramTotal / 1024).toFixed(1)} GB`}
              color={getColorByRAM(serverStats.gpu.vramPercent)}
              loading={!serverStats}
            />
          )}

          {/* Power Consumption */}
          {serverStats?.power && (
            <StatCard
              icon="🔌"
              label="Power (Watt)"
              value={`${serverStats.power.powerConsumption}W`}
              subValue="ประมาณการ"
              color={getColorByPower(serverStats.power.powerConsumption)}
              loading={!serverStats}
            />
          )}

          {/* Uptime */}
          <StatCard
            icon="⏱️"
            label="Server Uptime"
            value={serverStats?.uptime || '—'}
            color="text-purple-400"
            loading={!serverStats}
          />

          {/* Machines */}
          <StatCard
            icon="🖥️"
            label="เครื่องลูก"
            value={`${onlineCount}/${machines.length}`}
            subValue={`Online: ${onlineCount} | Offline: ${offlineCount}`}
            color="text-blue-400"
          />
        </div>

        {/* Machines Grid */}
        <div>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span>💻</span> เครื่องลูกทั้งหมด
          </h2>

          {machines.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <div className="text-gray-400 font-bold">ไม่พบเครื่องลูก</div>
              <div className="text-gray-600 text-sm mt-2">ติดตั้ง Agent บนเครื่องลูกเพื่อเชื่อมต่อ</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {machines.map(machine => (
                <MachineCard key={machine.id} machine={machine} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span>⚡</span> Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ActionButton
              icon="📊"
              label="Admin Panel"
              href="/admin"
            />
            <ActionButton
              icon="🏠"
              label="หน้าร้าน"
              href="/"
            />
            <ActionButton
              icon="🔄"
              label="Refresh"
              onClick={() => window.location.reload()}
            />
            <ActionButton
              icon="📝"
              label="Logs"
              href="/admin"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ========================================
// COMPONENTS
// ========================================

function StatCard({
  icon,
  label,
  value,
  subValue,
  color = 'text-green-400',
  loading = false
}: {
  icon: string
  label: string
  value: string
  subValue?: string
  color?: string
  loading?: boolean
}) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        {loading && (
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        )}
      </div>
      <div className={`text-3xl font-black ${color} mb-1`}>
        {loading ? '...' : value}
      </div>
      <div className="text-xs text-gray-400 font-bold">{label}</div>
      {subValue && (
        <div className="text-[10px] text-gray-500 mt-1">{subValue}</div>
      )}
    </div>
  )
}

function MachineCard({ machine }: { machine: MachineStatus }) {
  const isOnline = machine.status === 'online'
  const lastSeenText = machine.lastSeen
    ? formatTimeSince(machine.lastSeen)
    : '—'

  return (
    <div className={`bg-white/5 backdrop-blur-md border rounded-2xl p-4 transition-all ${
      isOnline
        ? 'border-green-500/30 hover:bg-white/10'
        : 'border-white/10 opacity-60'
    }`}>
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 text-xs font-bold px-2.5 py-1 rounded-full ${
          isOnline
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
          }`} />
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Machine Info */}
      <div className="mb-3">
        <div className="text-white font-black text-lg mb-1">{machine.name}</div>
        <div className="text-gray-400 text-xs font-mono">{machine.ip}</div>
        {machine.anydeskId && (
          <div className="text-orange-400 text-xs font-mono mt-1">
            🖥️ {machine.anydeskId}
          </div>
        )}
      </div>

      {/* Stats */}
      {isOnline && (machine.cpu !== undefined || machine.ram !== undefined) && (
        <div className="space-y-2 mb-3">
          {machine.cpu !== undefined && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-400">CPU</span>
                <span className={`font-bold ${getColorByCPU(machine.cpu)}`}>
                  {machine.cpu}%
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getColorByCPUBg(machine.cpu)}`}
                  style={{ width: `${machine.cpu}%` }}
                />
              </div>
            </div>
          )}

          {machine.ram !== undefined && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-400">RAM</span>
                <span className={`font-bold ${getColorByRAM(machine.ram)}`}>
                  {machine.ram}%
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getColorByRAMBg(machine.ram)}`}
                  style={{ width: `${machine.ram}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Last Seen */}
      <div className="text-[10px] text-gray-500 border-t border-white/5 pt-2">
        Last seen: {lastSeenText}
      </div>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  href,
  onClick
}: {
  icon: string
  label: string
  href?: string
  onClick?: () => void
}) {
  const className = "bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer flex flex-col items-center gap-2"

  const content = (
    <>
      <span className="text-3xl">{icon}</span>
      <span className="text-xs font-bold text-gray-300">{label}</span>
    </>
  )

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  )
}

// ========================================
// UTILITIES
// ========================================

function getColorByCPU(cpu: number): string {
  if (cpu >= 90) return 'text-red-400'
  if (cpu >= 70) return 'text-orange-400'
  if (cpu >= 50) return 'text-yellow-400'
  return 'text-green-400'
}

function getColorByCPUBg(cpu: number): string {
  if (cpu >= 90) return 'bg-red-500'
  if (cpu >= 70) return 'bg-orange-500'
  if (cpu >= 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

function getColorByRAM(ram: number): string {
  if (ram >= 90) return 'text-red-400'
  if (ram >= 75) return 'text-orange-400'
  if (ram >= 60) return 'text-yellow-400'
  return 'text-blue-400'
}

function getColorByRAMBg(ram: number): string {
  if (ram >= 90) return 'bg-red-500'
  if (ram >= 75) return 'bg-orange-500'
  if (ram >= 60) return 'bg-yellow-500'
  return 'bg-blue-500'
}

function getColorByPower(watts: number): string {
  if (watts >= 400) return 'text-red-400'      // มากเกินไป
  if (watts >= 300) return 'text-orange-400'   // สูง
  if (watts >= 200) return 'text-yellow-400'   // ปานกลาง
  return 'text-green-400'                       // ปกติ
}

function formatTimeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return `${seconds} วินาทีที่แล้ว`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชั่วโมงที่แล้ว`
  return `${Math.floor(seconds / 86400)} วันที่แล้ว`
}
