# 📥 วิธีติดตั้ง NNVPS Agent

## 🎯 Agent คืออะไร?

**NNVPS Agent** คือโปรแกรมที่ติดตั้งบนเครื่อง Windows ที่ต้องการให้เป็น "เครื่องลูก" เพื่อ:
- ✅ ส่งภาพหน้าจอแบบเรียลไทม์
- ✅ รับคำสั่งจากระบบ
- ✅ รายงานสถานะเครื่อง
- ✅ เชื่อมต่อ AnyDesk อัตโนมัติ

---

## 📋 ความต้องการระบบ

- ✅ Windows 10/11
- ✅ PowerShell 5.1 ขึ้นไป
- ✅ สิทธิ์ Administrator
- ✅ เชื่อมต่ออินเทอร์เน็ต
- ✅ AnyDesk (ติดตั้งแล้วหรือจะติดตั้งอัตโนมัติ)

---

## 🚀 วิธีติดตั้ง (3 ขั้นตอน)

### **ขั้นตอนที่ 1: ดาวน์โหลดไฟล์**

คลิกขวาที่ลิงก์นี้แล้วเลือก **"Save link as..."**:

👉 [ดาวน์โหลด install.ps1](https://vps-web1.vercel.app/agent/install.ps1)

บันทึกที่: `C:\Temp\install.ps1` (หรือที่ไหนก็ได้)

---

### **ขั้นตอนที่ 2: เปิด PowerShell แบบ Administrator**

1. กด **Windows + X**
2. เลือก **"Windows PowerShell (Admin)"** หรือ **"Terminal (Admin)"**
3. คลิก **Yes** เมื่อถูกถาม UAC

---

### **ขั้นตอนที่ 3: รันคำสั่งติดตั้ง**

Copy คำสั่งนี้แล้ววางใน PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; cd C:\Temp; .\install.ps1
```

**หรือถ้าบันทึกที่อื่น ให้แก้ path:**
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; cd "D:\Downloads"; .\install.ps1
```

---

## ✅ การติดตั้งสำเร็จจะเห็น:

```
===== NNVPS Agent Installer =====
Server : https://vps-web1.vercel.app
Interval: 5s

✓ สร้างโฟลเดอร์ C:\Program Files\NNVPSAgent
✓ บันทึก config.json
✓ สร้างไฟล์ agent.ps1
✓ สร้าง Scheduled Task
✓ Agent กำลังทำงาน!

ดูสถานะ: Get-ScheduledTask -TaskName "NNVPSAgent"
ดู Log: Get-Content "C:\Program Files\NNVPSAgent\agent.log" -Tail 10
```

---

## 🔧 คำสั่งที่เป็นประโยชน์

### **ตรวจสอบสถานะ Agent:**
```powershell
Get-ScheduledTask -TaskName "NNVPSAgent"
```

### **ดู Log แบบเรียลไทม์:**
```powershell
Get-Content "C:\Program Files\NNVPSAgent\agent.log" -Wait -Tail 10
```

### **หยุด Agent:**
```powershell
Stop-ScheduledTask -TaskName "NNVPSAgent"
```

### **เริ่ม Agent:**
```powershell
Start-ScheduledTask -TaskName "NNVPSAgent"
```

### **ถอนการติดตั้ง:**
```powershell
Unregister-ScheduledTask -TaskName "NNVPSAgent" -Confirm:$false
Remove-Item -Path "C:\Program Files\NNVPSAgent" -Recurse -Force
```

---

## 🐛 แก้ปัญหา

### **ปัญหา: "ไม่สามารถรันสคริปต์ได้"**
```powershell
Set-ExecutionPolicy Bypass -Scope CurrentUser -Force
```

### **ปัญหา: "Access Denied"**
- ต้องเปิด PowerShell แบบ **Administrator** เท่านั้น

### **ปัญหา: "Agent ไม่ส่งข้อมูล"**
1. ตรวจสอบอินเทอร์เน็ต
2. ดู Log: `Get-Content "C:\Program Files\NNVPSAgent\agent.log" -Tail 20`
3. ลอง restart: `Restart-Computer`

---

## 📞 ติดต่อสอบถาม

- 📧 Email: no0652492919@gmail.com
- 💬 Facebook: [NNPCSHOP](https://www.facebook.com/sc.phl.photh.da)

---

**เมื่อติดตั้งเสร็จแล้ว เครื่องจะปรากฏในหน้า Admin อัตโนมัติ!** 🎉
