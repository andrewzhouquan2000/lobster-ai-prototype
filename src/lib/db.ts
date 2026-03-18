/**
 * Supabase 数据库抽象层
 * 替代 better-sqlite3，兼容 Vercel Serverless
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

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
  const client = getSupabaseClient();
  
  // 如果没有提供 userId，使用默认用户
  const targetUserId = userId || 'default-user';
  
  // 先尝试通过 ID 查找
  let { data: user, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', targetUserId)
    .single();
  
  if (error || !user) {
    // 尝试通过 email 查找默认用户
    const { data: existingUser } = await client
      .from('profiles')
      .select('*')
      .eq('email', 'demo@lobster.ai')
      .single();
    
    if (existingUser) {
      return existingUser;
    }
    
    // 创建默认用户（使用 Supabase Auth 的用户 ID 格式或自定义 ID）
    const { data: newUser, error: createError } = await client
      .from('profiles')
      .insert({
        id: targetUserId,
        email: 'demo@lobster.ai',
        display_name: '董事长'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Failed to create user:', createError);
      // 返回一个临时用户对象
      return {
        id: targetUserId,
        email: 'demo@lobster.ai',
        display_name: '董事长',
        created_at: new Date().toISOString()
      };
    }
    
    return newUser;
  }
  
  return user;
}

// Agent 操作
export async function getAgents(): Promise<Agent[]> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('agents')
    .select('*')
    .eq('is_active', true);
  
  if (error) {
    console.error('Failed to fetch agents:', error);
    return [];
  }
  
  return data || [];
}

export async function updateAgentCallCount(agentId: string): Promise<void> {
  const client = getSupabaseClient();
  
  // 先获取当前 call_count
  const { data } = await client
    .from('agents')
    .select('call_count')
    .eq('id', agentId)
    .single();
  
  const currentCount = data?.call_count || 0;
  
  await client
    .from('agents')
    .update({ call_count: currentCount + 1 })
    .eq('id', agentId);
}

export async function updateAgentStatus(agentId: string, status: string, currentUser?: string): Promise<void> {
  const client = getSupabaseClient();
  
  await client
    .from('agents')
    .update({ 
      status, 
      current_user: currentUser || null 
    })
    .eq('id', agentId);
}

// 项目操作
export async function getProjects(userId: string): Promise<Project[]> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Failed to fetch projects:', error);
    return [];
  }
  
  return data || [];
}

export async function getProject(projectId: string): Promise<Project | null> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  
  if (error) {
    return null;
  }
  
  return data;
}

export async function createProject(userId: string, name: string, description?: string): Promise<string> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('projects')
    .insert({
      user_id: userId,
      name,
      description: description || '',
      status: 'active',
      progress: 0
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to create project:', error);
    throw error;
  }
  
  return data.id;
}

export async function updateProjectName(projectId: string, name: string): Promise<void> {
  const client = getSupabaseClient();
  
  await client
    .from('projects')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', projectId);
}

// 线程操作
export async function getOrCreateThread(projectId: string, userId: string): Promise<Thread> {
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
  const { data: newThread, error } = await client
    .from('threads')
    .insert({
      user_id: userId,
      project_id: projectId,
      title: '项目讨论'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Failed to create thread:', error);
    throw error;
  }
  
  return newThread;
}

// 消息操作
export async function getMessages(threadId: string): Promise<Message[]> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Failed to fetch messages:', error);
    return [];
  }
  
  return data || [];
}

export async function createMessage(
  threadId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  agentName?: string,
  agentAvatar?: string
): Promise<string> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('messages')
    .insert({
      thread_id: threadId,
      role,
      content,
      agent_name: agentName,
      agent_avatar: agentAvatar
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to create message:', error);
    throw error;
  }
  
  return data.id;
}

export async function getMessageCount(threadId: string, role?: string): Promise<number> {
  const client = getSupabaseClient();
  
  let query = client
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('thread_id', threadId);
  
  if (role) {
    query = query.eq('role', role);
  }
  
  const { count, error } = await query;
  
  if (error) {
    return 0;
  }
  
  return count || 0;
}

// API Keys 操作
export async function getApiKeys(userId: string): Promise<{ id: string; provider: string; key_name?: string; created_at: string }[]> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('api_keys')
    .select('id, provider, key_name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Failed to fetch API keys:', error);
    return [];
  }
  
  return (data || []) as { id: string; provider: string; key_name?: string; created_at: string }[];
}

export async function createApiKey(userId: string, provider: string, keyName: string, keyValue: string): Promise<string> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('api_keys')
    .insert({
      user_id: userId,
      provider,
      key_name: keyName,
      key_value: keyValue
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to create API key:', error);
    throw error;
  }
  
  return data.id;
}

export async function deleteApiKey(id: string, userId: string): Promise<boolean> {
  const client = getSupabaseClient();
  
  const { error } = await client
    .from('api_keys')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Failed to delete API key:', error);
    return false;
  }
  
  return true;
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