'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { assessments, skills, SkillCategory } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import OnboardingModal from '@/components/OnboardingModal';

interface Certification {
  name: string;
  obtained: string;
  needsRenewal: boolean;
}

interface SkillResponse {
  hasExperience: boolean;
  wantsExperience: boolean;  // For people who WANT to learn but don't have experience yet
  proficiency: number;
  enjoyment: number;
  usesAtWork: boolean;
  hasCerts: boolean;
  certifications: Certification[];  // Multiple certifications
  trainingBackground: string[];
  wantsTraining: boolean;
  trainingUrgency: string;
  trainingType: string;
  conferenceInterest: string;
  canMentor: boolean;
  canLead: boolean;
  futureWillingness: number; // 1-4: 1=don't consider me, 2=if needed, 3=happy to, 4=eager
  notes: string;
}

const DEFAULTS: SkillResponse = {
  hasExperience: false, wantsExperience: false, proficiency: 25, enjoyment: 50, usesAtWork: false,
  hasCerts: false, certifications: [],
  trainingBackground: [], wantsTraining: false, trainingUrgency: '', trainingType: '',
  conferenceInterest: '', canMentor: false, canLead: false, futureWillingness: 3, notes: '',
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
    <div className="space-y-2">
      <div className="flex justify-between items-center text-gray-500">
        <span className="text-2xl">😫</span>
        <span className="font-medium text-gray-700 dark:text-gray-300"><span className="text-2xl">{emoji}</span> {label}</span>
        <span className="text-2xl">🤩</span>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(+e.target.value)} disabled={disabled}
        className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-40 bg-gradient-to-r from-red-200 via-gray-200 to-green-200" />
    </div>
  );
}

