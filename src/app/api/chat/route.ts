import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateUser,
  getProject,
  createProject,
  updateProjectName,
  getOrCreateThread,
  getMessages,
  createMessage,
  getMessageCount,
  updateAgentCallCount,
  updateAgentStatus
} from '@/lib/db';

// 内存中存储 artifacts（Vercel serverless 兼容）
interface Artifact {
  name: string;
  content: string;
  created_at: Date;
}

declare global {
  // eslint-disable-next-line no-var
  var artifactsStore: Map<string, Map<string, Artifact>> | undefined;
}

function getArtifactsStore(): Map<string, Map<string, Artifact>> {
  if (!globalThis.artifactsStore) {
    globalThis.artifactsStore = new Map();
  }
  return globalThis.artifactsStore;
}

// 保存产出文件
function saveArtifact(projectId: string, filename: string, content: string) {
  const store = getArtifactsStore();
  if (!store.has(projectId)) {
    store.set(projectId, new Map());
  }
  store.get(projectId)!.set(filename, {
    name: filename,
    content,
    created_at: new Date()
  });
  return filename;
}

// 获取项目产出文件列表
function getProjectArtifacts(projectId: string): Artifact[] {
  const store = getArtifactsStore();
  const projectArtifacts = store.get(projectId);
  if (!projectArtifacts) return [];
  return Array.from(projectArtifacts.values());
}

// 获取 artifact 内容
function getArtifactContent(projectId: string, filename: string): string | null {
  const store = getArtifactsStore();
  const projectArtifacts = store.get(projectId);
  if (!projectArtifacts) return null;
  const artifact = projectArtifacts.get(filename);
  return artifact?.content || null;
}

