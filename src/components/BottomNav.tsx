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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 z-50">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isLoading = navigating === item.href;
          
          return (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              disabled={isLoading}
              className={`flex flex-col items-center py-2 px-3 transition-all active:scale-95 ${
                isLoading 
                  ? 'text-[#FF6B3D] opacity-60' 
                  : isActive 
                    ? 'text-[#FF6B3D]' 
                    : 'text-gray-400 active:text-gray-600'
              }`}
            >
              <span className="text-lg">
                {isLoading ? '⏳' : item.icon}
              </span>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}