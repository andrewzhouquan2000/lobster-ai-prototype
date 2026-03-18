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
  file_count?: number;
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);

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

  // 加载项目文件数量
  useEffect(() => {
    async function loadFileCounts() {
      if (projects.length === 0) return;
      
      try {
        const res = await fetch('/api/artifacts');
        const data = await res.json();
        const projectIds: string[] = data.projects || [];
        
        // 为每个项目获取文件数量
        const fileCountMap: Record<string, number> = {};
        await Promise.all(
          projectIds.map(async (id) => {
            const fileRes = await fetch(`/api/artifacts/${id}`);
            const fileData = await fileRes.json();
            fileCountMap[id] = (fileData.files || []).length;
          })
        );
        
        setProjects(prev => prev.map(p => ({
          ...p,
          file_count: fileCountMap[p.id] || 0
        })));
      } catch (error) {
        console.error('Failed to load file counts:', error);
      }
    }
    
    if (!loading && projects.length > 0) {
      loadFileCounts();
    }
  }, [loading, projects.length]);

  async function handleRename(projectId: string) {
    if (!editName.trim() || savingName) return;
    
    setSavingName(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name: editName.trim() })
      });
      
      if (res.ok) {
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, name: editName.trim() } : p
        ));
        setEditingProject(null);
        setEditName('');
      }
    } catch (error) {
      console.error('Failed to rename project:', error);
    } finally {
      setSavingName(false);
    }
  }

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
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
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
              <Card key={project.id} className="border border-gray-100 rounded-xl shadow-sm hover:border-[#FF6B3D]/30 transition-colors overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <Link href={`/chat?project=${project.id}`} className="flex-1">
                      {editingProject === project.id ? (
                        <div onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(project.id);
                              if (e.key === 'Escape') setEditingProject(null);
                            }}
                            className="w-full text-sm font-medium text-[#1A1A2E] border border-[#FF6B3D]/30 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/20"
                            autoFocus
                            disabled={savingName}
                          />
                        </div>
                      ) : (
                        <h3 className="font-medium text-[#1A1A2E] text-sm">{project.name}</h3>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(project.updated_at).toLocaleDateString('zh-CN')}
                        {project.file_count !== undefined && project.file_count > 0 && (
                          <span className="ml-2 text-[#FF6B3D]">· {project.file_count} 个文件</span>
                        )}
                      </p>
                    </Link>
                    <button
                      onClick={() => {
                        setEditingProject(project.id);
                        setEditName(project.name);
                      }}
                      className="text-gray-400 hover:text-[#FF6B3D] p-1 rounded hover:bg-orange-50 transition-colors"
                      title="重命名"
                    >
                      ✏️
                    </button>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                    <div className={`h-full rounded-full ${project.progress === 100 ? 'bg-green-400' : 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B]'}`} style={{ width: `${project.progress}%` }} />
                  </div>
                  {/* 文件快捷入口 */}
                  {project.file_count !== undefined && project.file_count > 0 && (
                    <Link 
                      href={`/artifacts?project=${project.id}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-[#FF6B3D] hover:underline"
                    >
                      📁 查看产出文件 →
                    </Link>
                  )}
                </CardContent>
              </Card>
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
    </div>
  );
}