import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PROJECTS_DIR = path.join(process.cwd(), 'data', 'projects');

// GET /api/artifacts/[projectId]/[filename] - 获取文件内容
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; filename: string }> }
) {
  const { projectId, filename } = await params;
  const filePath = path.join(PROJECTS_DIR, projectId, filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const stats = fs.statSync(filePath);
  
  return NextResponse.json({
    file: {
      name: filename,
      content,
      size: stats.size,
      created_at: stats.birthtime,
      modified_at: stats.mtime
    },
    project: projectId
  });
}

// DELETE /api/artifacts/[projectId]/[filename] - 删除文件
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; filename: string }> }
) {
  const { projectId, filename } = await params;
  const filePath = path.join(PROJECTS_DIR, projectId, filename);

  // 安全检查：防止路径遍历攻击
  const resolvedPath = path.resolve(filePath);
  const resolvedProjectsDir = path.resolve(PROJECTS_DIR);
  if (!resolvedPath.startsWith(resolvedProjectsDir)) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    fs.unlinkSync(filePath);
    return NextResponse.json({ success: true, message: '文件已删除' });
  } catch (error) {
    console.error('删除文件失败:', error);
    return NextResponse.json({ error: '删除文件失败' }, { status: 500 });
  }
}