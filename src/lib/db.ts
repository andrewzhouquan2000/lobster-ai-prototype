/**
 * Supabase 数据库抽象层 + 本地存储 fallback
 * 替代 better-sqlite3，兼容 Vercel Serverless
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 本地存储文件路径
const LOCAL_DB_PATH = path.join(process.cwd(), 'data', 'local-db.json');

// 本地存储数据结构
interface LocalDB {
  profiles: Record<string, any>;
  projects: Record<string, any>;
  threads: Record<string, any>;
  messages: Record<string, any[]>;
  agents: Record<string, any>;
  api_keys: Record<string, any>;
}

// 初始化本地存储
function loadLocalDB(): LocalDB {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const data = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load local DB:', e);
  }
  
  // 返回默认数据
  return {
    profiles: {},
    projects: {},
    threads: {},
    messages: {},
    agents: {
      'coder': { id: 'coder', name: 'Coder', avatar: '💻', category: '开发', skills: ['Python', 'TypeScript', 'React'], description: '代码开发和系统架构专家', is_active: true, call_count: 0, status: 'available' },
      'researcher': { id: 'researcher', name: 'Researcher', avatar: '🔍', category: '研究', skills: ['数据分析', '市场研究'], description: '深度研究和分析专家', is_active: true, call_count: 0, status: 'available' },
      'designer': { id: 'designer', name: 'Designer', avatar: '🎨', category: '设计', skills: ['UI/UX', 'Figma'], description: '产品设计和用户体验专家', is_active: true, call_count: 0, status: 'available' },
      'devops': { id: 'devops', name: 'DevOps', avatar: '⚙️', category: '运维', skills: ['Docker', 'K8s', 'CI/CD'], description: '部署和运维自动化专家', is_active: true, call_count: 0, status: 'available' },
      'analyst': { id: 'analyst', name: 'Analyst', avatar: '📊', category: '分析', skills: ['财务分析', '数据可视化'], description: '数据分析和商业智能专家', is_active: true, call_count: 0, status: 'available' }
    },
    api_keys: {}
  };
}

// 保存本地存储
function saveLocalDB(db: LocalDB): void {
  try {
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save local DB:', e);
  }
}

// 全局本地存储实例
let localDB: LocalDB | null = null;

function getLocalDB(): LocalDB {
  if (!localDB) {
    localDB = loadLocalDB();
  }
  return localDB;
}

// Supabase 客户端（服务端使用，绕过 RLS）
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // 在构建时提供占位符，避免构建失败
  const url = supabaseUrl || 'https://placeholder.supabase.co';
  const key = supabaseKey || 'placeholder-key';
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// 检查 Supabase 是否可用
async function checkSupabaseAvailable(): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    const { error } = await client.from('profiles').select('id').limit(1);
    return !error || error.code !== 'PGRST205';
  } catch {
    return false;
  }
}

// 导出单例客户端
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
    
    // 先尝试通过 ID 查找
    let { data: user, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();
    
    if (!error && user) {
      return user;
    }
    
    // 尝试通过 email 查找默认用户
    const { data: existingUser } = await client
      .from('profiles')
      .select('*')
      .eq('email', 'demo@lobster.ai')
      .single();
    
    if (existingUser) {
      return existingUser;
    }
    
    // 创建默认用户
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
    console.log('Supabase not available, using local storage');
  }
  
  // Fallback to local storage
  const db = getLocalDB();
  if (db.profiles[targetUserId]) {
    return db.profiles[targetUserId];
  }
  
  // 创建本地用户
  const newUser: User = {
    id: targetUserId,
    email: 'demo@lobster.ai',
    display_name: '董事长',
    created_at: new Date().toISOString()
  };
  
  db.profiles[targetUserId] = newUser;
  saveLocalDB(db);
  
  return newUser;
}

// Agent 操作
export async function getAgents(): Promise<Agent[]> {
  // 尝试 Supabase
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
    console.log('Using local agents');
  }
  
  // Fallback to local storage
  const db = getLocalDB();
  return Object.values(db.agents).filter((a: any) => a.is_active);
}

export async function updateAgentCallCount(agentId: string): Promise<void> {
  // 尝试 Supabase
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
    // Fallback to local
  }
  
  // Fallback to local storage
  const db = getLocalDB();
  if (db.agents[agentId]) {
    db.agents[agentId].call_count = (db.agents[agentId].call_count || 0) + 1;
    saveLocalDB(db);
  }
}

export async function updateAgentStatus(agentId: string, status: string, currentUser?: string): Promise<void> {
  // 尝试 Supabase
  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('agents')
      .update({ 
        status, 
        current_user: currentUser || null 
      })
      .eq('id', agentId);
    
    if (!error) return;
  } catch (e) {
    // Fallback to local
  }
  
  // Fallback to local storage
  const db = getLocalDB();
  if (db.agents[agentId]) {
    db.agents[agentId].status = status;
    db.agents[agentId].current_user = currentUser;
    saveLocalDB(db);
  }
}

// 项目操作
export async function getProjects(userId: string): Promise<Project[]> {
  // 尝试 Supabase
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
    // Fallback to local
  }
  
  // Fallback to local storage
  const db = getLocalDB();
  return Object.values(db.projects).filter((p: any) => p.user_id === userId);
}

export async function getProject(projectId: string): Promise<Project | null> {
  // 尝试 Supabase
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
    // Fallback to local
  }
  
  // Fallback to local storage
  const db = getLocalDB();
  return db.projects[projectId] || null;
}

export async function createProject(userId: string, name: string, description?: string): Promise<string> {
  const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // 尝试 Supabase
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
    // Fallback to local
  }
  
  // Fallback to local storage
  const db = getLocalDB();
  const now = new Date().toISOString();
  db.projects[projectId] = {
    id: projectId,
    user_id: userId,
    name,
    description: description || '',
    status: 'active',
    progress: 0,
    created_at: now,
    updated_at: now
  };
  saveLocalDB(db);
  
  return projectId;
}

export async function updateProjectName(projectId: string, name: string): Promise<void> {
  // 尝试 Supabase
  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('projects')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', projectId);
    
    if (!error) return;
  } catch (e) {
    // Fallback to local
  }
  
  // Fallback to local storage
  const db = getLocalDB();
  if (db.projects[projectId]) {
    db.projects[projectId].name = name;
    db.projects[projectId].updated_at = new Date().toISOString();
    saveLocalDB(db);
  }
}

// 线程操作
export async function getOrCreateThread(projectId: string, userId: string): Promise<Thread> {
  // 尝试 Supabase
  try {
    const client = getSupabaseClient();
    
    // 查找现有线程
    const { data: existingThread } = await client
      .from('threads')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (existingThread) {
      return existingThread;
    }
    
    // 创建新线程
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
    // Fallback to local
  }
  
  // Fallback to local storage
  const db = getLocalDB();
  
  // 查找现有线程
  for (const thread of Object.values(db.threads)) {
    if ((thread as any).project_id === projectId) {
      return thread as Thread;
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
  
  db.threads[threadId] = newThread;
  db.messages[threadId] = [];
  saveLocalDB(db);
  
  return newThread;
}

// 消息操作
export async function getMessages(threadId: string): Promise<Message[]> {
  // 尝试 Supabase
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
    // Fallback to local
  }
  
  // Fallback to local storage
  const db = getLocalDB();
  return db.messages[threadId] || [];
}

export async function createMessage(
  threadId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  agentName?: string,
  agentAvatar?: string
): Promise<string> {
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // 尝试 Supabase
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
    // Fallback to local
  }
  
  // Fallback to local storage
  const db = getLocalDB();
  if (!db.messages[threadId]) {
    db.messages[threadId] = [];
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
  
  db.messages[threadId].push(message);
  saveLocalDB(db);
  
  return messageId;
}

export async function getMessageCount(threadId: string, role?: string): Promise<number> {
  // 尝试 Supabase
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
    // Fallback to local
  }
  
  // Fallback to local storage
  const db = getLocalDB();
  const messages = db.messages[threadId] || [];
  
  if (role) {
    return messages.filter((m: Message) => m.role === role).length;
  }
  
  return messages.length;
}

// API Keys 操作
export async function getApiKeys(userId: string): Promise<{ id: string; provider: string; key_name?: string; created_at: string }[]> {
  // 尝试 Supabase
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
    // Fallback to local
  }
  
  // Fallback to local storage
  const db = getLocalDB();
  return Object.values(db.api_keys)
    .filter((k: any) => k.user_id === userId)
    .map((k: any) => ({ id: k.id, provider: k.provider, key_name: k.key_name, created_at: k.created_at }));
}

export async function createApiKey(userId: string, provider: string, keyName: string, keyValue: string): Promise<string> {
  const keyId = `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // 尝试 Supabase
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
    // Fallback to local
  }
  
  // Fallback to local storage
  const db = getLocalDB();
  db.api_keys[keyId] = {
    id: keyId,
    user_id: userId,
    provider,
    key_name: keyName,
    key_value: keyValue,
    created_at: new Date().toISOString()
  };
  saveLocalDB(db);
  
  return keyId;
}

export async function deleteApiKey(id: string, userId: string): Promise<boolean> {
  // 尝试 Supabase
  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (!error) return true;
  } catch (e) {
    // Fallback to local
  }
  
  // Fallback to local storage
  const db = getLocalDB();
  if (db.api_keys[id] && db.api_keys[id].user_id === userId) {
    delete db.api_keys[id];
    saveLocalDB(db);
    return true;
  }
  
  return false;
}

// 默认导出（向后兼容）
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