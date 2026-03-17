'use client';

import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

const logs = [
  { id: 1, time: '14:42', agent: 'Coder', action: '完成 analyzer.py 编写', status: 'success' },
  { id: 2, time: '14:38', agent: 'DevOps', action: '创建 OSS bucket', status: 'success' },
  { id: 3, time: '14:35', agent: 'Coder', action: '开始数据获取模块开发', status: 'info' },
  { id: 4, time: '14:32', agent: 'CEO', action: '任务拆解完成', status: 'info' },
  { id: 5, time: '14:28', agent: 'Coder', action: '警告：API 调用接近限额', status: 'warning' },
  { id: 6, time: '14:25', agent: 'System', action: '错误：GitHub API 认证失败', status: 'error' },
];

export default function LogsPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#1A1A2E]">日志监控</h1>
            <p className="text-xs text-gray-400 mt-0.5">实时执行记录</p>
          </div>
          <button className="text-xs text-[#FF6B3D]">导出</button>
        </div>
      </div>

      {/* 统计 */}
      <div className="px-4 py-3 flex gap-3">
        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-xl font-bold text-[#1A1A2E]">234</div>
          <div className="text-[10px] text-gray-400">今日操作</div>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-xl font-bold text-green-500">98.7%</div>
          <div className="text-[10px] text-gray-400">成功率</div>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-xl font-bold text-[#1A1A2E]">1.2s</div>
          <div className="text-[10px] text-gray-400">平均响应</div>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="px-4 pb-2 flex gap-2">
        {['全部', '成功', '错误', '警告'].map((f, i) => (
          <button key={f} className={`px-3 py-1.5 rounded-full text-xs ${i === 0 ? 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* 日志列表 */}
      <div className="px-4">
        <Card className="border border-gray-100 rounded-xl shadow-sm">
          <CardContent className="p-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 py-3 border-b border-gray-50 last:border-0">
                <span className="text-[10px] text-gray-300 w-10 font-mono">{log.time}</span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  log.status === 'success' ? 'bg-green-50 text-green-500' :
                  log.status === 'error' ? 'bg-red-50 text-red-500' :
                  log.status === 'warning' ? 'bg-yellow-50 text-yellow-500' : 'bg-gray-50 text-gray-400'
                }`}>
                  {log.status === 'success' ? '✓' : log.status === 'error' ? '✗' : log.status === 'warning' ? '!' : '●'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">{log.agent}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{log.action}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}