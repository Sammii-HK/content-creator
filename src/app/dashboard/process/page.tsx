'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, VideoCameraIcon, ScissorsIcon, SparklesIcon, PlayIcon } from '@heroicons/react/24/outline';

interface BrollVideo {
  id: string;
  name: string;
  fileUrl: string;
  duration: number;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export default function ProcessVideos() {
  const [videos, setVideos] = useState<BrollVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/broll');
      if (response.ok) {
        const data = await response.json();
        setVideos(data.broll || []);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors mr-6"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Process Videos</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Create segments and generate content</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <VideoCameraIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No videos uploaded yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Upload some videos first to start processing them</p>
            <Link
              href="/dashboard/upload"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Upload Videos
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Processing Steps */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Next Steps</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                    <ScissorsIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">1. Segment Videos</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Break videos into timestamped clips</p>
                  <button className="mt-3 text-blue-600 dark:text-blue-400 text-sm font-medium" disabled>
                    Coming Soon
                  </button>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                    <SparklesIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">2. AI Analysis</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Auto-tag and categorize content</p>
                  <button className="mt-3 text-purple-600 dark:text-purple-400 text-sm font-medium" disabled>
                    Coming Soon
                  </button>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-900 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                    <PlayIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">3. Generate Content</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create videos from segments</p>
                  <button className="mt-3 text-green-600 dark:text-green-400 text-sm font-medium" disabled>
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>

            {/* Video Library */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Your Video Library</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <div key={video.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded-lg mb-3 flex items-center justify-center">
                      <PlayIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{video.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{video.duration}s • {video.category}</p>
                    <div className="mt-3 flex space-x-2">
                      <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 px-3 rounded font-medium transition-colors" disabled>
                        Segment
                      </button>
                      <button className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm py-2 px-3">
                        Preview
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
