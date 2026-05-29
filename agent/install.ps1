# ============================================================
#  NNVPS Agent Installer
#  รันด้วย: powershell -ExecutionPolicy Bypass -File install.ps1
# ============================================================
param(
    [string]$ServerURL = "https://vps-web1.vercel.app",
    [int]$Interval     = 5    # ส่ง screenshot ทุกกี่วินาที (3 / 5 / 10)
)

$AGENT_DIR  = "$env:ProgramFiles\NNVPSAgent"
$SCRIPT_FILE = "$AGENT_DIR\agent.ps1"
$CONFIG_FILE = "$AGENT_DIR\config.json"
$TASK_NAME  = "NNVPSAgent"
$LOG_FILE   = "$AGENT_DIR\agent.log"

Write-Host "===== NNVPS Agent Installer =====" -ForegroundColor Cyan
Write-Host "Server : $ServerURL"
Write-Host "Interval: ${Interval}s"

# สร้างโฟลเดอร์
New-Item -ItemType Directory -Force $AGENT_DIR | Out-Null

# บันทึก config
@{ serverUrl = $ServerURL; interval = $Interval } |
    ConvertTo-Json | Set-Content -Path $CONFIG_FILE -Encoding UTF8

# ============================================================
#  เขียนไฟล์ agent.ps1 ลงดิสก์
# ============================================================
$AgentCode = @'
# NNVPS Agent — รันอัตโนมัติบนเครื่องลูก
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$CFG      = Get-Content "$env:ProgramFiles\NNVPSAgent\config.json" | ConvertFrom-Json
$SERVER   = $CFG.serverUrl
$INTERVAL = $CFG.interval
$ID       = $env:COMPUTERNAME

function Write-Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts  $msg" | Out-File "$env:ProgramFiles\NNVPSAgent\agent.log" -Append -Encoding UTF8
}

# ---- AnyDesk helpers ----
function Find-AnyDesk {
    @(
        "$env:ProgramFiles\AnyDesk\AnyDesk.exe",
        "${env:ProgramFiles(x86)}\AnyDesk\AnyDesk.exe",
        "$env:LocalAppData\Programs\AnyDesk\AnyDesk.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
}

function Get-AnyDeskID {
    $exe = Find-AnyDesk
    if (-not $exe) { return "" }
    try { return (& $exe --get-id 2>$null).Trim() } catch { return "" }
}

function Set-AnyDeskPassword($pass) {
    $exe = Find-AnyDesk
    if (-not $exe) { Write-Log "AnyDesk ไม่พบ"; return $false }
    try {
        $pass | & $exe --set-password 2>$null
        Write-Log "เปลี่ยนรหัส AnyDesk สำเร็จ"
        return $true
    } catch { Write-Log "เปลี่ยนรหัส AnyDesk ล้มเหลว: $_"; return $false }
}

# ---- Screenshot ----
function Take-Screenshot {
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen
    $bmp    = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)
    $g      = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)

    $ms     = New-Object System.IO.MemoryStream
    $codec  = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
              Where-Object { $_.MimeType -eq 'image/jpeg' }
    $ep     = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality, [long]60)
    $bmp.Save($ms, $codec, $ep)
    $g.Dispose(); $bmp.Dispose()
    return [Convert]::ToBase64String($ms.ToArray())
}

# ---- HTTP helpers ----
function Post-Json($uri, $body) {
    try {
        Invoke-RestMethod -Method POST -Uri "$SERVER$uri" `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json -Depth 5) `
            -TimeoutSec 10
    } catch {}
}

function Get-Command {
    try {
        return Invoke-RestMethod -Method GET `
            -Uri "$SERVER/api/agent/command?id=$ID" -TimeoutSec 5
    } catch {}
    return $null
}

# ---- ลงทะเบียนกับเซิร์ฟเวอร์ ----
$anydeskId = Get-AnyDeskID
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
       Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.' } |
       Select-Object -First 1).IPAddress

Write-Log "เริ่มต้น | Server=$SERVER | AnyDesk=$anydeskId | IP=$ip"

Post-Json "/api/agent/register" @{
    machineId = $ID; name = $ID; ip = $ip; anydeskId = $anydeskId
}

# ---- Main loop ----
while ($true) {
    # ส่ง screenshot
    try {
        $ss = Take-Screenshot
        Post-Json "/api/agent/screenshot" @{ machineId = $ID; screenshot = $ss }
    } catch { Write-Log "Screenshot error: $_" }

    # ตรวจ command
    $res = Get-Command
    if ($res -and $res.command) {
        $cmd = $res.command
        if ($cmd.type -eq "setPassword") {
            $ok = Set-AnyDeskPassword $cmd.payload
            Post-Json "/api/agent/confirm" @{ commandId = $cmd.id; success = $ok }
        }
    }

    Start-Sleep -Seconds $INTERVAL
}
'@

$AgentCode | Set-Content -Path $SCRIPT_FILE -Encoding UTF8

# ============================================================
#  ลงทะเบียน Scheduled Task (เริ่มอัตโนมัติพร้อม Windows)
# ============================================================
$action   = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-WindowStyle Hidden -NonInteractive -ExecutionPolicy Bypass -File `"$SCRIPT_FILE`""

$trigger  = New-ScheduledTaskTrigger -AtStartup

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -RestartInterval  (New-TimeSpan -Minutes 2) `
    -RestartCount 999 `
    -ExecutionTimeLimit (New-TimeSpan -Days 365)

Unregister-ScheduledTask -TaskName $TASK_NAME -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask `
    -TaskName $TASK_NAME `
    -Action   $action `
    -Trigger  $trigger `
    -Settings $settings `
    -RunLevel Highest `
    -Force | Out-Null

Write-Host "ติดตั้งสำเร็จ!" -ForegroundColor Green
Write-Host "กำลังเริ่ม agent..." -ForegroundColor Yellow

Start-ScheduledTask -TaskName $TASK_NAME
Start-Sleep -Seconds 2

$state = (Get-ScheduledTask -TaskName $TASK_NAME).State
Write-Host "สถานะ Task: $state" -ForegroundColor Cyan
Write-Host ""
Write-Host "Log อยู่ที่: $LOG_FILE"
Write-Host "หยุด agent: Stop-ScheduledTask -TaskName $TASK_NAME"
Write-Host "ถอนติดตั้ง: Unregister-ScheduledTask -TaskName $TASK_NAME -Confirm:`$false"
