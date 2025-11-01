'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function UploadBroll() {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setUploadResult(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    
    if (!file) {
      setUploadResult('Please select a video file');
      setUploading(false);
      return;
    }

    const metadata = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
      duration: parseInt(formData.get('duration') as string)
    };

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('metadata', JSON.stringify(metadata));

    try {
      const response = await fetch('/api/upload/broll', {
        method: 'POST',
        body: uploadFormData
      });

      const result = await response.json();
      
      if (response.ok) {
        setUploadResult(`✅ Successfully uploaded: ${result.broll.name}`);
        (e.target as HTMLFormElement).reset();
      } else {
        setUploadResult(`❌ Upload failed: ${result.error}`);
      }
    } catch (error) {
      setUploadResult(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">Upload B-roll Content</h1>
              <p className="text-gray-600">Add video files for content generation</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video File
              </label>
              <input
                type="file"
                name="file"
                accept="video/*"
                required
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., City Timelapse"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Brief description of the video content"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  name="duration"
                  min="1"
                  max="300"
                  defaultValue="30"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., fast, energy, modern, city"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload B-roll Video'}
            </button>

            {uploadResult && (
              <div className={`p-4 rounded-lg ${uploadResult.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {uploadResult}
              </div>
            )}
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Good B-roll:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use vertical videos (9:16 aspect ratio) for best results</li>
              <li>• Keep videos under 60 seconds for faster processing</li>
              <li>• High-quality, well-lit footage works best</li>
              <li>• Avoid videos with existing text overlays</li>
              <li>• MP4 format recommended</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
