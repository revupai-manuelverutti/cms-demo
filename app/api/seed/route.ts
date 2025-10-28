import { NextRequest, NextResponse } from 'next/server';
import { saveContent } from '@/lib/content';
import type { ContentPage } from '@/lib/content';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isKVEnabled() {
  return Boolean(
    process.env.KV_REST_API_URL ||
      process.env.KV_URL ||
      process.env.KV_REST_API_TOKEN ||
      process.env.KV_REST_API_READ_ONLY_TOKEN
  );
}

function toSlug(input: string | null): string | null {
  if (!input) return null;
  const cleaned = input.trim();
  if (!cleaned) return null;
  return cleaned === '/' ? 'home' : cleaned.replace(/^\//, '');
}

export async function POST(request: NextRequest) {
  try {
    if (!isKVEnabled()) {
      return NextResponse.json(
        { error: 'KV is not configured in this environment' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : '';
    const expected = process.env.SEED_TOKEN || '';
    if (!expected || token !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slugParam = toSlug(searchParams.get('slug'));
    if (!slugParam) {
      return NextResponse.json(
        { error: 'Missing slug. Usage: POST /api/seed?slug=aem' },
        { status: 400 }
      );
    }

    // Read JSON from public via HTTP to ensure availability in serverless environment
    const origin = request.nextUrl.origin;
    const jsonUrl = `${origin}/content/${slugParam}.json`;
    const resp = await fetch(jsonUrl, { cache: 'no-store' });
    if (!resp.ok) {
      return NextResponse.json(
        { error: `Source JSON not found at ${jsonUrl}` },
        { status: 404 }
      );
    }
    const source = (await resp.json()) as ContentPage;

    const ok = await saveContent(source);
    if (!ok) {
      return NextResponse.json(
        { error: 'Failed to save content to KV' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Seeded', slug: slugParam });
  } catch (error) {
    console.error('[API POST /api/seed] error:', error);
    return NextResponse.json(
      { error: 'Unexpected error while seeding' },
      { status: 500 }
    );
  }
}

