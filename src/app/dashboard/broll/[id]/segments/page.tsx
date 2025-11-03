'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeftIcon, PlayIcon, PauseIcon, ScissorsIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface BrollVideo {
  id: string;
  name: string;
  fileUrl: string;
  duration: number;
  category: string;
}

interface VideoSegment {
  id?: string;
  name: string;
  startTime: number;
  endTime: number;
  description: string;
  quality: number;
  tags: string[];
  isUsable: boolean;
}

export default function VideoSegments() {
  const params = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState<BrollVideo | null>(null);
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Segment creation
  const [isCreatingSegment, setIsCreatingSegment] = useState(false);
  const [segmentStart, setSegmentStart] = useState<number | null>(null);
  const [newSegment, setNewSegment] = useState<Partial<VideoSegment>>({
    description: '',
    quality: 5,
    tags: [],
    isUsable: true,
  });

  useEffect(() => {
    if (params.id) {
      fetchVideo();
      fetchSegments();
    }
  }, [params.id]);

  const fetchVideo = async () => {
    try {
      const response = await fetch(`/api/broll/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setVideo(data.broll);
      }
    } catch (error) {
      console.error('Failed to fetch video:', error);
    }
  };

  const fetchSegments = async () => {
    try {
      const response = await fetch(`/api/broll/${params.id}/segments`);
      if (response.ok) {
        const data = await response.json();
        setSegments(data.segments || []);
      }
    } catch (error) {
      console.error('Failed to fetch segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const startSegmentCreation = () => {
    setSegmentStart(currentTime);
    setIsCreatingSegment(true);
    setNewSegment({
      description: '',
      quality: 5,
      tags: [],
      isUsable: true,
    });
  };

  const finishSegmentCreation = async () => {
    if (segmentStart === null) return;

    const segmentData = {
      name: `Segment ${segmentStart.toFixed(1)}s-${currentTime.toFixed(1)}s`,
      startTime: segmentStart,
      endTime: currentTime,
      description: newSegment.description || `Segment from ${segmentStart.toFixed(1)}s to ${currentTime.toFixed(1)}s`,
      quality: newSegment.quality || 5,
      tags: newSegment.tags || [],
      isUsable: newSegment.isUsable !== false,
    };

    try {
      const response = await fetch(`/api/broll/${params.id}/segments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(segmentData),
      });

      if (response.ok) {
        const data = await response.json();
        setSegments([...segments, data.segment]);
        setIsCreatingSegment(false);
        setSegmentStart(null);
      }
    } catch (error) {
      console.error('Failed to create segment:', error);
    }
  };

  const updateSegmentRating = async (segmentId: string, rating: number) => {
    try {
      const response = await fetch(`/api/broll/segments/${segmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality: rating }),
      });

      if (response.ok) {
        setSegments(segments.map(s => 
          s.id === segmentId ? { ...s, quality: rating } : s
        ));
      }
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-gray-900 dark:text-white">Video not found</h2>
          <Link href="/dashboard/process" className="text-indigo-600 dark:text-indigo-400">
            Back to videos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link
              href="/dashboard/process"
              className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors mr-6"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{video.name}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create segments • Rate quality • Tag content</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Simple Video Player */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Video Player</h2>
            
            <div className="space-y-4">
              {/* Video */}
              <video
                ref={videoRef}
                src={video.fileUrl}
                controls
                className="w-full max-w-2xl mx-auto rounded-lg bg-black"
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              
              {/* Simple Controls */}
              <div className="flex items-center justify-center space-x-4">
                <span className="text-gray-900 dark:text-white font-mono">
                  Current: {formatTime(currentTime)}
                </span>
                
                {!isCreatingSegment ? (
                  <button
                    onClick={startSegmentCreation}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    🎬 Start New Segment
                  </button>
                ) : (
                  <div className="flex items-center space-x-4">
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                      Recording from {formatTime(segmentStart || 0)}
                    </span>
                    <button
                      onClick={finishSegmentCreation}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      ✂️ End Segment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Simple Segments List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Segments ({segments.length})
            </h3>
            
            {segments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">No segments created yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Play the video above and click "Start New Segment" to begin
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {segments.map((segment, index) => (
                  <div key={segment.id || index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <button
                          onClick={() => seekTo(segment.startTime)}
                          className="text-lg font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {formatTime(segment.startTime)} → {formatTime(segment.endTime)}
                        </button>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{segment.description}</p>
                        
                        {/* Simple Quality Rating */}
                        <div className="flex items-center space-x-2 mt-3">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Quality:</span>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => segment.id && updateSegmentRating(segment.id, rating)}
                              className={`w-6 h-6 rounded text-xs font-bold ${
                                rating <= segment.quality 
                                  ? 'bg-yellow-400 text-black' 
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {segment.quality}/10
                          </span>
                        </div>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        segment.isUsable 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {segment.isUsable ? '✅ Good' : '❌ Skip'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}