# ============================================================
#  NNVPS Server Setup Script (เครื่องแม่)
#  สคริปต์ติดตั้ง Next.js Server อัตโนมัติบน Windows
# ============================================================

Write-Host "===== NNVPS Server Setup =====" -ForegroundColor Cyan
Write-Host "กำลังติดตั้ง Next.js Server สำหรับเครื่องแม่..."

# ตรวจสอบ Node.js
Write-Host "`n[1/5] ตรวจสอบ Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✕ Node.js ยังไม่ได้ติดตั้ง" -ForegroundColor Red
    Write-Host "กำลังติดตั้ง Node.js LTS ผ่าน winget..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS.LTS -e --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✕ ติดตั้ง Node.js ล้มเหลว กรุณาติดตั้งด้วยตนเอง: https://nodejs.org" -ForegroundColor Red
        exit 1
    }
    # รีเฟรช PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    $nodeVersion = node --version
}
Write-Host "✓ Node.js $nodeVersion พร้อมใช้งาน" -ForegroundColor Green

# ตรวจสอบ Git
Write-Host "`n[2/5] ตรวจสอบ Git..." -ForegroundColor Yellow
$gitVersion = git --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✕ Git ยังไม่ได้ติดตั้ง" -ForegroundColor Red
    Write-Host "กำลังติดตั้ง Git ผ่าน winget..." -ForegroundColor Yellow
    winget install --id Git.Git -e --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✕ ติดตั้ง Git ล้มเหลว กรุณาติดตั้งด้วยตนเอง: https://git-scm.com" -ForegroundColor Red
        exit 1
    }
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    $gitVersion = git --version
}
Write-Host "✓ $gitVersion พร้อมใช้งาน" -ForegroundColor Green

# Clone Repository
Write-Host "`n[3/5] ดาวน์โหลดโปรเจค..." -ForegroundColor Yellow
$REPO_URL = "https://github.com/NNPCSHOP/vps-web1.git"
$PROJECT_DIR = "$env:USERPROFILE\Desktop\vps-web1"

if (Test-Path $PROJECT_DIR) {
    Write-Host "⚠ โฟลเดอร์ $PROJECT_DIR มีอยู่แล้ว" -ForegroundColor Yellow
    $overwrite = Read-Host "ต้องการลบและติดตั้งใหม่? (y/n)"
    if ($overwrite -eq 'y') {
        Remove-Item -Path $PROJECT_DIR -Recurse -Force
    } else {
        Write-Host "ยกเลิกการติดตั้ง" -ForegroundColor Red
        exit 0
    }
}

Write-Host "กำลัง clone จาก $REPO_URL ..." -ForegroundColor Cyan
git clone $REPO_URL $PROJECT_DIR
if ($LASTEXITCODE -ne 0) {
    Write-Host "✕ Clone โปรเจคล้มเหลว" -ForegroundColor Red
    exit 1
}
Write-Host "✓ ดาวน์โหลดโปรเจคสำเร็จ" -ForegroundColor Green

# ติดตั้ง Dependencies
Write-Host "`n[4/5] ติดตั้ง dependencies..." -ForegroundColor Yellow
cd $PROJECT_DIR
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✕ npm install ล้มเหลว" -ForegroundColor Red
    exit 1
}
Write-Host "✓ ติดตั้ง dependencies สำเร็จ" -ForegroundColor Green

# สร้าง Batch file สำหรับเริ่มต้น server
Write-Host "`n[5/5] สร้างไฟล์เริ่มต้น server..." -ForegroundColor Yellow
@"
@echo off
cd /d "%~dp0"
echo Starting NNVPS Server...
npm run dev
pause
"@ | Out-File -FilePath "$PROJECT_DIR\start-server.bat" -Encoding ASCII

@"
@echo off
cd /d "%~dp0"
echo Building NNVPS Server...
npm run build
if %ERRORLEVEL% EQU 0 (
    echo Starting production server...
    npm start
) else (
    echo Build failed!
    pause
)
"@ | Out-File -FilePath "$PROJECT_DIR\start-production.bat" -Encoding ASCII

Write-Host "✓ สร้างไฟล์เริ่มต้นสำเร็จ" -ForegroundColor Green

# สรุป
Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  🎉 ติดตั้งเครื่องแม่สำเร็จ!                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nโฟลเดอร์โปรเจค: " -NoNewline
Write-Host $PROJECT_DIR -ForegroundColor Cyan

Write-Host "`n📌 วิธีเริ่มใช้งาน:" -ForegroundColor Yellow
Write-Host "   1. เปิดโฟลเดอร์: " -NoNewline
Write-Host $PROJECT_DIR -ForegroundColor Cyan
Write-Host "   2. ดับเบิลคลิก: " -NoNewline
Write-Host "start-server.bat" -ForegroundColor Green -NoNewline
Write-Host " (Development mode)"
Write-Host "   3. เข้าใช้งานที่: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Green
Write-Host "   4. Admin Panel: " -NoNewline
Write-Host "http://localhost:3000/admin" -ForegroundColor Green

Write-Host "`n💡 Production mode:" -ForegroundColor Yellow
Write-Host "   - ดับเบิลคลิก: " -NoNewline
Write-Host "start-production.bat" -ForegroundColor Green

Write-Host "`n🌐 ถ้าต้องการให้เครื่องอื่นเข้าถึงได้:" -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.' } | Select-Object -First 1).IPAddress
Write-Host "   - ใช้ IP: " -NoNewline
Write-Host "http://$ip`:3000" -ForegroundColor Green
Write-Host "   - อย่าลืมเปิด Firewall port 3000" -ForegroundColor Red

Write-Host "`nกด Enter เพื่อเปิดโฟลเดอร์..."
Read-Host
Start-Process explorer.exe $PROJECT_DIR
