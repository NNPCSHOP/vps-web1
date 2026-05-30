# ========================================
# NNVPS Agent Installer
# ติดตั้ง Agent บนเครื่องลูกเพื่อเชื่อมต่อกับระบบ
# ========================================

param(
    [string]$ServerURL = "https://vps-web1.vercel.app"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   NNVPS Agent Installer" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ตรวจสอบว่ารันด้วย Admin หรือไม่
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "โปรดรันด้วยสิทธิ์ Administrator!" -ForegroundColor Red
    Write-Host "คลิกขวาที่ PowerShell แล้วเลือก 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

# กำหนดตำแหน่งติดตั้ง
$installPath = "C:\NNVPS\Agent"
$scriptPath = "$installPath\agent.ps1"
$logPath = "$installPath\agent.log"

Write-Host "กำลังติดตั้ง Agent..." -ForegroundColor Yellow
Write-Host "ตำแหน่ง: $installPath`n" -ForegroundColor Gray

# สร้างโฟลเดอร์
if (-not (Test-Path $installPath)) {
    New-Item -ItemType Directory -Path $installPath -Force | Out-Null
    Write-Host "✓ สร้างโฟลเดอร์สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "✓ โฟลเดอร์มีอยู่แล้ว" -ForegroundColor Green
}

# สร้างไฟล์ Agent Script
$agentScript = @"
# NNVPS Agent - เชื่อมต่อเครื่องกับระบบหลังบ้าน
# Server URL: $ServerURL

`$API_URL = "$ServerURL"
`$MACHINE_ID = "PC-`$(Get-WmiObject Win32_ComputerSystemProduct | Select-Object -ExpandProperty UUID)"
`$MACHINE_NAME = `$env:COMPUTERNAME
`$INTERVAL_SECONDS = 30

function Get-LocalIP {
    try {
        `$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
            `$_.InterfaceAlias -notlike "*Loopback*" -and `$_.IPAddress -notlike "169.254.*"
        } | Select-Object -First 1).IPAddress

        if (`$ip) { return `$ip }
        return "Unknown"
    } catch {
        return "Unknown"
    }
}

function Get-AnydeskID {
    try {
        `$anydeskPath = "`$env:ProgramData\AnyDesk\anydesk.trace"
        if (Test-Path `$anydeskPath) {
            `$content = Get-Content `$anydeskPath -Raw
            if (`$content -match 'anynet\.id = (\d+ \d+ \d+)') {
                return `$matches[1]
            }
        }

        `$adPath = "`${env:ProgramFiles(x86)}\AnyDesk\AnyDesk.exe"
        if (Test-Path `$adPath) {
            `$output = & `$adPath --get-id 2>`$null
            if (`$output -match '\d+ \d+ \d+') {
                return `$matches[0]
            }
        }

        return "Not Installed"
    } catch {
        return "Not Installed"
    }
}

function Send-Heartbeat {
    try {
        `$ip = Get-LocalIP
        `$anydeskId = Get-AnydeskID

        `$body = @{
            machineId = `$MACHINE_ID
            name = `$MACHINE_NAME
            ip = `$ip
            anydeskId = `$anydeskId
            lastSeen = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        } | ConvertTo-Json

        `$response = Invoke-RestMethod -Uri "`$API_URL/api/agent/heartbeat" ``
            -Method POST ``
            -Body `$body ``
            -ContentType "application/json" ``
            -ErrorAction Stop

        `$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        Add-Content -Path "$logPath" -Value "[`$timestamp] ✓ Heartbeat sent: `$MACHINE_NAME (`$ip)"
        return `$true
    } catch {
        `$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        Add-Content -Path "$logPath" -Value "[`$timestamp] ✗ Failed: `$(`$_.Exception.Message)"
        return `$false
    }
}

# เริ่มต้นทำงาน
`$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Add-Content -Path "$logPath" -Value "`n========================================`n[`$timestamp] NNVPS Agent Started`n========================================"
Add-Content -Path "$logPath" -Value "Machine ID  : `$MACHINE_ID"
Add-Content -Path "$logPath" -Value "Machine Name: `$MACHINE_NAME"
Add-Content -Path "$logPath" -Value "Server URL  : `$API_URL"

while (`$true) {
    Send-Heartbeat
    Start-Sleep -Seconds `$INTERVAL_SECONDS
}
"@

# บันทึกไฟล์ Agent
Set-Content -Path $scriptPath -Value $agentScript -Encoding UTF8
Write-Host "✓ สร้างไฟล์ Agent สำเร็จ" -ForegroundColor Green

# สร้าง Scheduled Task สำหรับ Auto-Start
$taskName = "NNVPS-Agent"

# ลบ Task เก่า (ถ้ามี)
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "✓ ลบ Task เก่าสำเร็จ" -ForegroundColor Green
}

# สร้าง Task ใหม่
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings | Out-Null
Write-Host "✓ ตั้งค่า Auto-Start สำเร็จ" -ForegroundColor Green

# เริ่มต้น Agent ทันที
Start-ScheduledTask -TaskName $taskName
Write-Host "✓ เริ่มต้น Agent สำเร็จ" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ติดตั้งเสร็จสมบูรณ์!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nAgent กำลังทำงานในพื้นหลัง" -ForegroundColor Yellow
Write-Host "ดู Log ได้ที่: $logPath" -ForegroundColor Gray
Write-Host "`nเครื่องนี้จะถูกแสดงในระบบ Admin แล้ว" -ForegroundColor Green
Write-Host "`nกด Enter เพื่อออก..."
Read-Host
