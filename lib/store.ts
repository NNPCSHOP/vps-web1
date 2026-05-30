import { INIT_MACHINES, INIT_USERS, INIT_PAYMENTS, type Machine, type User, type Payment } from './data'

/**
 * In-memory data store สำหรับแชร์ข้อมูลระหว่าง API routes
 * (ข้อมูลจะหายเมื่อ restart server - ในการใช้งานจริงควรใช้ Database)
 */

class DataStore {
  private static instance: DataStore
  public machines: Machine[] = [...INIT_MACHINES]
  public users: User[] = [...INIT_USERS]
  public payments: Payment[] = [...INIT_PAYMENTS]

  private constructor() {}

  static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore()
    }
    return DataStore.instance
  }

  // เครื่อง
  getMachines() {
    return this.machines
  }

  addMachine(machine: Machine) {
    this.machines.push(machine)
    return this.machines
  }

  updateMachine(id: string, data: Partial<Machine>) {
    const index = this.machines.findIndex(m => m.id === id)
    if (index !== -1) {
      this.machines[index] = { ...this.machines[index], ...data }
    }
    return this.machines
  }

  deleteMachine(id: string) {
    this.machines = this.machines.filter(m => m.id !== id)
    return this.machines
  }

  // ผู้ใช้
  getUsers() {
    return this.users
  }

  addUser(user: User) {
    this.users.push(user)
    return this.users
  }

  updateUser(id: string, data: Partial<User>) {
    const index = this.users.findIndex(u => u.id === id)
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...data }
    }
    return this.users
  }

  deleteUser(id: string) {
    this.users = this.users.filter(u => u.id !== id)
    return this.users
  }

  // การชำระเงิน
  getPayments() {
    return this.payments
  }

  addPayment(payment: Payment) {
    this.payments.push(payment)
    return this.payments
  }

  updatePayment(id: string, data: Partial<Payment>) {
    const index = this.payments.findIndex(p => p.id === id)
    if (index !== -1) {
      this.payments[index] = { ...this.payments[index], ...data }
    }
    return this.payments
  }

  deletePayment(id: string) {
    this.payments = this.payments.filter(p => p.id !== id)
    return this.payments
  }

  // รีเซ็ตข้อมูลทั้งหมด
  reset() {
    this.machines = [...INIT_MACHINES]
    this.users = [...INIT_USERS]
    this.payments = [...INIT_PAYMENTS]
  }
}

/**
 * Agent Store สำหรับเก็บข้อมูล Agent ที่เชื่อมต่อ
 */

export interface AgentInfo {
  machineId: string
  name: string
  ip: string
  anydeskId: string
  lastSeen: number
  online: boolean
  // ข้อมูลเพิ่มเติมจากเครื่องลูก
  cpu?: number
  ramUsed?: number
  ramTotal?: number
  ramPercent?: number
  uptime?: string
}

class AgentStore {
  private static instance: AgentStore
  private agents: Map<string, AgentInfo> = new Map()
  private readonly TIMEOUT_MS = 15_000 // 15 วินาที

  private constructor() {}

  static getInstance(): AgentStore {
    if (!AgentStore.instance) {
      AgentStore.instance = new AgentStore()
    }
    return AgentStore.instance
  }

  // ลงทะเบียน/อัพเดท agent
  register(info: Omit<AgentInfo, 'online'>) {
    this.agents.set(info.machineId, {
      ...info,
      online: true
    })
  }

  // ดึงรายชื่อ agent ทั้งหมด พร้อมเช็ค online/offline
  getAll(): AgentInfo[] {
    const now = Date.now()
    const result: AgentInfo[] = []

    // เช็คและอัพเดทสถานะ online
    for (const [id, agent] of this.agents.entries()) {
      const isOnline = (now - agent.lastSeen) < this.TIMEOUT_MS

      if (isOnline) {
        result.push({ ...agent, online: true })
      } else {
        // ลบ agent ที่ offline ไปนานแล้ว (เกิน 1 ชั่วโมง)
        if ((now - agent.lastSeen) > 3_600_000) {
          this.agents.delete(id)
        } else {
          result.push({ ...agent, online: false })
        }
      }
    }

    return result
  }

  // ลบ agent
  remove(machineId: string) {
    this.agents.delete(machineId)
  }
}

/**
 * Command Queue สำหรับส่งคำสั่งไปยัง Agent
 */

export interface AgentCommand {
  id: string
  machineId: string
  type: 'setPassword' | 'restart' | 'shutdown'
  payload?: string
  createdAt: number
  done: boolean
}

class CommandStore {
  private static instance: CommandStore
  private commands: AgentCommand[] = []

  private constructor() {}

  static getInstance(): CommandStore {
    if (!CommandStore.instance) {
      CommandStore.instance = new CommandStore()
    }
    return CommandStore.instance
  }

  // เพิ่มคำสั่งใหม่
  addCommand(machineId: string, type: AgentCommand['type'], payload?: string): AgentCommand {
    // ยกเลิกคำสั่งเก่าของเครื่องนี้ที่ยังไม่ได้ทำ
    this.commands.forEach(c => {
      if (c.machineId === machineId && !c.done) {
        c.done = true
      }
    })

    const cmd: AgentCommand = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      machineId,
      type,
      payload,
      createdAt: Date.now(),
      done: false
    }

    this.commands.push(cmd)
    return cmd
  }

  // Agent ดึงคำสั่งที่รอดำเนินการ
  getPendingCommand(machineId: string): AgentCommand | null {
    return this.commands.find(c => c.machineId === machineId && !c.done) ?? null
  }

  // Agent ยืนยันว่าทำคำสั่งแล้ว
  confirmCommand(commandId: string): boolean {
    const cmd = this.commands.find(c => c.id === commandId)
    if (cmd) {
      cmd.done = true
      return true
    }
    return false
  }

  // ดูคำสั่งทั้งหมด (สำหรับ debug)
  getAllCommands(): AgentCommand[] {
    return this.commands
  }
}

// Export singleton instance
export const store = DataStore.getInstance()
export const agentStore = AgentStore.getInstance()
export const commandStore = CommandStore.getInstance()
