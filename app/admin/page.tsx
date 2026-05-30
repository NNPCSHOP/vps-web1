'use client'

// ระบบหลังบ้าน NNVPS Admin Panel — รองรับ SSH + Agent + AnyDesk
import { useState, useEffect } from 'react'

/* ─── TYPES ─── */
type MachineStatus = 'active' | 'available' | 'stopped' | 'maintenance'
type AdminTab      = 'dashboard' | 'machines' | 'agents' | 'users' | 'payments'
type PayStatus     = 'pending' | 'approved' | 'rejected'

interface AgentInfo {
  machineId: string; name: string; ip: string
  anydeskId: string; lastSeen: number; online: boolean
}

interface Machine {
  id: string; name: string; status: MachineStatus
  user?: string; ip: string; mac?: string
  sshPort: number; sshUser: string; sshPass: string
  priceWeekly: number; priceMonthly: number
  rentedAt?: string; expiresAt?: string
  specCPU: string; specGPU: string; specRAM: string; specSSD: string
  anydeskId?: string
}

interface MachineStats {
  cpu?: number; ram?: number
  ramUsed?: number; ramTotal?: number
  uptime?: string; loading?: boolean; error?: string
}

interface User {
  id: string; username: string; email: string
  password: string
  balance: number; totalSpent: number
  registeredAt: string; status: 'active' | 'banned'
  rentingMachine?: string
}

interface Payment {
  id: string; username: string
  amount: number; method: string
  status: PayStatus; createdAt: string; note?: string
}

/* ─── MOCK DATA ─── */
const DEFAULT_SPEC = {
  specCPU: 'Dual Xeon E5-2686 V4 36/72',
  specGPU: 'RTX 3060 12GB',
  specRAM: '128 GB',
  specSSD: '1TB NVMe',
}

const INIT_MACHINES: Machine[] = [
  { id: 'm1', name: 'VPS-01', status: 'active',   user: 'somchai99', ip: '192.168.1.150', mac: '', sshPort: 22, sshUser: 'admin', sshPass: '', priceWeekly: 800, priceMonthly: 2800, rentedAt: '2026-05-22', expiresAt: '2026-05-29', ...DEFAULT_SPEC },
  { id: 'm2', name: 'VPS-02', status: 'active',   user: 'narin_x',   ip: '192.168.1.151', mac: '', sshPort: 22, sshUser: 'admin', sshPass: '', priceWeekly: 800, priceMonthly: 2800, rentedAt: '2026-05-26', expiresAt: '2026-06-02', ...DEFAULT_SPEC },
  { id: 'm3', name: 'VPS-03', status: 'available',                   ip: '192.168.1.152', mac: '', sshPort: 22, sshUser: 'admin', sshPass: '', priceWeekly: 800, priceMonthly: 2800, ...DEFAULT_SPEC },
  { id: 'm4', name: 'VPS-04', status: 'stopped',                     ip: '192.168.1.153', mac: '', sshPort: 22, sshUser: 'admin', sshPass: '', priceWeekly: 800, priceMonthly: 2800, ...DEFAULT_SPEC },
]

const INIT_USERS: User[] = [
  { id: 'u1', username: 'somchai99', email: 'somchai@gmail.com', password: 'pass1234', balance: 1200, totalSpent: 4800, registeredAt: '2026-03-10', status: 'active', rentingMachine: 'VPS-01' },
  { id: 'u2', username: 'narin_x',   email: 'narin@hotmail.com', password: 'narin999', balance: 500,  totalSpent: 2800, registeredAt: '2026-04-01', status: 'active', rentingMachine: 'VPS-02' },
  { id: 'u3', username: 'ploy2025',  email: 'ploy@gmail.com',    password: 'ploy2025', balance: 0,    totalSpent: 800,  registeredAt: '2026-05-15', status: 'active' },
  { id: 'u4', username: 'teeray_r',  email: 'tee@gmail.com',     password: 'tee1234',  balance: 300,  totalSpent: 1600, registeredAt: '2026-04-20', status: 'banned' },
]

const INIT_PAYMENTS: Payment[] = [
  { id: 'p1', username: 'ploy2025',  amount: 800,  method: 'PromptPay', status: 'pending',  createdAt: '2026-05-30 14:32' },
  { id: 'p2', username: 'somchai99', amount: 500,  method: 'PromptPay', status: 'pending',  createdAt: '2026-05-30 11:05' },
  { id: 'p3', username: 'narin_x',   amount: 2800, method: 'PromptPay', status: 'approved', createdAt: '2026-05-29 09:18', note: 'อนุมัติแล้ว' },
  { id: 'p4', username: 'teeray_r',  amount: 100,  method: 'PromptPay', status: 'rejected', createdAt: '2026-05-28 20:44', note: 'สลิปปลอม' },
]

const M_STATUS: Record<MachineStatus, { label: string; color: string; bg: string }> = {
  active:      { label: 'ไม่ว่าง',   color: 'text-yellow-400', bg: 'bg-yellow-400/15 border-yellow-700/30' },
  available:   { label: 'ว่าง',      color: 'text-green-400',  bg: 'bg-green-400/15  border-green-700/30'  },
  stopped:     { label: 'ปิด',       color: 'text-gray-400',   bg: 'bg-gray-400/10   border-gray-700/30'   },
  maintenance: { label: 'ซ่อมบำรุง', color: 'text-blue-400',   bg: 'bg-blue-400/15   border-blue-700/30'   },
}

const P_STATUS: Record<PayStatus, { label: string; color: string; bg: string }> = {
  pending:  { label: 'รอตรวจ',  color: 'text-yellow-400', bg: 'bg-yellow-400/15 border-yellow-700/30' },
  approved: { label: 'อนุมัติ', color: 'text-green-400',  bg: 'bg-green-400/15  border-green-700/30'  },
  rejected: { label: 'ปฏิเสธ', color: 'text-red-400',    bg: 'bg-red-400/15    border-red-700/30'    },
}

