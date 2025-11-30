'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { assessments, skills, SkillCategory } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import OnboardingModal from '@/components/OnboardingModal';

interface SkillResponse {
  hasExperience: boolean;
  proficiency: number;
  enjoyment: number;
  usesAtWork: boolean;
  yearsExperience: number;
  hasCerts: boolean;
  certDetails: string;
  certExpiry: string;
  needsRenewal: boolean;
  trainingBackground: string[];
  wantsTraining: boolean;
  trainingUrgency: string;
  trainingType: string;
  conferenceInterest: string;
  canMentor: boolean;
  canLead: boolean;
  willingFuture: boolean;
  notes: string;
}

const DEFAULTS: SkillResponse = {
  hasExperience: false, proficiency: 25, enjoyment: 50, usesAtWork: false, yearsExperience: 0,
  hasCerts: false, certDetails: '', certExpiry: '', needsRenewal: false,
  trainingBackground: [], wantsTraining: false, trainingUrgency: '', trainingType: '',
  conferenceInterest: '', canMentor: false, canLead: false, willingFuture: true, notes: '',
};

const TRAINING_BG = [
  'Self-taught', 'YouTube/Videos', 'Online courses', 'Books/Documentation',
  'Bootcamp', 'College degree', 'Vendor certification program', 'On-the-job', 'Mentored by colleague',
];

// Proficiency slider component with gradient
function ProficiencySlider({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const getLabel = (v: number) => {
    if (v < 15) return "Just getting started";
    if (v < 30) return "Still learning the basics";
    if (v < 50) return "Can handle it with some help";
    if (v < 70) return "Confident working independently";
    if (v < 85) return "More skilled than most";
    return "Expert — few are better";
  };
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Novice</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">{getLabel(value)}</span>
        <span>Expert</span>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(+e.target.value)} disabled={disabled}
        className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-40"
        style={{ background: 'linear-gradient(to right, #fca5a5, #fcd34d, #86efac)' }} />
    </div>
  );
}

