'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { assessments, skills, SkillCategory } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import OnboardingModal from '@/components/OnboardingModal';

interface SkillResponse {
  level: number;
  interestLevel: number;
  growthDesire: number;
  useFrequency: number;
  mentorLevel: number;
  leadLevel: number;
  yearsExperience: number;
  trainingSource: string;
  certifications: string;
  willingToUse: boolean;
  notes: string;
}

const DEFAULTS: SkillResponse = {
  level: 0, interestLevel: 3, growthDesire: 3, useFrequency: 1,
  mentorLevel: 0, leadLevel: 0, yearsExperience: 0,
  trainingSource: '', certifications: '', willingToUse: true, notes: '',
};

const PROFICIENCY = [
  { value: 0, label: 'None', desc: 'No experience', color: 'bg-gray-300' },
  { value: 1, label: 'Awareness', desc: 'Know it exists', color: 'bg-red-400' },
  { value: 2, label: 'Beginner', desc: 'Learning basics', color: 'bg-orange-400' },
  { value: 3, label: 'Intermediate', desc: 'Can work independently', color: 'bg-yellow-400' },
  { value: 4, label: 'Advanced', desc: 'Deep expertise', color: 'bg-lime-400' },
  { value: 5, label: 'Expert', desc: 'Industry-level mastery', color: 'bg-green-500' },
];

const INTEREST = [
  { value: 1, label: '😫', desc: 'Actively avoid' },
  { value: 2, label: '😐', desc: 'Prefer not to' },
  { value: 3, label: '🙂', desc: 'Neutral' },
  { value: 4, label: '😊', desc: 'Enjoy it' },
  { value: 5, label: '🤩', desc: 'Passionate!' },
];

const GROWTH = [
  { value: 1, label: 'None', desc: 'No training needed' },
  { value: 2, label: 'Low', desc: 'Nice to have' },
  { value: 3, label: 'Medium', desc: 'Would benefit' },
  { value: 4, label: 'High', desc: 'Priority for me' },
  { value: 5, label: 'Urgent', desc: 'Critical gap!' },
];

const FREQUENCY = [
  { value: 1, label: 'Never' },
  { value: 2, label: 'Rarely' },
  { value: 3, label: 'Monthly' },
  { value: 4, label: 'Weekly' },
  { value: 5, label: 'Daily' },
];

const MENTOR = [
  { value: 0, label: 'Cannot' },
  { value: 1, label: 'Can Assist' },
  { value: 2, label: 'Can Mentor' },
  { value: 3, label: 'Expert Trainer' },
];

const LEAD = [
  { value: 0, label: 'Cannot Lead' },
  { value: 1, label: 'Support Role' },
  { value: 2, label: 'Small Projects' },
  { value: 3, label: 'Major Initiatives' },
];

