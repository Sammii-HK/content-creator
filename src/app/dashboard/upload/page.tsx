'use client';

import { useState } from 'react';
import Link from 'next/link';
import FileUpload from '@/components/ui/FileUpload';
import { ArrowLeftIcon, PlayIcon } from '@heroicons/react/24/outline';

export default function UploadBroll() {
  const [recentUploads, setRecentUploads] = useState<any[]>([]);

  const handleUpload = async (file: File, metadata: any) => {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('metadata', JSON.stringify(metadata));

    const response = await fetch('/api/upload/broll', {
      method: 'POST',
      body: uploadFormData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    setRecentUploads(prev => [result.broll, ...prev].slice(0, 5)); // Keep last 5
    
    return result;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-colors mr-6"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Upload B-roll Content</h1>
              <p className="text-gray-600 mt-1">Add video files from your iPhone or computer</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <div className="bg-indigo-100 rounded-lg p-2">
                  <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Upload Video</h2>
                  <p className="text-sm sm:text-base text-gray-600">Duration & tags auto-detected</p>
                </div>
              </div>

              <FileUpload onUpload={handleUpload} maxSize={200} />
            </div>
          </div>

          {/* Recent Uploads & Info */}
          <div className="space-y-6">
            {/* Recent Uploads */}
            {recentUploads.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Uploads</h3>
                <div className="space-y-3">
                  {recentUploads.map((upload, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="bg-green-100 rounded-full p-1">
                        <PlayIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-900 truncate">
                          {upload.name}
                        </p>
                        <p className="text-xs text-green-700">
                          {upload.duration}s • {upload.category || 'Auto-categorized'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Categories Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Categories</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 rounded-full w-3 h-3 mt-1"></div>
                  <div>
                    <p className="font-medium text-gray-900">Personal/Creator</p>
                    <p className="text-gray-600">Videos of you talking, selfies, creator content</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full w-3 h-3 mt-1"></div>
                  <div>
                    <p className="font-medium text-gray-900">Workspace/Tech</p>
                    <p className="text-gray-600">Desk setups, coding, computers, office spaces</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 rounded-full w-3 h-3 mt-1"></div>
                  <div>
                    <p className="font-medium text-gray-900">Lifestyle/Daily</p>
                    <p className="text-gray-600">Coffee, food, routines, home life</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 rounded-full w-3 h-3 mt-1"></div>
                  <div>
                    <p className="font-medium text-gray-900">Auto-detected</p>
                    <p className="text-gray-600">AI categorizes based on your description and tags</p>
                  </div>
                </div>
              </div>
            </div>

            {/* iPhone Conversion Help */}
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-6">
              <h3 className="text-lg font-semibold text-orange-900 mb-3">📱 iPhone Upload Issues?</h3>
              <div className="space-y-2 text-sm text-orange-800">
                <p className="font-medium">If upload fails with "format issue":</p>
                <p>1. 📱 Open video in iPhone Photos app</p>
                <p>2. ✏️ Tap "Edit" → Tap "Done" (converts format)</p>
                <p>3. 🔄 Try uploading again</p>
                <p className="text-xs text-orange-600 mt-2">
                  This converts HEVC/HEIC to MP4 automatically
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">After Upload</h3>
              <div className="space-y-2 text-sm text-indigo-800">
                <p>1. ✂️ Create segments with timestamps</p>
                <p>2. ⭐ Rate segment quality (1-10)</p>
                <p>3. 🎬 Test video generation</p>
                <p>4. 🤖 Set up automation</p>
              </div>
              <Link
                href="/dashboard/content"
                className="inline-flex items-center space-x-2 mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <span>Manage Content</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
