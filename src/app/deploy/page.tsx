'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

const targets = [
  { id: 'oss', name: '阿里云 OSS', icon: '☁️', desc: '静态文件托管' },
  { id: 'vercel', name: 'Vercel', icon: '▲', desc: '一键部署前端' },
  { id: 'ecs', name: '阿里云 ECS', icon: '🖥️', desc: '云服务器部署' },
];

const deployments = [
  { id: 1, project: 'Stock Analyzer', target: 'Aliyun OSS', status: 'success', time: '今天 14:45' },
  { id: 2, project: 'AI News', target: 'Vercel', status: 'success', time: '今天 08:00' },
];

export default function DeployPage() {
  const [selectedTarget, setSelectedTarget] = useState('oss');

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-[#1A1A2E]">部署</h1>
        <p className="text-xs text-gray-400 mt-0.5">一键部署到云端</p>
      </div>

      {/* 部署目标 */}
      <div className="px-4 py-3">
        <h2 className="text-xs font-medium text-gray-400 mb-2">选择目标</h2>
        <div className="flex gap-2">
          {targets.map((target) => (
            <div
              key={target.id}
              onClick={() => setSelectedTarget(target.id)}
              className={`flex-1 p-3 rounded-xl cursor-pointer border-2 transition-all text-center ${
                selectedTarget === target.id ? 'border-[#FF6B3D] bg-orange-50' : 'border-gray-100 bg-white'
              }`}
            >
              <div className="text-2xl mb-1">{target.icon}</div>
              <div className="text-xs font-medium">{target.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 配置表单 */}
      <div className="px-4">
        <Card className="border border-gray-100 rounded-xl shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-xs font-medium text-gray-400 mb-3">配置信息</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block">Bucket 名称</label>
                <input className="w-full h-9 text-sm bg-gray-50 border-0 rounded-lg px-3" placeholder="ai-assistant-2026" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block">Region</label>
                <input className="w-full h-9 text-sm bg-gray-50 border-0 rounded-lg px-3" placeholder="cn-hangzhou" />
              </div>
            </div>
            <button className="w-full mt-4 h-9 rounded-xl bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white text-sm font-medium">
              开始部署
            </button>
          </CardContent>
        </Card>
      </div>

      {/* 部署记录 */}
      <div className="px-4 mt-4">
        <h2 className="text-xs font-medium text-gray-400 mb-2">最近部署</h2>
        {deployments.map((dep) => (
          <Card key={dep.id} className="border border-gray-100 rounded-xl shadow-sm mb-2">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center text-white text-sm">📦</div>
                  <div>
                    <div className="text-sm font-medium">{dep.project}</div>
                    <div className="text-[10px] text-gray-400">{dep.target}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs ${dep.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                    {dep.status === 'success' ? '✓ 成功' : '✗ 失败'}
                  </div>
                  <div className="text-[10px] text-gray-400">{dep.time}</div>
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