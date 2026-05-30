import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * API สำหรับดาวน์โหลด Agent Script
 */

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'NNVPS-Agent.ps1')
    const fileContent = fs.readFileSync(filePath, 'utf-8')

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="NNVPS-Agent.ps1"'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'File not found'
    }, { status: 404 })
  }
}
