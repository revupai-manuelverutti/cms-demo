import { NextRequest, NextResponse } from 'next/server';
import { getAllContent, saveContent, deleteContent } from '@/lib/content';
import type { ContentPage } from '@/lib/content';

export async function GET() {
  try {
    console.debug('[API GET /api/content] fetching all content');
    const content = await getAllContent();
    console.debug('[API GET /api/content] items:', content.length);
    return NextResponse.json(content);
  } catch (error) {
    console.error('[API GET /api/content] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const content: ContentPage = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const success = await saveContent(content);
    console.debug('[API POST /api/content] save success?', success);
    
    if (success) {
      return NextResponse.json(content, { status: 201 });
    } else {
      return NextResponse.json(
        { error: 'Failed to save content' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API POST /api/content] error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
export const dynamic = 'force-dynamic';
