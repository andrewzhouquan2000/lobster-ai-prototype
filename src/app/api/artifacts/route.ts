import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PROJECTS_DIR = path.join(process.cwd(), 'data', 'projects');

// GET - 获取项目文件列表或单个文件内容
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project');
  const fileName = searchParams.get('file');

  if (!projectId) {
    // 返回所有项目
    if (!fs.existsSync(PROJECTS_DIR)) {
      return NextResponse.json({ projects: [] });
    }
    const projects = fs.readdirSync(PROJECTS_DIR);
    return NextResponse.json({ projects });
  }

  const projectDir = path.join(PROJECTS_DIR, projectId);

  if (!fs.existsSync(projectDir)) {
    return NextResponse.json({ files: [], project: projectId });
  }

  if (fileName) {
    // 返回单个文件内容
    const filePath = path.join(projectDir, fileName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    
    return NextResponse.json({
      file: {
        name: fileName,
        content,
        size: stats.size,
        created_at: stats.birthtime,
        modified_at: stats.mtime
      },
      project: projectId
    });
  }

  // 返回项目文件列表
  const files = fs.readdirSync(projectDir).map(name => {
    const filePath = path.join(projectDir, name);
    const stats = fs.statSync(filePath);
    return {
      name,
      size: stats.size,
      created_at: stats.birthtime,
      modified_at: stats.mtime
    };
  });

  return NextResponse.json({ files, project: projectId });
}

// DELETE - 删除文件
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project');
  const fileName = searchParams.get('file');

  if (!projectId || !fileName) {
    return NextResponse.json({ error: 'project and file required' }, { status: 400 });
  }

  const filePath = path.join(PROJECTS_DIR, projectId, fileName);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  fs.unlinkSync(filePath);
  return NextResponse.json({ success: true, deleted: fileName });
}