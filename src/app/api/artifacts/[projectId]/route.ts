import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PROJECTS_DIR = path.join(process.cwd(), 'data', 'projects');

// GET /api/artifacts/[projectId] - 获取项目文件列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const projectDir = path.join(PROJECTS_DIR, projectId);

  if (!fs.existsSync(projectDir)) {
    return NextResponse.json({ files: [], project: projectId, error: 'Project not found' }, { status: 404 });
  }

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