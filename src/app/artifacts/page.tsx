'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

const fileTree = [
  { id: 1, name: 'src', type: 'folder', open: true, children: [
    { id: '1-1', name: 'stock_fetcher.py', type: 'code', size: '2.4KB' },
    { id: '1-2', name: 'analyzer.py', type: 'code', size: '5.1KB' },
    { id: '1-3', name: 'report_gen.py', type: 'code', size: '3.2KB' },
  ]},
  { id: 2, name: 'config', type: 'folder', open: false, children: [
    { id: '2-1', name: 'settings.yaml', type: 'config', size: '856B' },
  ]},
  { id: 3, name: 'README.md', type: 'doc', size: '1.2KB' },
];

export default function ArtifactsPage() {
  const [selectedFile, setSelectedFile] = useState<string | null>('stock_fetcher.py');

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-[#1A1A2E]">Artifacts</h1>
        <p className="text-xs text-gray-400 mt-0.5">项目产物与文件</p>
      </div>

      {/* 文件树 */}
      <div className="px-4 py-3">
        <Card className="border border-gray-100 rounded-xl shadow-sm">
          <CardContent className="p-3">
            {fileTree.map((item) => (
              <div key={item.id}>
                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-lg">{item.type === 'folder' ? '📁' : item.type === 'code' ? '📄' : '📝'}</span>
                  <span className="text-sm flex-1">{item.name}</span>
                  {item.size && <span className="text-xs text-gray-400">{item.size}</span>}
                </div>
                {item.children && item.children.map((child) => (
                  <div 
                    key={child.id}
                    onClick={() => setSelectedFile(child.name)}
                    className={`flex items-center gap-2 p-2 pl-8 rounded-lg cursor-pointer ${
                      selectedFile === child.name ? 'bg-orange-50 border border-[#FF6B3D]/30' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{child.type === 'code' ? '📄' : '⚙️'}</span>
                    <span className="text-sm flex-1">{child.name}</span>
                    <span className="text-xs text-gray-400">{child.size}</span>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 文件预览 */}
      {selectedFile && (
        <div className="px-4">
          <Card className="border border-gray-100 rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">{selectedFile}</h3>
                <div className="flex gap-2">
                  <button className="text-xs text-gray-400 hover:text-[#FF6B3D]">下载</button>
                  <button className="text-xs text-gray-400 hover:text-[#FF6B3D]">分享</button>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-gray-300">
                <pre>{`# ${selectedFile}
import requests

def fetch_data(symbol):
    """获取股票数据"""
    url = f"https://api.example.com/{symbol}"
    response = requests.get(url)
    return response.json()

def analyze_stock(symbol):
    data = fetch_data(symbol)
    return calculate_indicators(data)`}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
}