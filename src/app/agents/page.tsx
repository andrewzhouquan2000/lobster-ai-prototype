'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

const agents = [
  { id: 1, name: 'CEO Lobster', role: '任务拆解 · 资源调配', status: 'online', avatar: '🦞', skills: ['项目管理', '决策分析', '团队协调'], active: true },
  { id: 2, name: 'Coder Lobster', role: '代码开发 · 功能实现', status: 'busy', avatar: '💻', skills: ['Python', 'TypeScript', 'React'], active: true },
  { id: 3, name: 'Designer Lobster', role: 'UI/UX 设计', status: 'online', avatar: '🎨', skills: ['Figma', '设计系统', 'CSS'], active: true },
  { id: 4, name: 'DevOps Lobster', role: '部署运维 · 监控告警', status: 'offline', avatar: '⚙️', skills: ['Docker', 'K8s', 'CI/CD'], active: true },
];

export default function AgentsPage() {
  const [agentList, setAgentList] = useState(agents);

  const toggleAgent = (id: number) => {
    setAgentList(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-[#1A1A2E]">AI 团队</h1>
        <p className="text-xs text-gray-400 mt-0.5">管理你的龙虾员工</p>
      </div>

      {/* 统计卡片 */}
      <div className="px-4 py-3 flex gap-3">
        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-xl font-bold text-[#1A1A2E]">{agents.length}</div>
          <div className="text-[10px] text-gray-400">总 Agent</div>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-xl font-bold text-green-500">{agents.filter(a => a.status === 'online').length}</div>
          <div className="text-[10px] text-gray-400">在线</div>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-xl font-bold text-[#FF6B3D]">{agents.filter(a => a.active).length}</div>
          <div className="text-[10px] text-gray-400">已启用</div>
        </div>
      </div>

      {/* Agent 列表 */}
      <div className="px-4 space-y-3">
        {agentList.map((agent) => (
          <Card key={agent.id} className="border border-gray-100 rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center text-xl">
                    {agent.avatar}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    agent.status === 'online' ? 'bg-green-400' : agent.status === 'busy' ? 'bg-orange-400' : 'bg-gray-300'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[#1A1A2E] text-sm">{agent.name}</h3>
                    <button 
                      onClick={() => toggleAgent(agent.id)}
                      className={`w-9 h-5 rounded-full transition-colors ${agent.active ? 'bg-[#FF6B3D]' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${agent.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{agent.role}</p>
                  <div className="flex gap-1 mt-2">
                    {agent.skills.slice(0, 3).map((skill, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-[#FF6B3D] rounded">
                        {skill}
                      </span>
                    ))}
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