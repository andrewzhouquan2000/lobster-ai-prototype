'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useCallback } from 'react';

const navItems = [
  { icon: '🏠', label: '首页', href: '/dashboard' },
  { icon: '📁', label: '文件', href: '/artifacts' },
  { icon: '🦞', label: '团队', href: '/agents' },
  { icon: '⚙️', label: '设置', href: '/settings' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [navigating, setNavigating] = useState<string | null>(null);

  const handleNav = useCallback((href: string) => {
    if (pathname === href) return; // 已在当前页面
    
    setNavigating(href);
    
    // 使用 requestAnimationFrame 确保状态更新后再导航
    requestAnimationFrame(() => {
      router.push(href);
      // 200ms 后清除导航状态（给用户反馈时间）
      setTimeout(() => setNavigating(null), 200);
    });
  }, [pathname, router]);

  const handleNewProject = useCallback(() => {
    const newProjectId = `proj_${Date.now()}`;
    router.push(`/chat?project=${newProjectId}`);
  }, [router]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 z-50">
      <div className="flex items-center justify-around relative">
        {/* 首页 */}
        <button
          onClick={() => handleNav('/dashboard')}
          disabled={navigating === '/dashboard'}
          className={`flex flex-col items-center py-2 px-4 transition-all active:scale-95 ${
            navigating === '/dashboard' 
              ? 'text-[#FF6B3D] opacity-60' 
              : pathname === '/dashboard' 
                ? 'text-[#FF6B3D]' 
                : 'text-gray-400 active:text-gray-600'
          }`}
        >
          <span className="text-lg">{navigating === '/dashboard' ? '⏳' : '🏠'}</span>
          <span className="text-[10px] mt-0.5">首页</span>
        </button>

        {/* 文件 */}
        <button
          onClick={() => handleNav('/artifacts')}
          disabled={navigating === '/artifacts'}
          className={`flex flex-col items-center py-2 px-4 transition-all active:scale-95 ${
            navigating === '/artifacts' 
              ? 'text-[#FF6B3D] opacity-60' 
              : pathname === '/artifacts' 
                ? 'text-[#FF6B3D]' 
                : 'text-gray-400 active:text-gray-600'
          }`}
        >
          <span className="text-lg">{navigating === '/artifacts' ? '⏳' : '📁'}</span>
          <span className="text-[10px] mt-0.5">文件</span>
        </button>

        {/* 中间新建按钮 - 更大更醒目 */}
        <button
          onClick={handleNewProject}
          className="flex flex-col items-center -mt-6 transition-all active:scale-90"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center shadow-lg shadow-[#FF6B3D]/40 hover:shadow-xl hover:shadow-[#FF6B3D]/50">
            <span className="text-2xl text-white font-light">＋</span>
          </div>
          <span className="text-[10px] mt-1 text-[#FF6B3D] font-medium">新建</span>
        </button>

        {/* 团队 */}
        <button
          onClick={() => handleNav('/agents')}
          disabled={navigating === '/agents'}
          className={`flex flex-col items-center py-2 px-4 transition-all active:scale-95 ${
            navigating === '/agents' 
              ? 'text-[#FF6B3D] opacity-60' 
              : pathname === '/agents' 
                ? 'text-[#FF6B3D]' 
                : 'text-gray-400 active:text-gray-600'
          }`}
        >
          <span className="text-lg">{navigating === '/agents' ? '⏳' : '🦞'}</span>
          <span className="text-[10px] mt-0.5">团队</span>
        </button>

        {/* 设置 */}
        <button
          onClick={() => handleNav('/settings')}
          disabled={navigating === '/settings'}
          className={`flex flex-col items-center py-2 px-4 transition-all active:scale-95 ${
            navigating === '/settings' 
              ? 'text-[#FF6B3D] opacity-60' 
              : pathname === '/settings' 
                ? 'text-[#FF6B3D]' 
                : 'text-gray-400 active:text-gray-600'
          }`}
        >
          <span className="text-lg">{navigating === '/settings' ? '⏳' : '⚙️'}</span>
          <span className="text-[10px] mt-0.5">设置</span>
        </button>
      </div>
    </div>
  );
}