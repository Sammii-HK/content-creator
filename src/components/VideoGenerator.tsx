'use client';

import { useState, useRef, useEffect } from 'react';
import { PlayIcon, StopIcon, DownloadIcon, EyeIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface VideoGeneratorProps {
  videoUrl: string;
  template: any;
  content: Record<string, string>;
  onComplete?: (videoBlob: Blob) => void;
}

export default function VideoGenerator({ 
  videoUrl, 
  template, 
  content, 
  onComplete 
}: VideoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);

  const generateVideo = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsGenerating(true);
    setProgress(0);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    // Set canvas size for vertical video
    canvas.width = 1080;
    canvas.height = 1920;

    try {
      // Set up recording
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);

      const recordingPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };
      });

      // Start recording
      recorder.start();
      video.currentTime = 0;
      video.play();

      // Render loop
      const startTime = Date.now();
      const duration = template.duration * 1000; // Convert to milliseconds

      const renderFrame = () => {
        const elapsed = Date.now() - startTime;
        const videoTime = elapsed / 1000; // Convert back to seconds
        
        setProgress((elapsed / duration) * 100);

        if (elapsed >= duration) {
          recorder.stop();
          video.pause();
          return;
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw video frame (crop to vertical)
        const videoAspect = video.videoWidth / video.videoHeight;
        const targetAspect = 9 / 16;

        let drawWidth, drawHeight, drawX, drawY;

        if (videoAspect > targetAspect) {
          // Video is wider - crop sides
          drawHeight = canvas.height;
          drawWidth = drawHeight * videoAspect;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = 0;
        } else {
          // Video is taller - crop top/bottom
          drawWidth = canvas.width;
          drawHeight = drawWidth / videoAspect;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        }

        ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);

        // Apply filters for current scene
        const currentScene = template.scenes.find((scene: any) => 
          videoTime >= scene.start && videoTime < scene.end
        );

        if (currentScene) {
          // Apply brightness/contrast filters
          if (currentScene.filters) {
            // Simple filter application
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // Apply basic brightness adjustment
            // (In a full implementation, you'd parse and apply the actual filters)
            ctx.putImageData(imageData, 0, 0);
          }

          // Render text overlay
          this.renderTextOverlay(ctx, currentScene, content);
          setCurrentScene(template.scenes.indexOf(currentScene));
        }

        requestAnimationFrame(renderFrame);
      };

      renderFrame();

      // Wait for recording to complete
      const videoBlob = await recordingPromise;
      const videoUrl = URL.createObjectURL(videoBlob);
      setGeneratedVideo(videoUrl);
      
      if (onComplete) {
        onComplete(videoBlob);
      }

    } catch (error) {
      console.error('Video generation failed:', error);
      alert('Video generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const renderTextOverlay = (
    ctx: CanvasRenderingContext2D,
    scene: any,
    content: Record<string, string>
  ) => {
    const text = this.replaceVariables(scene.text.content, content);
    const style = scene.text.style;
    const pos = scene.text.position;

    // Calculate position in pixels
    const x = (pos.x / 100) * ctx.canvas.width;
    const y = (pos.y / 100) * ctx.canvas.height;

    // Set text properties
    ctx.font = `${style.fontWeight} ${style.fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text stroke/outline
    if (style.stroke && style.strokeWidth) {
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = style.strokeWidth;
      ctx.strokeText(text, x, y);
    }

    // Fill text
    ctx.fillStyle = style.color;
    ctx.fillText(text, x, y);
  };

  const replaceVariables = (text: string, content: Record<string, string>): string => {
    let result = text;
    Object.entries(content).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  };

  const downloadVideo = () => {
    if (!generatedVideo) return;
    
    const a = document.createElement('a');
    a.href = generatedVideo;
    a.download = `smart-content-${Date.now()}.webm`;
    a.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Video Generator</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={clsx(
              "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors",
              isPreviewMode 
                ? "bg-indigo-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <EyeIcon className="h-4 w-4" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Video Preview Area */}
      <div className="mb-6">
        <div className="bg-black rounded-lg aspect-[9/16] max-w-xs mx-auto relative overflow-hidden">
          {/* Source video (hidden) */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="hidden"
            crossOrigin="anonymous"
            preload="metadata"
          />
          
          {/* Canvas for generation */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: isGenerating ? 'block' : 'none' }}
          />
          
          {/* Preview video */}
          {generatedVideo && (
            <video
              ref={previewRef}
              src={generatedVideo}
              className="w-full h-full object-cover"
              controls
              loop
            />
          )}
          
          {/* Preview mode - show template */}
          {isPreviewMode && !isGenerating && !generatedVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
              <div className="text-center">
                <div className="text-white text-sm mb-2">Scene {currentScene + 1}</div>
                <div 
                  className="text-white font-bold absolute"
                  style={{
                    fontSize: `${(template.scenes[currentScene]?.text.style.fontSize || 48) / 6}px`,
                    left: `${template.scenes[currentScene]?.text.position.x || 50}%`,
                    top: `${template.scenes[currentScene]?.text.position.y || 50}%`,
                    transform: 'translate(-50%, -50%)',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    maxWidth: '80%',
                    wordWrap: 'break-word'
                  }}
                >
                  {this.replaceVariables(
                    template.scenes[currentScene]?.text.content || '',
                    content
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Generating video...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={generateVideo}
          disabled={isGenerating}
          className={clsx(
            "flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors",
            isGenerating
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          )}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <PlayIcon className="h-4 w-4" />
              <span>Generate Video</span>
            </>
          )}
        </button>

        {generatedVideo && (
          <button
            onClick={downloadVideo}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <DownloadIcon className="h-4 w-4" />
            <span>Download</span>
          </button>
        )}
      </div>

      {/* Template Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Template: {template.name || 'Custom'}</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Duration: {template.duration}s</p>
          <p>Scenes: {template.scenes?.length || 0}</p>
          <p>Content: {Object.entries(content).map(([k, v]) => `${k}: "${v.slice(0, 30)}..."`).join(', ')}</p>
        </div>
      </div>

      {/* Cost Info */}
      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 rounded-full p-1">
            <span className="text-green-600 text-xs font-bold">$0</span>
          </div>
          <p className="text-sm text-green-800 font-medium">
            Free client-side video generation • Unlimited videos • No server costs
          </p>
        </div>
      </div>
    </div>
  );
}
