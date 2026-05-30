# ========================================
# NNVPS Agent - เชื่อมต่อเครื่องกับระบบหลังบ้าน
# ========================================

# ⚙️ กำหนดค่า
$API_URL = "https://vps-web1-j6x5wvrik-nnpcshops-projects.vercel.app"  # URL ของระบบหลังบ้าน
$MACHINE_ID = "PC-$(Get-WmiObject Win32_ComputerSystemProduct | Select-Object -ExpandProperty UUID)"
$MACHINE_NAME = $env:COMPUTERNAME
$INTERVAL_SECONDS = 5  # ส่ง heartbeat ทุก 5 วินาที

# ฟังก์ชันดึง IP Address
function Get-LocalIP {
    try {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
            $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*"
        } | Select-Object -First 1).IPAddress

        if ($ip) { return $ip }
        return "Unknown"
    } catch {
        return "Unknown"
    }
}

# ฟังก์ชันดึง AnyDesk ID
function Get-AnydeskID {
    try {
        $anydeskPath = "$env:ProgramData\AnyDesk\anydesk.trace"
        if (Test-Path $anydeskPath) {
            $content = Get-Content $anydeskPath -Raw
            if ($content -match 'anynet\.id = (\d+ \d+ \d+)') {
                return $matches[1]
            }
        }

        # ลองวิธีอื่น
        $adPath = "${env:ProgramFiles(x86)}\AnyDesk\AnyDesk.exe"
        if (Test-Path $adPath) {
            $output = & $adPath --get-id 2>$null
            if ($output -match '\d+ \d+ \d+') {
                return $matches[0]
            }
        }

        return "Not Installed"
    } catch {
        return "Not Installed"
    }
}

# ฟังก์ชันดึง CPU Usage
function Get-CPUUsage {
    try {
        $cpu = Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction Stop
        return [math]::Round($cpu.CounterSamples[0].CookedValue, 1)
    } catch {
        return 0
    }
}

# ฟังก์ชันดึง RAM Usage
function Get-RAMUsage {
    try {
        $os = Get-CimInstance Win32_OperatingSystem
        $total = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
        $free = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
        $used = [math]::Round($total - $free, 2)
        return @{
            used = $used
            total = $total
            percent = [math]::Round(($used / $total) * 100, 1)
        }
    } catch {
        return @{ used = 0; total = 0; percent = 0 }
    }
}

# ฟังก์ชันดึง Uptime
function Get-SystemUptime {
    try {
        $os = Get-CimInstance Win32_OperatingSystem
        $uptime = (Get-Date) - $os.LastBootUpTime
        return "$($uptime.Days)d $($uptime.Hours)h $($uptime.Minutes)m"
    } catch {
        return "Unknown"
    }
}

# ฟังก์ชันส่ง heartbeat + ข้อมูลเครื่อง
function Send-Heartbeat {
    try {
        $ip = Get-LocalIP
        $anydeskId = Get-AnydeskID
        $cpu = Get-CPUUsage
        $ram = Get-RAMUsage
        $uptime = Get-SystemUptime

        $body = @{
            machineId = $MACHINE_ID
            name = $MACHINE_NAME
            ip = $ip
            anydeskId = $anydeskId
            lastSeen = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            cpu = $cpu
            ramUsed = $ram.used
            ramTotal = $ram.total
            ramPercent = $ram.percent
            uptime = $uptime
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$API_URL/api/agent/heartbeat" `
            -Method POST `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop

        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✓ CPU: $cpu% | RAM: $($ram.percent)% | $MACHINE_NAME ($ip)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# แสดงข้อมูลเครื่อง
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   NNVPS Agent" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Machine ID  : $MACHINE_ID"
Write-Host "Machine Name: $MACHINE_NAME"
Write-Host "Server URL  : $API_URL"
Write-Host "Interval    : $INTERVAL_SECONDS seconds"
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "กำลังเชื่อมต่อ..." -ForegroundColor Yellow
Write-Host "กด Ctrl+C เพื่อหยุด`n" -ForegroundColor Yellow

# ฟังก์ชันเช็คคำสั่งจากเซิร์ฟเวอร์
function Check-Command {
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/api/agent/command?machineId=$MACHINE_ID" `
            -Method GET `
            -ErrorAction Stop

        if ($response.hasCommand -and $response.command) {
            $cmd = $response.command
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 📨 คำสั่งใหม่: $($cmd.type)" -ForegroundColor Yellow

            switch ($cmd.type) {
                "setPassword" {
                    Execute-SetPassword $cmd.payload $cmd.id
                }
                "restart" {
                    Write-Host "  ↻ กำลังรีสตาร์ท..." -ForegroundColor Yellow
                    Confirm-Command $cmd.id
                    Restart-Computer -Force
                }
                "shutdown" {
                    Write-Host "  ■ กำลังปิดเครื่อง..." -ForegroundColor Yellow
                    Confirm-Command $cmd.id
                    Stop-Computer -Force
                }
            }
        }
    } catch {
        # ไม่แสดง error ถ้าไม่มีคำสั่ง
    }
}

# ฟังก์ชันเปลี่ยนรหัส AnyDesk
function Execute-SetPassword($newPassword, $commandId) {
    try {
        Write-Host "  🔐 กำลังเปลี่ยนรหัส AnyDesk เป็น: $newPassword" -ForegroundColor Cyan

        $adPath = "${env:ProgramFiles(x86)}\AnyDesk\AnyDesk.exe"
        if (-not (Test-Path $adPath)) {
            throw "ไม่พบ AnyDesk"
        }

        # เปลี่ยนรหัส
        & $adPath --set-password $newPassword 2>$null

        Write-Host "  ✓ เปลี่ยนรหัสสำเร็จ!" -ForegroundColor Green

        # แจ้งเซิร์ฟเวอร์ว่าทำเสร็จแล้ว
        Confirm-Command $commandId
    } catch {
        Write-Host "  ✗ เปลี่ยนรหัสล้มเหลว: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ฟังก์ชันยืนยันคำสั่งเสร็จแล้ว
function Confirm-Command($commandId) {
    try {
        $body = @{ commandId = $commandId } | ConvertTo-Json
        Invoke-RestMethod -Uri "$API_URL/api/agent/command" `
            -Method POST `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop
    } catch {
        # ไม่แสดง error
    }
}

# Loop ส่ง heartbeat + เช็คคำสั่ง
while ($true) {
    Send-Heartbeat
    Check-Command
    Start-Sleep -Seconds $INTERVAL_SECONDS
}
