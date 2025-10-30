'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BrollItem {
  id: string;
  name: string;
  description?: string;
  fileUrl: string;
  duration: number;
  category?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
}

export default function ContentManagement() {
  const [brollItems, setBrollItems] = useState<BrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
    duration: 10
  });

  useEffect(() => {
    fetchBrollItems();
  }, []);

  const fetchBrollItems = async () => {
    try {
      const response = await fetch('/api/broll');
      if (response.ok) {
        const data = await response.json();
        setBrollItems(data.broll || []);
      }
    } catch (error) {
      console.error('Failed to fetch B-roll items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/broll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          fileUrl: `/placeholder/${formData.name.toLowerCase().replace(/\s+/g, '-')}.mp4`
        })
      });

      if (response.ok) {
        await fetchBrollItems();
        setShowUploadForm(false);
        setFormData({ name: '', description: '', category: '', tags: '', duration: 10 });
      } else {
        alert('Failed to add B-roll item');
      }
    } catch (error) {
      console.error('Failed to add B-roll item:', error);
      alert('Failed to add B-roll item');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/broll/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        await fetchBrollItems();
      }
    } catch (error) {
      console.error('Failed to toggle B-roll status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">Content Management</h1>
              <p className="text-gray-600">Manage your B-roll video library</p>
            </div>
            <button
              onClick={() => setShowUploadForm(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Add B-roll
            </button>
          </div>
        </div>
      </header>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New B-roll</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select category</option>
                  <option value="urban">Urban</option>
                  <option value="nature">Nature</option>
                  <option value="technology">Technology</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="abstract">Abstract</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  max="60"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. modern, clean, fast"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Add B-roll
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">B-roll Library</h3>
            <p className="text-sm text-gray-600 mt-1">
              {brollItems.length} items • {brollItems.filter(item => item.isActive).length} active
            </p>
          </div>
          
          {brollItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No B-roll content yet</h3>
              <p className="text-gray-600 mb-4">Add your first B-roll video to get started</p>
              <button
                onClick={() => setShowUploadForm(true)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Add B-roll
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {brollItems.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 h-32 flex items-center justify-center">
                    <div className="text-4xl">🎥</div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg">{item.name}</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    )}
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                      <span>{item.duration}s</span>
                      {item.category && (
                        <span className="bg-gray-100 px-2 py-1 rounded capitalize">
                          {item.category}
                        </span>
                      )}
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{item.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleActive(item.id, item.isActive)}
                        className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                          item.isActive
                            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            : 'bg-green-200 text-green-800 hover:bg-green-300'
                        }`}
                      >
                        {item.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
