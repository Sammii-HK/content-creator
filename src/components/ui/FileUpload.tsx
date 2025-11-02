'use client';

import { useState, useRef } from 'react';
import { CloudArrowUpIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { appleVideoHandler } from '@/lib/apple-video-handler';
import clsx from 'clsx';

interface FileUploadProps {
  onUpload: (file: File, metadata: any) => Promise<void>;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export default function FileUpload({ 
  onUpload, 
  accept = "video/*", 
  maxSize = 100,
  className 
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [metadata, setMetadata] = useState({
    name: '',
    description: '',
    category: '',
    tags: ''
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });

    const fileSizeMB = file.size / (1024 * 1024);

    // Use robust Apple video validation
    const validation = appleVideoHandler.validateAppleVideo(file);
    if (!validation.valid) {
      setUploadStatus('error');
      setUploadMessage(validation.error || 'Invalid video format');
      return;
    }

    console.log('✅ Apple video validation passed - processing iPhone/iPad video');

    // Auto-fill name if empty
    if (!metadata.name) {
      setMetadata(prev => ({
        ...prev,
        name: file.name.replace(/\.[^/.]+$/, "") // Remove extension
      }));
    }

    setUploading(true);
    setUploadStatus('idle');
    
    try {
      await onUpload(file, {
        ...metadata,
        tags: metadata.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      });
      
      setUploadStatus('success');
      setUploadMessage('Video uploaded successfully!');
      
      // Reset form
      setMetadata({ name: '', description: '', category: '', tags: '' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      
      let errorMessage = 'Upload failed';
      if (error instanceof Error) {
        if (error.message.includes('string did not match')) {
          errorMessage = 'iPhone video format issue. Try converting to MP4 first, or use a different video.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setUploadMessage(errorMessage);
    } finally {
      setUploading(false);
    }
  };


  const categories = [
    { value: 'personal', label: 'Personal/Creator', desc: 'Videos of yourself, talking head shots' },
    { value: 'workspace', label: 'Workspace/Tech', desc: 'Desk setups, computers, coding' },
    { value: 'lifestyle', label: 'Lifestyle/Daily', desc: 'Coffee, food, routines, home' },
    { value: 'nature', label: 'Nature/Outdoor', desc: 'Sky, trees, water, landscapes' },
    { value: 'urban', label: 'Urban/City', desc: 'Streets, buildings, city life' },
    { value: 'abstract', label: 'Abstract/Motion', desc: 'Patterns, colors, animations' },
    { value: 'business', label: 'Business/Professional', desc: 'Meetings, presentations, corporate' },
    { value: 'general', label: 'General/Other', desc: 'Other content' }
  ];

  return (
    <div className={clsx("space-y-4 sm:space-y-6", className)}>
      {/* File Drop Area */}
      <div
        className={clsx(
          "border-2 border-dashed rounded-lg sm:rounded-xl p-4 sm:p-8 text-center transition-all duration-200 cursor-pointer",
          isDragOver 
            ? "border-indigo-500 bg-indigo-50 scale-105" 
            : "border-gray-300 hover:border-indigo-300 hover:bg-gray-50",
          uploading && "pointer-events-none opacity-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.mov,.avi,.webm,.m4v"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-indigo-600"></div>
          ) : (
            <CloudArrowUpIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
          )}
          
          <div className="text-center">
            <p className="text-base sm:text-lg font-medium text-gray-900">
              {uploading ? 'Uploading & analyzing...' : 'Drop video or tap to select'}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              📱 iPhone videos • MP4, MOV • Max {maxSize}MB
            </p>
            {uploading && (
              <p className="text-xs text-indigo-600 mt-2">
                🤖 AI generating tags automatically...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Upload Status */}
      {uploadStatus !== 'idle' && (
        <div className={clsx(
          "flex items-center space-x-3 p-4 rounded-lg",
          uploadStatus === 'success' ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
        )}>
          {uploadStatus === 'success' ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <XCircleIcon className="h-5 w-5" />
          )}
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* Metadata Form - Mobile Optimized */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Details</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Name
            </label>
            <input
              type="text"
              value={metadata.name}
              onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="e.g., Me talking about productivity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's in this video? 🤖
            </label>
            <textarea
              value={metadata.description}
              onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Describe what happens: 'Me talking about morning routine with coffee in my kitchen' - AI will auto-generate tags!"
            />
            <p className="text-xs text-indigo-600 mt-1 font-medium">
              💡 AI analyzes your description to generate tags automatically (costs ~$0.0001)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category (Optional)
            </label>
            <select
              value={metadata.category}
              onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="">🤖 Auto-detect from description</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Leave blank for smart auto-categorization
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Tags (Optional)
            </label>
            <input
              type="text"
              value={metadata.tags}
              onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Add extra tags if needed"
            />
            <p className="text-xs text-gray-500 mt-1">
              AI will generate most tags automatically from your description
            </p>
          </div>
        </div>
      </div>

      {/* iPhone Upload Tips - Mobile Optimized */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <VideoCameraIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="font-medium text-blue-900 text-sm sm:text-base">📱 iPhone Upload:</h4>
            <div className="text-xs sm:text-sm text-blue-800 mt-2 space-y-1">
              <p>• 📱 Direct from camera roll</p>
              <p>• ⏱️ Duration auto-detected</p>
              <p>• 🤖 AI generates tags from description</p>
              <p>• 📊 Smart categorization</p>
              <p>• 💰 Cost: ~$0.0001 per video</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
