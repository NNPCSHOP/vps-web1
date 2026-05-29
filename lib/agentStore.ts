// ระบบจัดเก็บข้อมูล Agent — ใช้ไฟล์ JSON บนดิสก์
import fs   from 'fs'
import path from 'path'

const DATA_DIR       = path.join(process.cwd(), 'data')
const AGENTS_FILE    = path.join(DATA_DIR, 'agents.json')
const COMMANDS_FILE  = path.join(DATA_DIR, 'commands.json')
export const SS_DIR  = path.join(process.cwd(), 'public', 'screenshots')

// สร้างโฟลเดอร์ถ้ายังไม่มี
for (const dir of [DATA_DIR, SS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export interface AgentInfo {
  machineId: string
  name:      string
  ip:        string
  anydeskId: string
  lastSeen:  number
}

export interface AgentCommand {
  id:        string
  machineId: string
  type:      'setPassword'
  payload:   string
  createdAt: number
  done:      boolean
}

/* ── helpers ── */
function readJSON<T>(file: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')) } catch { return fallback }
}
function writeJSON(file: string, data: unknown) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
}

export const agentStore = {
  /* ลงทะเบียน / อัปเดต agent */
  register(info: AgentInfo) {
    const list = readJSON<AgentInfo[]>(AGENTS_FILE, [])
    const idx  = list.findIndex(a => a.machineId === info.machineId)
    if (idx >= 0) list[idx] = info
    else list.push(info)
    writeJSON(AGENTS_FILE, list)
  },

  /* ดึงรายชื่อ agent ทั้งหมด พร้อมสถานะ online */
  getAll(): (AgentInfo & { online: boolean })[] {
    const list = readJSON<AgentInfo[]>(AGENTS_FILE, [])
    const now  = Date.now()
    return list.map(a => ({ ...a, online: now - a.lastSeen < 15_000 }))
  },

  /* บันทึก screenshot ลงดิสก์ */
  saveScreenshot(machineId: string, base64: string) {
    const buf = Buffer.from(base64, 'base64')
    fs.writeFileSync(path.join(SS_DIR, `${machineId}.jpg`), buf)
  },

  /* เพิ่ม command รอ agent รับไปทำ */
  addCommand(machineId: string, type: 'setPassword', payload: string): AgentCommand {
    const list = readJSON<AgentCommand[]>(COMMANDS_FILE, [])
    // ยกเลิก command เก่าของเครื่องนี้ที่ยังไม่ได้ทำ
    list.forEach(c => { if (c.machineId === machineId && !c.done) c.done = true })
    const cmd: AgentCommand = {
      id: `${Date.now()}`, machineId, type, payload,
      createdAt: Date.now(), done: false,
    }
    list.push(cmd)
    writeJSON(COMMANDS_FILE, list)
    return cmd
  },

  /* agent ดึง command ที่รอดำเนินการ */
  getPending(machineId: string): AgentCommand | null {
    const list = readJSON<AgentCommand[]>(COMMANDS_FILE, [])
    return list.find(c => c.machineId === machineId && !c.done) ?? null
  },

  /* agent ยืนยันว่าทำ command แล้ว */
  confirmCommand(commandId: string) {
    const list = readJSON<AgentCommand[]>(COMMANDS_FILE, [])
    const idx  = list.findIndex(c => c.id === commandId)
    if (idx >= 0) list[idx].done = true
    writeJSON(COMMANDS_FILE, list)
  },
}
