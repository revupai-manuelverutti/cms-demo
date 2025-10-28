import { notFound } from 'next/navigation';
import { getContentByPath } from '@/lib/content';
import PageRenderer from '@/components/PageRenderer';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  // No predefined static params; pages load dynamically
  console.debug('[generateStaticParams] no predefined params');
  return [];
}

export default async function DynamicPage({ params }: PageProps) {
  try {
    console.debug('[DynamicPage] params received (promise):', params);
    const { slug } = await params;
    const path = `/${slug}`;
    console.debug('[DynamicPage] resolved path:', path);
    const content = await getContentByPath(path);
    console.debug('[DynamicPage] content loaded?', !!content);

    if (!content) {
      console.warn('[DynamicPage] content not found for path:', path);
      notFound();
    }

    return <PageRenderer content={content} />;
  } catch (err) {
    console.error('[DynamicPage] error rendering page:', err);
    throw err;
  }
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const { slug } = await params;
    const path = `/${slug}`;
    const content = await getContentByPath(path);
    console.debug('[generateMetadata] path:', path, 'has content?', !!content);

    if (!content) {
      return {
        title: 'Page Not Found',
      } as const;
    }

    return {
      title: content.title,
      description: content.description,
    } as const;
  } catch (err) {
    console.error('[generateMetadata] error:', err);
    return { title: 'Error' } as const;
  }
}
export const dynamic = 'force-dynamic';
export const revalidate = 0;
