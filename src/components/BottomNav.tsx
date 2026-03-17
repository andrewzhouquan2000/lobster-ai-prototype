'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { icon: '🏠', label: '首页', href: '/dashboard' },
  { icon: '📁', label: '文件', href: '/artifacts' },
  { icon: '🦞', label: '团队', href: '/agents' },
  { icon: '⚙️', label: '设置', href: '/tokens' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 z-50">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 transition-colors ${
                isActive ? 'text-[#FF6B3D]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}