/* ─── BLANK FORM ─── */
const BLANK_FORM = (): Omit<Machine, 'id'> => ({
  name: '', ip: '', mac: '', sshPort: 22, sshUser: 'root', sshPass: '',
  status: 'available', priceWeekly: 800, priceMonthly: 2800,
  ...DEFAULT_SPEC,
})

/* ─── ADMIN LOGIN ─── */
export default function AdminPage() {
  const [authed,     setAuthed]    = useState(false)
  const [username,   setUsername]  = useState('')
  const [password,   setPassword]  = useState('')
  const [passErr,    setPassErr]   = useState(false)

  async function handleLogin() {
    try {
      // ส่งไปตรวจสอบที่ API แทนการเช็คในโค้ด
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()

      if (data.success) {
        setAuthed(true)
        // เก็บ session token (ถ้ามี)
        if (data.token) sessionStorage.setItem('admin_token', data.token)
      } else {
        setPassErr(true)
        setTimeout(() => setPassErr(false), 1500)
      }
    } catch {
      setPassErr(true)
      setTimeout(() => setPassErr(false), 1500)
    }
  }

  if (!authed) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-2xl text-white"
            style={{ background: 'linear-gradient(135deg, #ff6b35, #c0392b)', boxShadow: '0 0 24px rgba(192,57,43,0.5)' }}>
            NN
          </div>
          <div className="text-white font-black text-2xl">Admin Panel</div>
          <div className="text-gray-500 text-sm mt-1">NNVPS · ระบบหลังบ้าน</div>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6">
          {/* Username */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs font-bold block mb-2">👤 ยูสเซอร์เนม</label>
            <input
              type="text" value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="username"
              className={`w-full bg-black/40 border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none transition-colors ${
                passErr ? 'border-red-600' : 'border-gray-700/60 focus:border-red-700/60'
              }`}
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs font-bold block mb-2">🔒 รหัสผ่าน</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="password"
              className={`w-full bg-black/40 border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none transition-colors ${
                passErr ? 'border-red-600' : 'border-gray-700/60 focus:border-red-700/60'
              }`}
            />
          </div>

          {passErr && <p className="text-red-400 text-xs text-center mb-3">ข้อมูลไม่ถูกต้อง</p>}
          <button onClick={handleLogin}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all"
            style={{ boxShadow: '0 0 16px rgba(220,38,38,0.35)' }}>
            เข้าสู่ระบบ
          </button>
          <p className="text-center text-gray-700 text-xs mt-4">
            <a href="/" className="hover:text-gray-500 transition-colors">← กลับหน้าร้าน</a>
          </p>
        </div>
      </div>
    </div>
  )

  return <AdminDashboard />
}

