import { NextResponse } from 'next/server';

export async function GET() {
  // 测试 LLM API 连接
  let llmStatus = 'not_tested';
  let llmError = null;
  
  try {
    const response = await fetch(process.env.LLM_API_URL!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL,
        messages: [{ role: 'user', content: 'hi' }],
        temperature: 0.7
      })
    });
    
    if (response.ok) {
      llmStatus = 'ok';
    } else {
      llmStatus = `error_${response.status}`;
      const text = await response.text();
      llmError = text.substring(0, 200);
    }
  } catch (e) {
    llmStatus = 'exception';
    llmError = e instanceof Error ? e.message : String(e);
  }
  
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasLlmUrl: !!process.env.LLM_API_URL,
    hasLlmKey: !!process.env.LLM_API_KEY,
    llmModel: process.env.LLM_MODEL,
    llmStatus,
    llmError,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    vercel: process.env.VERCEL,
  });
}
