'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

interface Token {
  id: string;
  provider: string;
  key_name: string;
  created_at: string;
}

const providerIcons: Record<string, string> = {
  openai: '🤖',
  anthropic: '🧠',
  brave: '🦁',
  github: '🐙',
  other: '🔑',
};

const providerNames: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  brave: 'Brave Search',
  github: 'GitHub',
  other: '其他服务',
};

export default function TokensPage() {
  const router = useRouter();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'openai',
    keyName: '',
    keyValue: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/tokens');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setTokens(data.tokens || []);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.keyValue) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: formData.provider,
          keyName: formData.keyName || providerNames[formData.provider],
          keyValue: formData.keyValue,
        }),
      });

      if (res.ok) {
        setFormData({ provider: 'openai', keyName: '', keyValue: '' });
        setShowAddForm(false);
        fetchTokens();
      }
    } catch (error) {
      console.error('Failed to add token:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteToken = async (id: string) => {
    if (!confirm('确定要删除这个 Token 吗？')) return;

    try {
      const res = await fetch(`/api/tokens?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTokens();
      }
    } catch (error) {
      console.error('Failed to delete token:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#1A1A2E]">Token 管理</h1>
            <p className="text-xs text-gray-400 mt-0.5">API Key 安全存储</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white text-xs"
          >
            + 添加
          </button>
        </div>
      </div>

      {/* 统计 */}
      <div className="px-4 py-3 flex gap-3">
        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-xl font-bold text-[#1A1A2E]">{tokens.length}</div>
          <div className="text-[10px] text-gray-400">已连接</div>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-xl font-bold text-green-500">{tokens.length}</div>
          <div className="text-[10px] text-gray-400">活跃</div>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-xl font-bold text-blue-500">
            {new Set(tokens.map(t => t.provider)).size}
          </div>
          <div className="text-[10px] text-gray-400">服务商</div>
        </div>
      </div>

      {/* 添加表单 */}
      {showAddForm && (
        <div className="px-4 mb-3">
          <Card className="border border-gray-100 rounded-xl shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm text-[#1A1A2E] mb-3">添加新 Token</h3>
              <form onSubmit={handleAddToken} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">服务商</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B3D]"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="brave">Brave Search</option>
                    <option value="github">GitHub</option>
                    <option value="other">其他服务</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">名称 (可选)</label>
                  <input
                    type="text"
                    value={formData.keyName}
                    onChange={(e) => setFormData({ ...formData, keyName: e.target.value })}
                    placeholder={providerNames[formData.provider]}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B3D]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">API Key *</label>
                  <input
                    type="password"
                    value={formData.keyValue}
                    onChange={(e) => setFormData({ ...formData, keyValue: e.target.value })}
                    placeholder="sk-..."
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B3D]"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formData.keyValue}
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white text-sm disabled:opacity-50"
                  >
                    {submitting ? '保存中...' : '保存'}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Token 列表 */}
      <div className="px-4 space-y-2">
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">🔑</div>
            <p>暂无 Token，点击上方添加</p>
          </div>
        ) : (
          tokens.map((token) => (
            <Card key={token.id} className="border border-gray-100 rounded-xl shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg">
                    {providerIcons[token.provider] || '🔑'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm text-[#1A1A2E]">
                        {token.key_name || providerNames[token.provider] || token.provider}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                        ✓ 活跃
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      创建: {formatDate(token.created_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteToken(token.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}