'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface VideoWithMetrics {
  id: string;
  theme: string;
  createdAt: string;
  metrics?: {
    views?: number;
    likes?: number;
    engagement?: number;
    completionRate?: number;
  };
}

interface Template {
  id: string;
  name: string;
  performance?: number;
}

interface DashboardData {
  recentVideos: VideoWithMetrics[];
  metrics: {
    totalVideos: number;
    totalViews: number;
    totalLikes: number;
    avgEngagement: number;
    avgCompletionRate: number;
  };
  templates: Template[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [videosRes, metricsRes, templatesRes] = await Promise.all([
        fetch('/api/generate?limit=10'),
        fetch('/api/metrics/sync'),
        fetch('/api/templates')
      ]);

      const videos = await videosRes.json();
      const metrics = await metricsRes.json();
      const templates = await templatesRes.json();

      setData({
        recentVideos: videos.videos || [],
        metrics: metrics.aggregates || {
          totalVideos: 0,
          totalViews: 0,
          totalLikes: 0,
          avgEngagement: 0,
          avgCompletionRate: 0
        },
        templates: templates.templates || []
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewBatch = async () => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: 'trending topic',
          generateVariants: 3,
          includeTrends: true
        })
      });

      if (response.ok) {
        await fetchDashboardData(); // Refresh data
        alert('New batch generated successfully!');
      } else {
        alert('Failed to generate new batch');
      }
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate new batch');
    }
  };

  const retrainModel = async () => {
    try {
      const response = await fetch('/api/ml/retrain', {
        method: 'POST'
      });

      if (response.ok) {
        alert('Model retrained successfully!');
      } else {
        alert('Failed to retrain model');
      }
    } catch (error) {
      console.error('Retraining failed:', error);
      alert('Failed to retrain model');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Chart data
  const engagementData = {
    labels: data?.recentVideos.slice(0, 7).map((v, i) => `Video ${i + 1}`) || [],
    datasets: [{
      label: 'Engagement Score',
      data: data?.recentVideos.slice(0, 7).map(v => v.metrics?.engagement || 0) || [],
      borderColor: 'rgb(79, 70, 229)',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      tension: 0.3
    }]
  };

  const templatePerformanceData = {
    labels: data?.templates.slice(0, 5).map(t => t.name) || [],
    datasets: [{
      label: 'Performance Score',
      data: data?.templates.slice(0, 5).map(t => t.performance || 0) || [],
      backgroundColor: [
        'rgba(79, 70, 229, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ]
    }]
  };

  const metricsOverviewData = {
    labels: ['Views', 'Likes', 'Shares', 'Comments'],
    datasets: [{
      data: [
        data?.metrics.totalViews || 0,
        data?.metrics.totalLikes || 0,
        Math.floor((data?.metrics.totalLikes || 0) * 0.1), // Estimated shares
        Math.floor((data?.metrics.totalLikes || 0) * 0.05) // Estimated comments
      ],
      backgroundColor: [
        '#3B82F6',
        '#EF4444',
        '#10B981',
        '#F59E0B'
      ]
    }]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Content Studio</h1>
              <p className="text-gray-600">AI-powered content creation dashboard</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={generateNewBatch}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Generate New Batch
              </button>
              <button
                onClick={retrainModel}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Retrain Model
              </button>
              <Link
                href="/dashboard/content"
                className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Manage Content
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {['overview', 'analytics', 'templates', 'trends'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-gray-900">
                  {data?.metrics.totalVideos || 0}
                </div>
                <div className="text-sm text-gray-600">Total Videos</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-gray-900">
                  {(data?.metrics.totalViews || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Views</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(data?.metrics.avgEngagement || 0)}%
                </div>
                <div className="text-sm text-gray-600">Avg Engagement</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(data?.metrics.avgCompletionRate || 0)}%
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Recent Video Performance</h3>
                <Line data={engagementData} options={{ responsive: true }} />
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Metrics Overview</h3>
                <Doughnut data={metricsOverviewData} options={{ responsive: true }} />
              </div>
            </div>

            {/* Recent Videos */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Recent Videos</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Video
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Theme
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Engagement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.recentVideos.map((video, index) => (
                      <tr key={video.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-300 rounded-lg flex items-center justify-center">
                              🎥
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                Video #{index + 1}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {video.theme}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(video.metrics?.views || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            (video.metrics?.engagement || 0) > 50 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {Math.round(video.metrics?.engagement || 0)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Template Performance</h3>
              <Bar data={templatePerformanceData} options={{ responsive: true }} />
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Templates</h3>
              <Link
                href="/dashboard/templates/new"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Template
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.templates.map((template) => (
                <div key={template.id} className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-semibold text-lg mb-2">{template.name}</h4>
                  <div className="text-sm text-gray-600 mb-4">
                    Performance: {Math.round(template.performance || 0)}%
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/dashboard/templates/${template.id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      View
                    </Link>
                    <button className="text-green-600 hover:text-green-800 text-sm">
                      Refine
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Trending Topics</h3>
            <p className="text-gray-600">Trend analysis coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
}
