'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface NavItem {
  href: string;
  label: string;
}

export default function Navigation() {
  const pathname = usePathname();
  const [navItems, setNavItems] = useState<NavItem[]>([
    { href: '/admin', label: 'Admin' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        console.debug('[Navigation] fetching /api/content ...');
        const response = await fetch('/api/content');
        console.debug('[Navigation] response ok?', response.ok, 'status:', response.status);
        const data = await response.json();
        console.debug('[Navigation] items received:', Array.isArray(data) ? data.length : typeof data);
        
        // Build nav items without a home link
        const otherPages = data.filter((page: { path: string }) => page.path !== '/');
        
        const items: NavItem[] = [];
        
        // Add other pages
        items.push(...otherPages.map((page: { path: string; title: string }) => ({
          href: page.path,
          label: page.title,
        })));
        
        // Add Admin link at the end
        items.push({ href: '/admin', label: 'Admin' });
        
        setNavItems(items);
      } catch (error) {
        console.error('[Navigation] Error fetching navigation items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [pathname]);

  if (loading) {
    return (
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link 
                href="/" 
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                Mini CMS
              </Link>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-sm text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Mini CMS
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
