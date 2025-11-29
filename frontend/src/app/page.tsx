export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Skills Matrix</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Assess, track, and optimize your team&apos;s skills
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
            Start Assessment
          </button>
          <button className="border border-gray-300 hover:border-gray-400 font-medium py-2 px-6 rounded-lg transition-colors">
            View Matrix
          </button>
        </div>
      </div>
    </main>
  )
}