// Enjoyment slider with emojis
function EnjoymentSlider({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const emoji = value < 25 ? '😫' : value < 50 ? '😐' : value < 75 ? '😊' : '🤩';
  const label = value < 25 ? 'Rather avoid' : value < 50 ? 'Neutral' : value < 75 ? 'Enjoy it' : 'Love it!';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>😫</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">{emoji} {label}</span>
        <span>🤩</span>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(+e.target.value)} disabled={disabled}
        className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-40 bg-gradient-to-r from-red-200 via-gray-200 to-green-200" />
    </div>
  );
}

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
        if (assessRes.assessment?.responses) {
          const existing: Record<string, SkillResponse> = {};
          assessRes.assessment.responses.forEach((r: Record<string, unknown>) => {
            existing[r.skillId as string] = {
              ...DEFAULTS,
              hasExperience: (r.level as number) > 0,
              proficiency: ((r.level as number) ?? 0) * 20,
              enjoyment: ((r.interestLevel as number) ?? 3) * 20,
              yearsExperience: (r.yearsExperience as number) ?? 0,
              certDetails: (r.certifications as string) ?? '',
              hasCerts: !!(r.certifications as string),
              willingFuture: (r.willingToUse as boolean) ?? true,
              notes: (r.notes as string) ?? '',
            };
          });
          setResponses(existing);
        }
        setExpandedCategories(new Set(catRes.categories.map((c) => c.id)));
      }).finally(() => setLoading(false));
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
        responses: Object.entries(responses)
          .filter(([, r]) => r.hasExperience)
          .map(([skillId, r]) => ({
            skillId,
            level: Math.round(r.proficiency / 20), // 0-100 → 0-5
            interestLevel: Math.round(r.enjoyment / 20) || 3,
            growthDesire: r.wantsTraining ? (r.trainingUrgency === 'urgent' ? 5 : r.trainingUrgency === 'soon' ? 4 : 3) : 1,
            useFrequency: r.usesAtWork ? 4 : 2,
            mentorLevel: r.canMentor ? 2 : 0,
            leadLevel: r.canLead ? 2 : 0,
            yearsExperience: r.yearsExperience,
            trainingSource: r.trainingBackground.join(', ') || undefined,
            certifications: r.hasCerts ? JSON.stringify([{ name: r.certDetails, expiry: r.certExpiry }]) : undefined,
            willingToUse: r.willingFuture,
            notes: [r.conferenceInterest ? `Conferences: ${r.conferenceInterest}` : '', r.notes].filter(Boolean).join(' | ') || undefined,
          })),
      };
      await assessments.submit(token, data);
      setSaved(true);
    } catch {
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
              <div className="border-t border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
                {category.skills.map((skill) => {
                  const r = responses[skill.id] || DEFAULTS;
                  const toggleTraining = (t: string) => {
                    const current = r.trainingBackground || [];
                    const updated = current.includes(t) ? current.filter(x => x !== t) : [...current, t];
                    updateResponse(skill.id, { trainingBackground: updated });
                  };
                  return (
                    <div key={skill.id} className="px-6 py-5">
                      {/* Skill name + initial toggle */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{skill.name}</h3>
                          {skill.description && <p className="text-sm text-gray-500 mt-0.5">{skill.description}</p>}
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer shrink-0">
                          <span className="text-sm text-gray-600 dark:text-gray-400">I have experience</span>
                          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${r.hasExperience ? 'bg-green-500' : 'bg-gray-300'}`}
                            onClick={() => updateResponse(skill.id, { hasExperience: !r.hasExperience })}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${r.hasExperience ? 'translate-x-6' : ''}`} />
                          </div>
                        </label>
                      </div>

                      {/* Progressive disclosure - only show if has experience */}
                      {r.hasExperience && (
                        <div className="space-y-5 pl-0 border-l-4 border-green-200 dark:border-green-800 ml-0 animate-in slide-in-from-top-2">
                          {/* Proficiency Slider */}
                          <div className="pl-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">How would you rate your skill level?</label>
                            <ProficiencySlider value={r.proficiency} onChange={(v) => updateResponse(skill.id, { proficiency: v })} />
                          </div>

                          {/* Currently using + Years */}
                          <div className="pl-4 grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" checked={r.usesAtWork} onChange={(e) => updateResponse(skill.id, { usesAtWork: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">I use this in my current role</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Years of experience:</span>
                              <input type="number" min="0" max="40" value={r.yearsExperience}
                                onChange={(e) => updateResponse(skill.id, { yearsExperience: Math.max(0, +e.target.value || 0) })}
                                className="w-16 px-2 py-1 border rounded text-center dark:bg-slate-700 dark:border-slate-600" />
                            </div>
                          </div>

                          {/* Enjoyment Slider */}
                          <div className="pl-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">How much do you enjoy working with this?</label>
                            <EnjoymentSlider value={r.enjoyment} onChange={(v) => updateResponse(skill.id, { enjoyment: v })} />
                          </div>

                          {/* Certifications */}
                          <div className="pl-4 space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" checked={r.hasCerts} onChange={(e) => updateResponse(skill.id, { hasCerts: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">I have certifications for this skill</span>
                            </label>
                            {r.hasCerts && (
                              <div className="grid grid-cols-3 gap-3 animate-in slide-in-from-top-1">
                                <input type="text" placeholder="Cert names (AWS SAA, CCNA...)" value={r.certDetails}
                                  onChange={(e) => updateResponse(skill.id, { certDetails: e.target.value })}
                                  className="px-3 py-2 border rounded text-sm dark:bg-slate-700 dark:border-slate-600" />
                                <input type="text" placeholder="When obtained?" value={r.certExpiry}
                                  onChange={(e) => updateResponse(skill.id, { certExpiry: e.target.value })}
                                  className="px-3 py-2 border rounded text-sm dark:bg-slate-700 dark:border-slate-600" />
                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <input type="checkbox" checked={r.needsRenewal} onChange={(e) => updateResponse(skill.id, { needsRenewal: e.target.checked })}
                                    className="w-4 h-4 rounded" />
                                  Needs renewal
                                </label>
                              </div>
                            )}
                          </div>

                          {/* Training Background */}
                          <div className="pl-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">How did you learn this? (select all that apply)</label>
                            <div className="flex flex-wrap gap-2">
                              {TRAINING_BG.map((t) => (
                                <button key={t} onClick={() => toggleTraining(t)}
                                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                                    r.trainingBackground?.includes(t)
                                      ? 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-slate-700 dark:border-slate-600'
                                  }`}>
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Want More Training */}
                          <div className="pl-4 space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" checked={r.wantsTraining} onChange={(e) => updateResponse(skill.id, { wantsTraining: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-purple-600" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">I want/need more training in this area</span>
                            </label>
                            {r.wantsTraining && (
                              <div className="space-y-3 animate-in slide-in-from-top-1">
                                <div>
                                  <span className="text-xs text-gray-500 mb-1 block">How urgently?</span>
                                  <div className="flex gap-2">
                                    {[
                                      { id: 'whenever', label: 'Whenever', color: 'bg-gray-100' },
                                      { id: 'soon', label: 'Next few months', color: 'bg-yellow-100' },
                                      { id: 'urgent', label: 'ASAP!', color: 'bg-red-100' },
                                    ].map((u) => (
                                      <button key={u.id} onClick={() => updateResponse(skill.id, { trainingUrgency: u.id })}
                                        className={`px-3 py-1.5 text-xs rounded border transition-all ${
                                          r.trainingUrgency === u.id ? `${u.color} border-gray-400 font-medium` : 'bg-white border-gray-200 dark:bg-slate-700'
                                        }`}>
                                        {u.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 mb-1 block">What type of learning?</span>
                                  <div className="flex gap-2">
                                    {[
                                      { id: 'course', label: 'One-time course' },
                                      { id: 'ongoing', label: 'Ongoing learning' },
                                      { id: 'conference', label: 'Conference/event' },
                                    ].map((t) => (
                                      <button key={t.id} onClick={() => updateResponse(skill.id, { trainingType: t.id })}
                                        className={`px-3 py-1.5 text-xs rounded border transition-all ${
                                          r.trainingType === t.id ? 'bg-purple-100 border-purple-400 font-medium' : 'bg-white border-gray-200 dark:bg-slate-700'
                                        }`}>
                                        {t.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                {r.trainingType === 'conference' && (
                                  <input type="text" placeholder="Any specific conferences you're interested in?"
                                    value={r.conferenceInterest} onChange={(e) => updateResponse(skill.id, { conferenceInterest: e.target.value })}
                                    className="w-full px-3 py-2 border rounded text-sm dark:bg-slate-700 dark:border-slate-600" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Mentor & Lead */}
                          <div className="pl-4 flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={r.canMentor} onChange={(e) => updateResponse(skill.id, { canMentor: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-amber-600" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">I can mentor others in this</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={r.canLead} onChange={(e) => updateResponse(skill.id, { canLead: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-indigo-600" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">I can lead projects using this</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={r.willingFuture} onChange={(e) => updateResponse(skill.id, { willingFuture: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-green-600" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Willing to use in future roles</span>
                            </label>
                          </div>

                          {/* Notes */}
                          <div className="pl-4">
                            <input type="text" placeholder="Any other notes about this skill..."
                              value={r.notes} onChange={(e) => updateResponse(skill.id, { notes: e.target.value })}
                              className="w-full px-3 py-2 border rounded text-sm dark:bg-slate-700 dark:border-slate-600" />
                          </div>
                        </div>
                      )}
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

