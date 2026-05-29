import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // กำหนดค่าว่างเพื่อใช้ Turbopack
  turbopack: {},
};

// กำหนดค่า PWA
export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // ปิดในโหมด dev
})(nextConfig);
