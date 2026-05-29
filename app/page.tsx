'use client'

// NNVPS — สไตล์ร้านเกมอัตโนมัติ
import { useState, useEffect } from 'react'
import type { ReactElement } from 'react'

/* ─── TYPES ─── */
type ServerStatus = 'active' | 'stopped' | 'expired' | 'available'
type Lang         = 'th' | 'en'
type LoginTab     = 'login' | 'register'
type RightPanel   = 'login' | 'topup'

interface VPSServer {
  id: string
  name: string
  status: ServerStatus
  ip?: string
  expiresAt?: number // timestamp เวลาหมดอายุ (milliseconds)
  priceWeekly: number
  priceMonthly: number
  specCPU: string
  specGPU: string
  specRAM: string
  specSSD: string
  anydeskId?: string
}

/* ─── TRANSLATIONS ─── */
type LangPack = {
  shopType: string; shopTagline: string
  statAvailable: string; statBusy: string; statClosed: string; statUsers: string; machineUnit: string
  filterAll: string; filterAvailable: string; filterBusy: string
  sectionTitle: string; sectionSub: (n: number) => string
  statusLabels: Record<ServerStatus, string>
  timeLabel: string
  specCPU: string; specGPU: string; specRAM: string; specSSD: string
  priceWeek: string; priceMonth: string
  btnRentNow: string; btnBusy: string; btnClosed: string; btnRenew: string
  loginTitle: string; loginSub: string; loginTab: string; registerTab: string
  labelUser: string; labelEmail: string; labelPass: string; labelConfirmPass: string
  phUser: string; phEmail: string; phPass: string; phConfirmPass: string
  captchaTitle: string; captchaSub: string; captchaDone: string
  btnLogin: string
  greetUser: string; balanceLabel: string
  btnTopup: string; btnLogout: string
  selectAmount: string
  summaryAmount: string; summaryReceive: string; summaryAfter: string
  btnGenQR: string
  modalTitle: string; modalSubtitle: string
  autoCheck: string; waitingPayment: string
  btnConfirming: string; btnConfirm: string
  successTitle: string; successSub: string; balanceShort: string; btnClose: string
}

const LANG: Record<Lang, LangPack> = {
  th: {
    shopType: '🖥 ร้านเช่าคอมฟาร์มอัตโนมัติ', shopTagline: 'สเปกแรงๆ ราคาสบายกระเป๋า',
    statAvailable: 'ว่าง', statBusy: 'ไม่ว่าง', statClosed: 'ปิด', statUsers: 'ยูส', machineUnit: 'เครื่อง',
    filterAll: 'ทั้งหมด', filterAvailable: 'ว่าง', filterBusy: 'ไม่ว่าง',
    sectionTitle: 'เครื่องในร้าน', sectionSub: (n) => `${n} เครื่อง · เครื่องคอมฟาร์มจริง`,
    statusLabels: { active: 'ไม่ว่าง', stopped: 'ปิด', expired: 'ไม่ว่าง', available: 'ว่าง' },
    timeLabel: 'เหลืออีก',
    specCPU: 'Dual Xeon E5-2686 V4 36/72', specGPU: 'RTX 3060 12GB', specRAM: '128 GB', specSSD: '1TB NVMe',
    priceWeek: '฿/อาทิตย์', priceMonth: '฿/เดือน',
    btnRentNow: 'เช่าเลย', btnBusy: 'ไม่ว่าง', btnClosed: 'ปิดปรับปรุง', btnRenew: 'ต่ออายุ',
    loginTitle: 'เข้าสู่ระบบ', loginSub: 'เพื่อเช่าเครื่องในร้านนี้',
    loginTab: 'เข้าสู่ระบบ', registerTab: 'สมัครสมาชิก',
    labelUser: 'Username', labelEmail: 'Email', labelPass: 'Password', labelConfirmPass: 'ยืนยันรหัสผ่าน',
    phUser: 'กรอก Username', phEmail: 'กรอก Email', phPass: 'กรอกรหัสผ่าน', phConfirmPass: 'ยืนยันรหัสผ่านอีกครั้ง',
    captchaTitle: 'ยืนยันความปลอดภัย', captchaSub: 'Cloudflare · ป้องกันบอท', captchaDone: 'Success!',
    btnLogin: 'เข้าสู่ระบบ',
    greetUser: 'ยินดีต้อนรับ', balanceLabel: 'ยอดเงิน',
    btnTopup: '+ เติมเงิน', btnLogout: 'ออกจากระบบ',
    selectAmount: 'เลือกจำนวนเงิน (บาท)',
    summaryAmount: 'จำนวนเงิน', summaryReceive: 'จะได้รับ', summaryAfter: 'ยอดรวมหลังเติม',
    btnGenQR: 'สร้าง QR PromptPay',
    modalTitle: 'ชำระเงิน PromptPay', modalSubtitle: 'สแกน QR Code ด้วยแอปธนาคาร',
    autoCheck: '⚠ ระบบตรวจสลิปอัตโนมัติ', waitingPayment: 'กำลังรอการชำระเงิน...',
    btnConfirming: '◌ กำลังยืนยัน...', btnConfirm: '✓ ยืนยันการชำระเงิน (จำลอง)',
    successTitle: 'ชำระเงินสำเร็จ!', successSub: 'เพิ่มยอดเงินเรียบร้อย',
    balanceShort: 'ยอดเงิน:', btnClose: 'ปิด',
  },
  en: {
    shopType: '🖥 Auto Farm Rental', shopTagline: 'High Specs · Affordable Prices',
    statAvailable: 'Available', statBusy: 'In Use', statClosed: 'Closed', statUsers: 'Users', machineUnit: 'Units',
    filterAll: 'All', filterAvailable: 'Available', filterBusy: 'In Use',
    sectionTitle: 'Machines', sectionSub: (n) => `${n} units · Real farm machines`,
    statusLabels: { active: 'In Use', stopped: 'Closed', expired: 'In Use', available: 'Available' },
    timeLabel: 'Remaining',
    specCPU: 'Dual Xeon E5-2686 V4 36/72', specGPU: 'RTX 3060 12GB', specRAM: '128 GB', specSSD: '1TB NVMe',
    priceWeek: '฿/week', priceMonth: '฿/month',
    btnRentNow: 'Rent Now', btnBusy: 'In Use', btnClosed: 'Maintenance', btnRenew: 'Renew',
    loginTitle: 'Sign In', loginSub: 'To rent machines in this shop',
    loginTab: 'Sign In', registerTab: 'Register',
    labelUser: 'Username', labelEmail: 'Email', labelPass: 'Password', labelConfirmPass: 'Confirm Password',
    phUser: 'Enter Username', phEmail: 'Enter Email', phPass: 'Enter Password', phConfirmPass: 'Confirm Password',
    captchaTitle: 'Security Check', captchaSub: 'Cloudflare · Bot Protection', captchaDone: 'Success!',
    btnLogin: 'Sign In',
    greetUser: 'Welcome', balanceLabel: 'Balance',
    btnTopup: '+ Top-up', btnLogout: 'Sign Out',
    selectAmount: 'Select Amount (THB)',
    summaryAmount: 'Amount', summaryReceive: "You'll receive", summaryAfter: 'Balance after top-up',
    btnGenQR: 'Generate PromptPay QR',
    modalTitle: 'PromptPay Payment', modalSubtitle: 'Scan QR Code with banking app',
    autoCheck: '⚠ Auto Slip Verification', waitingPayment: 'Waiting for payment...',
    btnConfirming: '◌ Confirming...', btnConfirm: '✓ Confirm Payment (Simulate)',
    successTitle: 'Payment Successful!', successSub: 'Balance updated successfully',
    balanceShort: 'Balance:', btnClose: 'Close',
  },
}

/* ─── STATIC DATA ─── */
const PRICE_OPTIONS = [50, 100, 300, 500, 1000]

// สีตามสถานะ
const STATUS_CFG: Record<ServerStatus, { dot: string; badge: string; badgeBg: string }> = {
  active:    { dot: 'bg-yellow-400', badge: 'text-yellow-400', badgeBg: 'bg-yellow-400/15 border-yellow-600/30' },
  expired:   { dot: 'bg-yellow-400', badge: 'text-yellow-400', badgeBg: 'bg-yellow-400/15 border-yellow-600/30' },
  available: { dot: 'bg-green-400',  badge: 'text-green-400',  badgeBg: 'bg-green-400/15  border-green-600/30'  },
  stopped:   { dot: 'bg-gray-500',   badge: 'text-gray-500',   badgeBg: 'bg-gray-500/10   border-gray-600/30'   },
}

const DEFAULT_SPEC = {
  specCPU: 'Dual Xeon E5-2686 V4 36/72',
  specGPU: 'RTX 3060 12GB',
  specRAM: '128 GB',
  specSSD: '1TB NVMe',
}

// ฟังก์ชันคำนวณเวลาที่เหลือ (แบบละเอียดพร้อมวินาที)
function formatTimeRemaining(expiresAt: number, lang: Lang): string {
  const now = Date.now()
  const remaining = expiresAt - now

  if (remaining <= 0) return lang === 'th' ? 'หมดอายุ' : 'Expired'

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

  // จัดรูปแบบเป็น HH:MM:SS
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  if (lang === 'th') {
    if (days > 0) return `${days} วัน ${timeStr}`
    return timeStr
  } else {
    if (days > 0) return `${days}d ${timeStr}`
    return timeStr
  }
}

