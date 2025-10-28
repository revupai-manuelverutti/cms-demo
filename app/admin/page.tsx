'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContentPage } from '@/lib/content';
import Editor from '@/components/Editor';
import SearchBar from '@/components/SearchBar';
import Card from '@/components/Card';

export default function AdminPage() {
  const router = useRouter();
  const [contentList, setContentList] = useState<ContentPage[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentPage[]>([]);
  const [editingContent, setEditingContent] = useState<ContentPage | undefined>();
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/content');
      const data = await response.json();
      setContentList(data);
      setFilteredContent(data);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredContent(contentList);
    } else {
      const filtered = contentList.filter(content =>
        content.title.toLowerCase().includes(query.toLowerCase()) ||
        content.path.toLowerCase().includes(query.toLowerCase()) ||
        content.description?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredContent(filtered);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingContent(undefined);
  };

  const handleEdit = (content: ContentPage) => {
    setEditingContent(content);
    setIsCreating(false);
  };

  const showMessage = (type: 'success' | 'error' | 'warning', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleDelete = async (path: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const slug = path === '/' ? 'home' : path.replace('/', '');
      const response = await fetch(`/api/content/${slug}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showMessage('success', `Content "${title}" deleted successfully`);
        await fetchContent();
      } else {
        showMessage('error', 'Failed to delete content');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      showMessage('error', 'Failed to delete content');
    }
  };

  const handleSave = async (content: ContentPage) => {
    // Validate path
    if (!content.path || content.path.trim() === '') {
      showMessage('error', 'Path is required');
      return;
    }

    if (!content.path.startsWith('/')) {
      showMessage('error', 'Path must start with "/"');
      return;
    }

    // Check for duplicate paths (only when creating new content)
    if (!editingContent) {
      const slug = content.path === '/' ? 'home' : content.path.replace('/', '');
      const existing = await fetch(`/api/content/${slug}`);
      if (existing.ok) {
        showMessage('error', 'A page with this path already exists');
        return;
      }
    }

    try {
      const slug = content.path === '/' ? 'home' : content.path.replace('/', '');
      const url = editingContent ? `/api/content/${slug}` : '/api/content';
      const method = editingContent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });

      if (response.ok) {
        const action = editingContent ? 'updated' : 'created';
        showMessage('success', `Content "${content.title}" ${action} successfully`);
        await fetchContent();
        setEditingContent(undefined);
        setIsCreating(false);
        // Auto-refresh to show changes
        router.refresh();
      } else {
        const data = await response.json();
        showMessage('error', data.error || 'Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      showMessage('error', 'Failed to save content');
    }
  };

  const handleCancel = () => {
    setEditingContent(undefined);
    setIsCreating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (editingContent || isCreating) {
    return (
      <Editor
        content={editingContent}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Message Banner */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
            <div className="flex justify-between items-center">
              <span className="font-sans">{message.text}</span>
              <button 
                onClick={() => setMessage(null)}
                className="ml-4 text-lg font-bold opacity-50 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900 font-sans">
                Content Management
              </h1>
              <button
                onClick={handleCreate}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-sans font-semibold"
                >
                Create New Content
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <SearchBar
                placeholder="Search content by title, path, or description..."
                onSearch={handleSearch}
              />
            </div>

            {/* Content Cards */}
            {filteredContent.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg font-sans">
                  {searchQuery ? 'No content matches your search.' : 'No content found. Create your first page!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContent.map((content) => (
                  <div
                    key={content.path}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">
                      {content.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 font-sans">
                      <span className="font-semibold">Path:</span> {content.path}
                    </p>
                    {content.description && (
                      <p className="text-sm text-gray-500 mb-4 font-sans">
                        {content.description}
                      </p>
                    )}
                    <div className="text-xs text-gray-400 mb-4 font-sans">
                      {content.sections.length} section(s) • 
                      Created: {new Date(content.createdAt || '').toLocaleDateString()} • 
                      Updated: {new Date(content.updatedAt || '').toLocaleDateString()}
                    </div>
                    <div className="flex flex-col gap-2">
                      <a
                        href={content.path === '/' ? '/home' : content.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 transition-colors font-sans"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleEdit(content)}
                        className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors font-sans"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(content.path, content.title)}
                        className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors font-sans"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
