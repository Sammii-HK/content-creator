'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, VideoCameraIcon, PlayIcon, EyeIcon } from '@heroicons/react/24/outline';

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
          <div className="space-y-6">
            {/* Simple Video List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Videos ({videos.length})</h2>
              
              <div className="space-y-4">
                {videos.map((video) => (
                  <div key={video.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      {/* Video Thumbnail */}
                      <div className="w-24 h-16 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                        <PlayIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      
                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                          {video.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toFixed(0).padStart(2, '0')} • Category: {video.category}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Uploaded: {new Date(video.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col space-y-2">
                        <a
                          href={video.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>Preview</span>
                        </a>
                        
                        <Link
                          href={`/dashboard/broll/${video.id}/segments`}
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                        >
                          <VideoCameraIcon className="h-4 w-4" />
                          <span>Segment</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {videos.length === 0 && (
                <div className="text-center py-8">
                  <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No videos uploaded yet</p>
                  <Link
                    href="/dashboard/upload"
                    className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Upload Your First Video
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