// Component แสดงเวลาที่เหลือแบบนับถอยหลังอัตโนมัติ (inline ใต้ราคา)
function CountdownTimerInline({ expiresAt, lang, timeLabel }: { expiresAt: number; lang: Lang; timeLabel: string }) {
  const [timeText, setTimeText] = useState(formatTimeRemaining(expiresAt, lang))

  useEffect(() => {
    // อัปเดตทุก 1 วินาที
    const interval = setInterval(() => {
      setTimeText(formatTimeRemaining(expiresAt, lang))
    }, 1000) // 1 วินาที

    return () => clearInterval(interval)
  }, [expiresAt, lang])

  return (
    <div className="w-full px-4 py-2 rounded-lg"
         style={{
           background: 'linear-gradient(135deg, rgba(212,175,55,0.95) 0%, rgba(154,123,42,0.95) 100%)',
           boxShadow: '0 4px 12px rgba(0,0,0,0.5), 0 0 20px rgba(212,175,55,0.3)',
           border: '1px solid rgba(255,215,0,0.3)'
         }}>
      <div className="flex flex-col items-center">
        <span className="text-xs font-semibold text-black/60 mb-1">{timeLabel}</span>
        <span className="text-lg font-black text-black" style={{ textShadow: '0 1px 2px rgba(255,255,255,0.3)' }}>
          {timeText}
        </span>
      </div>
    </div>
  )
}

const INITIAL_SERVERS: VPSServer[] = [
  { id: 'vps-01', name: 'VPS-01', status: 'active', ip: '192.168.1.150',
    expiresAt: Date.now() + (20 * 60 * 60 * 1000 + 2 * 60 * 1000), // 20 ชม. 2 นาที จากตอนนี้
    priceWeekly: 800, priceMonthly: 2800, anydeskId: '112 536 741', ...DEFAULT_SPEC },
  { id: 'vps-02', name: 'VPS-02', status: 'active',
    expiresAt: Date.now() + (1 * 60 * 60 * 1000 + 45 * 60 * 1000), // 1 ชม. 45 นาที จากตอนนี้
    priceWeekly: 800, priceMonthly: 2800, anydeskId: '234 819 052', ...DEFAULT_SPEC },
  { id: 'vps-03', name: 'VPS-03', status: 'available',
    priceWeekly: 800, priceMonthly: 2800, anydeskId: '398 047 261', ...DEFAULT_SPEC },
  { id: 'vps-04', name: 'VPS-04', status: 'stopped',
    priceWeekly: 800, priceMonthly: 2800, anydeskId: '471 203 885', ...DEFAULT_SPEC },
]

