'use client';

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // 自动跳转到 Dashboard
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center shadow-lg mb-4 mx-auto animate-pulse">
          <span className="text-3xl">🦞</span>
        </div>
        <p className="text-gray-400">加载中...</p>
      </div>
    </div>
  )
}