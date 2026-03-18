'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

interface Message {
  id: string;
  role: string;
  content: string;
  agent_name?: string;
  agent_avatar?: string;
  created_at: string;
}

interface ErrorMessage {
  id: string;
  content: string;
  retryable: boolean;
}

interface AgentProgress {
  name: string;
  avatar: string;
  task: string;
  status: 'working' | 'completed';
}

function ChatContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUserScrollingUp, setIsUserScrollingUp] = useState(false);
  const [projectName, setProjectName] = useState('新项目');
  const [error, setError] = useState<ErrorMessage | null>(null);
  const [agentProgress, setAgentProgress] = useState<AgentProgress[]>([]);
  const [showAllMessages, setShowAllMessages] = useState(false);

  // 折叠逻辑：默认只显示最新 10 条消息
  const displayedMessages = showAllMessages ? messages : messages.slice(-10);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string>('');
  const prevMessagesLengthRef = useRef(0);
  const isAutoScrollingRef = useRef(false);

  // 如果没有 projectId，创建新项目
  useEffect(() => {
    if (!projectId) {
      const newProjectId = `proj_${Date.now()}`;
      router.replace(`/chat?project=${newProjectId}`);
    }
  }, [projectId, router]);

  // 加载消息
  useEffect(() => {
    if (projectId) {
      fetchMessages();
      loadProject();
    }
  }, [projectId]);

  // 监听滚动，检测用户是否在查看历史消息
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      // 使用 ref 追踪是否在底部，避免闭包问题
      isAutoScrollingRef.current = isAtBottom;
      setIsUserScrollingUp(!isAtBottom);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 自动滚动到底部（仅当用户在底部时）
  useEffect(() => {
    // 只有当用户在底部时才自动滚动
    if (isAutoScrollingRef.current && messagesEndRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, agentProgress.length]);

  // 解析消息中的 Agent 进度
  useEffect(() => {
    const newProgress: AgentProgress[] = [];
    const agentMap: Record<string, AgentProgress> = {};

    // 从消息中提取 Agent 任务状态
    messages.forEach((msg) => {
      if (msg.role !== 'user' && msg.agent_name && msg.agent_name !== 'CEO') {
        const avatar = msg.agent_avatar || '🤖';
        
        // 检测任务接收
        if (msg.content.includes('已接收任务：')) {
          const task = msg.content.replace('✅ 已接收任务：', '').trim();
          agentMap[msg.agent_name] = {
            name: msg.agent_name,
            avatar,
            task,
            status: 'working'
          };
        }
        // 检测任务完成
        else if (msg.content.includes('已完成') || msg.content.includes('✅')) {
          if (agentMap[msg.agent_name]) {
            agentMap[msg.agent_name].status = 'completed';
          }
        }
      }
    });

    // 只保留正在工作的 Agent
    Object.values(agentMap).forEach(p => {
      if (p.status === 'working') {
        newProgress.push(p);
      }
    });

    // 检测 CEO 总结消息，清空进度
    const hasSummary = messages.some(msg => 
      msg.agent_name === 'CEO' && msg.content.includes('项目状态更新')
    );
    
    if (hasSummary) {
      setAgentProgress([]);
    } else {
      setAgentProgress(newProgress);
    }
  }, [messages]);

  // 定时刷新消息（捕获 Agent 异步工作）
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchMessages();
      }
    }, 2000); // 缩短轮询间隔以更快捕获进度
    return () => clearInterval(interval);
  }, [projectId, loading]);

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/chat?projectId=${projectId}`);
      const data = await res.json();
      
      // 检测是否有新消息
      const hasNewMessages = data.length > prevMessagesLengthRef.current;
      prevMessagesLengthRef.current = data.length;
      
      // 如果有新消息，更新滚动状态（使用 ref 避免闭包）
      if (hasNewMessages) {
        // isAutoScrollingRef 会在 useEffect 中决定是否滚动
      }
      
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }

  async function loadProject() {
    try {
      const res = await fetch('/api/projects');
      const projects = await res.json();
      const project = projects.find((p: any) => p.id === projectId);
      if (project) {
        setProjectName(project.name);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  }

  async function sendMessage(retryContent?: string) {
    const userMessage = retryContent || input.trim();
    if (!userMessage || loading) return;

    setInput('');
    setLoading(true);
    setError(null);
    setAgentProgress([]);
    setIsUserScrollingUp(false); // 用户发送消息时重置滚动状态，滚动到底部

    // 立即显示用户消息
    const tempUserMsg: Message = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    lastMessageRef.current = userMessage;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, content: userMessage })
      });

      if (!res.ok) {
        throw new Error(`网络错误: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        // 刷新消息列表
        setTimeout(() => fetchMessages(), 500);
      } else {
        throw new Error(data.error || '发送失败');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError({
        id: `error_${Date.now()}`,
        content: err instanceof Error ? err.message : '发送消息失败，请重试',
        retryable: true
      });
    } finally {
      setLoading(false);
    }
  }

  function handleRetry() {
    if (lastMessageRef.current) {
      setError(null);
      sendMessage(lastMessageRef.current);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center text-sm">
          🦞
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-[#1A1A2E] text-sm">{projectName}</h1>
          <p className="text-xs text-gray-400">
            {loading ? '思考中...' : agentProgress.length > 0 ? `${agentProgress.length} 个 Agent 工作中` : '多 Agent 协作中'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/artifacts?project=${projectId}`} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm hover:bg-orange-50 transition-colors" title="查看产出文件">
            📦
          </Link>
          <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm">⋯</button>
        </div>
      </div>

      {/* Agent 进度指示器 - 增强版，显示实时状态 */}
      {agentProgress.length > 0 && (
        <div className="bg-gradient-to-r from-[#FF6B3D]/10 to-[#FF8F6B]/10 border-b border-[#FF6B3D]/20 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FF6B3D] animate-pulse" />
              <span className="text-xs font-semibold text-[#FF6B3D]">AI 团队工作中</span>
              <span className="text-xs text-gray-400">({agentProgress.length} 个 Agent)</span>
            </div>
            <div className="flex-1 h-1 bg-white/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {agentProgress.map((agent, index) => (
              <div key={index} className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm border border-[#FF6B3D]/10 flex-shrink-0">
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF6B3D]/10 to-[#FF8F6B]/10 flex items-center justify-center text-sm">
                    {agent.avatar}
                  </div>
                  {/* 小绿点表示工作状态 */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-[#1A1A2E]">{agent.name}</span>
                  <span className="text-[10px] text-gray-400 max-w-[80px] truncate">{agent.task}</span>
                </div>
                {/* 旋转加载动画 */}
                <svg className="w-3.5 h-3.5 text-[#FF6B3D] animate-spin flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-auto p-4 space-y-4 pb-32">
        {/* 历史消息折叠按钮 */}
        {messages.length > 10 && !showAllMessages && (
          <div className="text-center py-2">
            <button
              onClick={() => setShowAllMessages(true)}
              className="text-sm text-[#FF6B3D] hover:text-[#FF8F6B] font-medium px-4 py-2 rounded-full bg-white shadow-sm hover:shadow transition-all"
            >
              查看更早的 {messages.length - 10} 条消息
            </button>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B3D]/10 to-[#FF8F6B]/10 flex items-center justify-center text-3xl mx-auto mb-4">
              🦞
            </div>
            <p className="text-gray-400 text-sm">我是 CEO Agent，有什么可以帮你的？</p>
            <p className="text-gray-300 text-xs mt-2">告诉我你的项目需求，我会协调团队完成</p>
          </div>
        )}

        {displayedMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-sm shrink-0">
                  {msg.agent_avatar || '🤖'}
                </div>
              )}
              <div className={msg.role === 'user' ? 'text-right' : ''}>
                {msg.role !== 'user' && msg.agent_name && (
                  <p className="text-xs text-gray-400 mb-1 ml-1">{msg.agent_name}</p>
                )}
                <div className={`rounded-2xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white rounded-tr-md'
                    : 'bg-white shadow-sm rounded-tl-md'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <p className={`text-[10px] text-gray-300 mt-1 ${msg.role === 'user' ? 'mr-1 text-right' : 'ml-1'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-sm">
                🦞
              </div>
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-[#FF6B3D] animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm text-gray-500">CEO 正在协调团队...</p>
                </div>
                {/* 动态进度指示 */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B3D] animate-pulse" />
                    <span className="text-xs text-gray-400">分析需求中...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="text-xs text-gray-300">分配任务给团队...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: '0.4s' }} />
                    <span className="text-xs text-gray-300">等待执行结果...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-sm">
                ⚠️
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl rounded-tl-md px-3 py-2">
                <p className="text-sm text-red-600">{error.content}</p>
                {error.retryable && (
                  <button
                    onClick={handleRetry}
                    className="mt-2 text-xs text-red-500 underline hover:no-underline"
                  >
                    重试
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
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
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="告诉我你的需求..."
            className="flex-1 h-9 text-sm bg-gray-50 border-0 rounded-full px-4 focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/30"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              loading || !input.trim()
                ? 'bg-gray-200 text-gray-400'
                : 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white shadow-lg shadow-[#FF6B3D]/30'
            }`}
          >
            <span className="text-sm">→</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">加载中...</div>}>
      <ChatContent />
    </Suspense>
  );
}