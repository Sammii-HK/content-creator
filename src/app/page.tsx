export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Smart Content Studio
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI-driven content creation and optimization platform that learns from your audience
            to create engaging short-form videos automatically.
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="/dashboard"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Open Dashboard
            </a>
            <a
              href="/dashboard/generate"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold border border-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Generate Content
            </a>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-indigo-600 text-2xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Generation</h3>
            <p className="text-gray-600">
              Create engaging scripts and captions using advanced language models trained on viral content patterns.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-indigo-600 text-2xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Performance Analytics</h3>
            <p className="text-gray-600">
              Track engagement metrics and let the system learn from your best-performing content automatically.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-indigo-600 text-2xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Smart Optimization</h3>
            <p className="text-gray-600">
              Automatically refine templates and content strategies based on real performance data.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
