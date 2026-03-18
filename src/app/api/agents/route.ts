import { NextRequest, NextResponse } from 'next/server';
import { getAgents, updateAgentCallCount, updateAgentStatus } from '@/lib/db';

export async function GET() {
  try {
    const agents = await getAgents();
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

// 更新 Agent 调用统计
export async function PATCH(request: NextRequest) {
  try {
    const { agentId, action } = await request.json();

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 });
    }

    if (action === 'increment') {
      await updateAgentCallCount(agentId);
      return NextResponse.json({ success: true });
    }

    if (action === 'setStatus') {
      const { status, currentUser } = await request.json();
      await updateAgentStatus(agentId, status || 'available', currentUser || undefined);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update agent:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}