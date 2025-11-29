'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { assessments, skills, SkillCategory, Assessment } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (token) {
      Promise.all([
        skills.getCategories(token),
        assessments.getCurrent(token),
      ])
        .then(([catRes, assessRes]) => {
          setCategories(catRes.categories);
          setCurrentAssessment(assessRes.assessment);
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalSkills = categories.reduce((acc, cat) => acc + (cat.skills?.length || 0), 0);
  const assessedSkills = currentAssessment?.responses?.length || 0;
  const completionPercent = totalSkills > 0 ? Math.round((assessedSkills / totalSkills) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's an overview of your capability evaluation.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="text-3xl font-bold text-blue-600">{categories.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Skill Categories</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="text-3xl font-bold text-green-600">{assessedSkills}/{totalSkills}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Skills Assessed</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="text-3xl font-bold text-purple-600">{completionPercent}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Completion</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/evaluation"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              📝 {currentAssessment ? 'Update Evaluation' : 'Start Evaluation'}
            </Link>
            <Link
              href="/vector"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors text-gray-700 dark:text-gray-200"
            >
              🎯 View Capability Vector
            </Link>
          </div>
        </div>

        {/* Categories Overview */}
        {!loading && categories.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skill Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">{cat.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {cat.skills?.length || 0} skills
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