/* ─── MAIN DASHBOARD ─── */
function AdminDashboard() {
  const [tab,          setTab]         = useState<AdminTab>('dashboard')
  const [machines,     setMachines]    = useState<Machine[]>(INIT_MACHINES)
  const [users,        setUsers]       = useState<User[]>(INIT_USERS)
  const [payments,     setPayments]    = useState<Payment[]>(INIT_PAYMENTS)
  const [machineStats, setMachineStats]= useState<Record<string, MachineStats>>({})
  const [ctrlMsg,      setCtrlMsg]     = useState<Record<string, string>>({})
  const [agents,       setAgents]      = useState<AgentInfo[]>([])

  // ดึงรายชื่อ agent ทุก 5 วินาที
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res  = await fetch('/api/agent/list')
        const data = await res.json()
        setAgents(data.agents ?? [])
      } catch {}
    }
    fetchAgents()
    const timer = setInterval(fetchAgents, 5_000)
    return () => clearInterval(timer)
  }, [])

  const totalRevenue    = users.reduce((s, u) => s + u.totalSpent, 0)
  const todayRevenue    = payments.filter(p => p.status === 'approved' && p.createdAt.startsWith('2026-05-30')).reduce((s, p) => s + p.amount, 0)
  const activeMachines  = machines.filter(m => m.status === 'active').length
  const pendingPayments = payments.filter(p => p.status === 'pending').length

  // เช็คสถานะเครื่องผ่าน SSH
  async function checkStatus(id: string) {
    const m = machines.find(x => x.id === id)
    if (!m) return
    setMachineStats(s => ({ ...s, [id]: { loading: true } }))
    try {
      const res = await fetch('/api/ssh/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: m.ip, port: m.sshPort, username: m.sshUser, password: m.sshPass }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMachineStats(s => ({ ...s, [id]: data }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setMachineStats(s => ({ ...s, [id]: { error: msg } }))
    }
  }

  // สั่ง เปิด/ปิด/รีสตาร์ท เครื่องผ่าน SSH / WOL
  async function controlMachine(id: string, action: 'start' | 'stop' | 'restart') {
    const m = machines.find(x => x.id === id)
    if (!m) return
    setCtrlMsg(s => ({ ...s, [id]: '⏳ กำลังดำเนินการ...' }))
    try {
      const res = await fetch('/api/ssh/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: m.ip, port: m.sshPort, username: m.sshUser, password: m.sshPass, mac: m.mac, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const msg = data.message ?? '✓ สำเร็จ'
      setCtrlMsg(s => ({ ...s, [id]: msg }))
      // อัปเดตสถานะในตาราง
      if (action === 'stop') setMachines(ms => ms.map(x => x.id === id ? { ...x, status: 'stopped' } : x))
      if (action === 'start') setMachines(ms => ms.map(x => x.id === id ? { ...x, status: 'available' } : x))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setCtrlMsg(s => ({ ...s, [id]: `✕ ${msg}` }))
    }
    setTimeout(() => setCtrlMsg(s => { const n = { ...s }; delete n[id]; return n }), 5_000)
  }

  function addMachine(form: Omit<Machine, 'id'>) {
    const id = `m${Date.now()}`
    setMachines(ms => [...ms, { id, ...form }])
  }

  function removeMachine(id: string) {
    setMachines(ms => ms.filter(m => m.id !== id))
  }

  function updateMachineSSH(id: string, fields: Partial<Pick<Machine, 'sshUser' | 'sshPass' | 'sshPort' | 'mac' | 'ip'>>) {
    setMachines(ms => ms.map(m => m.id === id ? { ...m, ...fields } : m))
  }

  function changeMachineStatus(id: string, status: MachineStatus) {
    setMachines(ms => ms.map(m => m.id === id
      ? { ...m, status, user: status !== 'active' ? undefined : m.user }
      : m
    ))
  }

  function approvePayment(id: string) {
    const pay = payments.find(p => p.id === id)
    if (!pay) return
    setPayments(ps => ps.map(p => p.id === id ? { ...p, status: 'approved', note: 'อนุมัติแล้ว' } : p))
    setUsers(us => us.map(u => u.username === pay.username ? { ...u, balance: u.balance + pay.amount } : u))
  }

  function rejectPayment(id: string) {
    setPayments(ps => ps.map(p => p.id === id ? { ...p, status: 'rejected', note: 'ปฏิเสธโดยแอดมิน' } : p))
  }

  function toggleUserBan(id: string) {
    setUsers(us => us.map(u => u.id === id ? { ...u, status: u.status === 'banned' ? 'active' : 'banned' } : u))
  }

  function addBalance(id: string, amount: number) {
    setUsers(us => us.map(u => u.id === id ? { ...u, balance: u.balance + amount } : u))
  }

  function deleteUser(id: string) {
    const user = users.find(u => u.id === id)
    if (!user) return

    // ยืนยันก่อนลบ
    const confirmed = confirm(`ต้องการลบสมาชิก "${user.username}" จริงหรือไม่?\n\nข้อมูลจะหายถาวร!`)
    if (!confirmed) return

    // ลบออกจาก state
    setUsers(us => us.filter(u => u.id !== id))

    // ถ้ากำลังเช่าเครื่องอยู่ให้ปลดเครื่องด้วย
    if (user.rentingMachine) {
      setMachines(ms => ms.map(m =>
        m.name === user.rentingMachine
          ? { ...m, status: 'available' as MachineStatus, user: undefined, rentedAt: undefined, expiresAt: undefined }
          : m
      ))
    }
  }

  const onlineAgents = agents.filter(a => a.online).length

  const TABS: { key: AdminTab; label: string; icon: string; badge?: number }[] = [
    { key: 'dashboard', label: 'แดชบอร์ด', icon: '📊' },
    { key: 'machines',  label: 'เครื่อง',   icon: '🖥',  badge: machines.filter(m => m.status === 'maintenance').length || undefined },
    { key: 'agents',    label: 'เอเยนต์',   icon: '🤖',  badge: onlineAgents || undefined },
    { key: 'users',     label: 'สมาชิก',    icon: '👥',  badge: users.filter(u => u.status === 'banned').length || undefined },
    { key: 'payments',  label: 'ชำระเงิน',  icon: '💳',  badge: pendingPayments || undefined },
  ]

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-200">
      <header style={{ background: 'linear-gradient(135deg, #1c0303 0%, #3a0808 40%, #2a0505 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #ff6b35, #c0392b)' }}>NN</div>
            <div>
              <div className="text-white font-black text-base leading-none">NNVPS Admin</div>
              <div className="text-gray-500 text-[10px]">ระบบจัดการร้าน</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingPayments > 0 && (
              <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-700/40 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                <span className="text-yellow-400 text-xs font-bold">รอยืนยัน {pendingPayments} รายการ</span>
              </div>
            )}
            <a href="/" className="text-gray-600 hover:text-gray-400 text-xs transition-colors border border-gray-800 rounded-lg px-3 py-1.5">
              ← หน้าร้าน
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        {/* Tab nav */}
        <div className="flex gap-1 bg-black/40 border border-gray-800 rounded-xl p-1 mb-5 w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition-all relative ${
                tab === t.key ? 'bg-red-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              <span>{t.icon}</span> {t.label}
              {t.badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-black">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <DashboardTab
            totalRevenue={totalRevenue} todayRevenue={todayRevenue}
            machines={machines} users={users} payments={payments}
            activeMachines={activeMachines} pendingPayments={pendingPayments}
          />
        )}
        {tab === 'agents' && (
          <AgentTab
            agents={agents}
            machines={machines}
            onAddMachine={(m: Omit<Machine, 'id'>) => setMachines(ms => [...ms, { id: `m${Date.now()}`, ...m }])}
          />
        )}
        {tab === 'machines' && (
          <MachinesTab
            machines={machines} machineStats={machineStats} ctrlMsg={ctrlMsg}
            onChangeStatus={changeMachineStatus}
            onCheckStatus={checkStatus}
            onControl={controlMachine}
            onAdd={addMachine}
            onRemove={removeMachine}
            onUpdateSSH={updateMachineSSH}
          />
        )}
        {tab === 'users' && (
          <UsersTab users={users} onToggleBan={toggleUserBan} onAddBalance={addBalance} onDeleteUser={deleteUser} />
        )}
        {tab === 'payments' && (
          <PaymentsTab payments={payments} onApprove={approvePayment} onReject={rejectPayment} />
        )}
      </div>
    </div>
  )
}

