/**
 * หน้าดาวน์โหลด Agent Script
 * สำหรับติดตั้งบนเครื่องลูกเพื่อเชื่อมต่อกับระบบ
 */
export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <span className="text-3xl">💾</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ดาวน์โหลด NNVPS Agent
          </h1>
          <p className="text-gray-600">
            ติดตั้งบนเครื่องลูกเพื่อเชื่อมต่อกับระบบหลังบ้าน
          </p>
        </div>

        {/* Download Button */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">NNVPS Agent v1.0</h2>
              <p className="text-blue-100 text-sm">
                สำหรับ Windows 10/11
              </p>
            </div>
            <a
              href="/install.ps1"
              download="install.ps1"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              📥 ดาวน์โหลด
            </a>
          </div>
          <div className="text-sm text-blue-100">
            ไฟล์: install.ps1 | ขนาด: ~6 KB
          </div>
        </div>

        {/* Installation Steps */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            📋 วิธีติดตั้ง
          </h3>

          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                ดาวน์โหลดไฟล์
              </h4>
              <p className="text-gray-600 text-sm">
                คลิกปุ่มดาวน์โหลดด้านบน บันทึกไฟล์ <code className="bg-gray-100 px-2 py-1 rounded">install.ps1</code>
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                เปิด PowerShell แบบ Administrator
              </h4>
              <p className="text-gray-600 text-sm mb-2">
                คลิกขวาที่ปุ่ม Start → เลือก <strong>Terminal (Admin)</strong> หรือ <strong>PowerShell (Admin)</strong>
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                รันคำสั่งติดตั้ง
              </h4>
              <p className="text-gray-600 text-sm mb-2">
                พิมพ์คำสั่งนี้ (แก้ Path ให้ตรงกับที่บันทึกไฟล์):
              </p>
              <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm overflow-x-auto">
                Set-ExecutionPolicy Bypass -Scope Process -Force; cd Downloads; .\install.ps1
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                เสร็จสิ้น
              </h4>
              <p className="text-gray-600 text-sm">
                Agent จะทำงานอัตโนมัติในพื้นหลัง และเครื่องจะปรากฏในระบบ Admin ทันที
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            ✨ คุณสมบัติ
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>ส่งข้อมูลเครื่อง (ชื่อ, IP Address, AnyDesk ID) ไปยังระบบอัตโนมัติ</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>รันอัตโนมัติตอนเปิดเครื่อง (Auto-Start)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>ทำงานในพื้นหลังไม่รบกวนผู้ใช้งาน</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>บันทึก Log ไว้ที่ C:\NNVPS\Agent\agent.log</span>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div className="border-t pt-6">
          <p className="text-center text-sm text-gray-500">
            หากมีปัญหาในการติดตั้ง กรุณาติดต่อ Admin
          </p>
        </div>
      </div>
    </div>
  )
}