// Willingness slider (1-4) for future roles/projects
const WILLINGNESS_LEVELS = [
  { value: 1, label: "Don't consider me", color: 'bg-red-100 border-red-300 text-red-700' },
  { value: 2, label: 'If needed', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
  { value: 3, label: 'Happy to', color: 'bg-blue-100 border-blue-300 text-blue-700' },
  { value: 4, label: 'Highly eager', color: 'bg-green-100 border-green-300 text-green-700' },
];

function WillingnessSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Future willingness</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">{WILLINGNESS_LEVELS.find(l => l.value === value)?.label}</span>
      </div>
      <div className="flex gap-1">
        {WILLINGNESS_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => onChange(level.value)}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded border transition-all ${
              value === level.value
                ? level.color + ' shadow-sm'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-400'
            }`}
          >
            {level.label}
          </button>
        ))}
      </div>
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
            // Convert old boolean willingToUse to new 1-4 scale
            const oldWilling = r.willingToUse as boolean | undefined;
            const futureWillingness = typeof r.futureWillingness === 'number'
              ? r.futureWillingness as number
              : (oldWilling === false ? 1 : 3);
            // Parse certifications - could be old string or new JSON array
            let certifications: Certification[] = [];
            const rawCerts = r.certifications;
            if (typeof rawCerts === 'string' && rawCerts) {
              // Old format: single string - convert to array with one entry
              certifications = [{ name: rawCerts, obtained: '', needsRenewal: false }];
            } else if (Array.isArray(rawCerts)) {
              certifications = rawCerts as Certification[];
            }
            existing[r.skillId as string] = {
              ...DEFAULTS,
              hasExperience: (r.level as number) > 0,
              proficiency: ((r.level as number) ?? 0) * 20,
              enjoyment: ((r.interestLevel as number) ?? 3) * 20,
              certifications,
              hasCerts: certifications.length > 0,
              futureWillingness,
              notes: (r.notes as string) ?? '',
            };
          });
          setResponses(existing);
        }
        // Start with all categories collapsed - set to empty
        setExpandedCategories(new Set());
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
            trainingSource: r.trainingBackground.join(', ') || undefined,
            certifications: r.hasCerts && r.certifications.length > 0 ? JSON.stringify(r.certifications) : undefined,
            futureWillingness: r.futureWillingness,
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
  const assessedCount = Object.values(responses).filter(r => r.hasExperience || r.wantsExperience).length;

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

        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <span className="text-slate-700 dark:text-slate-300">
            {assessedCount === 0
              ? 'No skills evaluated yet — check the ones relevant to you'
              : `${assessedCount} skill${assessedCount === 1 ? '' : 's'} evaluated`}
          </span>
        </div>

        {categories.map((category) => {
          // Calculate completion status for this category
          const categorySkillIds = category.skills?.map(s => s.id) || [];
          const filledCount = categorySkillIds.filter(id => responses[id]?.hasExperience || responses[id]?.wantsExperience).length;
          const totalInCategory = categorySkillIds.length;
          const isComplete = totalInCategory > 0 && filledCount === totalInCategory;
          const isPartial = filledCount > 0 && filledCount < totalInCategory;

          // Header styles based on completion - subtle but distinct
          const isExpanded = expandedCategories.has(category.id);
          const headerStyles = isComplete
            ? 'bg-green-100 dark:bg-green-900/40 border-l-4 border-l-green-500'
            : isPartial
            ? 'bg-amber-50 dark:bg-amber-900/30 border-l-4 border-l-amber-500'
            : 'bg-slate-200 dark:bg-slate-700 border-l-4 border-l-slate-400';

          return (
          <div key={category.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <button onClick={() => toggleCategory(category.id)}
              className={`w-full px-6 py-4 flex justify-between items-center transition-colors hover:opacity-90 ${headerStyles}`}>
              <div className="text-left">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-gray-900 dark:text-white">{category.name}</h2>
                  {isComplete && <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1"><span className="text-2xl">✓</span> Complete</span>}
                  {isPartial && <span className="text-amber-600 dark:text-amber-400 text-sm">{filledCount}/{totalInCategory}</span>}
                </div>
                {category.description && <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>}
              </div>
              <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
            </button>

            {isExpanded && category.skills && (
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
                      {/* Skill name + toggles */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{skill.name}</h3>
                          {skill.description && <p className="text-sm text-gray-500 mt-0.5">{skill.description}</p>}
                        </div>
                        {/* Two distinct toggles */}
                        <div className="flex flex-col gap-2 shrink-0">
                          {/* I have experience - green */}
                          <button onClick={() => updateResponse(skill.id, { hasExperience: !r.hasExperience, wantsExperience: false })}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              r.hasExperience
                                ? 'bg-green-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-400'
                            }`}>
                            <span className="text-base">{r.hasExperience ? '✓' : '○'}</span>
                            I have experience
                          </button>
                          {/* I want experience - purple/blue */}
                          {!r.hasExperience && (
                            <button onClick={() => updateResponse(skill.id, { wantsExperience: !r.wantsExperience, hasExperience: false })}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                r.wantsExperience
                                  ? 'bg-purple-500 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-400'
                              }`}>
                              <span className="text-base">{r.wantsExperience ? '★' : '☆'}</span>
                              I want to learn this
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Wants Experience - show training interest form */}
                      {r.wantsExperience && !r.hasExperience && (
                        <div className="mt-4 space-y-4 pl-0 border-l-4 border-purple-200 dark:border-purple-800 animate-in slide-in-from-top-2">
                          <div className="pl-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">How urgent is this for you?</label>
                            <div className="flex gap-2">
                              {[
                                { id: 'whenever', label: 'Whenever possible', color: 'bg-gray-100' },
                                { id: 'soon', label: 'Next few months', color: 'bg-yellow-100' },
                                { id: 'urgent', label: 'High priority', color: 'bg-red-100' },
                              ].map((u) => (
                                <button key={u.id} onClick={() => updateResponse(skill.id, { trainingUrgency: u.id })}
                                  className={`px-3 py-1.5 text-sm rounded border transition-all ${
                                    r.trainingUrgency === u.id ? `${u.color} border-purple-400 font-medium` : 'bg-white border-gray-200 dark:bg-slate-700'
                                  }`}>
                                  {u.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="pl-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">What type of learning?</label>
                            <div className="flex gap-2">
                              {[
                                { id: 'course', label: 'One-time course' },
                                { id: 'ongoing', label: 'Ongoing learning' },
                                { id: 'conference', label: 'Conference/event' },
                              ].map((t) => (
                                <button key={t.id} onClick={() => updateResponse(skill.id, { trainingType: t.id })}
                                  className={`px-3 py-1.5 text-sm rounded border transition-all ${
                                    r.trainingType === t.id ? 'bg-purple-100 border-purple-400 font-medium' : 'bg-white border-gray-200 dark:bg-slate-700'
                                  }`}>
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="pl-4">
                            <input type="text" placeholder="Any specific training, courses, or conferences you're interested in?"
                              value={r.conferenceInterest} onChange={(e) => updateResponse(skill.id, { conferenceInterest: e.target.value })}
                              className="w-full px-3 py-2 border rounded text-sm dark:bg-slate-700 dark:border-slate-600" />
                          </div>
                        </div>
                      )}

                      {/* Has Experience - show full form */}
                      {r.hasExperience && (
                        <div className="mt-4 space-y-5 pl-0 border-l-4 border-green-200 dark:border-green-800 animate-in slide-in-from-top-2">
                          {/* Proficiency Slider */}
                          <div className="pl-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">How would you rate your skill level?</label>
                            <ProficiencySlider value={r.proficiency} onChange={(v) => updateResponse(skill.id, { proficiency: v })} />
                          </div>

                          {/* Currently using at work */}
                          <div className="pl-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" checked={r.usesAtWork} onChange={(e) => updateResponse(skill.id, { usesAtWork: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">I use this in my current role</span>
                            </label>
                          </div>

                          {/* Enjoyment Slider */}
                          <div className="pl-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">How much do you enjoy working with this?</label>
                            <EnjoymentSlider value={r.enjoyment} onChange={(v) => updateResponse(skill.id, { enjoyment: v })} />
                          </div>

                          {/* Certifications - Multi-entry */}
                          <div className="pl-4 space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" checked={r.hasCerts} onChange={(e) => {
                                if (e.target.checked && r.certifications.length === 0) {
                                  // Add first empty cert when checking
                                  updateResponse(skill.id, { hasCerts: true, certifications: [{ name: '', obtained: '', needsRenewal: false }] });
                                } else {
                                  updateResponse(skill.id, { hasCerts: e.target.checked });
                                }
                              }}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">I have certifications for this skill</span>
                            </label>
                            {r.hasCerts && (
                              <div className="space-y-2 animate-in slide-in-from-top-1">
                                {r.certifications.map((cert, idx) => (
                                  <div key={idx} className="flex gap-2 items-center">
                                    <input type="text" placeholder="Certification name" value={cert.name}
                                      onChange={(e) => {
                                        const updated = [...r.certifications];
                                        updated[idx] = { ...cert, name: e.target.value };
                                        updateResponse(skill.id, { certifications: updated });
                                      }}
                                      className="flex-1 px-3 py-2 border rounded text-sm dark:bg-slate-700 dark:border-slate-600" />
                                    <input type="text" placeholder="Year obtained" value={cert.obtained}
                                      onChange={(e) => {
                                        const updated = [...r.certifications];
                                        updated[idx] = { ...cert, obtained: e.target.value };
                                        updateResponse(skill.id, { certifications: updated });
                                      }}
                                      className="w-28 px-3 py-2 border rounded text-sm dark:bg-slate-700 dark:border-slate-600" />
                                    <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                      <input type="checkbox" checked={cert.needsRenewal} onChange={(e) => {
                                        const updated = [...r.certifications];
                                        updated[idx] = { ...cert, needsRenewal: e.target.checked };
                                        updateResponse(skill.id, { certifications: updated });
                                      }}
                                        className="w-4 h-4 rounded" />
                                      Renewal
                                    </label>
                                    <button onClick={() => {
                                      const updated = r.certifications.filter((_, i) => i !== idx);
                                      updateResponse(skill.id, { certifications: updated, hasCerts: updated.length > 0 });
                                    }}
                                      className="text-red-500 hover:text-red-700 px-2 py-1 text-lg">×</button>
                                  </div>
                                ))}
                                <button onClick={() => {
                                  updateResponse(skill.id, { certifications: [...r.certifications, { name: '', obtained: '', needsRenewal: false }] });
                                }}
                                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1">
                                  <span>+</span> Add another certification
                                </button>
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
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">How urgent is this for you?</label>
                                  <div className="flex gap-2">
                                    {[
                                      { id: 'whenever', label: 'Whenever possible', color: 'bg-gray-100' },
                                      { id: 'soon', label: 'Next few months', color: 'bg-yellow-100' },
                                      { id: 'urgent', label: 'High priority', color: 'bg-red-100' },
                                    ].map((u) => (
                                      <button key={u.id} onClick={() => updateResponse(skill.id, { trainingUrgency: u.id })}
                                        className={`px-3 py-1.5 text-sm rounded border transition-all ${
                                          r.trainingUrgency === u.id ? `${u.color} border-gray-400 font-medium` : 'bg-white border-gray-200 dark:bg-slate-700'
                                        }`}>
                                        {u.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">What type of learning?</label>
                                  <div className="flex gap-2">
                                    {[
                                      { id: 'course', label: 'One-time course' },
                                      { id: 'ongoing', label: 'Ongoing learning' },
                                      { id: 'conference', label: 'Conference/event' },
                                    ].map((t) => (
                                      <button key={t.id} onClick={() => updateResponse(skill.id, { trainingType: t.id })}
                                        className={`px-3 py-1.5 text-sm rounded border transition-all ${
                                          r.trainingType === t.id ? 'bg-purple-100 border-purple-400 font-medium' : 'bg-white border-gray-200 dark:bg-slate-700'
                                        }`}>
                                        {t.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <input type="text" placeholder="Any specific training, courses, or conferences you're interested in?"
                                    value={r.conferenceInterest} onChange={(e) => updateResponse(skill.id, { conferenceInterest: e.target.value })}
                                    className="w-full px-3 py-2 border rounded text-sm dark:bg-slate-700 dark:border-slate-600" />
                                </div>
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
                          </div>

                          {/* Future Willingness */}
                          <div className="pl-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                              Willingness to use in future roles/projects
                            </label>
                            <WillingnessSelector
                              value={r.futureWillingness}
                              onChange={(v) => updateResponse(skill.id, { futureWillingness: v })}
                            />
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
          );
        })}
      </div>
    </DashboardLayout>
  );
}