/* ─── DASHBOARD TAB ─── */
function DashboardTab({ totalRevenue, todayRevenue, machines, users, payments, activeMachines, pendingPayments }: {
  totalRevenue: number; todayRevenue: number; machines: Machine[]
  users: User[]; payments: Payment[]; activeMachines: number; pendingPayments: number
}) {
  const availableMachines = machines.filter(m => m.status === 'available').length

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'รายได้วันนี้',     value: `฿${todayRevenue.toLocaleString()}`,          color: '#22c55e', icon: '📈' },
          { label: 'รายได้รวม',        value: `฿${totalRevenue.toLocaleString()}`,           color: '#facc15', icon: '💰' },
          { label: 'เครื่องที่ใช้อยู่', value: `${activeMachines}/${machines.length}`,        color: '#fb923c', icon: '🖥' },
          { label: 'เครื่องว่าง',      value: `${availableMachines} เครื่อง`,               color: '#4ade80', icon: '✅' },
          { label: 'สมาชิกทั้งหมด',   value: `${users.length} คน`,                         color: '#60a5fa', icon: '👥' },
          { label: 'รอยืนยันสลิป',    value: `${pendingPayments} รายการ`,                  color: '#f87171', icon: '⏳' },
        ].map(s => (
          <div key={s.label} className="bg-[#1a1a1a] border border-gray-800/60 rounded-2xl p-4">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="font-black text-xl tabular-nums" style={{ color: s.color }}>{s.value}</div>
            <div className="text-gray-500 text-[10px] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] border border-gray-800/60 rounded-2xl p-4">
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><span>🖥</span> สถานะเครื่อง</h3>
          <div className="space-y-2">
            {machines.map(m => {
              const cfg = M_STATUS[m.status]
              return (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-800/40 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm w-16">{m.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-xs">{m.user ?? '—'}</div>
                    {m.expiresAt && <div className="text-gray-600 text-[10px]">หมด {m.expiresAt}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800/60 rounded-2xl p-4">
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><span>💳</span> การชำระเงินล่าสุด</h3>
          <div className="space-y-2">
            {payments.slice(0, 5).map(p => {
              const cfg = P_STATUS[p.status]
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-800/40 last:border-0">
                  <div>
                    <div className="text-white text-xs font-bold">{p.username}</div>
                    <div className="text-gray-600 text-[10px]">{p.createdAt}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-300 font-black text-sm">฿{p.amount.toLocaleString()}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── MACHINES TAB ─── */
function MachinesTab({ machines, machineStats, ctrlMsg, onChangeStatus, onCheckStatus, onControl, onAdd, onRemove, onUpdateSSH }: {
  machines: Machine[]; machineStats: Record<string, MachineStats>; ctrlMsg: Record<string, string>
  onChangeStatus: (id: string, s: MachineStatus) => void
  onCheckStatus: (id: string) => void
  onControl: (id: string, action: 'start' | 'stop' | 'restart') => void
  onAdd: (form: Omit<Machine, 'id'>) => void
  onRemove: (id: string) => void
  onUpdateSSH: (id: string, fields: Partial<Pick<Machine, 'sshUser' | 'sshPass' | 'sshPort' | 'mac' | 'ip'>>) => void
}) {
  const [showAdd,  setShowAdd]  = useState(false)
  const [expandId, setExpandId] = useState<string | null>(null)
  const [form,     setForm]     = useState(BLANK_FORM)
  const [editStatus, setEditStatus] = useState<Record<string, MachineStatus>>({})

  function submitAdd() {
    if (!form.name.trim() || !form.ip.trim()) return
    onAdd(form)
    setForm(BLANK_FORM())
    setShowAdd(false)
  }

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold">จัดการเครื่อง ({machines.length} เครื่อง)</h2>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
          style={{ boxShadow: '0 0 10px rgba(220,38,38,0.3)' }}>
          + เพิ่มเครื่อง
        </button>
      </div>

      {/* ตาราง */}
      <div className="bg-[#1a1a1a] border border-gray-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800/60">
                {['เครื่อง', 'IP', 'สถานะ', 'ผู้ใช้', 'ราคา', 'หมดอายุ', 'SSH Live', 'ควบคุม'].map(h => (
                  <th key={h} className="text-left text-gray-500 text-xs font-bold px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {machines.map(m => {
                const cfg   = M_STATUS[m.status]
                const stats = machineStats[m.id]
                const msg   = ctrlMsg[m.id]
                const isExpanded = expandId === m.id
                const editSt = editStatus[m.id]

                return (
                  <>
                    <tr key={m.id} className="border-b border-gray-800/30 hover:bg-white/[0.02] transition-colors">
                      {/* ชื่อ */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setExpandId(isExpanded ? null : m.id)}
                            className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
                            {isExpanded ? '▼' : '▶'}
                          </button>
                          <span className="text-white font-black">{m.name}</span>
                        </div>
                      </td>
                      {/* IP */}
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">{m.ip}</td>
                      {/* สถานะ */}
                      <td className="px-4 py-3">
                        {editSt !== undefined ? (
                          <div className="flex gap-1 items-center">
                            <select value={editSt}
                              onChange={e => setEditStatus(s => ({ ...s, [m.id]: e.target.value as MachineStatus }))}
                              className="bg-gray-900 border border-gray-700 text-white text-xs rounded-lg px-2 py-1">
                              <option value="available">ว่าง</option>
                              <option value="active">ไม่ว่าง</option>
                              <option value="stopped">ปิด</option>
                              <option value="maintenance">ซ่อมบำรุง</option>
                            </select>
                            <button onClick={() => { onChangeStatus(m.id, editSt); setEditStatus(s => { const n={...s}; delete n[m.id]; return n }) }}
                              className="bg-green-700 hover:bg-green-600 text-white text-xs px-2 py-1 rounded-lg">✓</button>
                            <button onClick={() => setEditStatus(s => { const n={...s}; delete n[m.id]; return n })}
                              className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-lg">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setEditStatus(s => ({ ...s, [m.id]: m.status }))}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} hover:opacity-80`}>
                            {cfg.label}
                          </button>
                        )}
                      </td>
                      {/* ผู้ใช้ */}
                      <td className="px-4 py-3 text-gray-400 text-sm">{m.user ?? <span className="text-gray-700">—</span>}</td>
                      {/* ราคา */}
                      <td className="px-4 py-3">
                        <div className="text-red-400 font-bold text-xs">฿{m.priceWeekly}/อาทิตย์</div>
                        <div className="text-gray-600 text-[10px]">฿{m.priceMonthly}/เดือน</div>
                      </td>
                      {/* หมดอายุ */}
                      <td className="px-4 py-3 text-gray-500 text-xs">{m.expiresAt ?? <span className="text-gray-700">—</span>}</td>
                      {/* SSH Live stats */}
                      <td className="px-4 py-3">
                        {stats?.loading ? (
                          <span className="text-gray-500 text-xs animate-pulse">กำลังเชื่อมต่อ...</span>
                        ) : stats?.error ? (
                          <span className="text-red-500 text-[10px]">✕ {stats.error}</span>
                        ) : stats?.cpu !== undefined ? (
                          <div className="space-y-1">
                            <StatBar label="CPU" val={stats.cpu ?? 0} color="#f87171" />
                            <StatBar label="RAM" val={stats.ram ?? 0} color="#60a5fa" />
                            <div className="text-gray-600 text-[9px] mt-0.5">{stats.uptime}</div>
                          </div>
                        ) : (
                          <button onClick={() => onCheckStatus(m.id)}
                            className="text-xs text-blue-400 hover:text-blue-300 font-bold border border-blue-800/40 bg-blue-400/10 px-2 py-1 rounded-lg transition-colors">
                            🔌 เช็ค SSH
                          </button>
                        )}
                      </td>
                      {/* ควบคุม */}
                      <td className="px-4 py-3">
                        <div className="space-y-1.5">
                          {msg && <div className="text-xs text-yellow-400">{msg}</div>}
                          <div className="flex gap-1">
                            <button onClick={() => onControl(m.id, 'start')}
                              className="bg-green-900/40 hover:bg-green-800/60 text-green-400 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-green-800/40 transition-colors">
                              ▶ เปิด
                            </button>
                            <button onClick={() => onControl(m.id, 'restart')}
                              className="bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-blue-800/40 transition-colors">
                              ↺ รีสตาร์ท
                            </button>
                            <button onClick={() => onControl(m.id, 'stop')}
                              className="bg-red-900/40 hover:bg-red-800/60 text-red-400 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-red-800/40 transition-colors">
                              ■ ปิด
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* SSH Credentials แบบ expandable */}
                    {isExpanded && (
                      <tr key={`${m.id}-exp`} className="border-b border-gray-800/30 bg-black/20">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="text-gray-400 text-xs font-bold mb-3">⚙ SSH Credentials & ข้อมูลเครื่อง</div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: 'IP Address', key: 'ip' as const, val: m.ip, ph: '192.168.1.x' },
                              { label: 'SSH Port',   key: 'sshPort' as const, val: String(m.sshPort), ph: '22' },
                              { label: 'SSH User',   key: 'sshUser' as const, val: m.sshUser, ph: 'root' },
                              { label: 'MAC (WOL)',  key: 'mac' as const, val: m.mac ?? '', ph: 'AA:BB:CC:DD:EE:FF' },
                            ].map(f => (
                              <div key={f.key}>
                                <label className="text-gray-600 text-[10px] block mb-1">{f.label}</label>
                                <input
                                  defaultValue={f.val} placeholder={f.ph}
                                  onBlur={e => onUpdateSSH(m.id, { [f.key]: f.key === 'sshPort' ? Number(e.target.value) : e.target.value })}
                                  className="w-full bg-black/40 border border-gray-700/60 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-blue-700/60"
                                />
                              </div>
                            ))}
                            <div>
                              <label className="text-gray-600 text-[10px] block mb-1">SSH Password</label>
                              <input
                                type="password" defaultValue={m.sshPass} placeholder="รหัส SSH"
                                onBlur={e => onUpdateSSH(m.id, { sshPass: e.target.value })}
                                className="w-full bg-black/40 border border-gray-700/60 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-blue-700/60"
                              />
                            </div>
                          </div>

                          {/* แก้ไขสเปก */}
                          <div className="text-gray-400 text-xs font-bold mt-4 mb-3">🔧 สเปกเครื่อง (แสดงในหน้าร้าน)</div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: 'CPU', key: 'specCPU' as const, val: m.specCPU, ph: 'Dual Xeon E5-2686 V4' },
                              { label: 'GPU', key: 'specGPU' as const, val: m.specGPU, ph: 'RTX 3060 12GB' },
                              { label: 'RAM', key: 'specRAM' as const, val: m.specRAM, ph: '128 GB' },
                              { label: 'SSD', key: 'specSSD' as const, val: m.specSSD, ph: '1TB NVMe' },
                            ].map(f => (
                              <div key={f.key}>
                                <label className="text-gray-600 text-[10px] block mb-1">{f.label}</label>
                                <input
                                  defaultValue={f.val} placeholder={f.ph}
                                  onBlur={e => onUpdateSSH(m.id, { [f.key]: e.target.value })}
                                  className="w-full bg-black/40 border border-gray-700/60 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-green-700/60"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => onCheckStatus(m.id)}
                              className="bg-blue-900/40 hover:bg-blue-800/50 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-800/40 transition-colors">
                              🔌 ทดสอบ SSH
                            </button>
                            <button onClick={() => { if (confirm(`ลบ ${m.name} ออกจากระบบ?`)) onRemove(m.id) }}
                              className="bg-red-900/30 hover:bg-red-800/40 text-red-500 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-900/40 transition-colors">
                              🗑 ลบเครื่อง
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal เพิ่มเครื่องใหม่ */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-6 w-full max-w-md"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold">+ เพิ่มเครื่องใหม่</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-600 hover:text-gray-300 text-xl">✕</button>
            </div>

            <div className="space-y-3">
              {[
                { label: 'ชื่อเครื่อง *', key: 'name',    ph: 'VPS-05', type: 'text' },
                { label: 'IP Address *', key: 'ip',      ph: '192.168.1.155', type: 'text' },
                { label: 'MAC Address (Wake-on-LAN)', key: 'mac', ph: 'AA:BB:CC:DD:EE:FF', type: 'text' },
                { label: 'SSH Port',     key: 'sshPort', ph: '22', type: 'number' },
                { label: 'SSH Username', key: 'sshUser', ph: 'root', type: 'text' },
                { label: 'SSH Password', key: 'sshPass', ph: 'รหัสผ่าน SSH', type: 'password' },
                { label: 'ราคา/อาทิตย์ (฿)', key: 'priceWeekly',  ph: '800',                    type: 'number' },
                { label: 'ราคา/เดือน (฿)',   key: 'priceMonthly', ph: '2800',                   type: 'number' },
                { label: 'CPU',              key: 'specCPU',      ph: 'Dual Xeon E5-2686 V4',   type: 'text'   },
                { label: 'GPU',              key: 'specGPU',      ph: 'RTX 3060 12GB',           type: 'text'   },
                { label: 'RAM',              key: 'specRAM',      ph: '128 GB',                  type: 'text'   },
                { label: 'SSD',              key: 'specSSD',      ph: '1TB NVMe',                type: 'text'   },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-gray-400 text-xs font-bold block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={String((form as Record<string, unknown>)[f.key] ?? '')}
                    onChange={e => setForm(fm => ({
                      ...fm,
                      [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value
                    }))}
                    placeholder={f.ph}
                    className="w-full bg-black/40 border border-gray-700/60 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-700/60 transition-colors"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={submitAdd}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all">
                เพิ่มเครื่อง
              </button>
              <button onClick={() => setShowAdd(false)}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-sm transition-all">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── STAT BAR ─── */
function StatBar({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-600 text-[9px] w-7">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, background: color }} />
      </div>
      <span className="text-[9px] font-bold tabular-nums" style={{ color }}>{val}%</span>
    </div>
  )
}

/* ─── USERS TAB ─── */
function UsersTab({ users, onToggleBan, onAddBalance, onDeleteUser }: {
  users: User[]
  onToggleBan: (id: string) => void
  onAddBalance: (id: string, amount: number) => void
  onDeleteUser: (id: string) => void
}) {
  const [topupId,     setTopupId]     = useState<string | null>(null)
  const [topupAmount, setTopupAmount] = useState('')

  function handleTopup(id: string) {
    const amount = parseInt(topupAmount)
    if (!amount || amount <= 0) return
    onAddBalance(id, amount)
    setTopupId(null)
    setTopupAmount('')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-white font-bold">จัดการสมาชิก ({users.length} คน)</h2>
      <div className="bg-[#1a1a1a] border border-gray-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800/60">
                {['สมาชิก', 'อีเมล', 'ยอดเงิน', 'ใช้ไปรวม', 'เครื่องที่เช่า', 'วันสมัคร', 'สถานะ', 'รหัสผ่าน', 'จัดการ'].map(h => (
                  <th key={h} className="text-left text-gray-500 text-xs font-bold px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-800/30 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-red-800 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-bold text-sm">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-3"><span className="text-yellow-300 font-black text-sm">฿{u.balance.toLocaleString()}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-sm">฿{u.totalSpent.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {u.rentingMachine
                      ? <span className="text-green-400 text-xs font-bold">{u.rentingMachine}</span>
                      : <span className="text-gray-700 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.registeredAt}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      u.status === 'active' ? 'text-green-400 bg-green-400/15 border-green-700/30' : 'text-red-400 bg-red-400/15 border-red-700/30'
                    }`}>
                      {u.status === 'active' ? 'ปกติ' : 'บล็อก'}
                    </span>
                  </td>
                  {/* คอลัมน์รหัสผ่าน */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-orange-400 bg-black/40 px-2 py-1 rounded font-mono">
                        {u.password}
                      </code>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {topupId === u.id ? (
                      <div className="flex gap-1 items-center">
                        <input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
                          placeholder="จำนวน"
                          className="w-20 bg-gray-900 border border-gray-700 text-white text-xs rounded-lg px-2 py-1" />
                        <button onClick={() => handleTopup(u.id)} className="bg-green-700 hover:bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-lg">✓</button>
                        <button onClick={() => setTopupId(null)} className="bg-gray-800 text-gray-400 text-xs font-bold px-2 py-1 rounded-lg">✕</button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button onClick={() => setTopupId(u.id)}
                          className="bg-yellow-900/50 hover:bg-yellow-800/60 text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-yellow-800/40 transition-colors">
                          เติมเงิน
                        </button>
                        <button onClick={() => onToggleBan(u.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                            u.status === 'active'
                              ? 'bg-red-900/40 hover:bg-red-800/50 text-red-400 border-red-800/40'
                              : 'bg-green-900/40 hover:bg-green-800/50 text-green-400 border-green-800/40'
                          }`}>
                          {u.status === 'active' ? 'บล็อก' : 'ปลดบล็อก'}
                        </button>
                        <button onClick={() => onDeleteUser(u.id)}
                          className="bg-red-950/60 hover:bg-red-900/70 text-red-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-900/50 transition-colors">
                          ลบ
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ─── PAYMENTS TAB ─── */
/* ─── AGENT TAB ─── */
function AgentTab({ agents, machines, onAddMachine }: {
  agents: AgentInfo[]
  machines: Machine[]
  onAddMachine: (m: Omit<Machine, 'id'>) => void
}) {
  const [passMsg,  setPassMsg]  = useState<Record<string, string>>({})
  const [ssTime,   setSsTime]   = useState(Date.now())

  // รีเฟรช screenshot ทุก 5 วินาที
  useEffect(() => {
    const t = setInterval(() => setSsTime(Date.now()), 5_000)
    return () => clearInterval(t)
  }, [])

  async function changePassword(machineId: string) {
    setPassMsg(s => ({ ...s, [machineId]: '⏳ กำลังส่งคำสั่ง...' }))
    try {
      const res  = await fetch('/api/agent/setpassword', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machineId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPassMsg(s => ({ ...s, [machineId]: `✓ รหัสใหม่: ${data.password}` }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setPassMsg(s => ({ ...s, [machineId]: `✕ ${msg}` }))
    }
  }

  function addToSite(agent: AgentInfo) {
    const already = machines.some(m => m.ip === agent.ip || m.name === agent.name)
    if (already) { alert('เครื่องนี้อยู่ในระบบแล้ว'); return }
    onAddMachine({
      name: agent.name, ip: agent.ip, mac: '', anydeskId: agent.anydeskId,
      sshPort: 22, sshUser: 'root', sshPass: '',
      status: 'available', priceWeekly: 800, priceMonthly: 2800,
      ...DEFAULT_SPEC,
    })
    alert(`เพิ่ม ${agent.name} ลงหน้าเว็บแล้ว`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold">เอเยนต์ที่ลงทะเบียน ({agents.length} เครื่อง)</h2>
          <p className="text-gray-600 text-xs mt-0.5">เครื่องที่ติดตั้ง NNVPSAgent จะขึ้นที่นี่อัตโนมัติ</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-xs font-bold">{agents.filter(a => a.online).length} Online</span>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-gray-800/60 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3">🤖</div>
          <div className="text-gray-400 font-bold mb-1">ยังไม่มีเอเยนต์</div>
          <div className="text-gray-600 text-sm">นำไฟล์ <code className="text-blue-400">agent/install.ps1</code> ไปรันบนเครื่องลูก</div>
          <div className="text-gray-700 text-xs mt-2">powershell -ExecutionPolicy Bypass -File install.ps1 -ServerURL &quot;http://[IP เซิร์ฟเวอร์]:3000&quot;</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map(a => {
            const inSite  = machines.some(m => m.ip === a.ip || m.name === a.name)
            const msg     = passMsg[a.machineId]
            const ssUrl   = `/screenshots/${a.machineId}.jpg?t=${ssTime}`
            return (
              <div key={a.machineId} className="bg-[#1a1a1a] border border-gray-800/60 rounded-2xl overflow-hidden">

                {/* Screenshot */}
                <div className="relative bg-black aspect-video overflow-hidden">
                  <img
                    src={ssUrl} alt="screenshot"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  {/* Online badge */}
                  <div className={`absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    a.online ? 'bg-green-500/20 border border-green-600/40 text-green-400' : 'bg-gray-800/60 border border-gray-700/40 text-gray-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${a.online ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                    {a.online ? 'Online' : 'Offline'}
                  </div>
                  {inSite && (
                    <div className="absolute top-2 right-2 bg-blue-500/20 border border-blue-600/40 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      อยู่ในระบบ
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-black text-base">{a.name}</div>
                      <div className="text-gray-500 text-xs font-mono">{a.ip}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-400 text-[10px]">AnyDesk ID</div>
                      <div className="text-orange-400 font-black text-sm">{a.anydeskId || '—'}</div>
                    </div>
                  </div>

                  {/* AnyDesk password control */}
                  <div className="bg-black/30 border border-orange-900/30 rounded-xl p-3">
                    <div className="text-orange-400 text-[10px] font-bold mb-2">🔐 AnyDesk Password</div>
                    {msg && <div className={`text-xs mb-2 font-bold ${msg.startsWith('✓') ? 'text-green-400' : msg.startsWith('✕') ? 'text-red-400' : 'text-yellow-400'}`}>{msg}</div>}
                    <button
                      onClick={() => changePassword(a.machineId)}
                      className="w-full py-2 bg-orange-700/40 hover:bg-orange-600/50 text-orange-300 text-xs font-bold rounded-lg border border-orange-700/40 transition-colors">
                      สุ่มรหัสใหม่ให้ลูกค้า
                    </button>
                  </div>

                  {/* เพิ่มลงเว็บ */}
                  {!inSite && (
                    <button
                      onClick={() => addToSite(a)}
                      className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors"
                      style={{ boxShadow: '0 0 8px rgba(220,38,38,0.3)' }}>
                      + เพิ่มลงหน้าเว็บ
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* วิธีติดตั้ง */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 1. ติดตั้งเครื่องแม่ */}
        <div className="bg-[#1a1a1a] border border-gray-800/60 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-2xl shrink-0">
              🖥️
            </div>
            <div>
              <h3 className="text-white font-black text-base">1. ติดตั้งเครื่องแม่</h3>
              <p className="text-gray-500 text-xs">Server ที่รัน Next.js (เว็บนี้)</p>
            </div>
          </div>

          <div className="space-y-3 mb-4 text-xs">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 bg-blue-700 rounded-full flex items-center justify-center text-white font-black text-[10px] shrink-0 mt-0.5">1</span>
              <span className="text-gray-400">Clone โปรเจค: <code className="text-blue-400 bg-black/40 px-1.5 py-0.5 rounded">git clone [repo-url]</code></span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 bg-blue-700 rounded-full flex items-center justify-center text-white font-black text-[10px] shrink-0 mt-0.5">2</span>
              <span className="text-gray-400">ติดตั้ง: <code className="text-blue-400 bg-black/40 px-1.5 py-0.5 rounded">npm install</code></span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 bg-blue-700 rounded-full flex items-center justify-center text-white font-black text-[10px] shrink-0 mt-0.5">3</span>
              <span className="text-gray-400">รัน: <code className="text-blue-400 bg-black/40 px-1.5 py-0.5 rounded">npm run dev</code> หรือ <code className="text-blue-400 bg-black/40 px-1.5 py-0.5 rounded">npm run build && npm start</code></span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 bg-blue-700 rounded-full flex items-center justify-center text-white font-black text-[10px] shrink-0 mt-0.5">4</span>
              <span className="text-gray-400">เข้าใช้งานที่: <code className="text-green-400 bg-black/40 px-1.5 py-0.5 rounded">http://[IP]:3000</code></span>
            </div>
          </div>

          {/* ปุ่มดาวน์โหลด Server Setup */}
          <div className="mb-3">
            <a href="/server-setup.ps1" download
               className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl transition-all active:scale-95 text-xs"
               style={{ boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }}>
              <span className="text-lg">📥</span>
              <span>ดาวน์โหลด server-setup.ps1</span>
            </a>
          </div>

          <div className="bg-blue-950/30 border border-blue-900/40 rounded-xl p-3">
            <div className="text-blue-400 text-[10px] font-bold mb-1">💡 สำหรับ Production</div>
            <div className="text-gray-400 text-xs">ใช้ PM2 หรือ Deploy ไป Vercel/Railway/DigitalOcean</div>
          </div>
        </div>

        {/* 2. ติดตั้งเครื่องลูก */}
        <div className="bg-[#1a1a1a] border border-gray-800/60 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl flex items-center justify-center text-2xl shrink-0">
              💻
            </div>
            <div>
              <h3 className="text-white font-black text-base">2. ติดตั้งเครื่องลูก</h3>
              <p className="text-gray-500 text-xs">เครื่อง Windows ที่เอาไว้ให้เช่า</p>
            </div>
          </div>

          {/* ปุ่มดาวน์โหลด */}
          <div className="mb-4">
            <a href="/agent/install.ps1" download
               className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold rounded-xl transition-all active:scale-95"
               style={{ boxShadow: '0 4px 12px rgba(234,88,12,0.4)' }}>
              <span className="text-xl">📥</span>
              <span>ดาวน์โหลด install.ps1</span>
            </a>
          </div>

          <div className="space-y-3 mb-4 text-xs">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 bg-orange-700 rounded-full flex items-center justify-center text-white font-black text-[10px] shrink-0 mt-0.5">1</span>
              <span className="text-gray-400">คลิกปุ่มด้านบนเพื่อดาวน์โหลด <code className="text-orange-400 bg-black/40 px-1.5 py-0.5 rounded">install.ps1</code></span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 bg-orange-700 rounded-full flex items-center justify-center text-white font-black text-[10px] shrink-0 mt-0.5">2</span>
              <span className="text-gray-400">เปิด PowerShell แบบ <strong className="text-orange-400">Administrator</strong></span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 bg-orange-700 rounded-full flex items-center justify-center text-white font-black text-[10px] shrink-0 mt-0.5">3</span>
              <div className="text-gray-400 flex-1">
                <div className="mb-1">รันคำสั่ง:</div>
                <code className="block text-orange-400 bg-black/60 px-2 py-1.5 rounded text-[10px] overflow-x-auto">
                  Set-ExecutionPolicy Bypass -Scope Process -Force; cd Downloads; .\install.ps1
                </code>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 bg-orange-700 rounded-full flex items-center justify-center text-white font-black text-[10px] shrink-0 mt-0.5">4</span>
              <span className="text-gray-400">เครื่องจะปรากฏในตารางด้านบนภายใน <strong className="text-green-400">5 วินาที</strong></span>
            </div>
          </div>

          <div className="bg-orange-950/30 border border-orange-900/40 rounded-xl p-3">
            <div className="text-orange-400 text-[10px] font-bold mb-1">📖 คู่มือฉบับเต็ม</div>
            <a href="/INSTALL_GUIDE.md" target="_blank" className="text-blue-400 hover:text-blue-300 text-xs underline">
              เปิดคู่มือติดตั้งแบบละเอียด →
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ─── PAYMENTS TAB ─── */
function PaymentsTab({ payments, onApprove, onReject }: {
  payments: Payment[]; onApprove: (id: string) => void; onReject: (id: string) => void
}) {
  const [filter, setFilter] = useState<PayStatus | 'all'>('all')
  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter)
  const pendingCount  = payments.filter(p => p.status === 'pending').length
  const approvedTotal = payments.filter(p => p.status === 'approved').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-white font-bold">ประวัติการชำระเงิน</h2>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="bg-yellow-500/10 border border-yellow-700/30 rounded-xl px-3 py-1.5 text-center">
              <div className="text-yellow-400 font-black text-sm">{pendingCount}</div>
              <div className="text-gray-600 text-[9px]">รอตรวจ</div>
            </div>
            <div className="bg-green-500/10 border border-green-700/30 rounded-xl px-3 py-1.5 text-center">
              <div className="text-green-400 font-black text-sm">฿{approvedTotal.toLocaleString()}</div>
              <div className="text-gray-600 text-[9px]">อนุมัติแล้ว</div>
            </div>
          </div>
          <div className="flex gap-1 bg-black/40 border border-gray-800 rounded-xl p-1">
            {([
              { key: 'all',      label: 'ทั้งหมด' },
              { key: 'pending',  label: 'รอตรวจ'  },
              { key: 'approved', label: 'อนุมัติ' },
              { key: 'rejected', label: 'ปฏิเสธ'  },
            ] as { key: PayStatus | 'all'; label: string }[]).map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filter === f.key ? 'bg-red-700 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800/60">
                {['สมาชิก', 'จำนวนเงิน', 'วิธีชำระ', 'เวลา', 'หมายเหตุ', 'สถานะ', 'จัดการ'].map(h => (
                  <th key={h} className="text-left text-gray-500 text-xs font-bold px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-600 py-8 text-sm">ไม่มีรายการ</td></tr>
              )}
              {filtered.map(p => {
                const cfg = P_STATUS[p.status]
                return (
                  <tr key={p.id} className="border-b border-gray-800/30 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0">
                          {p.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-bold text-sm">{p.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-yellow-300 font-black text-sm">฿{p.amount.toLocaleString()}</span></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{p.method}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{p.createdAt}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.note ?? <span className="text-gray-700">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'pending' ? (
                        <div className="flex gap-1">
                          <button onClick={() => onApprove(p.id)}
                            className="bg-green-900/50 hover:bg-green-800/60 text-green-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-green-800/40 transition-colors">
                            ✓ อนุมัติ
                          </button>
                          <button onClick={() => onReject(p.id)}
                            className="bg-red-900/40 hover:bg-red-800/50 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-800/40 transition-colors">
                            ✕ ปฏิเสธ
                          </button>
                        </div>
                      ) : <span className="text-gray-700 text-xs">ดำเนินการแล้ว</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
