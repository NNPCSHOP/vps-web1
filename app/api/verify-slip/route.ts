import { NextRequest, NextResponse } from 'next/server'

/**
 * API สำหรับตรวจสอบสลิปโอนเงินผ่าน SlipOK
 */

const SLIPOK_API_KEY = 'SLIPOK9UYS6YQ'
const SLIPOK_API_URL = 'https://api.slipok.com/api/line/apikey/67870'

export async function POST(req: NextRequest) {
  try {
    const { slipUrl } = await req.json()

    if (!slipUrl) {
      return NextResponse.json({
        success: false,
        message: 'กรุณาระบุ URL สลิป'
      }, { status: 400 })
    }

    // เรียก SlipOK API
    const response = await fetch(SLIPOK_API_URL, {
      method: 'POST',
      headers: {
        'x-authorization': SLIPOK_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: slipUrl,
        log: true
      })
    })

    const data = await response.json()

    // ตรวจสอบผลลัพธ์
    if (data.success) {
      return NextResponse.json({
        success: true,
        message: 'ตรวจสอบสลิปสำเร็จ',
        data: {
          amount: data.data?.amount || 0,
          transactionDate: data.data?.transactionDate || '',
          sender: data.data?.sender || {},
          receiver: data.data?.receiver || {},
          ref: data.data?.ref || ''
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: data.message || 'ตรวจสอบสลิปล้มเหลว'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error verifying slip:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสลิป'
    }, { status: 500 })
  }
}
