'use client';

import { useState, useRef } from 'react';
import { CloudArrowUpIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';
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
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setUploadStatus('error');
      setUploadMessage(`File too large. Maximum size is ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setUploadStatus('error');
      setUploadMessage('Please select a video file');
      return;
    }

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
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Upload failed');
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
    <div className={clsx("space-y-6", className)}>
      {/* File Drop Area */}
      <div
        className={clsx(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
          isDragOver 
            ? "border-indigo-500 bg-indigo-50" 
            : "border-gray-300 hover:border-gray-400",
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
          accept={accept}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          ) : (
            <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
          )}
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {uploading ? 'Uploading...' : 'Drop video here or click to browse'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supports iPhone videos, MP4, MOV • Max {maxSize}MB
            </p>
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

      {/* Metadata Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="e.g., Morning coffee routine, City walk"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={metadata.category}
              onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="">Auto-detect category</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label} - {cat.desc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={metadata.description}
              onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="What happens in this video? What mood or vibe does it have?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={metadata.tags}
              onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="e.g., energetic, close-up, bright, fast, me, talking"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Use descriptive tags like: energetic, calm, close-up, wide-shot, bright, dark, me, hands, face
            </p>
          </div>
        </div>
      </div>

      {/* iPhone Upload Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <VideoCameraIcon className="h-6 w-6 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">📱 iPhone Upload Tips:</h4>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• Record in vertical (portrait) mode for best results</li>
              <li>• Good lighting makes a huge difference</li>
              <li>• Keep videos under 60 seconds for faster processing</li>
              <li>• Videos upload directly from your iPhone camera roll</li>
              <li>• Duration is detected automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
