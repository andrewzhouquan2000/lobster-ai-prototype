import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys, createApiKey, deleteApiKey } from '@/lib/db';
import { randomUUID } from 'crypto';

// 简单的加密/解密 (生产环境应使用更安全的方式)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'lobster-ai-default-key';

function simpleEncrypt(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    );
  }
  return Buffer.from(result).toString('base64');
}

function simpleDecrypt(encrypted: string): string {
  const text = Buffer.from(encrypted, 'base64').toString();
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    );
  }
  return result;
}

// GET: 获取用户所有 Token
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const tokens = await getApiKeys(userId);
    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('Get tokens error:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// POST: 添加新 Token
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const { provider, keyName, keyValue } = await request.json();

    if (!provider || !keyValue) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const validProviders = ['openai', 'anthropic', 'brave', 'github', 'other'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: '无效的 provider' }, { status: 400 });
    }

    const encryptedValue = simpleEncrypt(keyValue);
    const id = await createApiKey(userId, provider, keyName || provider, encryptedValue);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Add token error:', error);
    return NextResponse.json({ error: '添加失败' }, { status: 500 });
  }
}

// DELETE: 删除 Token
export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少 id 参数' }, { status: 400 });
    }

    const success = await deleteApiKey(id, userId);

    if (!success) {
      return NextResponse.json({ error: 'Token 不存在或无权删除' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete token error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}

// 导出解密函数供其他模块使用
export { simpleDecrypt };