import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PROJECTS_DIR = path.join(process.cwd(), 'data', 'projects');

// GET /preview/[projectId] - 返回项目的 HTML 预览页面
// 优先返回 index.html，如果没有则返回第一个 .html 文件
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const projectDir = path.join(PROJECTS_DIR, projectId);

  if (!fs.existsSync(projectDir)) {
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>项目不存在</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 40px;
          }
          h1 { font-size: 48px; margin-bottom: 20px; }
          p { opacity: 0.9; }
          a { color: #FF6B3D; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📦</h1>
          <h2>项目不存在</h2>
          <p>项目 ID: ${projectId}</p>
          <p style="margin-top: 20px;"><a href="/chat?project=${projectId}">返回聊天</a></p>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // 获取项目中的所有文件
  const files = fs.readdirSync(projectDir);
  
  // 优先查找 index.html
  let htmlFile = files.find(f => f.toLowerCase() === 'index.html');
  
  // 如果没有 index.html，查找第一个 .html 文件
  if (!htmlFile) {
    htmlFile = files.find(f => f.toLowerCase().endsWith('.html'));
  }
  
  // 如果没有 HTML 文件，显示文件列表
  if (!htmlFile) {
    const fileList = files.map(f => `<li>${f}</li>`).join('');
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${projectId} - 文件列表</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-height: 100vh;
            margin: 0;
            background: #F8F9FA;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          h1 { color: #1A1A2E; margin-bottom: 8px; }
          p { color: #666; margin-bottom: 24px; }
          ul { list-style: none; padding: 0; }
          li {
            padding: 12px 16px;
            background: #F8F9FA;
            border-radius: 8px;
            margin-bottom: 8px;
            color: #1A1A2E;
          }
          .no-files { color: #999; text-align: center; padding: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📦 ${projectId}</h1>
          <p>此项目暂无可预览的 HTML 文件</p>
          ${files.length > 0 ? `<ul>${fileList}</ul>` : '<p class="no-files">暂无文件</p>'}
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  // 读取并返回 HTML 文件
  const filePath = path.join(projectDir, htmlFile);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  return new NextResponse(content, {
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}