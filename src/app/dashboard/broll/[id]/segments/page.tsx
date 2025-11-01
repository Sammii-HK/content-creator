'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface BrollSegment {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  quality: number;
  mood?: string;
  description?: string;
  tags: string[];
  isUsable: boolean;
  usageCount: number;
}

interface Broll {
  id: string;
  name: string;
  fileUrl: string;
  duration: number;
  segments: BrollSegment[];
}

export default function BrollSegments() {
  const params = useParams();
  const brollId = params.id as string;
  
  const [broll, setBroll] = useState<Broll | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSegment, setShowAddSegment] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: '',
    startTime: 0,
    endTime: 10,
    quality: 7,
    mood: '',
    description: '',
    tags: '',
    isUsable: true
  });

  useEffect(() => {
    fetchBrollData();
  }, [brollId]);

  const fetchBrollData = async () => {
    try {
      const response = await fetch(`/api/broll/${brollId}/segments`);
      if (response.ok) {
        const data = await response.json();
        setBroll(data.broll);
      }
    } catch (error) {
      console.error('Failed to fetch B-roll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/broll/${brollId}/segments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSegment,
          tags: newSegment.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      });

      if (response.ok) {
        await fetchBrollData();
        setShowAddSegment(false);
        setNewSegment({
          name: '',
          startTime: 0,
          endTime: 10,
          quality: 7,
          mood: '',
          description: '',
          tags: '',
          isUsable: true
        });
      } else {
        alert('Failed to add segment');
      }
    } catch (error) {
      console.error('Failed to add segment:', error);
      alert('Failed to add segment');
    }
  };

  const toggleUsable = async (segmentId: string, isUsable: boolean) => {
    try {
      const response = await fetch(`/api/broll/segments/${segmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUsable: !isUsable })
      });

      if (response.ok) {
        await fetchBrollData();
      }
    } catch (error) {
      console.error('Failed to toggle segment:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!broll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">B-roll Not Found</h1>
          <Link href="/dashboard/content" className="text-indigo-600 hover:text-indigo-800">
            ← Back to Content Management
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link href="/dashboard/content" className="text-indigo-600 hover:text-indigo-800 text-sm">
                ← Back to Content
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">{broll.name} - Segments</h1>
              <p className="text-gray-600">Manage video segments and timestamps</p>
            </div>
            <button
              onClick={() => setShowAddSegment(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Add Segment
            </button>
          </div>
        </div>
      </header>

      {/* Video Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Video Duration</h3>
              <p className="text-2xl font-bold text-indigo-600">{broll.duration}s</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Total Segments</h3>
              <p className="text-2xl font-bold text-green-600">{broll.segments.length}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Usable Segments</h3>
              <p className="text-2xl font-bold text-blue-600">
                {broll.segments.filter(s => s.isUsable).length}
              </p>
            </div>
          </div>
        </div>

        {/* Segments List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Video Segments</h3>
          </div>
          
          {broll.segments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">✂️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No segments defined</h3>
              <p className="text-gray-600 mb-4">Add segments with timestamps to mark good/bad parts of your video</p>
              <button
                onClick={() => setShowAddSegment(true)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Add First Segment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Segment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamps
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {broll.segments.map((segment) => (
                    <tr key={segment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{segment.name}</div>
                          {segment.description && (
                            <div className="text-sm text-gray-500">{segment.description}</div>
                          )}
                          {segment.mood && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 mt-1">
                              {segment.mood}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {segment.startTime}s → {segment.endTime}s
                        </div>
                        <div className="text-sm text-gray-500">
                          ({(segment.endTime - segment.startTime).toFixed(1)}s duration)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{segment.quality}/10</div>
                          <div className={`ml-2 w-16 h-2 rounded-full ${
                            segment.quality >= 8 ? 'bg-green-200' :
                            segment.quality >= 6 ? 'bg-yellow-200' : 'bg-red-200'
                          }`}>
                            <div 
                              className={`h-2 rounded-full ${
                                segment.quality >= 8 ? 'bg-green-500' :
                                segment.quality >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${segment.quality * 10}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {segment.usageCount} times
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          segment.isUsable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {segment.isUsable ? 'Usable' : 'Blocked'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleUsable(segment.id, segment.isUsable)}
                          className={`mr-3 ${
                            segment.isUsable 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {segment.isUsable ? 'Block' : 'Unblock'}
                        </button>
                        <button className="text-indigo-600 hover:text-indigo-900">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Segment Modal */}
      {showAddSegment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Video Segment</h3>
            <form onSubmit={handleAddSegment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Segment Name
                </label>
                <input
                  type="text"
                  value={newSegment.name}
                  onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Opening scene, City skyline"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time (seconds)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={broll?.duration || 300}
                    value={newSegment.startTime}
                    onChange={(e) => setNewSegment({ ...newSegment, startTime: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time (seconds)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={newSegment.startTime + 0.1}
                    max={broll?.duration || 300}
                    value={newSegment.endTime}
                    onChange={(e) => setNewSegment({ ...newSegment, endTime: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Rating (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={newSegment.quality}
                  onChange={(e) => setNewSegment({ ...newSegment, quality: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Poor (1)</span>
                  <span className="font-semibold">Current: {newSegment.quality}</span>
                  <span>Excellent (10)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mood/Vibe
                </label>
                <select
                  value={newSegment.mood}
                  onChange={(e) => setNewSegment({ ...newSegment, mood: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select mood</option>
                  <option value="energetic">Energetic</option>
                  <option value="calm">Calm</option>
                  <option value="dynamic">Dynamic</option>
                  <option value="focused">Focused</option>
                  <option value="creative">Creative</option>
                  <option value="professional">Professional</option>
                  <option value="warm">Warm</option>
                  <option value="modern">Modern</option>
                  <option value="natural">Natural</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newSegment.description}
                  onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                  placeholder="What happens in this segment?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newSegment.tags}
                  onChange={(e) => setNewSegment({ ...newSegment, tags: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., fast, bright, movement, close-up"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isUsable"
                  checked={newSegment.isUsable}
                  onChange={(e) => setNewSegment({ ...newSegment, isUsable: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isUsable" className="ml-2 block text-sm text-gray-900">
                  This segment is good to use in videos
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Add Segment
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSegment(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
