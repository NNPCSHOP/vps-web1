import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // ปิด Turbopack เพื่อแก้ปัญหา ssh2
  // turbopack: {},

  // เพิ่ม webpack config สำหรับ ssh2
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('ssh2');
    }
    return config;
  },
};

// กำหนดค่า PWA
export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // ปิดในโหมด dev
})(nextConfig);