/* ─── PAGE COMPONENT ─── */
export default function NNVPSPage() {

  const [servers]                         = useState<VPSServer[]>(INITIAL_SERVERS)
  const [balance,         setBalance]     = useState(2_500)
  const [loggedIn,        setLoggedIn]    = useState(false)
  const [loginTab,        setLoginTab]    = useState<LoginTab>('login')
  const [username,        setUsername]    = useState('')
  const [email,           setEmail]       = useState('')
  const [password,        setPassword]    = useState('')
  const [confirmPass,     setConfirmPass] = useState('')
  const [showPass,        setShowPass]    = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [rightPanel,      setRightPanel]  = useState<RightPanel>('login')
  const [filter,          setFilter]      = useState<'all'|'available'|'busy'>('all')
  const [lang,            setLang]        = useState<Lang>('th')
  const [selectedPrice,   setSelectedPrice] = useState<number | null>(null)
  const [showQR,          setShowQR]      = useState(false)
  const [paymentDone,     setPaymentDone] = useState(false)
  const [confirming,      setConfirming]  = useState(false)
  // สถานะแสดง/ซ่อน login panel มุมขวาบน
  const [showPanel,       setShowPanel]   = useState(false)
  const [showSocial,      setShowSocial]  = useState(false)
  const [dark,            setDark]        = useState(true)
  const [rentalInfo,      setRentalInfo]  = useState<{ server: VPSServer; pass: string; orderId: string } | null>(null)

  const t = LANG[lang]

  // สถิติ real-time
  const availableCount = servers.filter(s => s.status === 'available').length
  const busyCount      = servers.filter(s => s.status === 'active' || s.status === 'expired').length
  const closedCount    = servers.filter(s => s.status === 'stopped').length
  const totalUsers     = 1234 // จำนวนผู้ใช้ทั้งหมด (ตัวอย่าง)

  // กรองเครื่องตาม filter tab
  const filtered = servers.filter(s => {
    if (filter === 'available') return s.status === 'available'
    if (filter === 'busy')      return s.status === 'active' || s.status === 'expired'
    return true
  })

  function handleLogin() {
    if (!username.trim()) return
    setLoggedIn(true)
    setRightPanel('login')
  }

  function confirmPayment() {
    if (!selectedPrice) return
    setConfirming(true)
    setTimeout(() => {
      setBalance(b => b + selectedPrice)
      setPaymentDone(true)
      setConfirming(false)
    }, 2_000)
  }

  function closeModal() {
    setShowQR(false)
    setPaymentDone(false)
    setSelectedPrice(null)
  }

  /* ── RENDER ── */
  return (
    <div className="min-h-screen flex flex-col" style={{ color: dark ? '#e5e7eb' : '#2c1e06', background: 'transparent', position: 'relative' }}>
      {!dark && <MarbleBackground />}
      {dark && <DarkMarbleBackground />}

      {/* ══════════════════════════════════════════════
          HEADER BANNER
      ══════════════════════════════════════════════ */}
      <header style={{
        background: dark
          ? 'linear-gradient(180deg, #1a1208 0%, #2c1e06 40%, #1a1208 100%)'
          : 'rgba(255,240,248,0.45)',
        backdropFilter: dark ? undefined : 'blur(10px)',
        WebkitBackdropFilter: dark ? undefined : 'blur(10px)',
        boxShadow: dark ? '0 4px 32px rgba(0,0,0,0.7)' : '0 2px 16px rgba(200,100,140,0.12)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* เส้นบนสุด */}
        <div style={{ height: 2, background: dark
          ? 'linear-gradient(90deg, transparent 0%, #8B6914 15%, #D4AF37 40%, #F5E6A3 50%, #D4AF37 60%, #8B6914 85%, transparent 100%)'
          : 'linear-gradient(90deg, transparent 0%, #E898B4 15%, #F0B0C8 50%, #E898B4 85%, transparent 100%)'
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">

            {/* โลโก้ + ชื่อ */}
            <div className="flex items-center gap-3">
              <NNVPSLogo />
              <div style={{ width: 1, height: 44, background: dark ? 'linear-gradient(180deg, transparent, #D4AF37, transparent)' : 'linear-gradient(180deg, transparent, #E898B4, transparent)', opacity: 0.5 }} />
              <div>
                <div className="font-black text-xl tracking-[0.2em] leading-none"
                  style={{
                    color: dark ? '#F5E6A3' : '#8B1A4A',
                    textShadow: dark
                      ? '0 1px 0 #92740A, 0 2px 0 #7a6008, 0 3px 0 #5a4804, 0 4px 10px rgba(0,0,0,0.7)'
                      : '0 1px 2px rgba(180,60,100,0.2)',
                  }}>
                  NNVPS
                </div>
                <div className="text-[9px] tracking-[0.3em] uppercase mt-1"
                  style={{ color: dark ? '#9A7B2A' : '#C06080' }}>
                  Premium · VPS
                </div>
              </div>
            </div>

            {/* ขวา */}
            <div className="flex items-center gap-2 flex-wrap">

              {/* Stats */}
              {[
                { count: availableCount, label: t.statAvailable, num: '#86efac', txt: '#4ade80' },
                { count: busyCount,      label: t.statBusy,      num: '#fde68a', txt: '#fbbf24' },
                { count: closedCount,    label: t.statClosed,    num: '#F5E6A3', txt: '#9A7B2A' },
                { count: totalUsers,     label: t.statUsers,     num: '#c084fc', txt: '#a855f7' },
              ].map(s => (
                <div key={s.label} className="px-3 py-1.5 text-center min-w-[50px] rounded-lg"
                  style={{ background: dark ? 'rgba(212,175,55,0.06)' : 'linear-gradient(135deg,#F5E6A3,#D4AF37)', border: dark ? '1px solid rgba(212,175,55,0.18)' : '1px solid rgba(180,140,40,0.4)', boxShadow: dark ? undefined : '0 2px 8px rgba(212,175,55,0.3)' }}>
                  <div className="font-black text-lg tabular-nums leading-none" style={{ color: dark ? s.num : '#1a1208' }}>{s.count}</div>
                  <div className="text-[9px] mt-0.5 font-semibold" style={{ color: dark ? s.txt : '#5a3e00' }}>{s.label}</div>
                </div>
              ))}

              {/* ตัวคั่น */}
              <div style={{ width: 1, height: 28, background: dark ? 'rgba(212,175,55,0.25)' : 'rgba(200,100,140,0.3)' }} />

              {/* Dark/Light toggle */}
              <button onClick={() => setDark(d => !d)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all hover:scale-110"
                style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)' }}
                title={dark ? 'สว่าง' : 'มืด'}>
                {dark ? '☀️' : '🌙'}
              </button>

              {/* ภาษา */}
              <button onClick={() => setLang(l => l === 'th' ? 'en' : 'th')}
                className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all select-none"
                style={{ background: dark ? 'rgba(212,175,55,0.07)' : 'linear-gradient(135deg,#F5E6A3,#D4AF37)', border: dark ? '1px solid rgba(212,175,55,0.2)' : '1px solid rgba(180,140,40,0.4)', boxShadow: dark ? undefined : '0 2px 8px rgba(212,175,55,0.3)' }}>
                <span style={{ color: lang === 'th' ? (dark ? '#F5E6A3' : '#1a1208') : (dark ? '#4a3410' : '#7a5800') }}>TH</span>
                <span style={{ color: dark ? 'rgba(212,175,55,0.25)' : 'rgba(100,70,0,0.3)' }} className="mx-1">|</span>
                <span style={{ color: lang === 'en' ? (dark ? '#F5E6A3' : '#1a1208') : (dark ? '#4a3410' : '#7a5800') }}>EN</span>
              </button>

              {/* Login */}
              {loggedIn ? (
                <button onClick={() => setShowPanel(p => !p)}
                  className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #F5E6A3 0%, #D4AF37 50%, #92740A 100%)',
                    color: '#1a1208',
                    boxShadow: showPanel ? '0 0 20px rgba(212,175,55,0.7)' : '0 0 10px rgba(212,175,55,0.35)',
                  }}>
                  {username.charAt(0).toUpperCase() || 'U'}
                </button>
              ) : (
                <button onClick={() => setShowPanel(p => !p)}
                  className="px-5 py-2 text-sm font-bold rounded-lg transition-all hover:scale-105 tracking-wide"
                  style={{
                    background: dark
                      ? 'linear-gradient(135deg, #F5E6A3 0%, #D4AF37 45%, #92740A 100%)'
                      : 'linear-gradient(135deg, #F5E6A3 0%, #D4AF37 45%, #92740A 100%)',
                    color: '#1a1208',
                    boxShadow: dark ? '0 2px 16px rgba(212,175,55,0.4)' : '0 2px 16px rgba(212,175,55,0.35)',
                  }}>
                  {t.btnLogin}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* เส้นทองล่างสุด */}
        <div style={{ height: 1, background: dark
          ? 'linear-gradient(90deg, transparent 0%, #8B6914 20%, #D4AF37 50%, #8B6914 80%, transparent 100%)'
          : 'linear-gradient(90deg, transparent 0%, #E070A0 20%, #F090B8 50%, #E070A0 80%, transparent 100%)',
          opacity: 0.7 }} />
      </header>

      {/* ══════════════════════════════════════════════
          FLOATING PANEL มุมขวาบน (Login / User)
      ══════════════════════════════════════════════ */}
      {showPanel && (
        <>
          {/* Overlay คลิกปิด */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowPanel(false)}
          />
          {/* Panel */}
          <div className="fixed top-[88px] right-4 z-40 w-72">
            {loggedIn ? (
              <UserPanel
                t={t}
                balance={balance}
                username={username}
                rightPanel={rightPanel}
                setRightPanel={setRightPanel}
                selectedPrice={selectedPrice}
                setSelectedPrice={setSelectedPrice}
                setShowQR={setShowQR}
                onLogout={() => { setLoggedIn(false); setUsername(''); setPassword(''); setShowPanel(false) }}
              />
            ) : (
              <LoginPanel
                t={t}
                loginTab={loginTab}
                setLoginTab={setLoginTab}
                username={username}
                setUsername={setUsername}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                confirmPass={confirmPass}
                setConfirmPass={setConfirmPass}
                showPass={showPass}
                setShowPass={setShowPass}
                showConfirmPass={showConfirmPass}
                setShowConfirmPass={setShowConfirmPass}
                onLogin={handleLogin}
              />
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          MAIN — PC Grid เต็มความกว้าง
      ══════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex-1" style={{ position: 'relative', zIndex: 1 }}>

        {/* Section header + filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-black text-lg flex items-center gap-2" style={{
              color: dark ? '#F5E6A3' : '#1a0f00',
              textShadow: dark
                ? '0 1px 0 #92740A, 0 2px 0 #6b5208, 0 3px 8px rgba(0,0,0,0.6), 0 -1px 0 rgba(255,240,180,0.3)'
                : '0 1px 2px rgba(0,0,0,0.15)',
            }}>
              <span>🖥</span> {t.sectionTitle}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: dark ? '#9A7B2A' : '#5a4010' }}>{t.sectionSub(servers.length)}</p>
          </div>
          {/* Filter tabs */}
          <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.18)' }}>
            {((loggedIn
              ? [
                  { key: 'available', label: t.filterAvailable },
                  { key: 'busy',      label: t.filterBusy      },
                ]
              : [
                  { key: 'all',       label: t.filterAll       },
                  { key: 'available', label: t.filterAvailable },
                  { key: 'busy',      label: t.filterBusy      },
                ]) as { key: typeof filter; label: string }[]).map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
                style={filter === f.key
                  ? { background: 'linear-gradient(135deg,#F5E6A3,#D4AF37,#92740A)', color: '#1a1208', boxShadow: '0 2px 8px rgba(212,175,55,0.4)' }
                  : { color: dark ? '#9A7B2A' : '#8B6914' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ตาราง PC Cards — 2 หรือ 3 คอลัมน์ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(srv => (
            <PCCard
              key={srv.id}
              server={srv}
              lang={lang}
              t={t}
              dark={dark}
              onRent={() => {
                if (!loggedIn) { setShowPanel(true); return }
                // สร้าง Order ID และรหัสผ่านอัตโนมัติ
                const orderId = 'NO' + Math.floor(1000 + Math.random() * 9000)
                const pass    = String(Math.floor(100000 + Math.random() * 900000))
                setRentalInfo({ server: srv, pass, orderId })
              }}
            />
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          QR CODE MODAL
      ══════════════════════════════════════════════ */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-6 w-full max-w-xs"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}>

            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-white font-bold">{t.modalTitle}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{t.modalSubtitle}</p>
              </div>
              <button onClick={closeModal} className="text-gray-600 hover:text-gray-300 text-xl leading-none">✕</button>
            </div>

            {!paymentDone ? (
              <>
                <div className="bg-white rounded-xl p-3 mb-4 flex flex-col items-center gap-2">
                  <MockQRCode />
                  <div className="text-gray-500 text-xs">PromptPay: 0XX-XXX-XXXX</div>
                  <div className="text-gray-900 font-black text-xl">฿{selectedPrice?.toLocaleString()}</div>
                </div>
                <div className="bg-yellow-950/40 border border-yellow-900/40 rounded-xl p-3 mb-4">
                  <div className="text-yellow-500 text-xs font-bold mb-2">{t.autoCheck}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <span key={i} className="block w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${i*120}ms` }} />
                      ))}
                    </div>
                    <span className="text-yellow-700 text-xs">{t.waitingPayment}</span>
                  </div>
                </div>
                <button
                  onClick={confirmPayment} disabled={confirming}
                  className={`w-full py-3 text-sm font-bold rounded-xl transition-all ${
                    confirming ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {confirming ? t.btnConfirming : t.btnConfirm}
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-black font-black"
                  style={{ boxShadow: '0 0 30px rgba(34,197,94,0.5)' }}>✓</div>
                <div className="text-green-400 font-black text-2xl mb-1">{t.successTitle}</div>
                <div className="text-gray-500 text-sm mb-3">{t.successSub}</div>
                <div className="text-yellow-400 font-black text-4xl mb-1">+฿{selectedPrice?.toLocaleString()}</div>
                <div className="text-gray-600 text-sm mb-5">
                  {t.balanceShort} <span className="text-yellow-300 font-bold">฿{balance.toLocaleString()}</span>
                </div>
                <button onClick={closeModal}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-2.5 rounded-xl text-sm">
                  {t.btnClose}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          FLOATING SOCIAL POPUP — มุมขวาล่าง
      ══════════════════════════════════════════════ */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">

        {/* popup links — แสดงเมื่อ showSocial */}
        {showSocial && (
          <>
            {/* overlay คลิกปิด */}
            <div className="fixed inset-0 z-[-1]" onClick={() => setShowSocial(false)} />

            <div className="flex flex-col gap-2 mb-1">
              {[
                { icon: '▶', label: 'วิธีใช้งาน', bg: '#c0392b', url: '#' },
                { icon: 'f', label: 'Facebook',   bg: '#1877f2', url: 'https://www.facebook.com/sc.phl.photh.da' },
                { icon: 'L', label: 'Line',        bg: '#06c755', url: '#' },
                { icon: '◈', label: 'Discord',     bg: '#5865f2', url: '#' },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 self-end"
                  style={{ animation: `fadeSlideUp 0.15s ease ${i * 0.05}s both` }}
                >
                  <span className="text-gray-400 text-xs font-bold bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap">
                    {s.label}
                  </span>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg hover:scale-110 transition-transform shrink-0"
                    style={{ background: s.bg, boxShadow: `0 4px 14px ${s.bg}66` }}
                  >
                    {s.icon}
                  </a>
                </div>
              ))}
            </div>
          </>
        )}

        {/* FAB หลัก */}
        <button
          onClick={() => setShowSocial(p => !p)}
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-xl transition-all hover:scale-110 active:scale-95"
          style={{
            background: showSocial
              ? 'linear-gradient(135deg, #444, #222)'
              : 'linear-gradient(135deg, #c0392b, #7b1010)',
            boxShadow: showSocial ? '0 4px 16px rgba(0,0,0,0.5)' : '0 4px 20px rgba(192,57,43,0.5)',
            transform: showSocial ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          {showSocial ? '✕' : '💬'}
        </button>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ══════════════════════════════════════════════
          RENTAL INFO MODAL
      ══════════════════════════════════════════════ */}
      {rentalInfo && (
        <RentalInfoModal
          server={rentalInfo.server}
          orderId={rentalInfo.orderId}
          pass={rentalInfo.pass}
          onClose={() => setRentalInfo(null)}
          dark={dark}
        />
      )}

      {/* ══════════════════════════════════════════════
          ส่วนวิธีติดตั้งระบบเครื่องแม่ลูก
      ══════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4"
              style={{ color: dark ? '#F5E6A3' : '#1a1208',
                       textShadow: dark ? '0 2px 4px rgba(0,0,0,0.5)' : 'none' }}>
            🖥️ ติดตั้งระบบเครื่องแม่ลูก
          </h2>
          <p style={{ color: dark ? '#9A7B2A' : '#5a3e00' }}>
            ระบบเชื่อมต่อเครื่องคอมพิวเตอร์ของคุณกับระบบ VPS แบบอัตโนมัติ
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* การ์ดซ้าย - ดาวน์โหลด Agent */}
          <div className="rounded-2xl p-8 border transition-all hover:scale-105"
               style={{
                 background: dark ? 'rgba(212,175,55,0.06)' : 'linear-gradient(135deg,#F5E6A3,#D4AF37)',
                 border: dark ? '1px solid rgba(212,175,55,0.18)' : '1px solid rgba(180,140,40,0.4)',
                 boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.7)' : '0 8px 32px rgba(212,175,55,0.3)'
               }}>
            <div className="text-6xl mb-4 text-center">📥</div>
            <h3 className="text-xl font-black mb-3 text-center"
                style={{ color: dark ? '#F5E6A3' : '#1a1208' }}>
              ดาวน์โหลด Agent
            </h3>
            <p className="text-sm mb-6 text-center"
               style={{ color: dark ? '#9A7B2A' : '#5a3e00' }}>
              โปรแกรมติดตั้งบนเครื่องที่ต้องการเชื่อมต่อ
            </p>
            <a href="/agent/install.ps1"
               download
               className="block w-full text-center font-bold py-3 rounded-xl transition-all hover:scale-105"
               style={{
                 background: 'linear-gradient(135deg, #1877F2 0%, #0D5DBE 100%)',
                 color: 'white',
                 boxShadow: '0 4px 12px rgba(24,119,242,0.4)'
               }}>
              💾 ดาวน์โหลด install.ps1
            </a>
          </div>

          {/* การ์ดขวา - คู่มือติดตั้ง */}
          <div className="rounded-2xl p-8 border transition-all hover:scale-105"
               style={{
                 background: dark ? 'rgba(212,175,55,0.06)' : 'linear-gradient(135deg,#F5E6A3,#D4AF37)',
                 border: dark ? '1px solid rgba(212,175,55,0.18)' : '1px solid rgba(180,140,40,0.4)',
                 boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.7)' : '0 8px 32px rgba(212,175,55,0.3)'
               }}>
            <div className="text-6xl mb-4 text-center">📖</div>
            <h3 className="text-xl font-black mb-3 text-center"
                style={{ color: dark ? '#F5E6A3' : '#1a1208' }}>
              คู่มือติดตั้ง
            </h3>
            <p className="text-sm mb-6 text-center"
               style={{ color: dark ? '#9A7B2A' : '#5a3e00' }}>
              วิธีติดตั้งและใช้งานแบบละเอียด
            </p>
            <a href="/INSTALL_GUIDE.md"
               target="_blank"
               className="block w-full text-center font-bold py-3 rounded-xl transition-all hover:scale-105"
               style={{
                 background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                 color: 'white',
                 boxShadow: '0 4px 12px rgba(34,197,94,0.4)'
               }}>
              📚 อ่านคู่มือ
            </a>
          </div>
        </div>

        {/* ขั้นตอนสั้นๆ */}
        <div className="mt-12 max-w-2xl mx-auto rounded-2xl p-6"
             style={{
               background: dark ? 'rgba(212,175,55,0.03)' : 'rgba(212,175,55,0.08)',
               border: dark ? '1px solid rgba(212,175,55,0.12)' : '1px solid rgba(180,140,40,0.2)'
             }}>
          <h4 className="font-black mb-4 text-center"
              style={{ color: dark ? '#F5E6A3' : '#1a1208' }}>
            ⚡ ติดตั้งง่ายๆ 3 ขั้นตอน
          </h4>
          <ol className="space-y-3" style={{ color: dark ? '#9A7B2A' : '#5a3e00' }}>
            <li className="flex items-start gap-3">
              <span className="font-black text-xl">1️⃣</span>
              <span>ดาวน์โหลดไฟล์ <code className="bg-black/20 px-2 py-1 rounded">install.ps1</code></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-black text-xl">2️⃣</span>
              <span>เปิด PowerShell แบบ Administrator</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-black text-xl">3️⃣</span>
              <span>รันคำสั่ง: <code className="bg-black/20 px-2 py-1 rounded">.\install.ps1</code></span>
            </li>
          </ol>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <Footer dark={dark} />
    </div>
  )
}

/* ─── NNVPS LOGO ─── */
function NNVPSLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="NNVPS" width={72} height={72} className="shrink-0 select-none rounded-xl" />
  )
}


/* ─── MARBLE BACKGROUND ─── */
function MarbleBackground() {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
      style={{ position:'fixed', inset:0, width:'100%', height:'100%', zIndex:0, pointerEvents:'none' }}
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mg1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#C47090" stopOpacity="0.3"/>
          <stop offset="20%"  stopColor="#E090A8" stopOpacity="1"/>
          <stop offset="50%"  stopColor="#C86888" stopOpacity="1"/>
          <stop offset="80%"  stopColor="#E090A8" stopOpacity="0.95"/>
          <stop offset="100%" stopColor="#C47090" stopOpacity="0.3"/>
        </linearGradient>
        <linearGradient id="mg2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#D898B0" stopOpacity="0.2"/>
          <stop offset="35%"  stopColor="#E8A8BC" stopOpacity="0.9"/>
          <stop offset="65%"  stopColor="#C87090" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#D898B0" stopOpacity="0.2"/>
        </linearGradient>
      </defs>

      {/* พื้นหลังสีชมพูอ่อน */}
      <rect width="1440" height="900" fill="#FFF0F5"/>

      {/* Hairline veins (บางมาก) */}
      {[
        "M 1300,0 C 1250,60 1180,110 1110,160 C 1050,205 990,245 920,295 C 855,340 780,390 700,445",
        "M 1380,120 C 1320,175 1250,220 1180,270 C 1110,318 1038,368 958,420 C 878,472 790,528 695,585",
        "M 950,0 C 900,55 840,100 775,148 C 715,193 648,240 575,292 C 505,342 428,396 345,452",
        "M 600,0 C 558,48 508,88 455,130 C 405,170 348,212 285,258 C 225,302 160,350 88,402",
        "M 1440,300 C 1390,345 1328,385 1262,428 C 1196,471 1124,516 1045,563 C 968,610 884,658 793,708",
        "M 200,0 C 170,55 132,102 90,150 C 52,195 12,242 0,290",
        "M 1440,500 C 1390,538 1330,572 1265,610 C 1200,648 1130,688 1055,728",
      ].map((d, i) => (
        <path key={i} d={d} fill="none" stroke="rgba(200,100,140,0.14)" strokeWidth="0.6" strokeLinecap="round"/>
      ))}

      {/* Medium veins */}
      {[
        { d:"M 1250,0 C 1200,55 1140,100 1075,148 C 1018,190 958,232 892,280 C 828,326 756,376 678,428 C 602,478 518,532 426,590 C 348,638 262,688 165,738 C 105,770 50,798 0,820", w:3.5 },
        { d:"M 1440,180 C 1388,228 1326,268 1260,310 C 1196,352 1126,396 1050,442 C 976,488 895,536 808,586 C 724,634 633,682 534,732 C 455,772 370,808 275,845", w:2.5 },
        { d:"M 820,0 C 775,52 722,96 664,142 C 610,185 550,230 484,278 C 420,324 350,374 274,426 C 202,474 124,526 38,580", w:2.0 },
        { d:"M 380,0 C 342,50 298,92 250,136 C 205,178 155,222 100,270 C 55,310 18,352 0,395", w:1.5 },
      ].map((v, i) => (
        <path key={i} d={v.d} fill="none" stroke="rgba(200,100,140,0.6)" strokeWidth={v.w} strokeLinecap="round"/>
      ))}

      {/* Main thick veins — เส้นหลักสีทอง */}
      {/* เส้นหลัก 1 (หนาที่สุด) */}
      <path
        d="M 1080,0 C 1032,48 975,90 918,132 C 868,170 815,207 758,248 C 700,290 636,334 568,382 C 502,428 430,476 352,526 C 278,572 198,620 112,670 C 64,698 26,718 0,732"
        fill="none" stroke="url(#mg1)" strokeWidth="16" strokeLinecap="round"/>
      {/* highlight เส้นหลัก 1 */}
      <path
        d="M 1080,0 C 1032,48 975,90 918,132 C 868,170 815,207 758,248 C 700,290 636,334 568,382 C 502,428 430,476 352,526 C 278,572 198,620 112,670 C 64,698 26,718 0,732"
        fill="none" stroke="rgba(255,240,168,0.35)" strokeWidth="3" strokeLinecap="round"/>

      {/* เส้นหลัก 2 (เส้นรอง) */}
      <path
        d="M 1440,60 C 1395,105 1340,142 1282,182 C 1228,219 1170,256 1108,296 C 1044,338 975,382 900,428 C 826,474 746,522 660,572 C 578,618 490,666 395,715 C 328,748 255,780 172,810 C 110,832 52,848 0,858"
        fill="none" stroke="url(#mg2)" strokeWidth="10" strokeLinecap="round"/>
      {/* highlight เส้นหลัก 2 */}
      <path
        d="M 1440,60 C 1395,105 1340,142 1282,182 C 1228,219 1170,256 1108,296 C 1044,338 975,382 900,428 C 826,474 746,522 660,572 C 578,618 490,666 395,715 C 328,748 255,780 172,810 C 110,832 52,848 0,858"
        fill="none" stroke="rgba(255,240,168,0.2)" strokeWidth="2" strokeLinecap="round"/>

      {/* เส้นหลัก 3 (บางกว่า แต่ยังเป็นทอง) */}
      <path
        d="M 680,0 C 638,50 588,92 534,136 C 484,177 428,218 368,262 C 308,306 242,354 170,404 C 104,450 40,498 0,535"
        fill="none" stroke="rgba(196,100,140,0.88)" strokeWidth="7" strokeLinecap="round"/>

      {/* tiny branches */}
      {[
        "M 918,132 C 935,155 948,182 952,215",
        "M 758,248 C 740,272 718,300 708,335",
        "M 568,382 C 590,400 610,425 618,458",
        "M 352,526 C 368,545 380,568 376,600",
        "M 1108,296 C 1125,318 1138,345 1135,378",
        "M 900,428 C 918,448 932,472 928,505",
        "M 660,572 C 675,590 685,614 680,645",
      ].map((d, i) => (
        <path key={i} d={d} fill="none" stroke="rgba(200,100,140,0.7)" strokeWidth="2.5" strokeLinecap="round"/>
      ))}
    </svg>
  )
}

/* ─── DARK MARBLE BACKGROUND (หินอ่อนดำ-ทอง) ─── */
function DarkMarbleBackground() {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
      style={{ position:'fixed', inset:0, width:'100%', height:'100%', zIndex:0, pointerEvents:'none' }}
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* gradient เส้นทองหลัก — สว่างมาก */}
        <linearGradient id="dg1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#7a5800" stopOpacity="0.4"/>
          <stop offset="15%"  stopColor="#D4AF37" stopOpacity="1"/>
          <stop offset="40%"  stopColor="#FFE066" stopOpacity="1"/>
          <stop offset="65%"  stopColor="#D4AF37" stopOpacity="1"/>
          <stop offset="85%"  stopColor="#C9A030" stopOpacity="0.95"/>
          <stop offset="100%" stopColor="#7a5800" stopOpacity="0.4"/>
        </linearGradient>
        {/* gradient เส้นรอง */}
        <linearGradient id="dg2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#6a4a00" stopOpacity="0.2"/>
          <stop offset="30%"  stopColor="#C9A030" stopOpacity="0.9"/>
          <stop offset="60%"  stopColor="#E8C040" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#6a4a00" stopOpacity="0.2"/>
        </linearGradient>
        <linearGradient id="dg3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#B8962E" stopOpacity="0.1"/>
          <stop offset="40%"  stopColor="#D4AF37" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#B8962E" stopOpacity="0.1"/>
        </linearGradient>
        {/* filter glow ทอง */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* พื้นดำ */}
      <rect width="1440" height="900" fill="#080808"/>
      {/* texture ดำเล็กน้อย */}
      <rect width="1440" height="900" fill="url(#noise)" opacity="0.08"/>

      {/* เส้น white hairlines บางๆ */}
      {[
        "M 1300,0 C 1240,70 1170,130 1090,190 C 1010,250 920,310 820,380 C 720,450 610,520 490,595",
        "M 400,0 C 360,60 310,112 255,165 C 200,218 140,272 72,330",
        "M 1440,400 C 1380,450 1310,496 1235,544 C 1160,592 1078,642 990,694",
        "M 950,0 C 900,65 840,120 775,176 C 712,230 640,286 560,346",
        "M 100,200 C 75,255 45,308 10,362",
      ].map((d,i) => (
        <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" strokeLinecap="round"/>
      ))}

      {/* เส้นทองบาง-กลาง */}
      {[
        { d:"M 1200,0 C 1145,65 1080,118 1010,172 C 942,226 866,282 782,340 C 700,396 610,456 512,518 C 418,578 316,640 205,704 C 130,748 60,786 0,816", w:2.5 },
        { d:"M 1440,120 C 1382,172 1315,218 1244,266 C 1174,314 1098,364 1016,416 C 934,468 845,522 750,578 C 656,634 555,690 446,748 C 356,796 260,838 155,870", w:2.0 },
        { d:"M 580,0 C 534,62 480,114 422,168 C 366,220 304,274 236,332 C 170,388 98,446 18,508", w:1.5 },
        { d:"M 1440,600 C 1390,638 1330,672 1264,708 C 1198,744 1126,782 1048,820", w:1.5 },
      ].map((v,i) => (
        <path key={i} d={v.d} fill="none" stroke="rgba(212,175,55,0.55)" strokeWidth={v.w} strokeLinecap="round"/>
      ))}

      {/* เส้นหลัก 1 — หนาและสว่าง + glow */}
      <path
        d="M 1060,0 C 998,58 928,108 856,158 C 790,205 720,252 646,302 C 568,354 484,408 394,464 C 306,518 210,574 108,630 C 60,658 22,678 0,692"
        fill="none" stroke="url(#dg1)" strokeWidth="18" strokeLinecap="round" filter="url(#glow)"/>
      {/* highlight เส้นหลัก 1 */}
      <path
        d="M 1060,0 C 998,58 928,108 856,158 C 790,205 720,252 646,302 C 568,354 484,408 394,464 C 306,518 210,574 108,630 C 60,658 22,678 0,692"
        fill="none" stroke="rgba(255,240,160,0.6)" strokeWidth="5" strokeLinecap="round"/>

      {/* เส้นหลัก 2 — คู่แรก เยื้องกัน */}
      <path
        d="M 1440,280 C 1382,334 1314,378 1242,424 C 1170,470 1092,518 1008,568 C 924,618 832,670 734,722 C 638,774 534,824 422,870 C 348,900 275,900 200,900"
        fill="none" stroke="url(#dg2)" strokeWidth="12" strokeLinecap="round" filter="url(#glow)"/>
      <path
        d="M 1440,280 C 1382,334 1314,378 1242,424 C 1170,470 1092,518 1008,568 C 924,618 832,670 734,722 C 638,774 534,824 422,870 C 348,900 275,900 200,900"
        fill="none" stroke="rgba(255,230,120,0.5)" strokeWidth="3.5" strokeLinecap="round"/>

      {/* เส้นหลัก 3 — เส้นรองขนาดกลาง */}
      <path
        d="M 760,0 C 706,60 645,110 580,162 C 518,212 450,264 376,318 C 304,372 224,428 138,486 C 80,524 34,552 0,570"
        fill="none" stroke="url(#dg3)" strokeWidth="8" strokeLinecap="round"/>
      <path
        d="M 760,0 C 706,60 645,110 580,162 C 518,212 450,264 376,318 C 304,372 224,428 138,486 C 80,524 34,552 0,570"
        fill="none" stroke="rgba(255,230,120,0.35)" strokeWidth="2" strokeLinecap="round"/>

      {/* กิ่งก้านทอง */}
      {[
        "M 856,158 C 875,185 892,218 888,255",
        "M 646,302 C 668,326 685,356 680,392",
        "M 394,464 C 415,488 428,518 422,552",
        "M 1242,424 C 1262,450 1275,480 1268,515",
        "M 1008,568 C 1026,590 1038,618 1032,650",
        "M 580,162 C 598,188 610,220 604,256",
      ].map((d,i) => (
        <path key={i} d={d} fill="none" stroke="rgba(212,175,55,0.65)" strokeWidth="3" strokeLinecap="round"/>
      ))}
    </svg>
  )
}

/* ─── PC CARD ─── */
function PCCard({ server, lang, t, dark, onRent }: {
  server: VPSServer; lang: Lang; t: LangPack; dark: boolean
  onRent: () => void
}) {
  const cfg        = STATUS_CFG[server.status]
  const isAvailable = server.status === 'available'
  const isStopped   = server.status === 'stopped'
  const isExpired   = server.status === 'expired'
  const isActive    = server.status === 'active'

  const cardBg     = dark ? '#110e06'               : 'rgba(255,240,248,0.82)'
  const cardBorder = dark ? 'rgba(212,175,55,0.22)' : 'rgba(200,100,140,0.35)'
  const cardHover  = dark ? 'rgba(212,175,55,0.5)'  : 'rgba(200,100,140,0.65)'
  const nameColor  = dark ? '#F5E6A3'               : '#1a0f00'
  const specColor  = dark ? '#C9A84C'               : '#3a2800'
  const subColor   = dark ? '#9A7B2A'               : '#5a4010'
  const priceColor = dark ? '#F5C842'               : '#7a5a00'

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        backdropFilter: dark ? undefined : 'blur(12px)',
        WebkitBackdropFilter: dark ? undefined : 'blur(12px)',
        boxShadow: dark
          ? '0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.08), inset 0 1px 0 rgba(212,175,55,0.15)'
          : '0 8px 32px rgba(180,60,100,0.18), 0 2px 8px rgba(180,60,100,0.1), 0 0 0 1px rgba(255,255,255,0.6)',
        transform: 'translateY(0)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = `1px solid ${cardHover}`
        e.currentTarget.style.transform = 'translateY(-6px)'
        e.currentTarget.style.boxShadow = dark
          ? '0 20px 50px rgba(0,0,0,0.8), 0 6px 16px rgba(0,0,0,0.5), 0 0 20px rgba(212,175,55,0.12), inset 0 1px 0 rgba(212,175,55,0.25)'
          : '0 20px 48px rgba(180,60,100,0.28), 0 6px 16px rgba(180,60,100,0.15), 0 0 0 1px rgba(255,255,255,0.8)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = `1px solid ${cardBorder}`
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = dark
          ? '0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.08), inset 0 1px 0 rgba(212,175,55,0.15)'
          : '0 8px 32px rgba(180,60,100,0.18), 0 2px 8px rgba(180,60,100,0.1), 0 0 0 1px rgba(255,255,255,0.6)'
      }}
    >

      {/* รูป PC */}
      <div className="relative">
        <GamingPCVisual id={server.id} status={server.status} dark={dark} />

        {/* Badge สถานะ — มุมบนซ้าย */}
        <div className={`absolute top-3 left-3 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.badgeBg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${isActive ? 'animate-pulse' : ''}`} />
          <span className={cfg.badge}>{t.statusLabels[server.status]}</span>
        </div>

      </div>

      {/* ชื่อเครื่อง */}
      <div className="px-4 pt-3 pb-1">
        <div className="font-black text-lg tracking-wider" style={{
          color: nameColor,
          textShadow: dark
            ? '0 1px 0 #92740A, 0 2px 0 #7a6008, 0 3px 0 #5a4804, 0 4px 8px rgba(0,0,0,0.7), 0 -1px 0 rgba(255,240,180,0.4)'
            : '0 1px 0 rgba(180,140,40,0.3), 0 2px 4px rgba(0,0,0,0.12)',
        }}>{server.name}</div>
      </div>

      {/* สเปก */}
      <div className="px-4 pb-2 space-y-1">
        {[
          { icon: '🔲', val: server.specCPU },
          { icon: '🎮', val: server.specGPU },
          { icon: '💾', val: server.specRAM },
          { icon: '💿', val: server.specSSD },
        ].map(s => (
          <div key={s.val} className="flex items-center gap-1.5 text-xs" style={{ color: subColor }}>
            <span>{s.icon}</span> <span style={{ color: specColor }}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* ราคา + ปุ่ม */}
      <div className="px-4 pb-4 pt-2 flex items-end justify-between">
        <div className="flex-1">
          <div className="flex items-baseline gap-1">
            <span className="font-black text-2xl tabular-nums" style={{
              color: priceColor,
              textShadow: dark
                ? '0 1px 0 #92740A, 0 2px 0 #6b5208, 0 3px 6px rgba(0,0,0,0.7), 0 -1px 0 rgba(255,240,160,0.3)'
                : '0 1px 2px rgba(0,0,0,0.1)',
            }}>{server.priceWeekly.toLocaleString()}</span>
            <span className="text-xs" style={{ color: subColor }}>{t.priceWeek}</span>
          </div>
          <div className="text-[10px]" style={{ color: subColor }}>
            📅 {server.priceMonthly.toLocaleString()} {t.priceMonth}
          </div>
        </div>

        {isAvailable && (
          <button onClick={onRent}
            className="text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#F5E6A3,#D4AF37,#92740A)', color: '#1a1208', boxShadow: '0 0 14px rgba(212,175,55,0.4)' }}>
            {t.btnRentNow}
          </button>
        )}
        {(isActive || isExpired) && (
          <button disabled className="text-xs font-bold px-4 py-2 rounded-xl cursor-not-allowed"
            style={dark
              ? { background: 'rgba(212,175,55,0.08)', color: '#9A7B2A', border: '1px solid rgba(212,175,55,0.2)' }
              : { background: 'rgba(212,175,55,0.15)', color: '#7a5800', border: '1px solid rgba(180,140,40,0.35)' }}>
            {isExpired ? t.btnRenew : t.btnBusy}
          </button>
        )}
        {isStopped && (
          <button disabled className="text-xs font-bold px-4 py-2 rounded-xl cursor-not-allowed"
            style={dark
              ? { background: 'rgba(255,255,255,0.04)', color: '#555', border: '1px solid rgba(255,255,255,0.08)' }
              : { background: 'rgba(212,175,55,0.1)', color: '#9a7820', border: '1px solid rgba(180,140,40,0.25)' }}>
            {t.btnClosed}
          </button>
        )}
      </div>

      {/* เวลาที่เหลือ - ด้านล่างสุดของการ์ด */}
      {server.expiresAt && (
        <div className="px-4 pb-3">
          <CountdownTimerInline expiresAt={server.expiresAt} lang={lang} timeLabel={t.timeLabel} />
        </div>
      )}
    </div>
  )
}

/* ─── SERVER RACK VISUAL (SVG) ─── */
function GamingPCVisual({ id, status, dark }: { id: string; status: ServerStatus; dark: boolean }) {
  const isOn   = status === 'active' || status === 'available'
  const glow   = isOn ? '#D4AF37' : '#3a2e10'
  const led1   = status === 'available' ? '#86efac' : status === 'active' ? '#F5C842' : '#555'
  const led2   = status === 'active' ? '#F5C842' : '#555'

  return (
    <div
      className="w-full h-44 flex items-center justify-center relative overflow-hidden select-none"
      style={{ background: dark
        ? 'linear-gradient(135deg, #0c0a02 0%, #1a1508 50%, #120e04 100%)'
        : 'linear-gradient(135deg, #FDF8EE 0%, #F5EDD5 50%, #FDF6E3 100%)' }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-7xl font-black tracking-widest" style={{ color: dark ? 'rgba(212,175,55,0.04)' : 'rgba(212,175,55,0.08)' }}>NNVPS</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-8"
        style={{ background: `linear-gradient(to top, ${glow}20, transparent)` }} />

      {/* Server Rack SVG */}
      <svg width="180" height="165" viewBox="0 0 180 165">
        <defs>
          <linearGradient id={`gld-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#92740A"/>
            <stop offset="30%"  stopColor="#D4AF37"/>
            <stop offset="60%"  stopColor="#F5E6A3"/>
            <stop offset="100%" stopColor="#D4AF37"/>
          </linearGradient>
          {/* Animation สำหรับกระพริบ */}
          <animate id={`blink-${id}`} attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
        </defs>

        {/* Server Rack 1 - บน */}
        <rect x="20" y="15" width="140" height="40" rx="4" fill={dark ? '#0d0b03' : '#F5EDD5'} stroke="#3a2e10" strokeWidth="2"/>
        <rect x="25" y="20" width="110" height="30" rx="2" fill={dark ? 'rgba(212,175,55,0.05)' : 'rgba(212,175,55,0.1)'} stroke="rgba(212,175,55,0.3)" strokeWidth="1"/>
        {/* LED indicators */}
        <circle cx="145" cy="30" r="4" fill={led1}>
          {isOn && <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>}
        </circle>
        <circle cx="145" cy="42" r="4" fill={led2}>
          {isOn && <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite"/>}
        </circle>
        {/* Horizontal lines (vents) */}
        {[0,1,2,3,4,5].map((i) => (
          <line key={`v1-${i}`} x1="30" y1={23 + i*5} x2="130" y2={23 + i*5} stroke={glow} strokeWidth="0.5" opacity="0.4"/>
        ))}

        {/* Server Rack 2 - กลาง */}
        <rect x="20" y="62" width="140" height="40" rx="4" fill={dark ? '#0d0b03' : '#F5EDD5'} stroke="#3a2e10" strokeWidth="2"/>
        <rect x="25" y="67" width="110" height="30" rx="2" fill={dark ? 'rgba(212,175,55,0.05)' : 'rgba(212,175,55,0.1)'} stroke="rgba(212,175,55,0.3)" strokeWidth="1"/>
        <circle cx="145" cy="77" r="4" fill={led1}>
          {isOn && <animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite"/>}
        </circle>
        <circle cx="145" cy="89" r="4" fill={led2}>
          {isOn && <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.2s" repeatCount="indefinite"/>}
        </circle>
        {[0,1,2,3,4,5].map((i) => (
          <line key={`v2-${i}`} x1="30" y1={70 + i*5} x2="130" y2={70 + i*5} stroke={glow} strokeWidth="0.5" opacity="0.4"/>
        ))}

        {/* Server Rack 3 - ล่าง */}
        <rect x="20" y="109" width="140" height="40" rx="4" fill={dark ? '#0d0b03' : '#F5EDD5'} stroke="#3a2e10" strokeWidth="2"/>
        <rect x="25" y="114" width="110" height="30" rx="2" fill={dark ? 'rgba(212,175,55,0.05)' : 'rgba(212,175,55,0.1)'} stroke="rgba(212,175,55,0.3)" strokeWidth="1"/>
        <circle cx="145" cy="124" r="4" fill={led1}>
          {isOn && <animate attributeName="opacity" values="1;0.5;1" dur="2.5s" repeatCount="indefinite"/>}
        </circle>
        <circle cx="145" cy="136" r="4" fill={led2}>
          {isOn && <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.7s" repeatCount="indefinite"/>}
        </circle>
        {[0,1,2,3,4,5].map((i) => (
          <line key={`v3-${i}`} x1="30" y1={117 + i*5} x2="130" y2={117 + i*5} stroke={glow} strokeWidth="0.5" opacity="0.4"/>
        ))}

        {/* Gold accent bars */}
        <rect x="20" y="10" width="140" height="3" fill={`url(#gld-${id})`} opacity="0.8" rx="1"/>
        <rect x="20" y="152" width="140" height="3" fill={`url(#gld-${id})`} opacity="0.8" rx="1"/>
      </svg>
    </div>
  )
}

/* ─── LOGIN PANEL ─── */
function LoginPanel({ t, loginTab, setLoginTab, username, setUsername,
  email, setEmail, password, setPassword, confirmPass, setConfirmPass,
  showPass, setShowPass, showConfirmPass, setShowConfirmPass, onLogin }: {
  t: LangPack; loginTab: LoginTab; setLoginTab: (v: LoginTab) => void
  username: string; setUsername: (v: string) => void
  email: string; setEmail: (v: string) => void
  password: string; setPassword: (v: string) => void
  confirmPass: string; setConfirmPass: (v: string) => void
  showPass: boolean; setShowPass: (v: boolean) => void
  showConfirmPass: boolean; setShowConfirmPass: (v: boolean) => void
  onLogin: () => void
}) {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800/60 rounded-2xl p-5"
      style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-lg shrink-0">👤</div>
        <div>
          <div className="text-white font-bold text-sm">{t.loginTitle}</div>
          <div className="text-gray-500 text-xs">{t.loginSub}</div>
        </div>
      </div>

      <div className="flex bg-black/40 rounded-xl p-1 mb-4">
        {(['login', 'register'] as LoginTab[]).map(tab => (
          <button key={tab}
            onClick={() => setLoginTab(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              loginTab === tab ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}>
            {tab === 'login' ? t.loginTab : t.registerTab}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <label className="text-gray-400 text-xs font-bold flex items-center gap-1 mb-1.5">
          <span>👤</span> {t.labelUser}
        </label>
        <input
          type="text" value={username} onChange={e => setUsername(e.target.value)}
          placeholder={t.phUser}
          className="w-full bg-black/40 border border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-700/60 transition-colors"
        />
      </div>

      {/* Email - แสดงเฉพาะตอนสมัครสมาชิก */}
      {loginTab === 'register' && (
        <div className="mb-3">
          <label className="text-gray-400 text-xs font-bold flex items-center gap-1 mb-1.5">
            <span>📧</span> {t.labelEmail}
          </label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder={t.phEmail}
            className="w-full bg-black/40 border border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-700/60 transition-colors"
          />
        </div>
      )}

      <div className={loginTab === 'register' ? 'mb-3' : 'mb-4'}>
        <label className="text-gray-400 text-xs font-bold flex items-center gap-1 mb-1.5">
          <span>🔒</span> {t.labelPass}
        </label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
            placeholder={t.phPass}
            className="w-full bg-black/40 border border-gray-700/60 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-700/60 transition-colors"
          />
          <button onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm">
            {showPass ? '🙈' : '👁'}
          </button>
        </div>
      </div>

      {/* Confirm Password - แสดงเฉพาะตอนสมัครสมาชิก */}
      {loginTab === 'register' && (
        <div className="mb-4">
          <label className="text-gray-400 text-xs font-bold flex items-center gap-1 mb-1.5">
            <span>🔐</span> {t.labelConfirmPass}
          </label>
          <div className="relative">
            <input
              type={showConfirmPass ? 'text' : 'password'} value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
              placeholder={t.phConfirmPass}
              className="w-full bg-black/40 border border-gray-700/60 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-700/60 transition-colors"
            />
            <button onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm">
              {showConfirmPass ? '🙈' : '👁'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-700/60 rounded-xl p-3 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center text-sm">🛡</div>
            <div>
              <div className="text-white text-xs font-bold">{t.captchaTitle}</div>
              <div className="text-gray-500 text-[10px]">{t.captchaSub}</div>
            </div>
          </div>
          <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
        </div>
        <div className="mt-2 bg-black/40 border border-gray-700/40 rounded-lg px-2 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-[8px] text-black font-black">✓</div>
            <span className="text-white text-[10px] font-bold">{t.captchaDone}</span>
          </div>
          <span className="text-orange-400 text-[9px] font-bold">CLOUDFLARE</span>
        </div>
      </div>

      <p className="text-green-400 text-[10px] text-center mb-3">พร้อมแล้ว — กดเข้าสู่ระบบได้</p>

      <button
        onClick={onLogin}
        className="w-full py-3 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold rounded-xl transition-all mb-3 text-sm"
        style={{ boxShadow: '0 0 20px rgba(220,38,38,0.35)' }}
      >
        {t.btnLogin}
      </button>

    </div>
  )
}

/* ─── USER PANEL (logged in) ─── */
function UserPanel({ t, balance, username, rightPanel, setRightPanel,
  selectedPrice, setSelectedPrice, setShowQR, onLogout }: {
  t: LangPack; balance: number; username: string
  rightPanel: RightPanel; setRightPanel: (v: RightPanel) => void
  selectedPrice: number | null; setSelectedPrice: (v: number | null) => void
  setShowQR: (v: boolean) => void; onLogout: () => void
}) {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800/60 rounded-2xl p-5 space-y-4"
      style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-red-700 rounded-full flex items-center justify-center text-white font-black text-sm">
            {username.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="text-white font-bold text-sm">{t.greetUser}</div>
            <div className="text-gray-500 text-xs">{username || 'User_NNPC'}</div>
          </div>
        </div>
        <button onClick={onLogout} className="text-gray-600 hover:text-gray-400 text-xs transition-colors">{t.btnLogout}</button>
      </div>

      <div className="bg-black/40 border border-yellow-900/30 rounded-xl p-4 text-center">
        <div className="text-gray-500 text-[10px] tracking-widest mb-1">{t.balanceLabel}</div>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-yellow-500 font-bold text-xl">฿</span>
          <span className="text-yellow-300 font-black text-4xl tabular-nums"
            style={{ textShadow: '0 0 16px rgba(234,179,8,0.3)' }}>{balance.toLocaleString()}</span>
        </div>
      </div>

      <button
        onClick={() => setRightPanel(rightPanel === 'topup' ? 'login' : 'topup')}
        className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all"
        style={{ boxShadow: '0 0 14px rgba(220,38,38,0.3)' }}
      >
        {t.btnTopup}
      </button>

      {rightPanel === 'topup' && (
        <div className="space-y-3 pt-1">
          <div className="text-gray-400 text-[10px] font-bold tracking-widest">{t.selectAmount}</div>
          <div className="grid grid-cols-5 gap-1.5">
            {PRICE_OPTIONS.map(p => (
              <button key={p} onClick={() => setSelectedPrice(p)}
                className={`py-2.5 text-xs font-bold rounded-lg border transition-all ${
                  selectedPrice === p
                    ? 'bg-red-600 border-red-500 text-white scale-105'
                    : 'bg-gray-800/60 border-gray-700/50 text-gray-400 hover:border-red-800/50 hover:text-red-400'
                }`}>
                {p}
              </button>
            ))}
          </div>

          {selectedPrice && (
            <div className="bg-black/40 border border-gray-800/60 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-gray-500">
                <span>{t.summaryAmount}</span>
                <span className="text-white font-bold">฿{selectedPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>{t.summaryReceive}</span>
                <span className="text-yellow-400 font-bold">+฿{selectedPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500 border-t border-gray-800 pt-1.5">
                <span>{t.summaryAfter}</span>
                <span className="text-green-400 font-bold">฿{(balance + selectedPrice).toLocaleString()}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => selectedPrice && setShowQR(true)}
            disabled={!selectedPrice}
            className={`w-full py-2.5 text-sm font-bold rounded-xl transition-all ${
              selectedPrice ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gray-800/60 text-gray-600 cursor-not-allowed'
            }`}>
            {t.btnGenQR}
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── RENTAL INFO MODAL ─── */
const DURATION_OPTIONS = [
  { label: '1 อาทิตย์', days: 7,  price: 800  },
  { label: '1 เดือน',   days: 30, price: 2800 },
]

function RentalInfoModal({ server, orderId, pass, onClose, dark }: {
  server: VPSServer; orderId: string; pass: string
  onClose: () => void; dark: boolean
}) {
  const [copied,   setCopied]   = useState<string | null>(null)
  const [duration, setDuration] = useState(DURATION_OPTIONS[0]) // default 1 อาทิตย์ (index 0)
  const [step,     setStep]     = useState<'select' | 'info'>('select')

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const gold   = 'linear-gradient(135deg,#F5E6A3,#D4AF37,#92740A)'
  const cardBg = dark ? '#1a1208' : '#fffdf5'
  const border = dark ? 'rgba(212,175,55,0.3)' : 'rgba(180,140,40,0.35)'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}>

        {/* หัว */}
        <div style={{ background: gold, padding: '1px' }}>
          <div className="flex items-center justify-between px-5 py-3"
            style={{ background: dark ? '#0d0a02' : '#fffdf5' }}>
            <div>
              <div className="font-black text-base" style={{ color: '#D4AF37' }}>
                {step === 'select' ? '🖥 เลือกระยะเวลาเช่า' : '✓ เช่าเครื่องสำเร็จ'}
              </div>
              <div className="text-xs mt-0.5" style={{ color: dark ? '#9A7B2A' : '#8B6914' }}>
                {server.name} · {step === 'select' ? 'กรุณาเลือกระยะเวลา' : 'พร้อมใช้งาน'}
              </div>
            </div>
            <button onClick={onClose} className="text-2xl leading-none" style={{ color: '#9A7B2A' }}>✕</button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">

          {step === 'select' ? (
            /* ── STEP 1: เลือกเวลา ── */
            <>
              <div className="grid grid-cols-1 gap-2">
                {DURATION_OPTIONS.map(opt => (
                  <button key={opt.label}
                    onClick={() => setDuration(opt)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl transition-all active:scale-[0.98]"
                    style={duration.days === opt.days
                      ? { background: gold, color: '#1a1208', boxShadow: '0 2px 12px rgba(212,175,55,0.4)' }
                      : { background: dark ? 'rgba(212,175,55,0.06)' : 'rgba(212,175,55,0.08)', border: `1px solid ${border}`, color: dark ? '#C9A84C' : '#7a5800' }
                    }>
                    <div className="flex items-center gap-3">
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${duration.days === opt.days ? 'border-[#1a1208]' : 'border-current'}`}>
                        {duration.days === opt.days && <span className="w-2 h-2 rounded-full bg-[#1a1208]"/>}
                      </span>
                      <span className="font-bold">{opt.label}</span>
                    </div>
                    <span className="font-black text-lg">฿{opt.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>

              {/* สรุปราคา */}
              <div className="rounded-xl p-3 text-center" style={{ background: dark ? 'rgba(212,175,55,0.05)' : 'rgba(212,175,55,0.08)', border: `1px solid ${border}` }}>
                <div className="text-xs mb-1" style={{ color: dark ? '#9A7B2A' : '#8B6914' }}>ยอดที่ต้องชำระ</div>
                <div className="font-black text-3xl" style={{ color: '#D4AF37' }}>฿{duration.price.toLocaleString()}</div>
                <div className="text-xs mt-0.5" style={{ color: dark ? '#6B5208' : '#9a7820' }}>{duration.label}</div>
              </div>

              <button onClick={() => setStep('info')}
                className="w-full py-3 font-bold rounded-xl text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: gold, color: '#1a1208', boxShadow: '0 2px 12px rgba(212,175,55,0.4)' }}>
                ยืนยันและรับข้อมูลเชื่อมต่อ →
              </button>
            </>
          ) : (
            /* ── STEP 2: ข้อมูลการเชื่อมต่อ ── */
            <>
              {/* ระยะเวลาที่เลือก */}
              <div className="flex items-center justify-between rounded-xl px-4 py-2.5"
                style={{ background: gold }}>
                <span className="font-bold text-sm text-[#1a1208]">⏱ {duration.label}</span>
                <span className="font-black text-[#1a1208]">฿{duration.price.toLocaleString()}</span>
              </div>

              {/* Order ID */}
              <div className="text-center py-2 rounded-xl" style={{ background: dark ? 'rgba(212,175,55,0.06)' : 'rgba(212,175,55,0.08)', border: `1px solid ${border}` }}>
                <div className="text-xs mb-1" style={{ color: dark ? '#9A7B2A' : '#8B6914' }}>หมายเลขการเช่า</div>
                <div className="font-black text-2xl tracking-widest" style={{ color: '#D4AF37' }}>{orderId}</div>
              </div>

              {/* AnyDesk ID */}
              <div className="rounded-xl p-4 space-y-1" style={{ background: dark ? 'rgba(0,0,0,0.3)' : 'rgba(212,175,55,0.06)', border: `1px solid ${border}` }}>
                <div className="text-xs font-bold" style={{ color: dark ? '#9A7B2A' : '#8B6914' }}>🖥 AnyDesk ID</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-black text-xl tracking-wider" style={{ color: dark ? '#F5E6A3' : '#1a1208' }}>
                    {server.anydeskId ?? 'ยังไม่ตั้งค่า'}
                  </span>
                  <button onClick={() => copy(server.anydeskId ?? '', 'id')}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                    style={{ background: gold, color: '#1a1208' }}>
                    {copied === 'id' ? '✓ คัดลอก' : 'คัดลอก'}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="rounded-xl p-4 space-y-1" style={{ background: dark ? 'rgba(0,0,0,0.3)' : 'rgba(212,175,55,0.06)', border: `1px solid ${border}` }}>
                <div className="text-xs font-bold" style={{ color: dark ? '#9A7B2A' : '#8B6914' }}>🔒 รหัสผ่าน AnyDesk</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-black text-2xl tracking-[0.2em]" style={{ color: dark ? '#F5C842' : '#7a5800' }}>
                    {pass}
                  </span>
                  <button onClick={() => copy(pass, 'pass')}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                    style={{ background: gold, color: '#1a1208' }}>
                    {copied === 'pass' ? '✓ คัดลอก' : 'คัดลอก'}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep('select')}
                  className="px-4 py-3 font-bold rounded-xl text-sm transition-all"
                  style={{ background: dark ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.12)', color: dark ? '#C9A84C' : '#7a5800', border: `1px solid ${border}` }}>
                  ← ย้อนกลับ
                </button>
                <button onClick={onClose}
                  className="flex-1 py-3 font-bold rounded-xl text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: gold, color: '#1a1208', boxShadow: '0 2px 12px rgba(212,175,55,0.4)' }}>
                  รับทราบ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── FOOTER ─── */
function Footer({ dark }: { dark: boolean }) {
  const bg      = dark ? 'linear-gradient(180deg,#0a0808 0%,#110d0d 100%)' : 'linear-gradient(180deg,#FFD6E7 0%,#FFC2DA 50%,#FFD6E7 100%)'
  const line    = dark ? 'linear-gradient(90deg,transparent,#8B6914,#D4AF37,#8B6914,transparent)' : 'linear-gradient(90deg,transparent,#E898B4,#F0B0C8,#E898B4,transparent)'
  const title   = dark ? '#F5E6A3' : '#8B1A4A'
  const sub     = dark ? '#9A7B2A' : '#C06080'
  const body    = dark ? '#9a9ab0' : '#8B4060'
  const bullet  = dark ? '#D4AF37' : '#C03070'
  const tagBg   = dark ? 'rgba(212,175,55,0.1)'   : 'rgba(200,100,140,0.12)'
  const tagBr   = dark ? 'rgba(212,175,55,0.2)'   : 'rgba(200,100,140,0.3)'
  const tagTxt  = dark ? '#C9A84C'                 : '#C03070'
  const divider = dark ? 'rgba(212,175,55,0.15)'  : 'rgba(200,100,140,0.25)'
  const copy    = dark ? '#555570'                 : '#C06080'
  const copyHL  = dark ? '#D4AF37'                 : '#8B1A4A'

  return (
    <footer style={{ background: bg, position: 'relative', zIndex: 1 }}>
      <div style={{ height: 2, background: line }}/>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* คอลัมน์ 1: แบรนด์ */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="NNVPS" width={48} height={48} className="rounded-xl"/>
              <div>
                <div className="font-black text-base" style={{ color: title }}>NNVPS</div>
                <div className="text-xs" style={{ color: sub }}>ระบบปล่อยเช่าคอมอัตโนมัติ</div>
              </div>
            </div>
            <p className="text-xs leading-relaxed mb-4" style={{ color: body }}>
              แพลตฟอร์มจัดการร้านเช่าคอมพิวเตอร์ครบวงจร — ลูกค้าเติมเงิน เลือกเครื่อง และใช้งานได้เอง เจ้าของร้านควบคุมทุกอย่างผ่านเว็บ ไม่ต้องนั่งเฝ้าตลอดเวลา
            </p>
            <div className="flex flex-wrap gap-2">
              {['⚡ เปิด–ปิดอัตโนมัติ','💳 เติมเงินออนไลน์','🔒 AnyDesk Password','📷 Screenshot Live'].map(tag => (
                <span key={tag} className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: tagBg, border: `1px solid ${tagBr}`, color: tagTxt }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* คอลัมน์ 2: ฟีเจอร์หลัก */}
          <div>
            <div className="flex items-center gap-2 font-bold text-sm mb-4" style={{ color: title }}>
              <span>✦</span> ฟีเจอร์หลัก
            </div>
            <ul className="space-y-2">
              {[
                'Dashboard สรุปรายได้และสถานะเครื่อง',
                'ตั้งราคารายสัปดาห์ / รายเดือน',
                'ร้านค้าในระบบ & ภาษา (ไทย / EN)',
                'รีโมต AnyDesk, SSH ควบคุมเครื่อง',
                'ภาพหน้าจอ Live ทุก 3–10 วินาที',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-xs" style={{ color: body }}>
                  <span style={{ color: bullet }} className="mt-0.5 shrink-0">•</span> {f}
                </li>
              ))}
            </ul>
          </div>

          {/* คอลัมน์ 3: นำทาง */}
          <div>
            <div className="flex items-center gap-2 font-bold text-sm mb-4" style={{ color: title }}>
              <span>➤</span> นำทาง
            </div>
            <ul className="space-y-2.5">
              {[
                { icon: '🔍', label: 'ค้นหาร้านเช่าคอม' },
                { icon: '👤', label: 'เข้าสู่ระบบผู้เช่า' },
                { icon: '🏪', label: 'เข้าสู่ระบบเจ้าของร้าน', href: '/admin' },
              ].map(l => (
                <li key={l.label}>
                  <a href={l.href ?? '#'}
                    className="flex items-center gap-2 text-xs transition-colors hover:opacity-80"
                    style={{ color: body }}>
                    <span>{l.icon}</span> {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* เส้นแบ่ง + copyright */}
        <div className="mt-10 pt-5" style={{ borderTop: `1px solid ${divider}` }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs" style={{ color: copy }}>
              © 2026 <span style={{ color: copyHL }} className="font-bold">NNVPS</span> — ระบบเช่าคอมอัตโนมัติ สงวนลิขสิทธิ์
            </p>
            <p className="text-xs" style={{ color: copy }}>
              สร้างเพื่อร้านเช่าคอมไทย · ใช้งานง่าย ขยายจำนวนเครื่องได้ไม่จำกัด
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─── MOCK QR CODE ─── */
function MockQRCode() {
  const CELL = 6; const N = 25; const SIZE = CELL * N
  const m: number[][] = Array.from({ length: N }, () => new Array<number>(N).fill(0))
  function finder(r: number, c: number) {
    for (let dr = 0; dr < 7; dr++) for (let dc = 0; dc < 7; dc++) {
      const edge = dr===0||dr===6||dc===0||dc===6, inner = dr>=2&&dr<=4&&dc>=2&&dc<=4
      m[r+dr][c+dc] = edge||inner ? 1 : 0
    }
  }
  finder(0,0); finder(0,18); finder(18,0)
  for (let i=8;i<17;i++){m[6][i]=i%2===0?1:0;m[i][6]=i%2===0?1:0}
  m[4][9]=1
  const SEED=[1,0,1,1,0,0,1,0,1,1,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,1,0,1,0,1,1,0,0,1,0,0,1,1,0]
  let si=0
  for (let r=0;r<N;r++) for (let c=0;c<N;c++) {
    const inTL=r<9&&c<9,inTR=r<9&&c>15,inBL=r>15&&c<9
    if (m[r][c]===0&&!inTL&&!inTR&&!inBL) m[r][c]=SEED[si++%SEED.length]
  }
  const rects: ReactElement[]=[]
  for (let r=0;r<N;r++) for (let c=0;c<N;c++)
    if (m[r][c]===1) rects.push(<rect key={`${r}-${c}`} x={c*CELL} y={r*CELL} width={CELL} height={CELL} fill="black"/>)
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={SIZE} height={SIZE} fill="white"/>
      {rects}
    </svg>
  )
}
