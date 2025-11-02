'use client';

import { useState } from 'react';
import Link from 'next/link';
import FileUpload from '@/components/ui/FileUpload';
import { ArrowLeftIcon, PlayIcon } from '@heroicons/react/24/outline';

export default function UploadBroll() {
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File, metadata: any) => {
    // PURE CLIENT-SIDE R2 UPLOAD - NO API ENDPOINTS
    console.log('Starting pure client-side R2 upload...');
    
    const { ClientR2Uploader } = await import('@/lib/r2-storage');
    const uploader = new ClientR2Uploader(
      'https://pub-8b8b71f14a6347adbfbed072ddad9828.r2.dev'
    );

    // Upload directly to R2
    const uploadResult = await uploader.uploadFile(
      file, 
      '0f7d75c413cbf60bea1673ce243726fa', // Access Key ID
      '9daa02bc1fe9d843bc618bf0af78c81627a81499e7e4c1c11eea610bbe7b1d' // Secret Access Key
    );

    // Save to database (small payload)
    const fileSizeMB = file.size / (1024 * 1024);
    const estimatedDuration = Math.max(5, Math.min(300, Math.round(fileSizeMB * 8)));
    
    const dbResponse = await fetch('/api/broll/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metadata.name || file.name.replace(/\.[^/.]+$/, ""),
        description: metadata.description || `iPhone video: ${file.name}`,
        fileUrl: uploadResult.url,
        duration: estimatedDuration,
        category: metadata.category || 'personal',
        tags: metadata.tags || []
      })
    });

    if (!dbResponse.ok) {
      throw new Error('Database save failed');
    }

    const result = await dbResponse.json();
    setRecentUploads(prev => [result.broll, ...prev].slice(0, 5));
    
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

            {/* Desktop iPhone Video Instructions */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">🖥️ Using iPhone Videos on Desktop?</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p className="font-medium">Don't drag from Photos app directly!</p>
                <div className="bg-white rounded p-3 border border-blue-200">
                  <p className="font-medium text-blue-900 mb-1">✅ Correct Method:</p>
                  <ol className="space-y-1 text-blue-800">
                    <li>1. Open Photos app → Select your video</li>
                    <li>2. File → Export → Export Unmodified Original</li>
                    <li>3. Save to Downloads folder</li>
                    <li>4. Drag the .MOV file from Downloads here</li>
                  </ol>
                </div>
                <p className="text-xs text-blue-600">
                  💡 AirDrop from iPhone is even easier!
                </p>
              </div>
            </div>

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
