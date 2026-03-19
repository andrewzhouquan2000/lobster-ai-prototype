/**
 * Supabase 数据库抽象层 + 内存/本地存储 fallback
 * 支持 Vercel Serverless 环境
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// 检测是否在 Vercel 环境
const isVercel = process.env.VERCEL === '1';

// 内存存储（用于 Vercel 环境）
interface InMemoryDB {
  profiles: Map<string, any>;
  projects: Map<string, any>;
  threads: Map<string, any>;
  messages: Map<string, any[]>;
  agents: Map<string, any>;
  api_keys: Map<string, any>;
}

// 全局内存存储（Vercel 环境下会在同一实例内共享）
declare global {
  // eslint-disable-next-line no-var
  var inMemoryDB: InMemoryDB | undefined;
}

function getInMemoryDB(): InMemoryDB {
  if (!globalThis.inMemoryDB) {
    globalThis.inMemoryDB = {
      profiles: new Map(),
      projects: new Map(),
      threads: new Map(),
      messages: new Map(),
      agents: new Map([
        ['coder', { id: 'coder', name: 'Coder', avatar: '💻', category: '开发', skills: ['Python', 'TypeScript', 'React'], description: '代码开发和系统架构专家', is_active: true, call_count: 0, status: 'available' }],
        ['researcher', { id: 'researcher', name: 'Researcher', avatar: '🔍', category: '研究', skills: ['数据分析', '市场研究'], description: '深度研究和分析专家', is_active: true, call_count: 0, status: 'available' }],
        ['designer', { id: 'designer', name: 'Designer', avatar: '🎨', category: '设计', skills: ['UI/UX', 'Figma'], description: '产品设计和用户体验专家', is_active: true, call_count: 0, status: 'available' }],
        ['devops', { id: 'devops', name: 'DevOps', avatar: '⚙️', category: '运维', skills: ['Docker', 'K8s', 'CI/CD'], description: '部署和运维自动化专家', is_active: true, call_count: 0, status: 'available' }],
        ['analyst', { id: 'analyst', name: 'Analyst', avatar: '📊', category: '分析', skills: ['财务分析', '数据可视化'], description: '数据分析和商业智能专家', is_active: true, call_count: 0, status: 'available' }]
      ]),
      api_keys: new Map()
    };
  }
  return globalThis.inMemoryDB;
}

// Supabase 客户端
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const url = supabaseUrl || 'https://placeholder.supabase.co';
  const key = supabaseKey || 'placeholder-key';
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export const supabase = getSupabaseClient();

// ============ 类型定义 ============

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  category?: string;
  skills?: string[];
  description?: string;
  system_prompt?: string;
  is_active: boolean;
  call_count?: number;
  status?: string;
  current_user?: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  agent_id?: string;
  title: string;
  status: string;
  result?: string;
  created_at: string;
  completed_at?: string;
}

export interface Thread {
  id: string;
  user_id: string;
  project_id?: string;
  title?: string;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent_name?: string;
  agent_avatar?: string;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  provider: string;
  key_name?: string;
  key_value: string;
  created_at: string;
}

// ============ 数据库操作函数 ============

// 用户操作
export async function getOrCreateUser(userId?: string): Promise<User> {
  const targetUserId = userId || 'default-user';
  
  // 尝试 Supabase
  try {
    const client = getSupabaseClient();
    
    const { data: user, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();
    
    if (!error && user) {
      return user;
    }
    
    const { data: existingUser } = await client
      .from('profiles')
      .select('*')
      .eq('email', 'demo@lobster.ai')
      .single();
    
    if (existingUser) {
      return existingUser;
    }
    
    const { data: newUser, error: createError } = await client
      .from('profiles')
      .insert({
        id: targetUserId,
        email: 'demo@lobster.ai',
        display_name: '董事长'
      })
      .select()
      .single();
    
    if (!createError && newUser) {
      return newUser;
    }
  } catch (e) {
    console.log('Supabase not available, using memory storage');
  }
  
  // Fallback to memory storage
  const db = getInMemoryDB();
  if (db.profiles.has(targetUserId)) {
    return db.profiles.get(targetUserId)!;
  }
  
  const newUser: User = {
    id: targetUserId,
    email: 'demo@lobster.ai',
    display_name: '董事长',
    created_at: new Date().toISOString()
  };
  
  db.profiles.set(targetUserId, newUser);
  return newUser;
}

// Agent 操作
export async function getAgents(): Promise<Agent[]> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('agents')
      .select('*')
      .eq('is_active', true);
    
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.log('Using memory agents');
  }
  
  const db = getInMemoryDB();
  return Array.from(db.agents.values()).filter(a => a.is_active);
}

export async function updateAgentCallCount(agentId: string): Promise<void> {
  try {
    const client = getSupabaseClient();
    const { data } = await client
      .from('agents')
      .select('call_count')
      .eq('id', agentId)
      .single();
    
    const currentCount = data?.call_count || 0;
    
    const { error } = await client
      .from('agents')
      .update({ call_count: currentCount + 1 })
      .eq('id', agentId);
    
    if (!error) return;
  } catch (e) {
    // Fallback
  }
  
  const db = getInMemoryDB();
  const agent = db.agents.get(agentId);
  if (agent) {
    agent.call_count = (agent.call_count || 0) + 1;
    db.agents.set(agentId, agent);
  }
}

export async function updateAgentStatus(agentId: string, status: string, currentUser?: string): Promise<void> {
  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('agents')
      .update({ status, current_user: currentUser || null })
      .eq('id', agentId);
    
    if (!error) return;
  } catch (e) {
    // Fallback
  }
  
  const db = getInMemoryDB();
  const agent = db.agents.get(agentId);
  if (agent) {
    agent.status = status;
    agent.current_user = currentUser;
    db.agents.set(agentId, agent);
  }
}

// 项目操作
export async function getProjects(userId: string): Promise<Project[]> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (!error && data) {
      return data;
    }
  } catch (e) {
    // Fallback
  }
  
  const db = getInMemoryDB();
  return Array.from(db.projects.values()).filter(p => p.user_id === userId);
}

export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (!error && data) {
      return data;
    }
  } catch (e) {
    // Fallback
  }
  
  const db = getInMemoryDB();
  return db.projects.get(projectId) || null;
}

export async function createProject(userId: string, name: string, description?: string): Promise<string> {
  const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('projects')
      .insert({
        id: projectId,
        user_id: userId,
        name,
        description: description || '',
        status: 'active',
        progress: 0
      })
      .select('id')
      .single();
    
    if (!error && data) {
      return data.id;
    }
  } catch (e) {
    // Fallback
  }
  
  const db = getInMemoryDB();
  const now = new Date().toISOString();
  db.projects.set(projectId, {
    id: projectId,
    user_id: userId,
    name,
    description: description || '',
    status: 'active',
    progress: 0,
    created_at: now,
    updated_at: now
  });
  
  return projectId;
}

export async function updateProjectName(projectId: string, name: string): Promise<void> {
  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('projects')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', projectId);
    
    if (!error) return;
  } catch (e) {
    // Fallback
  }
  
  const db = getInMemoryDB();
  const project = db.projects.get(projectId);
  if (project) {
    project.name = name;
    project.updated_at = new Date().toISOString();
    db.projects.set(projectId, project);
  }
}

// 线程操作
export async function getOrCreateThread(projectId: string, userId: string): Promise<Thread> {
  try {
    const client = getSupabaseClient();
    
    const { data: existingThread } = await client
      .from('threads')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (existingThread) {
      return existingThread;
    }
    
    const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { data: newThread, error } = await client
      .from('threads')
      .insert({
        id: threadId,
        user_id: userId,
        project_id: projectId,
        title: '项目讨论'
      })
      .select()
      .single();
    
    if (!error && newThread) {
      return newThread;
    }
  } catch (e) {
    // Fallback
  }
  
  const db = getInMemoryDB();
  
  // 查找现有线程
  for (const thread of db.threads.values()) {
    if (thread.project_id === projectId) {
      return thread;
    }
  }
  
  // 创建新线程
  const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newThread: Thread = {
    id: threadId,
    user_id: userId,
    project_id: projectId,
    title: '项目讨论',
    created_at: new Date().toISOString()
  };
  
  db.threads.set(threadId, newThread);
  db.messages.set(threadId, []);
  
  return newThread;
}

// 消息操作
export async function getMessages(threadId: string): Promise<Message[]> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      return data;
    }
  } catch (e) {
    // Fallback
  }
  
  const db = getInMemoryDB();
  return db.messages.get(threadId) || [];
}

export async function createMessage(
  threadId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  agentName?: string,
  agentAvatar?: string
): Promise<string> {
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('messages')
      .insert({
        id: messageId,
        thread_id: threadId,
        role,
        content,
        agent_name: agentName,
        agent_avatar: agentAvatar
      })
      .select('id')
      .single();
    
    if (!error && data) {
      return data.id;
    }
  } catch (e) {
    // Fallback
  }
  
  const db = getInMemoryDB();
  if (!db.messages.has(threadId)) {
    db.messages.set(threadId, []);
  }
  
  const message: Message = {
    id: messageId,
    thread_id: threadId,
    role,
    content,
    agent_name: agentName,
    agent_avatar: agentAvatar,
    created_at: new Date().toISOString()
  };
  
  db.messages.get(threadId)!.push(message);
  
  return messageId;
}

export async function getMessageCount(threadId: string, role?: string): Promise<number> {
  try {
    const client = getSupabaseClient();
    let query = client
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('thread_id', threadId);
    
    if (role) {
      query = query.eq('role', role);
    }
    
    const { count, error } = await query;
    
    if (!error && count !== null) {
      return count;
    }
  } catch (e) {
    // Fallback
  }
  
  const db = getInMemoryDB();
  const messages = db.messages.get(threadId) || [];
  
  if (role) {
    return messages.filter(m => m.role === role).length;
  }
  
  return messages.length;
}

// API Keys 操作
export async function getApiKeys(userId: string): Promise<{ id: string; provider: string; key_name?: string; created_at: string }[]> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('api_keys')
      .select('id, provider, key_name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      return data;
    }
  } catch (e) {
    // Fallback
  }
  
  const db = getInMemoryDB();
  return Array.from(db.api_keys.values())
    .filter(k => k.user_id === userId)
    .map(k => ({ id: k.id, provider: k.provider, key_name: k.key_name, created_at: k.created_at }));
}

export async function createApiKey(userId: string, provider: string, keyName: string, keyValue: string): Promise<string> {
  const keyId = `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('api_keys')
      .insert({
        id: keyId,
        user_id: userId,
        provider,
        key_name: keyName,
        key_value: keyValue
      })
      .select('id')
      .single();
    
    if (!error && data) {
      return data.id;
    }
  } catch (e) {
    // Fallback
  }
  
  const db = getInMemoryDB();
  db.api_keys.set(keyId, {
    id: keyId,
    user_id: userId,
    provider,
    key_name: keyName,
    key_value: keyValue,
    created_at: new Date().toISOString()
  });
  
  return keyId;
}

export async function deleteApiKey(id: string, userId: string): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (!error) return true;
  } catch (e) {
    // Fallback
  }
  
  const db = getInMemoryDB();
  const key = db.api_keys.get(id);
  if (key && key.user_id === userId) {
    db.api_keys.delete(id);
    return true;
  }
  
  return false;
}

export default {
  supabase,
  getOrCreateUser,
  getAgents,
  updateAgentCallCount,
  updateAgentStatus,
  getProjects,
  getProject,
  createProject,
  updateProjectName,
  getOrCreateThread,
  getMessages,
  createMessage,
  getMessageCount,
  getApiKeys,
  createApiKey,
  deleteApiKey
};