'use client';

import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

const skills = [
  { id: 1, name: 'GitHub Integration', desc: '代码仓库管理', icon: '🐙', enabled: true },
  { id: 2, name: 'Aliyun Deploy', desc: '阿里云部署', icon: '☁️', enabled: true },
  { id: 3, name: 'Web Search', desc: '网络搜索', icon: '🔍', enabled: true },
  { id: 4, name: 'Python Exec', desc: 'Python 执行', icon: '🐍', enabled: false },
  { id: 5, name: 'Database', desc: '数据库操作', icon: '🗄️', enabled: false },
  { id: 6, name: 'Docker', desc: '容器管理', icon: '🐳', enabled: false },
];

export default function SkillsPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-[#1A1A2E]">Skills 市场</h1>
        <p className="text-xs text-gray-400 mt-0.5">扩展 AI 团队能力</p>
      </div>

      {/* 搜索 */}
      <div className="px-4 py-3">
        <input 
          type="text" 
          placeholder="搜索 Skills..."
          className="w-full h-9 text-sm bg-white border border-gray-200 rounded-xl px-4"
        />
      </div>

      {/* 统计 */}
      <div className="px-4 flex gap-3">
        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-xl font-bold text-[#1A1A2E]">{skills.filter(s => s.enabled).length}</div>
          <div className="text-[10px] text-gray-400">已启用</div>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-xl font-bold text-[#1A1A2E]">{skills.length}</div>
          <div className="text-[10px] text-gray-400">可用</div>
        </div>
      </div>

      {/* Skills 列表 */}
      <div className="px-4 py-3 space-y-2">
        {skills.map((skill) => (
          <Card key={skill.id} className="border border-gray-100 rounded-xl shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center text-lg">
                  {skill.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{skill.name}</h3>
                    <button className={`w-8 h-4 rounded-full transition-colors ${skill.enabled ? 'bg-[#FF6B3D]' : 'bg-gray-200'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${skill.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">{skill.desc}</p>
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