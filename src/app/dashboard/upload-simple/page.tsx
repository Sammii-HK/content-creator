'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, CloudArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function SimpleUpload() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!file) {
      setError('Please select a video file');
      setUploading(false);
      return;
    }

    console.log('iPhone upload attempt:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      name,
      description
    });

    // Use the simple upload endpoint
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('name', name || file.name);
    uploadFormData.append('description', description || `iPhone video: ${file.name}`);

    try {
      const response = await fetch('/api/upload/simple', {
        method: 'POST',
        body: uploadFormData
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(data.error || 'Upload failed');
        console.error('Upload error details:', data);
      }
    } catch (error) {
      console.error('Upload exception:', error);
      setError('Network error - please try again');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link 
            href="/dashboard" 
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">📱 Simple iPhone Upload</h1>
          <p className="text-gray-600">Maximum compatibility for iPhone videos</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-4">
                📹 Select Video from iPhone
              </label>
              <input
                type="file"
                name="file"
                accept="video/*"
                required
                className="block w-full text-base border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                Tap to select from your camera roll
              </p>
            </div>

            {/* Simple Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="e.g., My morning routine"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's in this video?
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="e.g., Me talking about productivity tips in my office"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-indigo-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
            >
              {uploading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <CloudArrowUpIcon className="h-5 w-5" />
                  <span>Upload iPhone Video</span>
                </div>
              )}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-2">Upload Error:</h4>
              <pre className="text-sm text-red-800 whitespace-pre-wrap">{error}</pre>
              
              <div className="mt-4 p-3 bg-white rounded border">
                <h5 className="font-medium text-red-900 mb-2">🛠️ Try This:</h5>
                <ol className="text-sm text-red-800 space-y-1">
                  <li>1. Open video in iPhone Photos app</li>
                  <li>2. Tap "Edit" → Make any small change → Tap "Done"</li>
                  <li>3. This converts to compatible MP4 format</li>
                  <li>4. Try uploading again</li>
                </ol>
              </div>
            </div>
          )}

          {/* Success Display */}
          {result && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-900">Upload Successful!</h4>
              </div>
              <div className="text-sm text-green-800 space-y-1">
                <p><strong>Name:</strong> {result.broll?.name}</p>
                <p><strong>Duration:</strong> {result.broll?.duration}s (estimated)</p>
                <p><strong>Category:</strong> {result.broll?.category}</p>
                <p><strong>File:</strong> {result.info?.originalFileName}</p>
              </div>
              <Link
                href="/dashboard/generate"
                className="inline-block mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                🎬 Generate Video Now
              </Link>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-3">📱 iPhone Video Tips:</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>Best format:</strong> Record in standard video mode (not cinematic)</li>
            <li>• <strong>If upload fails:</strong> Edit video in Photos app first</li>
            <li>• <strong>File size:</strong> Keep under 200MB for faster upload</li>
            <li>• <strong>Orientation:</strong> Vertical videos work best for social media</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
