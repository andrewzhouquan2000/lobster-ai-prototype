import { NextResponse } from 'next/server';
import { getOrCreateUser, getProjects, createProject, updateProjectName } from '@/lib/db';

export async function GET() {
  try {
    const user = await getOrCreateUser();
    const projects = await getProjects(user.id);
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateUser();
    const { name, description } = await request.json();
    
    const id = await createProject(user.id, name, description);
    return NextResponse.json({ id, success: true });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { projectId, name } = await request.json();
    
    if (!projectId || !name) {
      return NextResponse.json({ error: 'projectId and name required' }, { status: 400 });
    }
    
    await updateProjectName(projectId, name);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}