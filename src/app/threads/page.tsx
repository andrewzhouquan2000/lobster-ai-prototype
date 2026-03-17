'use client';

import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

const tasks = [
  { id: 1, name: '股票分析工具', status: 'active', progress: 75, updated: '2小时前', children: 4 },
  { id: 2, name: 'AI 新闻播客', status: 'done', progress: 100, updated: '今天 08:00', children: 2 },
  { id: 3, name: '客户线索挖掘', status: 'active', progress: 60, updated: '昨天', children: 3 },
];

const logs = [
  { time: '14:42', agent: 'Coder', action: '完成 analyzer.py 编写', status: 'success' },
  { time: '14:38', agent: 'DevOps', action: '创建 OSS bucket', status: 'success' },
  { time: '14:35', agent: 'Coder', action: '开始数据获取模块开发', status: 'info' },
];

export default function ThreadsPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-[#1A1A2E]">任务管理</h1>
        <p className="text-xs text-gray-400 mt-0.5">追踪 AI 团队执行进度</p>
      </div>

      {/* 任务列表 */}
      <div className="px-4 py-3 space-y-3">
        {tasks.map((task) => (
          <Card key={task.id} className="border border-gray-100 rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    task.status === 'done' ? 'bg-green-400' : task.status === 'active' ? 'bg-blue-400' : 'bg-gray-300'
                  }`} />
                  <span className="font-medium text-sm text-[#1A1A2E]">{task.name}</span>
                </div>
                <span className="text-xs text-gray-400">{task.children} 子任务</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${task.progress === 100 ? 'bg-green-400' : 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B]'}`} style={{ width: `${task.progress}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{task.updated}</span>
                <span className={`text-xs ${task.status === 'done' ? 'text-green-500' : 'text-[#FF6B3D]'}`}>
                  {task.status === 'done' ? '✓ 已完成' : `● ${task.progress}%`}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 执行日志 */}
      <div className="px-4 mt-2">
        <Card className="border border-gray-100 rounded-xl shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-xs font-medium text-gray-400 mb-3">执行日志</h3>
            {logs.map((log, i) => (
              <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                <span className="text-[10px] text-gray-300 w-10">{log.time}</span>
                <span className="w-5 h-5 rounded-full bg-blue-50 text-xs flex items-center justify-center">{log.agent === 'Coder' ? '💻' : '⚙️'}</span>
                <span className="flex-1 text-xs text-gray-600">{log.action}</span>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${log.status === 'success' ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-400'}`}>
                  {log.status === 'success' ? '✓' : '●'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}