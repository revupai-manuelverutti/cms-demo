import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content Management',
  description: 'Administrative interface for content management',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
