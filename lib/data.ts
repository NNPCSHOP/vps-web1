// ข้อมูลกลางที่ใช้ร่วมกันทั้งหน้าร้านและหลังบ้าน
export type MachineStatus = 'active' | 'available' | 'stopped' | 'maintenance'
export type PayStatus = 'pending' | 'approved' | 'rejected'

export interface Machine {
  id: string; name: string; status: MachineStatus
  user?: string; ip: string; mac?: string
  sshPort: number; sshUser: string; sshPass: string
  priceWeekly: number; priceMonthly: number
  rentedAt?: string; expiresAt?: string
  specCPU: string; specGPU: string; specRAM: string; specSSD: string
  anydeskId?: string
}

export interface User {
  id: string; username: string; email: string
  password: string
  balance: number; totalSpent: number
  registeredAt: string; status: 'active' | 'banned'
  rentingMachine?: string
}

export interface Payment {
  id: string; username: string
  amount: number; method: string
  status: PayStatus; createdAt: string; note?: string
}

// ค่าเริ่มต้น
const DEFAULT_SPEC = {
  specCPU: 'Dual Xeon E5-2686 V4 36/72',
  specGPU: 'RTX 3060 12GB',
  specRAM: '128 GB',
  specSSD: '1TB NVMe',
}

// ข้อมูลเครื่อง
export const INIT_MACHINES: Machine[] = [
  { id: 'm1', name: 'VPS-01', status: 'active',   user: 'somchai99', ip: '192.168.1.150', mac: '', anydeskId: '112 536 741', sshPort: 22, sshUser: 'admin', sshPass: '', priceWeekly: 800, priceMonthly: 2800, rentedAt: '2026-05-22', expiresAt: '2026-06-02', ...DEFAULT_SPEC },
  { id: 'm2', name: 'VPS-02', status: 'active',   user: 'narin_x',   ip: '192.168.1.151', mac: '', anydeskId: '234 819 052', sshPort: 22, sshUser: 'admin', sshPass: '', priceWeekly: 800, priceMonthly: 2800, rentedAt: '2026-05-26', expiresAt: '2026-06-03', ...DEFAULT_SPEC },
  { id: 'm3', name: 'VPS-03', status: 'available',                   ip: '192.168.1.152', mac: '', anydeskId: '398 047 261', sshPort: 22, sshUser: 'admin', sshPass: '', priceWeekly: 800, priceMonthly: 2800, ...DEFAULT_SPEC },
  { id: 'm4', name: 'VPS-04', status: 'stopped',                     ip: '192.168.1.153', mac: '', anydeskId: '471 203 885', sshPort: 22, sshUser: 'admin', sshPass: '', priceWeekly: 800, priceMonthly: 2800, ...DEFAULT_SPEC },
]

// ข้อมูลผู้ใช้
export const INIT_USERS: User[] = [
  { id: 'u1', username: 'somchai99', email: 'somchai@gmail.com', password: 'pass1234', balance: 1200, totalSpent: 4800, registeredAt: '2026-03-10', status: 'active', rentingMachine: 'VPS-01' },
  { id: 'u2', username: 'narin_x',   email: 'narin@hotmail.com', password: 'narin999', balance: 500,  totalSpent: 2800, registeredAt: '2026-04-01', status: 'active', rentingMachine: 'VPS-02' },
  { id: 'u3', username: 'ploy2025',  email: 'ploy@gmail.com',    password: 'ploy2025', balance: 0,    totalSpent: 800,  registeredAt: '2026-05-15', status: 'active' },
  { id: 'u4', username: 'teeray_r',  email: 'tee@gmail.com',     password: 'tee1234',  balance: 300,  totalSpent: 1600, registeredAt: '2026-04-20', status: 'banned' },
]

// ข้อมูลการชำระเงิน
export const INIT_PAYMENTS: Payment[] = [
  { id: 'p1', username: 'ploy2025',  amount: 800,  method: 'PromptPay', status: 'pending',  createdAt: '2026-05-30 14:32' },
  { id: 'p2', username: 'somchai99', amount: 500,  method: 'PromptPay', status: 'pending',  createdAt: '2026-05-30 11:05' },
  { id: 'p3', username: 'narin_x',   amount: 2800, method: 'PromptPay', status: 'approved', createdAt: '2026-05-25 09:20' },
]
