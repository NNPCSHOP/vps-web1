// API Route: เช็คสถานะเครื่องผ่าน SSH
import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'ssh2'

export async function POST(req: NextRequest) {
  const { ip, port = 22, username, password } = await req.json()

  if (!ip || !username || !password) {
    return NextResponse.json({ error: 'ข้อมูล SSH ไม่ครบ' }, { status: 400 })
  }

  return new Promise<NextResponse>((resolve) => {
    const conn = new Client()
    let output = ''

    const timer = setTimeout(() => {
      conn.destroy()
      resolve(NextResponse.json({ error: 'Connection timeout (8s)' }, { status: 408 }))
    }, 8_000)

    conn.on('ready', () => {
      // ดึง uptime, RAM, CPU ในคำสั่งเดียว
      const cmd = [
        "uptime -p",
        "free -m | awk 'NR==2{print $2,$3}'",
        "top -bn1 | grep 'Cpu(s)' | awk '{print $2+$4}'",
      ].join(' && ')

      conn.exec(cmd, (err, stream) => {
        if (err) {
          clearTimeout(timer)
          conn.end()
          resolve(NextResponse.json({ error: err.message }, { status: 500 }))
          return
        }

        stream.on('data', (data: Buffer) => { output += data.toString() })
        stream.stderr.on('data', () => {})
        stream.on('close', () => {
          clearTimeout(timer)
          conn.end()

          const lines = output.trim().split('\n').filter(Boolean)
          const uptime   = lines[0] ?? 'unknown'
          const [ramTotalStr, ramUsedStr] = (lines[1] ?? '0 0').split(' ')
          const ramTotal = Number(ramTotalStr) || 0
          const ramUsed  = Number(ramUsedStr)  || 0
          const cpu      = parseFloat(lines[2] ?? '0') || 0

          resolve(NextResponse.json({
            uptime,
            cpu:      Math.round(cpu),
            ram:      ramTotal > 0 ? Math.round((ramUsed / ramTotal) * 100) : 0,
            ramUsed,
            ramTotal,
          }))
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
