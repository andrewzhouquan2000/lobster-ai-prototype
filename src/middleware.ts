import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // 跳过登录验证，直接放行所有请求
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}