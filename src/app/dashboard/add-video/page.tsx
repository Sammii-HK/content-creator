'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

export default function AddVideoManually() {
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    
    const videoData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      fileUrl: formData.get('fileUrl') as string,
      duration: parseInt(formData.get('duration') as string),
      category: formData.get('category') as string,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean)
    };

    try {
      const response = await fetch('/api/broll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoData)
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        (e.target as HTMLFormElement).reset();
      } else {
        alert('Failed to add video');
      }
    } catch (error) {
      console.error('Failed to add video:', error);
      alert('Failed to add video');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/dashboard" className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 mb-4">
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add Video Manually</h1>
          <p className="text-gray-600">Bypass upload issues - add video URL directly</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">📱 For iPhone Videos:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Upload your iPhone video to any cloud storage (Google Drive, Dropbox, etc.)</li>
              <li>2. Get the public/shareable URL</li>
              <li>3. Paste the URL below</li>
              <li>4. System will use it for video generation</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                placeholder="e.g., Me talking about productivity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video URL *
              </label>
              <input
                type="url"
                name="fileUrl"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                placeholder="https://drive.google.com/... or https://dropbox.com/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload your iPhone video to Google Drive/Dropbox and paste the public URL
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (seconds) *
                </label>
                <input
                  type="number"
                  name="duration"
                  min="1"
                  max="300"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                >
                  <option value="personal">Personal/Creator</option>
                  <option value="workspace">Workspace/Tech</option>
                  <option value="lifestyle">Lifestyle/Daily</option>
                  <option value="nature">Nature/Outdoor</option>
                  <option value="urban">Urban/City</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                placeholder="What happens in this video?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                placeholder="e.g., me, talking, energetic, office"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
            >
              {saving ? 'Adding Video...' : 'Add Video to Library'}
            </button>
          </form>

          {result && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">✅ Video Added Successfully!</h4>
              <p className="text-sm text-green-800">
                {result.broll?.name} - {result.broll?.duration}s
              </p>
              <Link
                href="/dashboard/generate"
                className="inline-block mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                🎬 Generate Content Now
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
