'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

interface Agent {
  id: string;
  name: string;
  avatar: string;
  category: string;
  status?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentsRes, projectsRes] = await Promise.all([
          fetch('/api/agents'),
          fetch('/api/projects')
        ]);
        const agentsData = await agentsRes.json();
        const projectsData = await projectsRes.json();
        setAgents(agentsData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center shadow-lg mb-4 mx-auto animate-pulse">
            <span className="text-3xl">🦞</span>
          </div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="bg-white px-4 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center">
            <span className="text-lg">🦞</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">早上好</p>
            <h1 className="text-lg font-semibold text-[#1A1A2E]">董事长</h1>
          </div>
        </div>
        {/* 新建项目按钮 - 头部右侧 */}
        <Link 
          href="/chat"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white rounded-full shadow-md shadow-[#FF6B3D]/20 hover:shadow-lg hover:shadow-[#FF6B3D]/30 transition-all active:scale-95"
        >
          <span className="text-base">＋</span>
          <span className="text-xs font-medium">新建项目</span>
        </Link>
      </div>

      {/* AI 团队 */}
      <Link href="/agents" className="block px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-gray-400">AI 团队 ({agents.length})</h2>
          <span className="text-xs text-[#FF6B3D]">查看全部 →</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {agents.slice(0, 5).map((agent) => (
            <div key={agent.id} className="flex flex-col items-center flex-shrink-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">
                  {agent.avatar}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-400" />
              </div>
              <span className="text-xs text-gray-500 mt-1">{agent.name}</span>
            </div>
          ))}
        </div>
      </Link>

      {/* 项目列表 */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-gray-400">项目 ({projects.length})</h2>
          <span className="text-xs text-[#FF6B3D]">查看全部 →</span>
        </div>
        {projects.length === 0 ? (
          <Link href="/chat">
            <Card className="border-2 border-dashed border-[#FF6B3D]/30 rounded-xl bg-gradient-to-br from-[#FF6B3D]/5 to-[#FF8F6B]/5 hover:border-[#FF6B3D]/50 transition-all cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg">
                  🚀
                </div>
                <p className="text-[#1A1A2E] font-medium text-sm mb-1">创建你的第一个项目</p>
                <p className="text-gray-400 text-xs">告诉我你想做什么，AI 团队帮你实现</p>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/chat?project=${project.id}`}>
                <Card className="border border-gray-100 rounded-xl shadow-sm hover:border-[#FF6B3D]/30 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-[#1A1A2E] text-sm">{project.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(project.updated_at).toLocaleDateString('zh-CN')}
                    </p>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                      <div className={`h-full rounded-full ${project.progress === 100 ? 'bg-green-400' : 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B]'}`} style={{ width: `${project.progress}%` }} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

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
      
      {/* 底部浮动新建按钮 */}
      <Link 
        href="/chat"
        className="fixed bottom-24 right-4 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white rounded-full shadow-xl shadow-[#FF6B3D]/30 hover:shadow-2xl hover:shadow-[#FF6B3D]/40 transition-all active:scale-90 z-40"
      >
        <span className="text-2xl">＋</span>
      </Link>
    </div>
  );
}