const TRAINING_SOURCES = [
  '', 'Self-Taught', 'Online Course', 'Bootcamp', 'College/University', 'Vendor Training', 'On-the-Job',
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
        // Load existing responses with new schema
        if (assessRes.assessment?.responses) {
          const existing: Record<string, SkillResponse> = {};
          assessRes.assessment.responses.forEach((r: Record<string, unknown>) => {
            existing[r.skillId as string] = {
              level: (r.level as number) ?? 0,
              interestLevel: (r.interestLevel as number) ?? 3,
              growthDesire: (r.growthDesire as number) ?? 3,
              useFrequency: (r.useFrequency as number) ?? 1,
              mentorLevel: (r.mentorLevel as number) ?? 0,
              leadLevel: (r.leadLevel as number) ?? 0,
              yearsExperience: (r.yearsExperience as number) ?? 0,
              trainingSource: (r.trainingSource as string) ?? '',
              certifications: (r.certifications as string) ?? '',
              willingToUse: (r.willingToUse as boolean) ?? true,
              notes: (r.notes as string) ?? '',
            };
          });
          setResponses(existing);
        }
        setExpandedCategories(new Set(catRes.categories.map((c) => c.id)));
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [token]);

  // Show onboarding on first visit (always for demo users)
  useEffect(() => {
    if (user && !loading) {
      const isDemoUser = user.email?.endsWith('@capaz.io') || user.email?.endsWith('@demo-msp.com');
      if (isDemoUser || !localStorage.getItem('capaz_onboarding_complete')) {
        setShowOnboarding(true);
      }
    }
  }, [user, loading]);

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
      [skillId]: { ...DEFAULTS, ...prev[skillId], ...updates },
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
          interestLevel: r.interestLevel,
          growthDesire: r.growthDesire,
          useFrequency: r.useFrequency,
          mentorLevel: r.mentorLevel,
          leadLevel: r.leadLevel,
          yearsExperience: r.yearsExperience,
          trainingSource: r.trainingSource || undefined,
          certifications: r.certifications ? JSON.stringify([{ name: r.certifications }]) : undefined,
          willingToUse: r.willingToUse,
          notes: r.notes || undefined,
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
            <p className="text-gray-600 dark:text-gray-400 mt-1">Build your multi-dimensional capability vector</p>
          </div>
          <button onClick={handleSubmit} disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg">
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Evaluation'}
          </button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-blue-800 dark:text-blue-300">Progress: {assessedCount} of {totalSkills} skills evaluated</span>
            <div className="w-48 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${totalSkills ? (assessedCount/totalSkills)*100 : 0}%` }}></div>
            </div>
          </div>
        </div>

        {categories.map((category) => (
          <div key={category.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <button onClick={() => toggleCategory(category.id)}
              className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-700/50">
              <div className="text-left">
                <h2 className="font-semibold text-gray-900 dark:text-white">{category.name}</h2>
                {category.description && <p className="text-sm text-gray-500">{category.description}</p>}
              </div>
              <span className="text-gray-400">{expandedCategories.has(category.id) ? '▼' : '▶'}</span>
            </button>

            {expandedCategories.has(category.id) && category.skills && (
              <div className="border-t border-gray-200 dark:border-slate-700">
                {category.skills.map((skill) => {
                  const r = responses[skill.id] || DEFAULTS;
                  return (
                    <div key={skill.id} className="border-b border-gray-100 dark:border-slate-700 last:border-b-0">
                      {/* Skill Header */}
                      <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/30">
                        <h3 className="font-medium text-gray-900 dark:text-white">{skill.name}</h3>
                        {skill.description && <p className="text-sm text-gray-500">{skill.description}</p>}
                      </div>

                      <div className="px-6 py-4 space-y-4">
                        {/* Row 1: Proficiency */}
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Proficiency Level</label>
                          <div className="flex gap-1 mt-1">
                            {PROFICIENCY.map((p) => (
                              <button key={p.value} onClick={() => updateResponse(skill.id, { level: p.value })} title={`${p.label}: ${p.desc}`}
                                className={`flex-1 py-2 px-1 text-xs rounded transition-all ${r.level === p.value ? `${p.color} text-white ring-2 ring-blue-500` : 'bg-gray-100 dark:bg-slate-600 hover:bg-gray-200'}`}>
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Row 2: Interest & Growth */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Interest Level</label>
                            <div className="flex gap-1 mt-1">
                              {INTEREST.map((i) => (
                                <button key={i.value} onClick={() => updateResponse(skill.id, { interestLevel: i.value })} title={i.desc}
                                  className={`flex-1 py-2 text-lg rounded transition-all ${r.interestLevel === i.value ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : 'bg-gray-100 dark:bg-slate-600 hover:bg-gray-200'}`}>
                                  {i.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Training Desire</label>
                            <div className="flex gap-1 mt-1">
                              {GROWTH.map((g) => (
                                <button key={g.value} onClick={() => updateResponse(skill.id, { growthDesire: g.value })} title={g.desc}
                                  className={`flex-1 py-2 px-1 text-xs rounded transition-all ${r.growthDesire === g.value ? 'bg-purple-500 text-white ring-2 ring-purple-500' : 'bg-gray-100 dark:bg-slate-600 hover:bg-gray-200'}`}>
                                  {g.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Row 3: Frequency & Experience */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">How Often Used?</label>
                            <div className="flex gap-1 mt-1">
                              {FREQUENCY.map((f) => (
                                <button key={f.value} onClick={() => updateResponse(skill.id, { useFrequency: f.value })}
                                  className={`flex-1 py-2 px-1 text-xs rounded transition-all ${r.useFrequency === f.value ? 'bg-cyan-500 text-white ring-2 ring-cyan-500' : 'bg-gray-100 dark:bg-slate-600 hover:bg-gray-200'}`}>
                                  {f.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Years Experience</label>
                            <input type="number" min="0" max="40" value={r.yearsExperience}
                              onChange={(e) => updateResponse(skill.id, { yearsExperience: Math.max(0, parseInt(e.target.value) || 0) })}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm" />
                          </div>
                        </div>

                        {/* Row 4: Mentor & Lead */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Can Mentor Others?</label>
                            <div className="flex gap-1 mt-1">
                              {MENTOR.map((m) => (
                                <button key={m.value} onClick={() => updateResponse(skill.id, { mentorLevel: m.value })}
                                  className={`flex-1 py-2 px-1 text-xs rounded transition-all ${r.mentorLevel === m.value ? 'bg-amber-500 text-white ring-2 ring-amber-500' : 'bg-gray-100 dark:bg-slate-600 hover:bg-gray-200'}`}>
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Can Lead Projects?</label>
                            <div className="flex gap-1 mt-1">
                              {LEAD.map((l) => (
                                <button key={l.value} onClick={() => updateResponse(skill.id, { leadLevel: l.value })}
                                  className={`flex-1 py-2 px-1 text-xs rounded transition-all ${r.leadLevel === l.value ? 'bg-indigo-500 text-white ring-2 ring-indigo-500' : 'bg-gray-100 dark:bg-slate-600 hover:bg-gray-200'}`}>
                                  {l.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Row 5: Training & Certs */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Training Background</label>
                            <select value={r.trainingSource} onChange={(e) => updateResponse(skill.id, { trainingSource: e.target.value })}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm">
                              {TRAINING_SOURCES.map((t) => <option key={t} value={t}>{t || '-- Select --'}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Certifications</label>
                            <input type="text" placeholder="e.g., AWS SAA, CCNA" value={r.certifications}
                              onChange={(e) => updateResponse(skill.id, { certifications: e.target.value })}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm" />
                          </div>
                        </div>

                        {/* Row 6: Future Intent */}
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={r.willingToUse} onChange={(e) => updateResponse(skill.id, { willingToUse: e.target.checked })}
                              className="w-4 h-4 rounded border-gray-300" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Willing to use this skill in future roles</span>
                          </label>
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
    </DashboardLayout>
  );
}