// 调用 LLM API
async function callLLM(messages: Array<{role: string, content: string}>) {
  const response = await fetch(process.env.LLM_API_URL!, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 根据用户需求生成项目名称
function generateProjectName(userContent: string): string {
  const keywords = userContent
    .replace(/[，。！？、；：""''（）\[\]【】《》\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2 && word.length <= 6);
  
  const typeMap: Record<string, string> = {
    '网站': '官网', '网页': 'Web应用', '小程序': '小程序', 'APP': 'App',
    '应用': '应用', '系统': '系统', '平台': '平台', '工具': '工具',
    '分析': '分析工具', '爬虫': '爬虫', '机器人': 'Bot', '接口': 'API',
    '后台': '后台', '管理': '管理系统', '商城': '电商', '博客': '博客',
    '聊天': '聊天室', '游戏': '游戏',
  };
  
  const domainMap: Record<string, string> = {
    '股票': '股票', '基金': '基金', '数据': '数据', '用户': '用户',
    '订单': '订单', '商品': '商品', '内容': '内容', '文章': '文章',
    '图片': '图片', '视频': '视频', '音乐': '音乐', '文档': '文档',
    '任务': '任务', '日程': '日程', '笔记': '笔记', '财务': '财务',
    '人事': '人事', '库存': '库存',
  };
  
  let type = '';
  let domain = '';
  
  for (const [key, value] of Object.entries(typeMap)) {
    if (userContent.includes(key)) { type = value; break; }
  }
  for (const [key, value] of Object.entries(domainMap)) {
    if (userContent.includes(key)) { domain = value; break; }
  }
  
  if (domain && type) return `${domain}${type}`;
  if (domain) return `${domain}项目`;
  if (type) return `${type}项目`;
  if (keywords.length > 0) return `${keywords[0]}项目`;
  return '新项目';
}

// CEO Agent 系统提示
const CEO_SYSTEM_PROMPT = `你是 Lobster AI 的 CEO Agent。你负责理解用户需求并协调其他 Agent 完成任务。

你的团队成员：
- Coder（💻）：代码开发和系统架构
- Researcher（🔍）：研究和分析
- Designer（🎨）：设计和用户体验
- DevOps（⚙️）：部署和运维
- Analyst（📊）：数据分析

## 重要：需求澄清流程

当用户提出需求时，**不要立即派发任务**。你需要先判断需求是否清晰：

### 如果需求模糊或信息不足：
1. 友好地提出 3-5 个澄清问题
2. 使用编号列表形式，便于用户逐条回答
3. 问题要具体、有针对性
4. 保持简洁，每次不超过 5 个问题

### 如果需求已经清晰（用户已回答问题或提供了详细信息）：
1. 整理需求要点
2. 提出建议方案和项目名称
3. 询问用户是否确认
4. 用户确认后再派发任务

### 判断需求是否清晰的标准：
- 用户说"帮我开发XXX"但没有说明形式（网页/App/小程序）
- 用户说"做一个分析工具"但没有说明数据来源、目标用户
- 用户说"优化XXX"但没有说明当前问题和期望效果
- 需求涉及多个可能方向，需要用户明确偏好

### 回复格式（JSON）：

**需求模糊时：**
{
  "needClarification": true,
  "message": "好的，我来确认几个问题：\n1. 你希望以什么形式展现？网页/App？\n2. 你关心哪个市场？A股/美股/港股？\n3. 是分析你的持仓，还是获取市场动态？"
}

**需求清晰时：**
{
  "needClarification": false,
  "confirmed": false,
  "projectName": "股票分析工具",
  "message": "收到。根据你的需求，我建议开发「股票分析工具」：\n- 功能1：...\n- 功能2：...\n\n这样可以吗？"
}

**用户确认后：**
{
  "needClarification": false,
  "confirmed": true,
  "projectName": "股票分析工具",
  "agents": ["coder", "analyst"],
  "tasks": [
    {"agent": "coder", "task": "开发数据获取模块"},
    {"agent": "analyst", "task": "设计分析逻辑"}
  ],
  "message": "好的，开始安排任务..."
}

只返回 JSON，不要其他内容。`;

const AGENT_PROMPTS: Record<string, string> = {
  coder: `你是 Coder Agent。你的任务是完成代码开发。
当前任务：{task}
请汇报你的工作进度（简短，50字以内）：
{"status": "working|completed", "message": "正在...|已完成...", "output": "文件名或功能"}
只返回 JSON。`,
  researcher: `你是 Researcher Agent。你的任务是完成研究分析。
当前任务：{task}
请汇报你的工作进度（简短，50字以内）：
{"status": "working|completed", "message": "正在...|已完成...", "output": "文件名或报告"}
只返回 JSON。`,
  analyst: `你是 Analyst Agent。你的任务是完成数据分析。
当前任务：{task}
请汇报你的工作进度（简短，50字以内）：
{"status": "working|completed", "message": "正在...|已完成...", "output": "文件名或结果"}
只返回 JSON。`,
  designer: `你是 Designer Agent。你的任务是完成设计工作。
当前任务：{task}
请汇报你的工作进度（简短，50字以内）：
{"status": "working|completed", "message": "正在...|已完成...", "output": "文件名或设计稿"}
只返回 JSON。`,
  devops: `你是 DevOps Agent。你的任务是完成部署工作。
当前任务：{task}
请汇报你的工作进度（简短，50字以内）：
{"status": "working|completed", "message": "正在...|已完成...", "output": "服务名或配置"}
只返回 JSON。`
};

const AGENT_NAMES: Record<string, string> = {
  coder: 'Coder', researcher: 'Researcher', analyst: 'Analyst',
  designer: 'Designer', devops: 'DevOps'
};

const AGENT_AVATARS: Record<string, string> = {
  coder: '💻', researcher: '🔍', analyst: '📊', designer: '🎨', devops: '⚙️'
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  try {
    const user = await getOrCreateUser();
    
    // 确保项目存在
    let project = await getProject(projectId);
    if (!project) {
      await createProject(user.id, '新项目', '');
      project = await getProject(projectId);
    }
    
    const thread = await getOrCreateThread(projectId, user.id);
    const messages = await getMessages(thread.id);
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Failed to get messages:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, content, user } = await request.json();

    if (!projectId || !content) {
      return NextResponse.json({ error: 'projectId and content required' }, { status: 400 });
    }

    const dbUser = await getOrCreateUser();
    
    // 确保项目存在
    let project = await getProject(projectId);
    if (!project) {
      await createProject(dbUser.id, '新项目', '');
    }
    
    const thread = await getOrCreateThread(projectId, dbUser.id);

    // 保存用户消息
    await createMessage(thread.id, 'user', content);

    // 检查是否是第一条用户消息
    const userMsgCount = await getMessageCount(thread.id, 'user');
    const isFirstMessage = userMsgCount === 1;
    
    if (isFirstMessage) {
      const autoName = generateProjectName(content);
      await updateProjectName(projectId, autoName);
    }

    // 获取对话历史
    const messages = await getMessages(thread.id);
    const conversationHistory = messages.slice(-20).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.agent_name ? `[${msg.agent_name}]: ${msg.content}` : msg.content
    }));
    
    // 构建完整消息
    const llmMessages = [
      { role: 'system', content: CEO_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content }
    ];

    // 调用 CEO Agent
    const ceoResponse = await callLLM(llmMessages);

    let ceoDecision;
    try {
      let jsonStr = ceoResponse;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      }
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];
      ceoDecision = JSON.parse(jsonStr);
    } catch {
      ceoDecision = { message: ceoResponse, needClarification: false, agents: [], tasks: [] };
    }

    // 更新项目名称
    if (ceoDecision.projectName) {
      await updateProjectName(projectId, ceoDecision.projectName);
    }
    
    if (ceoDecision.confirmed === true && !ceoDecision.projectName && ceoDecision.tasks?.length > 0) {
      const firstTask = ceoDecision.tasks[0].task;
      const autoName = generateProjectName(firstTask);
      await updateProjectName(projectId, autoName);
      ceoDecision.projectName = autoName;
    }

    // 保存 CEO 消息
    const ceoDisplayMessage = ceoDecision.message || '收到，我来分析需求...';
    await createMessage(thread.id, 'assistant', ceoDisplayMessage, 'CEO', '🦞');

    // 只有确认后才派发任务
    const shouldDispatchTasks = ceoDecision.confirmed === true && ceoDecision.tasks?.length > 0;

    if (shouldDispatchTasks) {
      const uniqueAgents = [...new Set(ceoDecision.tasks.map((t: {agent: string, task: string}) => t.agent))] as string[];
      for (const agentId of uniqueAgents) {
        try {
          await updateAgentCallCount(agentId);
          await updateAgentStatus(agentId, 'busy', user || 'default-user');
        } catch (e) {
          console.error('Failed to update agent stats:', e);
        }
      }
      
      // 异步执行 Agent 工作
      simulateAgentWork(thread.id, ceoDecision.tasks, projectId, dbUser.id).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      ceoMessage: ceoDecision.message,
      needClarification: ceoDecision.needClarification || false,
      confirmed: ceoDecision.confirmed || false,
      projectName: ceoDecision.projectName,
      tasks: ceoDecision.tasks || []
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}

