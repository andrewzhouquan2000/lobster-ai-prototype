'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

const projects = [
  { id: 1, name: '股票分析工具', status: 'active', progress: 75, updated: '2小时前' },
  { id: 2, name: 'AI 新闻播客', status: 'done', progress: 100, updated: '今天 08:00' },
  { id: 3, name: '客户线索挖掘', status: 'active', progress: 60, updated: '昨天' },
];

const agents = [
  { id: 1, name: 'Coder', avatar: '💻', status: 'online' },
  { id: 2, name: 'DevOps', avatar: '⚙️', status: 'busy' },
  { id: 3, name: 'Designer', avatar: '🎨', status: 'online' },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="bg-white px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center">
            <span className="text-lg">🦞</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">早上好</p>
            <h1 className="text-lg font-semibold text-[#1A1A2E]">董事长</h1>
          </div>
        </div>
      </div>

      {/* AI 团队 - 点击跳转到 Agents */}
      <Link href="/agents" className="block px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-gray-400">AI 团队</h2>
          <span className="text-xs text-[#FF6B3D]">查看全部 →</span>
        </div>
        <div className="flex gap-3">
          {agents.map((agent) => (
            <div key={agent.id} className="flex flex-col items-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">
                  {agent.avatar}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  agent.status === 'online' ? 'bg-green-400' : 'bg-orange-400'
                }`} />
              </div>
              <span className="text-xs text-gray-500 mt-1">{agent.name}</span>
            </div>
          ))}
        </div>
      </Link>

      {/* 项目列表 - 点击跳转到 Chat */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-gray-400">项目</h2>
          <span className="text-xs text-[#FF6B3D]">查看全部 →</span>
        </div>
        <div className="space-y-3">
          {projects.map((project) => (
            <Link key={project.id} href="/chat">
              <Card className="border border-gray-100 rounded-xl shadow-sm hover:border-[#FF6B3D]/30 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <h3 className="font-medium text-[#1A1A2E] text-sm">{project.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{project.updated}</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                    <div className={`h-full rounded-full ${project.progress === 100 ? 'bg-green-400' : 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B]'}`} style={{ width: `${project.progress}%` }} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Token 使用量 - 点击跳转到 Tokens */}
      <Link href="/tokens" className="block px-4 mt-4">
        <Card className="border border-gray-100 rounded-xl shadow-sm hover:border-[#FF6B3D]/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">Token 使用量</span>
              <span className="text-xs text-[#FF6B3D]">详情 →</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] rounded-full" />
            </div>
            <p className="text-xs text-gray-500 mt-2">$3.42 / $10.00</p>
          </CardContent>
        </Card>
      </Link>

      {/* 快捷操作 */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <Link href="/deploy">
          <Card className="border border-gray-100 rounded-xl shadow-sm hover:border-[#FF6B3D]/30 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">🚀</span>
              <p className="text-sm font-medium mt-2">部署项目</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/logs">
          <Card className="border border-gray-100 rounded-xl shadow-sm hover:border-[#FF6B3D]/30 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">📋</span>
              <p className="text-sm font-medium mt-2">执行日志</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}