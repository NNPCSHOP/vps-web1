'use client';

import { useEffect, useState } from 'react';

// Interface สำหรับ BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่าเป็น iOS หรือไม่
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // ตรวจสอบว่าเปิดในโหมด standalone (ติดตั้งแล้ว) หรือไม่
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // ถ้าติดตั้งแล้วไม่ต้องแสดง prompt
    if (isInStandaloneMode) {
      return;
    }

    // จัดการสำหรับ Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // แสดง banner สำหรับ iOS (เพราะ iOS ไม่ support beforeinstallprompt)
    if (isIOSDevice && !isInStandaloneMode) {
      setShowInstallBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // ฟังก์ชันติดตั้งสำหรับ Android/Chrome
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  // ปิด banner
  const handleClose = () => {
    setShowInstallBanner(false);
    // เก็บค่าว่าผู้ใช้ปิด banner แล้ว (ไม่แสดงซ้ำในเซสชั่นเดียวกัน)
    sessionStorage.setItem('installBannerDismissed', 'true');
  };

  // ไม่แสดงถ้าติดตั้งแล้วหรือผู้ใช้ปิด banner
  if (isStandalone || !showInstallBanner || sessionStorage.getItem('installBannerDismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg z-50 animate-slide-up">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">📱 ติดตั้งแอปบนมือถือ</h3>
          {isIOS ? (
            <p className="text-sm opacity-90">
              กด <span className="inline-flex items-center px-2 py-1 bg-white/20 rounded mx-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                </svg>
              </span>
              แล้วเลือก <strong>"Add to Home Screen"</strong>
            </p>
          ) : (
            <p className="text-sm opacity-90">
              ติดตั้งเพื่อใช้งานแบบแอปพลิเคชัน เข้าถึงได้เร็วขึ้น
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="bg-white text-blue-600 font-semibold px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              ติดตั้ง
            </button>
          )}
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white p-2"
            aria-label="ปิด"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Animation CSS */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
