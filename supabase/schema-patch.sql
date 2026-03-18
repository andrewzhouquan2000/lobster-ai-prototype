-- Lobster AI V2 数据库 Schema (补充)
-- 执行位置：Supabase Dashboard > SQL Editor

-- 1. 添加 api_keys 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  key_name TEXT,
  key_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 为 agents 表添加额外字段（如果不存在）
-- 注意：如果列已存在会报错，可以忽略
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS call_count INTEGER DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS current_user TEXT;

-- 3. 为 messages 表添加 agent 相关字段
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS agent_name TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS agent_avatar TEXT;

-- 4. api_keys RLS 策略
CREATE POLICY "Users can view own api_keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own api_keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own api_keys" ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

-- 5. 允许服务端绕过 RLS（使用 service_role key 时）
-- 注意：这需要使用 SUPABASE_SERVICE_ROLE_KEY 环境变量

-- 6. 创建默认用户（如果不存在）
-- 注意：这个用户 ID 用于本地开发和默认场景
INSERT INTO public.profiles (id, email, display_name)
VALUES ('default-user', 'demo@lobster.ai', '董事长')
ON CONFLICT (id) DO NOTHING;

-- 7. 插入默认 Agent 数据（如果不存在）
INSERT INTO public.agents (id, name, avatar, category, skills, description, is_active)
VALUES 
  ('coder', 'Coder', '💻', '开发', ARRAY['Python', 'TypeScript', 'React'], '代码开发和系统架构专家', true),
  ('researcher', 'Researcher', '🔍', '研究', ARRAY['数据分析', '市场研究'], '深度研究和分析专家', true),
  ('designer', 'Designer', '🎨', '设计', ARRAY['UI/UX', 'Figma', '设计系统'], '产品设计和用户体验专家', true),
  ('devops', 'DevOps', '⚙️', '运维', ARRAY['Docker', 'K8s', 'CI/CD'], '部署和运维自动化专家', true),
  ('analyst', 'Analyst', '📊', '分析', ARRAY['财务分析', '数据可视化'], '数据分析和商业智能专家', true),
  ('writer', 'Writer', '✍️', '内容', ARRAY['文案', '技术写作', 'SEO'], '内容创作和文案专家', true)
ON CONFLICT (id) DO NOTHING;