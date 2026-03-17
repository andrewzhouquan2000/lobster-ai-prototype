'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

const messages = [
  { id: 1, agent: 'CEO', avatar: '🦞', content: '收到，我来安排开发任务。Coder，请开始实现股票分析工具。', time: '14:30' },
  { id: 2, agent: 'Coder', avatar: '💻', content: '好的，我来分析需求并开始编写代码。\n\n预计需要以下模块：\n1. 数据获取层\n2. 分析引擎\n3. 报告生成', time: '14:32' },
  { id: 3, agent: 'User', avatar: '👤', content: '好的，开始吧', time: '14:35', isUser: true },
  { id: 4, agent: 'Coder', avatar: '💻', content: '✅ 数据获取模块已完成\n```python\ndef get_stock_price(symbol):\n    return fetch_data(symbol)\n```', time: '14:45' },
  { id: 5, agent: 'DevOps', avatar: '⚙️', content: '我已创建 OSS bucket，准备部署', time: '14:50' },
];

export default function ChatPage() {
  const [input, setInput] = useState('');

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm">📁</div>
        <div className="flex-1">
          <h1 className="font-semibold text-[#1A1A2E] text-sm">股票分析工具</h1>
          <p className="text-xs text-gray-400">4 个 Agent 参与</p>
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm">📦</button>
          <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm">⋯</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4 pb-24">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[85%] ${msg.isUser ? 'flex-row-reverse' : ''}`}>
              {!msg.isUser && (
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-sm shrink-0">
                  {msg.avatar}
                </div>
              )}
              <div className={msg.isUser ? 'text-right' : ''}>
                {!msg.isUser && (
                  <p className="text-xs text-gray-400 mb-1 ml-1">{msg.agent}</p>
                )}
                <div className={`rounded-2xl px-3 py-2 text-sm ${
                  msg.isUser 
                    ? 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white rounded-tr-md' 
                    : 'bg-white shadow-sm rounded-tl-md'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <p className={`text-[10px] text-gray-300 mt-1 ${msg.isUser ? 'mr-1' : 'ml-1'}`}>{msg.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <span>+</span>
          </button>
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            className="flex-1 h-9 text-sm bg-gray-50 border-0 rounded-full px-4"
          />
          <button className="w-9 h-9 rounded-full bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white flex items-center justify-center">
            <span className="text-sm">→</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}