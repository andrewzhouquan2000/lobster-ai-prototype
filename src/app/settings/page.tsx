'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

type SettingsTab = 'account' | 'apikeys' | 'notifications' | 'theme';

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

const tabs: { id: SettingsTab; icon: string; label: string }[] = [
  { id: 'account', icon: '📱', label: '账户' },
  { id: 'apikeys', icon: '🔑', label: 'API Key' },
  { id: 'notifications', icon: '🔔', label: '通知' },
  { id: 'theme', icon: '🎨', label: '主题' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'openai',
    keyName: '',
    keyValue: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Account settings state
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

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

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert('两次输入的密码不一致');
      return;
    }
    // TODO: Implement password change API
    alert('密码修改功能开发中...');
    setPasswordForm({ current: '', new: '', confirm: '' });
    setShowPasswordForm(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  };

  const renderAccountSettings = () => (
    <div className="space-y-4">
      {/* 邮箱设置 */}
      <Card className="border border-gray-100 rounded-xl shadow-sm">
        <CardContent className="p-4">
          <h3 className="font-medium text-sm text-[#1A1A2E] mb-3">📧 邮箱地址</h3>
          <div className="flex items-center gap-3">
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B3D]"
              placeholder="your@email.com"
            />
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white text-sm">
              保存
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 密码修改 */}
      <Card className="border border-gray-100 rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm text-[#1A1A2E]">🔐 密码修改</h3>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-xs text-[#FF6B3D]"
            >
              {showPasswordForm ? '取消' : '修改'}
            </button>
          </div>
          {showPasswordForm ? (
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <input
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                placeholder="当前密码"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B3D]"
              />
              <input
                type="password"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                placeholder="新密码"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B3D]"
              />
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                placeholder="确认新密码"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B3D]"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white text-sm"
              >
                确认修改
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-400">点击右侧按钮修改密码</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderApiKeysSettings = () => (
    <div className="space-y-3">
      {/* 统计 */}
      <div className="flex gap-3">
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

      {/* 添加按钮 */}
      <button
        onClick={() => setShowAddForm(true)}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-[#FF6B3D] hover:text-[#FF6B3D] transition-colors"
      >
        + 添加 API Key
      </button>

      {/* 添加表单 */}
      {showAddForm && (
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
      )}

      {/* Token 列表 */}
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
  );

  const renderNotificationsSettings = () => (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">🔔</div>
      <h3 className="font-medium text-[#1A1A2E] mb-2">通知设置</h3>
      <p className="text-sm text-gray-400">开发中，敬请期待...</p>
    </div>
  );

  const renderThemeSettings = () => (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">🎨</div>
      <h3 className="font-medium text-[#1A1A2E] mb-2">主题设置</h3>
      <p className="text-sm text-gray-400">开发中，敬请期待...</p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return renderAccountSettings();
      case 'apikeys':
        return renderApiKeysSettings();
      case 'notifications':
        return renderNotificationsSettings();
      case 'theme':
        return renderThemeSettings();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-[#1A1A2E]">设置</h1>
        <p className="text-xs text-gray-400 mt-0.5">管理你的账户和应用设置</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100 px-2">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#FF6B3D] text-[#FF6B3D]'
                  : 'border-transparent text-gray-400'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {renderContent()}
      </div>

      <BottomNav />
    </div>
  );
}