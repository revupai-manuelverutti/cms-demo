import { NextRequest, NextResponse } from 'next/server';
import { getContentByPath, saveContent, deleteContent } from '@/lib/content';
import type { ContentPage } from '@/lib/content';

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    console.debug('[API GET /api/content/[slug]] params (promise):', params);
    const { slug } = await params;
    const contentPath = slug === 'home' ? '/' : `/${slug}`;
    const content = await getContentByPath(contentPath);
    console.debug('[API GET] path:', contentPath, 'found?', !!content);
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(content);
  } catch (error) {
    console.error('[API GET /api/content/[slug]] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const contentPath = slug === 'home' ? '/' : `/${slug}`;
    const body = await request.json();
    console.debug('[API PUT] path:', contentPath, 'body keys:', Object.keys(body || {}));
    
    const existingContent = await getContentByPath(contentPath);
    if (!existingContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    const content: ContentPage = {
      ...existingContent,
      ...body,
      path: existingContent.path, // Preserve original path
      updatedAt: new Date().toISOString(),
    };

    const success = await saveContent(content);
    console.debug('[API PUT] save success?', success);
    
    if (success) {
      return NextResponse.json(content);
    } else {
      return NextResponse.json(
        { error: 'Failed to update content' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API PUT /api/content/[slug]] error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const contentPath = slug === 'home' ? '/' : `/${slug}`;
    const success = await deleteContent(contentPath);
    console.debug('[API DELETE] path:', contentPath, 'success?', success);
    
    if (success) {
      return NextResponse.json({ message: 'Content deleted successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete content' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API DELETE /api/content/[slug]] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
