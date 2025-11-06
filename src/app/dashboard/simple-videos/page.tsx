'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Video {
  id: string;
  name: string;
  fileUrl: string;
  duration: number;
  category: string;
}

export default function SimpleVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/broll')
      .then(res => res.json())
      .then(data => {
        setVideos(data.broll || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 bg-white dark:bg-gray-900 min-h-screen">
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
        <h1 className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">Your Videos</h1>
        <p className="text-gray-600 dark:text-gray-400">Click any video to watch it and create segments</p>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No videos found</p>
          <Link 
            href="/dashboard/upload"
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          >
            Upload Videos
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {videos.map((video) => (
            <div key={video.id} className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-gray-800">
              <div className="flex items-start space-x-6">
                {/* Video Preview */}
                <div className="w-48 h-32 bg-gray-100 dark:bg-gray-700 rounded flex-shrink-0">
                  <video
                    src={video.fileUrl}
                    className="w-full h-full object-cover rounded"
                    muted
                    controls={false}
                    preload="metadata"
                  />
                </div>

                {/* Video Info */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{video.name}</h2>
                  <div className="text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toFixed(0).padStart(2, '0')}</p>
                    <p>Category: {video.category}</p>
                  </div>

                  <div className="mt-4 space-x-3">
                    <a
                      href={video.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
                    >
                      🎬 Watch Video
                    </a>
                    
                    <Link
                      href={`/dashboard/simple-videos/${video.id}/segment`}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
                    >
                      ✂️ Create Segments
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
