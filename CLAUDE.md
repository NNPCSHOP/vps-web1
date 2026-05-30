# CLAUDE.md

ไฟล์นี้ให้คำแนะนำแก่ Claude Code (claude.ai/code) เมื่อทำงานกับโค้ดในโปรเจคนี้

## คำเตือนเรื่อง Next.js Version

**Next.js ในโปรเจคนี้ไม่เหมือนที่คุ้นเคย** โปรเจคนี้ใช้ Next.js **16.2.6** กับ React 19.2.4 — API, รูปแบบ, และโครงสร้างไฟล์อาจแตกต่างจากข้อมูลที่เคยเรียนรู้มา ให้อ่านคู่มือที่เกี่ยวข้องใน `node_modules/next/dist/docs/` ก่อนเขียนโค้ดเสมอ และใส่ใจกับ deprecation notices

## คำสั่งที่ใช้บ่อย

```bash
npm run dev      # รันเซิร์ฟเวอร์พัฒนา (ใช้ Turbopack)
npm run build    # สร้าง production build
npm start        # รัน production server
npm run lint     # ตรวจสอบ ESLint
```

โปรเจคนี้**ไม่มี test** ใดๆ

ต้องตั้งค่า environment variables ก่อนจึงจะใช้ admin panel ได้:
```
ADMIN_USERNAME=<username>
ADMIN_PASSWORD=<password>
```

## ภาพรวมสถาปัตยกรรม

**NNVPS** คือเว็บร้านเช่าคอมฟาร์ม (VPS) แบบอัตโนมัติ ลูกค้าสามารถดูเครื่องที่ว่าง สมัครสมาชิก/เข้าสู่ระบบ เติมเงินผ่าน PromptPay QR แล้วเช่าเครื่องเพื่อรับ AnyDesk credentials

### หน้าเว็บ
- `app/page.tsx` — หน้าร้านลูกค้า (~1970 บรรทัด) ทุก UI component ถูกนิยามไว้ในไฟล์เดียว: `PCCard`, `LoginPanel`, `UserPanel`, `RentalInfoModal`, `CountdownTimerInline`, SVG พื้นหลังหินอ่อน, footer ฯลฯ
- `app/admin/page.tsx` — แดชบอร์ด Admin (~1400 บรรทัด) เช่นเดียวกัน: `AdminDashboard`, `DashboardTab`, `MachinesTab`, `AgentTab`, `UsersTab`, `PaymentsTab` อยู่ในไฟล์เดียว
- `app/download/page.tsx` — หน้าดาวน์โหลดสคริปต์ติดตั้ง agent สำหรับ Windows

### ชั้นข้อมูล

`lib/data.ts` กำหนด type หลัก (`Machine`, `User`, `Payment`) และข้อมูลเริ่มต้น (`INIT_MACHINES`, `INIT_USERS`, `INIT_PAYMENTS`)

`lib/store.ts` มี singleton store แบบ in-memory สามตัว:
- `store` (DataStore) — เก็บเครื่อง, ผู้ใช้, การชำระเงิน **ข้อมูลจะรีเซ็ตกลับเป็นค่าเริ่มต้นทุกครั้งที่รีสตาร์ทเซิร์ฟเวอร์**
- `agentStore` (AgentStore) — ทะเบียน agent แบบ in-memory โดยมี timeout 15 วินาที
- `commandStore` (CommandStore) — คิวคำสั่งที่รอส่งไปยัง agent

`lib/agentStore.ts` คือ**อีก implementation หนึ่ง**ที่บันทึกลงไฟล์ `data/agents.json` และ `data/commands.json` และบันทึก screenshot ไปที่ `public/screenshots/` — มี route บางตัวใช้ไฟล์นี้ บางตัวใช้ `lib/store.ts` (ดูตารางด้านล่าง)

### API Routes

