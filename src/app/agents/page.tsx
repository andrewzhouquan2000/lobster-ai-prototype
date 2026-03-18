'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';
import { useRouter } from 'next/navigation';

interface Agent {
  id: string;
  name: string;
  avatar: string;
  category: string;
  skills: string;
  description: string;
  call_count?: number;
  status?: string;
  current_user?: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const router = useRouter();

  // 获取状态样式
  const getStatusStyle = (status?: string) => {
    switch (status) {
      case 'busy':
        return {
          dot: 'bg-yellow-400',
          text: '使用中',
          bg: 'bg-yellow-50',
          animate: 'animate-pulse'
        };
      case 'offline':
        return {
          dot: 'bg-gray-400',
          text: '离线',
          bg: 'bg-gray-50',
          animate: ''
        };
      default:
        return {
          dot: 'bg-green-400',
          text: '在线',
          bg: 'bg-green-50',
          animate: ''
        };
    }
  };

  // 雇佣 Agent
  const handleHire = async (agentId: string) => {
    // 跳转到聊天页面，创建新项目
    router.push(`/chat?agent=${agentId}`);
  };

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        setAgents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 定期刷新状态（每 5 秒）
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/agents')
        .then(res => res.json())
        .then(data => setAgents(data))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const categories = ['all', ...new Set(agents.map(a => a.category))];
  const filteredAgents = selectedCategory === 'all'
    ? agents
    : agents.filter(a => a.category === selectedCategory);

  // 统计数据
  const totalCalls = agents.reduce((sum, a) => sum + (a.call_count || 0), 0);
  const availableCount = agents.filter(a => a.status === 'available' || !a.status).length;
  const busyCount = agents.filter(a => a.status === 'busy').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] px-4 py-6 text-white">
        <h1 className="text-xl font-bold">🦞 人才市场</h1>
        <p className="text-white/80 text-sm mt-1">
          {availableCount} 个专家在线 · 已服务 {totalCalls} 次任务
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FF6B3D]">{agents.length}</div>
            <div className="text-xs text-gray-500 mt-1">专家总数</div>
          </div>
          <div className="text-center border-x border-gray-100">
            <div className="text-2xl font-bold text-green-500">{availableCount}</div>
            <div className="text-xs text-gray-500 mt-1">在线可用</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{busyCount}</div>
            <div className="text-xs text-gray-500 mt-1">使用中</div>
          </div>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#FF6B3D] hover:text-[#FF6B3D]'
            }`}
          >
            {cat === 'all' ? '全部' : cat}
          </button>
        ))}
      </div>

      {/* Agent 列表 */}
      <div className="px-4 grid gap-4">
        {filteredAgents.map(agent => {
          const statusStyle = getStatusStyle(agent.status);
          return (
            <Card 
              key={agent.id} 
              className={`border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md ${
                agent.status === 'busy' ? 'opacity-90' : ''
              }`}
            >
              <CardContent className="p-4">
                {/* 状态栏 */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${statusStyle.bg}`}>
                    <div className={`w-2 h-2 rounded-full ${statusStyle.dot} ${statusStyle.animate}`} />
                    <span className="text-xs font-medium text-gray-600">{statusStyle.text}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    已调用 <span className="font-semibold text-[#FF6B3D]">{agent.call_count || 0}</span> 次
                  </div>
                </div>

                {/* Agent 信息 */}
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B3D]/10 to-[#FF8F6B]/10 flex items-center justify-center text-2xl flex-shrink-0">
                    {agent.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#1A1A2E]">{agent.name}</h3>
                      {agent.status === 'busy' && agent.current_user && (
                        <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
                          {agent.current_user} 使用中
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{agent.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {agent.skills?.split(', ').slice(0, 3).map(skill => (
                        <span 
                          key={skill} 
                          className="px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-500"
                        >
                          {skill}
                        </span>
                      ))}
                      {(agent.skills?.split(', ').length || 0) > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-400">
                          +{(agent.skills?.split(', ').length || 0) - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="mt-4">
                  <button
                    onClick={() => handleHire(agent.id)}
                    disabled={agent.status === 'busy'}
                    className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                      agent.status === 'busy'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white hover:shadow-lg hover:shadow-orange-200 active:scale-[0.98]'
                    }`}
                  >
                    {agent.status === 'busy' ? '任务执行中...' : '🤝 雇佣'}
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 空状态 */}
      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">暂无该分类的专家</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}