// API Route: สั่งเปิด/ปิด/รีสตาร์ทเครื่องผ่าน SSH หรือ Wake-on-LAN
import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'ssh2'
import dgram from 'dgram'

// คำสั่ง SSH ตาม action
const SSH_CMDS: Record<string, string> = {
  stop:    'sudo shutdown -h now',
  restart: 'sudo reboot',
}

// ส่ง Wake-on-LAN magic packet เพื่อเปิดเครื่องที่ปิดอยู่
function sendWOL(mac: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const hex = mac.replace(/[:\-\.]/g, '')
    if (hex.length !== 12) { reject(new Error('MAC address ไม่ถูกต้อง')); return }

    const buf = Buffer.alloc(102)
    for (let i = 0; i < 6; i++) buf[i] = 0xff
    for (let i = 1; i <= 16; i++) {
      for (let j = 0; j < 6; j++) {
        buf[i * 6 + j] = parseInt(hex.slice(j * 2, j * 2 + 2), 16)
      }
    }

    const sock = dgram.createSocket('udp4')
    sock.once('listening', () => sock.setBroadcast(true))
    sock.send(buf, 0, 102, 9, '255.255.255.255', (err) => {
      sock.close()
      err ? reject(err) : resolve()
    })
  })
}

export async function POST(req: NextRequest) {
  const { ip, port = 22, username, password, mac, action } = await req.json()

  // เปิดเครื่องผ่าน Wake-on-LAN
  if (action === 'start') {
    if (!mac) return NextResponse.json({ error: 'ต้องมี MAC address สำหรับ Wake-on-LAN' }, { status: 400 })
    try {
      await sendWOL(mac)
      return NextResponse.json({ success: true, message: 'ส่ง WOL packet แล้ว รอเครื่องเปิดสัก 30-60 วินาที' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  const cmd = SSH_CMDS[action]
  if (!cmd) return NextResponse.json({ error: 'action ไม่ถูกต้อง' }, { status: 400 })
  if (!ip || !username || !password) return NextResponse.json({ error: 'ข้อมูล SSH ไม่ครบ' }, { status: 400 })

  // ปิด/รีสตาร์ทผ่าน SSH
  return new Promise<NextResponse>((resolve) => {
    const conn = new Client()

    const timer = setTimeout(() => {
      conn.destroy()
      resolve(NextResponse.json({ error: 'Connection timeout (8s)' }, { status: 408 }))
    }, 8_000)

    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) {
          clearTimeout(timer)
          conn.end()
          resolve(NextResponse.json({ error: err.message }, { status: 500 }))
          return
        }
        stream.on('close', () => {
          clearTimeout(timer)
          conn.end()
          resolve(NextResponse.json({ success: true }))
        })
      })
    })

    conn.on('error', (err) => {
      clearTimeout(timer)
      resolve(NextResponse.json({ error: err.message }, { status: 500 }))
    })

    conn.connect({ host: ip, port: Number(port), username, password, readyTimeout: 5_000 })
  })
}
