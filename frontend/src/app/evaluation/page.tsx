'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { assessments, skills, SkillCategory, Assessment } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import OnboardingModal from '@/components/OnboardingModal';

interface SkillResponse {
  level: number;
  hasCertification: boolean;
  certificationName: string;
  wantsTraining: boolean;
}

const LEVELS = [
  { value: 0, label: 'No Experience', color: 'bg-gray-200 dark:bg-slate-600' },
  { value: 1, label: 'Beginner', color: 'bg-red-400' },
  { value: 2, label: 'Basic', color: 'bg-orange-400' },
  { value: 3, label: 'Intermediate', color: 'bg-yellow-400' },
  { value: 4, label: 'Advanced', color: 'bg-lime-400' },
  { value: 5, label: 'Expert', color: 'bg-green-500' },
];

export default function AssessmentPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [responses, setResponses] = useState<Record<string, SkillResponse>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
      ]).then(([catRes, assessRes]) => {
        setCategories(catRes.categories);
        // Load existing responses
        if (assessRes.assessment?.responses) {
          const existing: Record<string, SkillResponse> = {};
          assessRes.assessment.responses.forEach((r) => {
            existing[r.skillId] = {
              level: r.level,
              hasCertification: r.hasCertification,
              certificationName: r.certificationName || '',
              wantsTraining: r.wantsTraining,
            };
          });
          setResponses(existing);
        }
        // Expand all categories by default
        setExpandedCategories(new Set(catRes.categories.map((c) => c.id)));
      }).finally(() => {
        setLoading(false);
        // Show onboarding if first visit
        if (!localStorage.getItem('capaz_onboarding_complete')) {
          setShowOnboarding(true);
        }
      });
    }
  }, [token]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateResponse = (skillId: string, updates: Partial<SkillResponse>) => {
    setResponses((prev) => ({
      ...prev,
      [skillId]: {
        level: 0,
        hasCertification: false,
        certificationName: '',
        wantsTraining: false,
        ...prev[skillId],
        ...updates,
      },
    }));
    setSaved(false);
  };

  const handleSubmit = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const data = {
        responses: Object.entries(responses).map(([skillId, r]) => ({
          skillId,
          level: r.level,
          hasCertification: r.hasCertification,
          certificationName: r.certificationName || undefined,
          wantsTraining: r.wantsTraining,
        })),
      };
      await assessments.submit(token, data);
      setSaved(true);
    } catch (err) {
      alert('Failed to save evaluation');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalSkills = categories.reduce((acc, c) => acc + (c.skills?.length || 0), 0);
  const assessedCount = Object.keys(responses).length;

  return (
    <DashboardLayout>
      {showOnboarding && <OnboardingModal onComplete={() => setShowOnboarding(false)} />}
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Capability Evaluation</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Rate your proficiency level for each capability (0-5)
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Evaluation'}
          </button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-blue-800 dark:text-blue-300">Progress: {assessedCount} of {totalSkills} skills</span>
            <div className="w-48 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${(assessedCount/totalSkills)*100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="text-left">
                  <h2 className="font-semibold text-gray-900 dark:text-white">{category.name}</h2>
                  {category.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                  )}
                </div>
                <span className="text-gray-400">{expandedCategories.has(category.id) ? '▼' : '▶'}</span>
              </button>
              
              {expandedCategories.has(category.id) && category.skills && (
                <div className="border-t border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
                  {category.skills.map((skill) => {
                    const response = responses[skill.id] || { level: 0 };
                    return (
                      <div key={skill.id} className="px-6 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">{skill.name}</h3>
                            {skill.description && <p className="text-sm text-gray-500">{skill.description}</p>}
                          </div>
                          <div className="flex gap-1">
                            {LEVELS.map((lvl) => (
                              <button
                                key={lvl.value}
                                onClick={() => updateResponse(skill.id, { level: lvl.value })}
                                title={lvl.label}
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                                  response.level === lvl.value 
                                    ? `${lvl.color} text-white ring-2 ring-offset-2 ring-blue-500` 
                                    : 'bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                }`}
                              >
                                {lvl.value}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

