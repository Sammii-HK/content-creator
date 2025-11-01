'use client';

import { useState } from 'react';
import Link from 'next/link';

interface TextStyle {
  fontSize: number;
  fontWeight: string;
  color: string;
  stroke?: string;
  strokeWidth?: number;
}

interface TextOverlay {
  content: string;
  position: { x: number; y: number };
  style: TextStyle;
}

interface VideoScene {
  start: number;
  end: number;
  text: TextOverlay;
  filters?: string[];
}

interface VideoTemplate {
  duration: number;
  scenes: VideoScene[];
}

export default function NewTemplate() {
  const [templateName, setTemplateName] = useState('');
  const [template, setTemplate] = useState<VideoTemplate>({
    duration: 10,
    scenes: [
      {
        start: 0,
        end: 10,
        text: {
          content: '{{hook}}',
          position: { x: 50, y: 50 },
          style: {
            fontSize: 48,
            fontWeight: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeWidth: 2
          }
        },
        filters: ['brightness(1.0)', 'contrast(1.0)']
      }
    ]
  });

  const [previewScene, setPreviewScene] = useState(0);

  const addScene = () => {
    const newScene: VideoScene = {
      start: template.scenes[template.scenes.length - 1]?.end || 0,
      end: template.duration,
      text: {
        content: '{{content}}',
        position: { x: 50, y: 50 },
        style: {
          fontSize: 36,
          fontWeight: 'normal',
          color: '#ffffff',
          stroke: '#000000',
          strokeWidth: 1
        }
      },
      filters: ['brightness(1.0)', 'contrast(1.0)']
    };

    setTemplate({
      ...template,
      scenes: [...template.scenes, newScene]
    });
  };

  const updateScene = (index: number, updates: Partial<VideoScene>) => {
    const newScenes = [...template.scenes];
    newScenes[index] = { ...newScenes[index], ...updates };
    setTemplate({ ...template, scenes: newScenes });
  };

  const removeScene = (index: number) => {
    const newScenes = template.scenes.filter((_, i) => i !== index);
    setTemplate({ ...template, scenes: newScenes });
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          json: template
        })
      });

      if (response.ok) {
        alert('Template saved successfully!');
        window.location.href = '/dashboard';
      } else {
        alert('Failed to save template');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">Create Video Template</h1>
              <p className="text-gray-600">Design timing, text positioning, and effects</p>
            </div>
            <button
              onClick={saveTemplate}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Save Template
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Template Builder */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Template Info</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Quick Facts, Story Hook"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="30"
                    value={template.duration}
                    onChange={(e) => setTemplate({ ...template, duration: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Scenes */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Scenes</h3>
                <button
                  onClick={addScene}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Scene
                </button>
              </div>

              <div className="space-y-4">
                {template.scenes.map((scene, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Scene {index + 1}</h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setPreviewScene(index)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          Preview
                        </button>
                        {template.scenes.length > 1 && (
                          <button
                            onClick={() => removeScene(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time (s)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max={template.duration}
                          value={scene.start}
                          onChange={(e) => updateScene(index, { start: parseFloat(e.target.value) })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time (s)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min={scene.start}
                          max={template.duration}
                          value={scene.end}
                          onChange={(e) => updateScene(index, { end: parseFloat(e.target.value) })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Content
                      </label>
                      <input
                        type="text"
                        value={scene.text.content}
                        onChange={(e) => updateScene(index, { 
                          text: { ...scene.text, content: e.target.value }
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="Use {{hook}}, {{content}}, {{question}}, etc."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          X Position (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={scene.text.position.x}
                          onChange={(e) => updateScene(index, { 
                            text: { 
                              ...scene.text, 
                              position: { ...scene.text.position, x: parseInt(e.target.value) }
                            }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Y Position (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={scene.text.position.y}
                          onChange={(e) => updateScene(index, { 
                            text: { 
                              ...scene.text, 
                              position: { ...scene.text.position, y: parseInt(e.target.value) }
                            }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Font Size
                        </label>
                        <input
                          type="number"
                          min="12"
                          max="72"
                          value={scene.text.style.fontSize}
                          onChange={(e) => updateScene(index, { 
                            text: { 
                              ...scene.text, 
                              style: { ...scene.text.style, fontSize: parseInt(e.target.value) }
                            }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Text Color
                        </label>
                        <input
                          type="color"
                          value={scene.text.style.color}
                          onChange={(e) => updateScene(index, { 
                            text: { 
                              ...scene.text, 
                              style: { ...scene.text.style, color: e.target.value }
                            }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 h-10"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Template Preview</h3>
            
            {/* Video Preview Area */}
            <div className="bg-black rounded-lg aspect-[9/16] max-w-xs mx-auto mb-6 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-sm mb-2">Scene {previewScene + 1}</div>
                  <div 
                    className="absolute text-white font-bold"
                    style={{
                      fontSize: `${template.scenes[previewScene]?.text.style.fontSize / 4}px`,
                      left: `${template.scenes[previewScene]?.text.position.x}%`,
                      top: `${template.scenes[previewScene]?.text.position.y}%`,
                      transform: 'translate(-50%, -50%)',
                      color: template.scenes[previewScene]?.text.style.color,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    }}
                  >
                    {template.scenes[previewScene]?.text.content}
                  </div>
                </div>
              </div>
            </div>

            {/* Scene Navigation */}
            <div className="flex justify-center space-x-2 mb-6">
              {template.scenes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPreviewScene(index)}
                  className={`px-3 py-1 rounded ${
                    previewScene === index
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Scene {index + 1}
                </button>
              ))}
            </div>

            {/* Template Variables */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Available Variables:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <code className="bg-gray-100 px-2 py-1 rounded">{'{{hook}}'}</code>
                <code className="bg-gray-100 px-2 py-1 rounded">{'{{content}}'}</code>
                <code className="bg-gray-100 px-2 py-1 rounded">{'{{question}}'}</code>
                <code className="bg-gray-100 px-2 py-1 rounded">{'{{answer}}'}</code>
                <code className="bg-gray-100 px-2 py-1 rounded">{'{{title}}'}</code>
                <code className="bg-gray-100 px-2 py-1 rounded">{'{{items}}'}</code>
              </div>
            </div>

            {/* Common Templates */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Quick Templates:</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setTemplateName('Hook + Content');
                    setTemplate({
                      duration: 10,
                      scenes: [
                        {
                          start: 0,
                          end: 2,
                          text: {
                            content: '{{hook}}',
                            position: { x: 50, y: 20 },
                            style: { fontSize: 48, fontWeight: 'bold', color: '#ffffff', stroke: '#000000', strokeWidth: 2 }
                          },
                          filters: ['brightness(1.2)', 'contrast(1.1)']
                        },
                        {
                          start: 2,
                          end: 10,
                          text: {
                            content: '{{content}}',
                            position: { x: 50, y: 60 },
                            style: { fontSize: 36, fontWeight: 'normal', color: '#ffffff', stroke: '#000000', strokeWidth: 1 }
                          },
                          filters: ['brightness(1.0)', 'contrast(1.0)']
                        }
                      ]
                    });
                  }}
                  className="w-full text-left bg-blue-50 hover:bg-blue-100 p-3 rounded-lg transition-colors"
                >
                  <div className="font-medium">Hook + Content</div>
                  <div className="text-sm text-gray-600">Strong hook (2s) + main content (8s)</div>
                </button>

                <button
                  onClick={() => {
                    setTemplateName('Question + Answer');
                    setTemplate({
                      duration: 12,
                      scenes: [
                        {
                          start: 0,
                          end: 3,
                          text: {
                            content: '{{question}}',
                            position: { x: 50, y: 30 },
                            style: { fontSize: 42, fontWeight: 'bold', color: '#ffff00', stroke: '#000000', strokeWidth: 2 }
                          },
                          filters: ['brightness(1.1)', 'contrast(1.2)']
                        },
                        {
                          start: 3,
                          end: 12,
                          text: {
                            content: '{{answer}}',
                            position: { x: 50, y: 70 },
                            style: { fontSize: 38, fontWeight: 'normal', color: '#ffffff', stroke: '#000000', strokeWidth: 1 }
                          },
                          filters: ['brightness(1.0)', 'contrast(1.0)']
                        }
                      ]
                    });
                  }}
                  className="w-full text-left bg-green-50 hover:bg-green-100 p-3 rounded-lg transition-colors"
                >
                  <div className="font-medium">Question + Answer</div>
                  <div className="text-sm text-gray-600">Intriguing question (3s) + answer (9s)</div>
                </button>

                <button
                  onClick={() => {
                    setTemplateName('Countdown List');
                    setTemplate({
                      duration: 15,
                      scenes: [
                        {
                          start: 0,
                          end: 2,
                          text: {
                            content: '{{title}}',
                            position: { x: 50, y: 20 },
                            style: { fontSize: 44, fontWeight: 'bold', color: '#ff6b6b', stroke: '#ffffff', strokeWidth: 2 }
                          },
                          filters: ['brightness(1.2)', 'contrast(1.1)']
                        },
                        {
                          start: 2,
                          end: 15,
                          text: {
                            content: '{{items}}',
                            position: { x: 50, y: 60 },
                            style: { fontSize: 32, fontWeight: 'normal', color: '#ffffff', stroke: '#000000', strokeWidth: 1 }
                          },
                          filters: ['brightness(1.0)', 'contrast(1.0)']
                        }
                      ]
                    });
                  }}
                  className="w-full text-left bg-purple-50 hover:bg-purple-100 p-3 rounded-lg transition-colors"
                >
                  <div className="font-medium">Countdown List</div>
                  <div className="text-sm text-gray-600">Title (2s) + numbered items (13s)</div>
                </button>
              </div>
            </div>
          </div>

          {/* JSON Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Template JSON</h3>
            <pre className="bg-gray-100 rounded-lg p-4 text-sm overflow-auto max-h-96">
              {JSON.stringify(template, null, 2)}
            </pre>
            
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">💡 Template Tips:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Position: 0-100% (50 = center)</li>
                <li>• Use variables like {'{{hook}}'} for AI-generated content</li>
                <li>• Scene timing should not overlap</li>
                <li>• Higher contrast/brightness for text readability</li>
                <li>• Test different positions for mobile screens</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
