import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">Capaz</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Corporate Skills Matrix Platform
        </p>
        <p className="text-gray-500 dark:text-gray-400 mb-12">
          Assess, track, and optimize your team&apos;s skills with our comprehensive skills management platform.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-medium py-3 px-8 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}

