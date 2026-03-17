'use client';

import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

const tokens = [
  { id: 1, service: 'GitHub', icon: '🐙', status: 'active', created: '2026-03-10', lastUsed: '5分钟前' },
  { id: 2, service: 'Aliyun OSS', icon: '☁️', status: 'active', created: '2026-03-08', lastUsed: '1小时前' },
  { id: 3, service: 'Brave Search', icon: '🦁', status: 'active', created: '2026-03-05', lastUsed: '2小时前' },
  { id: 4, service: 'Alpha Vantage', icon: '📈', status: 'expired', created: '2026-02-20', lastUsed: '3天前' },
  { id: 5, service: 'OpenAI', icon: '🤖', status: 'active', created: '2026-03-01', lastUsed: '刚刚' },
];

export default function TokensPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#1A1A2E]">Token 管理</h1>
            <p className="text-xs text-gray-400 mt-0.5">第三方服务授权</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white text-xs">
            + 添加
          </button>
        </div>
      </div>

      {/* 统计 */}
      <div className="px-4 py-3 flex gap-3">
        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-xl font-bold text-[#1A1A2E]">{tokens.length}</div>
          <div className="text-[10px] text-gray-400">已连接</div>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-xl font-bold text-green-500">{tokens.filter(t => t.status === 'active').length}</div>
          <div className="text-[10px] text-gray-400">活跃</div>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-xl font-bold text-red-400">{tokens.filter(t => t.status === 'expired').length}</div>
          <div className="text-[10px] text-gray-400">已过期</div>
        </div>
      </div>

      {/* Token 列表 */}
      <div className="px-4 space-y-2">
        {tokens.map((token) => (
          <Card key={token.id} className="border border-gray-100 rounded-xl shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg">
                  {token.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm text-[#1A1A2E]">{token.service}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      token.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {token.status === 'active' ? '✓ 活跃' : '✗ 过期'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    创建: {token.created} · 使用: {token.lastUsed}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}