| Route | Store ที่ใช้ |
|---|---|
| `/api/machines`, `/api/machines/[id]` | `lib/store` (in-memory) |
| `/api/users`, `/api/users/[id]` | `lib/store` (in-memory) |
| `/api/admin/login` | env vars เท่านั้น |
| `/api/agent/heartbeat` | `lib/store` agentStore (in-memory) |
| `/api/agent/list` | `lib/store` agentStore (in-memory) |
| `/api/agent/command` | `lib/store` commandStore (in-memory) |
| `/api/agent/setpassword` | `lib/store` store + commandStore |
| `/api/agent/register` | `lib/agentStore` (บันทึกลงไฟล์) |
| `/api/agent/screenshot` | `lib/agentStore` (บันทึกลงไฟล์) |

**ปัญหาที่รู้อยู่แล้ว:** `register` และ `screenshot` เขียนลง `lib/agentStore` (ไฟล์) แต่ `list` อ่านจาก `lib/store` agentStore (in-memory) — agent ที่ลงทะเบียนผ่าน `/api/agent/register` จะ**ไม่ปรากฏ**ใน Agents tab ของ Admin มีเฉพาะ agent ที่ส่ง heartbeat มาที่ `/api/agent/heartbeat` เท่านั้นที่จะแสดง

### ระบบ Agent

เครื่อง Windows ของลูกค้ารัน PowerShell agent (`public/NNVPS-Agent.ps1`, ติดตั้งผ่าน `public/install.ps1` หรือ `agent/install.ps1`) โดย agent จะ:
- ส่ง heartbeat ทุก 5 วินาทีไปที่ `/api/agent/heartbeat` พร้อมข้อมูล CPU/RAM
- ดึงคำสั่งที่รอดำเนินการจาก `/api/agent/command` (เช่น `setPassword`)
- ยืนยันคำสั่งที่ทำเสร็จผ่าน `/api/agent/confirm`
- ส่ง screenshot ไปที่ `/api/agent/screenshot` (บันทึกเป็น `public/screenshots/{machineId}.jpg`)

Admin สามารถสั่งสุ่มรหัส AnyDesk ใหม่ผ่าน Agents tab ซึ่งจะเพิ่มคำสั่ง `setPassword` เข้าคิว

### การยืนยันตัวตน

- **Session ลูกค้า**: ใช้ `localStorage` key `vps_user` และ `vps_logged_in` รหัสผ่านเก็บและเปรียบเทียบแบบ plaintext ใน user object
- **Session Admin**: ใช้ `sessionStorage` key `admin_authed` ตรวจสอบกับ env var `ADMIN_USERNAME` / `ADMIN_PASSWORD`

### รูปแบบ UI

- ทุก page component เป็น `'use client'` และอยู่ในไฟล์ขนาดใหญ่ไฟล์เดียว
- รองรับสองภาษา (ไทย/อังกฤษ) ผ่าน constant `LANG` ที่มี type `LangPack` — state `lang` สลับระหว่าง `'th'` กับ `'en'`
- สลับธีมมืด/สว่างด้วย state `dark` ประเภท boolean — มืด = หินอ่อนดำ + ทอง (`#D4AF37`), สว่าง = หินอ่อนขาว + ชมพู
- สถานะเครื่องฝั่ง Admin (`'active' | 'available' | 'stopped' | 'maintenance'`) ถูกแปลงเป็นสถานะหน้าร้าน (`'active' | 'available' | 'stopped' | 'expired'`) ผ่านฟังก์ชัน `machineToVPS()` ใน `app/page.tsx`
- ราคาเป็นสกุลเงินบาท (฿) เก็บเป็น integer ใน `Machine.priceWeekly` และ `Machine.priceMonthly`

### PWA

กำหนดค่าผ่าน `next-pwa` ใน `next.config.ts` (ปัจจุบันมีแค่ `turbopack: {}`) manifest อยู่ที่ `public/manifest.json` ไอคอน `public/icon-192.png` และ `public/icon-512.png` ยังต้องสร้าง (ดูรายละเอียดใน `PWA_SETUP.md` และ `scripts/generate-icons.html`)
