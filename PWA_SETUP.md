# 📱 คู่มือติดตั้ง PWA (Progressive Web App)

## ✅ สิ่งที่ทำเสร็จแล้ว

1. ✅ ติดตั้ง `next-pwa` package
2. ✅ สร้าง `manifest.json` สำหรับกำหนดค่าแอป
3. ✅ สร้าง Component `InstallPrompt` แสดงแบนเนอร์ติดตั้ง
4. ✅ อัปเดต `layout.tsx` เพิ่ม metadata และ manifest
5. ✅ กำหนดค่า `next.config.ts` สำหรับ PWA

## 📋 สิ่งที่ต้องทำต่อ

### 1. สร้างไอคอนแอป (สำคัญ!)

คุณต้องสร้างไอคอน 2 ขนาด:
- `public/icon-192.png` (192x192 pixels)
- `public/icon-512.png` (512x512 pixels)

**วิธีสร้าง:**

#### ตัวเลือก 1: ใช้ HTML Generator (ง่ายที่สุด)
```bash
# เปิดไฟล์นี้ในเบราว์เซอร์
scripts/generate-icons.html
```
จากนั้นคลิกปุ่ม "ดาวน์โหลด" แล้วย้ายไฟล์ไปที่ `public/`

#### ตัวเลือก 2: ใช้เครื่องมือออนไลน์
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

#### ตัวเลือก 3: ใช้ Figma/Photoshop
แปลงไฟล์ `public/icon.svg` เป็น PNG ขนาดที่ต้องการ

### 2. ทดสอบการทำงาน

```bash
# Build และ run production mode
npm run build
npm start
```

จากนั้นเปิดเบราว์เซอร์:
- **Desktop**: `http://localhost:3000`
- **Mobile**: ใช้ ngrok หรือ deploy ขึ้น hosting ก่อน (PWA ต้องใช้ HTTPS)

### 3. ทดสอบบนมือถือจริง

#### Android (Chrome):
1. เข้าเว็บด้วย Chrome
2. จะมีแบนเนอร์ด้านล่างขึ้นมา "📱 ติดตั้งแอปบนมือถือ"
3. กดปุ่ม "ติดตั้ง"
4. แอปจะถูกเพิ่มไปที่หน้าจอหลัก

#### iOS (Safari):
1. เข้าเว็บด้วย Safari
2. จะมีแบนเนอร์ด้านล่างแสดงวิธีติดตั้ง
3. กดปุ่ม Share (⋮ หรือ 📤)
4. เลือก "Add to Home Screen"
5. ตั้งชื่อและกด Add

## 🎯 ฟีเจอร์ที่เพิ่มเข้ามา

### 1. Install Prompt Component
- ✅ ตรวจจับอุปกรณ์ (iOS / Android)
- ✅ แสดงคำแนะนำเฉพาะแพลตฟอร์ม
- ✅ ปุ่มติดตั้งสำหรับ Android/Chrome
- ✅ คำแนะนำ manual สำหรับ iOS
- ✅ Animation slide-up สวยงาม
- ✅ ปิดได้ และจำสถานะ (ไม่แสดงซ้ำในเซสชั่นเดียวกัน)
- ✅ ซ่อนอัตโนมัติถ้าติดตั้งแล้ว

### 2. PWA Features
- ✅ Offline support (Service Worker)
- ✅ Install to home screen
- ✅ Standalone mode (เหมือนแอปจริง)
- ✅ Custom theme color
- ✅ Splash screen (iOS)

## 🔧 การปรับแต่ง

### เปลี่ยนชื่อแอป
แก้ไขใน `public/manifest.json`:
```json
{
  "name": "ชื่อแอปของคุณ",
  "short_name": "ชื่อย่อ"
}
```

### เปลี่ยนสีธีม
แก้ไขใน `public/manifest.json`:
```json
{
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
```

### ปรับแต่งข้อความในแบนเนอร์
แก้ไขใน `app/components/InstallPrompt.tsx`

## 🚀 Deploy

PWA ต้องใช้ **HTTPS** เท่านั้น ให้ deploy ไปที่:
- Vercel (แนะนำสำหรับ Next.js)
- Netlify
- Railway
- หรือ hosting ที่รองรับ HTTPS

```bash
# Deploy to Vercel
npm i -g vercel
vercel
```

## 📱 การทดสอบ PWA

เช็กว่า PWA ของคุณพร้อมหรือยัง:
- Chrome DevTools → Lighthouse → Run audit → PWA category
- ควรได้คะแนน 100/100

## ⚠️ หมายเหตุ

- PWA จะทำงานเต็มรูปแบบเมื่อใช้ **HTTPS** เท่านั้น
- ใน development mode (localhost) บาง feature จะไม่ทำงาน
- iOS มีข้อจำกัดบาง features ของ PWA
- ต้องมีไอคอนครบถ้วนถึงจะติดตั้งได้

## 🎉 เสร็จแล้ว!

หลังจากสร้างไอคอนและ deploy แล้ว ผู้ใช้จะสามารถติดตั้งเว็บของคุณเป็นแอปบนมือถือได้เลย!
