import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasLlmUrl: !!process.env.LLM_API_URL,
    hasLlmKey: !!process.env.LLM_API_KEY,
    llmModel: process.env.LLM_MODEL,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    vercel: process.env.VERCEL,
  });
}