// 检测是否是网页/前端项目
function isWebProject(tasks: Array<{agent: string, task: string}>): boolean {
  const webKeywords = /网页|网站|web|html|页面|前端|界面|ui|dashboard|portal|landing|landing\s*page|官网|首页|应用|小程序/i;
  return tasks.some(t => webKeywords.test(t.task));
}

// 生成代码内容
function generateCodeContent(agent: string, task: string, filename: string): string {
  const className = filename.replace(/\.[^.]+$/, '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  const timestamp = new Date().toISOString();
  
  const templates: Record<string, string> = {
    coder: `# ${filename}\n# Generated by Coder Agent\n# Task: ${task}\n# Created: ${timestamp}\n\nclass ${className}:\n    def __init__(self):\n        self.initialized = True\n\n    def execute(self):\n        return {"status": "success"}\n`,
    analyst: `# ${filename}\n# Generated by Analyst Agent\n# Task: ${task}\n# Created: ${timestamp}\n\nimport pandas as pd\n\nclass DataAnalyzer:\n    def analyze(self, data):\n        return data.describe()\n`,
    researcher: `# ${filename}\n# Generated by Researcher Agent\n# Task: ${task}\n# Created: ${timestamp}\n\nclass ResearchModule:\n    def search(self, query):\n        return {"findings": []}\n`,
    designer: `# ${filename}\n# Generated by Designer Agent\n# Task: ${task}\n# Created: ${timestamp}\n\ndesign_spec = {"colors": {}, "typography": {}}\n`,
    devops: `version: "3.8"\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n`
  };
  
  return templates[agent] || `# ${filename}\n# Task: ${task}\n`;
}

// 模拟 Agent 工作
async function simulateAgentWork(threadId: string, tasks: Array<{agent: string, task: string}>, projectId: string, userId: string) {
  const generateCompleteHTML = (task: string, projectName: string): string => {
    const title = task.replace(/开发|创建|制作|设计|实现/g, '').trim() || projectName || 'Web应用';
    const timestamp = new Date().toLocaleString('zh-CN');
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); padding: 40px; max-width: 600px; width: 100%; }
    h1 { color: #1a1a2e; margin-bottom: 20px; font-size: 28px; }
    p { color: #666; line-height: 1.6; margin-bottom: 20px; }
    .btn { background: linear-gradient(135deg, #FF6B3D 0%, #FF8F6B 100%); color: white; border: none; padding: 14px 28px; border-radius: 30px; font-size: 16px; cursor: pointer; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🦞 ${title}</h1>
    <p>由 Lobster AI 多 Agent 协作生成的网页应用。</p>
    <button class="btn" onclick="alert('功能开发中！')">开始使用</button>
    <div class="footer">生成时间: ${timestamp}<br>Powered by Lobster AI</div>
  </div>
</body>
</html>`;
  };

  for (const { agent, task } of tasks) {
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

    // Agent 接收任务
    await createMessage(threadId, 'assistant', `✅ 已接收任务：${task}`, AGENT_NAMES[agent] || agent, AGENT_AVATARS[agent] || '🤖');

    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 3000));

    try {
      const agentPrompt = AGENT_PROMPTS[agent]?.replace('{task}', task) || `你是 ${agent}，任务：${task}`;
      const agentResponse = await callLLM([
        { role: 'system', content: agentPrompt },
        { role: 'user', content: '请汇报你的工作进度' }
      ]);

      let agentResult;
      try {
        agentResult = JSON.parse(agentResponse);
      } catch {
        agentResult = { status: 'completed', message: agentResponse };
      }

      const timestamp = Date.now();
      const isWebTask = /网页|网站|web|html|页面|前端|界面|ui/i.test(task);
      const defaultExt = isWebTask ? 'html' : (agent === 'devops' ? 'yaml' : 'py');
      const fileName = agentResult.output 
        ? (agentResult.output.includes('.') ? agentResult.output : `${agentResult.output}.${defaultExt}`)
        : `${agent}_${timestamp}.${defaultExt}`;
      
      const fileContent = generateCodeContent(agent, task, fileName);
      saveArtifact(projectId, fileName, fileContent);
      
      const statusEmoji = agentResult.status === 'completed' ? '✅' : '🔄';
      const artifactLink = `/artifacts?project=${projectId}&file=${fileName}`;
      
      await createMessage(threadId, 'assistant', `${statusEmoji} ${agentResult.message}\n📄 产出：[${fileName}](${artifactLink})`, AGENT_NAMES[agent] || agent, AGENT_AVATARS[agent] || '🤖');

    } catch (error) {
      await createMessage(threadId, 'assistant', `⚠️ 执行中遇到问题，正在处理...`, AGENT_NAMES[agent] || agent, AGENT_AVATARS[agent] || '🤖');
    }
  }

  // CEO 汇报
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const artifacts = getProjectArtifacts(projectId);
  const artifactList = artifacts.length > 0 ? artifacts.map(a => `  • ${a.name}`).join('\n') : '  暂无产出文件';
  
  const project = await getProject(projectId);
  const projectName = project?.name || '项目';
  
  const hasHtmlFile = artifacts.some(a => a.name.toLowerCase().endsWith('.html'));
  
  if (isWebProject(tasks) && hasHtmlFile) {
    const indexExists = artifacts.some(a => a.name.toLowerCase() === 'index.html');
    if (!indexExists) {
      const firstHtml = artifacts.find(a => a.name.toLowerCase().endsWith('.html'));
      if (firstHtml) {
        saveArtifact(projectId, 'index.html', firstHtml.content);
      }
    }
  }
  
  let summaryMessage = `✅ 所有任务已完成本轮执行！\n\n`;
  if (hasHtmlFile) {
    summaryMessage += `🌐 **访问网页：**\n[点击打开 →](/preview/${projectId})\n\n`;
  }
  summaryMessage += `📁 **产出文件：**\n${artifactList}\n\n`;
  summaryMessage += `👉 [查看所有产出文件](/artifacts?project=${projectId})`;
  
  await createMessage(threadId, 'assistant', summaryMessage, 'CEO', '🦞');
  
  // 重置 Agent 状态
  const uniqueAgents = [...new Set(tasks.map(t => t.agent))] as string[];
  for (const agentId of uniqueAgents) {
    try {
      await updateAgentStatus(agentId, 'available');
    } catch (e) {
      console.error('Failed to reset agent status:', e);
    }
  }
}