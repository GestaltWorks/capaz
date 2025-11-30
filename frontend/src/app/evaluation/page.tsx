'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { assessments, skills, SkillCategory } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import OnboardingModal from '@/components/OnboardingModal';
import SkillRadarChart from '@/components/SkillRadarChart';
import { ROLES, ACHIEVEMENTS, getShortCategoryName, RoleDefinition } from '@/lib/roleCategories';

interface Certification {
  name: string;
  obtained: string;
  needsRenewal: boolean;
}

interface SkillResponse {
  hasExperience: boolean;
  wantsExperience: boolean;
  proficiency: number;
  enjoyment: number;
  usesAtWork: boolean;
  hasCerts: boolean;
  certifications: Certification[];
  trainingBackground: string[];
  wantsTraining: boolean;
  trainingUrgency: string;
  trainingType: string;
  conferenceInterest: string;
  canMentor: boolean;
  canLead: boolean;
  futureWillingness: number;
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

// Evaluation modes
type EvalMode = 'browse' | 'identify' | 'detail';

// Session storage keys
const STORAGE_KEYS = {
  selectedRole: 'capaz_selected_role',
  evalMode: 'capaz_eval_mode',
  lastCategory: 'capaz_last_category',
};

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
  const getEmoji = (v: number) => {
    if (v < 15) return "🔧";
    if (v < 30) return "📚";
    if (v < 50) return "🛠️";
    if (v < 70) return "💪";
    if (v < 85) return "⚡";
    return "🏆";
  };
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-gray-500">
        <span className="text-2xl">🔧</span>
        <span className="font-medium text-gray-700 dark:text-gray-300"><span className="text-2xl">{getEmoji(value)}</span> {getLabel(value)}</span>
        <span className="text-2xl">🏆</span>
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

  // New UX state
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [evalMode, setEvalMode] = useState<EvalMode>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickModeEnabled, setQuickModeEnabled] = useState(false);
  const [showRadarChart, setShowRadarChart] = useState(true);
  const [identifiedSkills, setIdentifiedSkills] = useState<Set<string>>(new Set());
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  // Load saved session state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = sessionStorage.getItem(STORAGE_KEYS.selectedRole);
      const savedMode = sessionStorage.getItem(STORAGE_KEYS.evalMode) as EvalMode;
      if (savedRole) {
        const role = ROLES.find(r => r.id === savedRole);
        if (role) setSelectedRole(role);
      }
      if (savedMode) setEvalMode(savedMode);
    }
  }, []);

  useEffect(() => {
    if (token) {
      Promise.all([
        skills.getCategories(token),
        assessments.getCurrent(token),
      ]).then(([catRes, assessRes]) => {
        setCategories(catRes.categories);
        if (assessRes.assessment?.responses) {
          const existing: Record<string, SkillResponse> = {};
          const identified = new Set<string>();
          assessRes.assessment.responses.forEach((r: Record<string, unknown>) => {
            const oldWilling = r.willingToUse as boolean | undefined;
            const futureWillingness = typeof r.futureWillingness === 'number'
              ? r.futureWillingness as number
              : (oldWilling === false ? 1 : 3);
            let certifications: Certification[] = [];
            const rawCerts = r.certifications;
            if (typeof rawCerts === 'string' && rawCerts) {
              certifications = [{ name: rawCerts, obtained: '', needsRenewal: false }];
            } else if (Array.isArray(rawCerts)) {
              certifications = rawCerts as Certification[];
            }
            const skillId = r.skillId as string;
            existing[skillId] = {
              ...DEFAULTS,
              hasExperience: (r.level as number) > 0,
              proficiency: ((r.level as number) ?? 0) * 20,
              enjoyment: ((r.interestLevel as number) ?? 3) * 20,
              certifications,
              hasCerts: certifications.length > 0,
              futureWillingness,
              notes: (r.notes as string) ?? '',
            };
            if ((r.level as number) > 0) identified.add(skillId);
          });
          setResponses(existing);
          setIdentifiedSkills(identified);
        }
        setExpandedCategories(new Set());
        // Show role selector if no role selected and first time
        if (!sessionStorage.getItem(STORAGE_KEYS.selectedRole)) {
          setShowRoleSelector(true);
        }
      }).finally(() => setLoading(false));
    }
  }, [token]);

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
    sessionStorage.setItem(STORAGE_KEYS.lastCategory, id);
  };

  // Select role and save to session
  const handleRoleSelect = useCallback((role: RoleDefinition) => {
    setSelectedRole(role);
    sessionStorage.setItem(STORAGE_KEYS.selectedRole, role.id);
    setShowRoleSelector(false);
    // Auto-expand primary categories for selected role
    if (role.id !== 'all') {
      const primaryCatIds = categories
        .filter(c => role.primaryCategories.includes(c.name))
        .map(c => c.id);
      setExpandedCategories(new Set(primaryCatIds.slice(0, 2))); // Expand first 2
    }
  }, [categories]);

  // Calculate category relevance for role
  const getCategoryRelevance = useCallback((categoryName: string): 'primary' | 'secondary' | 'other' => {
    if (!selectedRole || selectedRole.id === 'all') return 'other';
    if (selectedRole.primaryCategories.includes(categoryName)) return 'primary';
    if (selectedRole.secondaryCategories.includes(categoryName)) return 'secondary';
    return 'other';
  }, [selectedRole]);

  // Sort categories by relevance
  const sortedCategories = useMemo(() => {
    if (!selectedRole || selectedRole.id === 'all') return categories;
    return [...categories].sort((a, b) => {
      const relA = getCategoryRelevance(a.name);
      const relB = getCategoryRelevance(b.name);
      const order = { primary: 0, secondary: 1, other: 2 };
      return order[relA] - order[relB];
    });
  }, [categories, selectedRole, getCategoryRelevance]);

  // Search filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    const results: { category: SkillCategory; skill: { id: string; name: string; description?: string } }[] = [];
    categories.forEach(cat => {
      cat.skills?.forEach(skill => {
        if (skill.name.toLowerCase().includes(query) || skill.description?.toLowerCase().includes(query)) {
          results.push({ category: cat, skill });
        }
      });
    });
    return results;
  }, [searchQuery, categories]);

  // Calculate radar chart data
  const radarData = useMemo(() => {
    return categories.map(cat => {
      const skillIds = cat.skills?.map(s => s.id) || [];
      const filledSkills = skillIds.filter(id => responses[id]?.hasExperience);
      const avgProficiency = filledSkills.length > 0
        ? filledSkills.reduce((sum, id) => sum + (responses[id]?.proficiency || 0), 0) / filledSkills.length
        : 0;
      return {
        name: cat.name,
        shortName: getShortCategoryName(cat.name),
        score: avgProficiency,
        count: filledSkills.length,
        total: skillIds.length,
      };
    }).filter(d => d.count > 0);
  }, [categories, responses]);

  // Calculate earned achievements
  const earnedAchievements = useMemo(() => {
    const completed = new Set<string>();
    categories.forEach(cat => {
      const skillIds = cat.skills?.map(s => s.id) || [];
      const filledCount = skillIds.filter(id => responses[id]?.hasExperience).length;
      if (filledCount === skillIds.length && skillIds.length > 0) {
        completed.add(cat.name);
      }
    });
    return ACHIEVEMENTS.filter(ach => {
      return [...completed].some(catName => ach.check(catName, 0, 0));
    });
  }, [categories, responses]);

  const updateResponse = (skillId: string, updates: Partial<SkillResponse>) => {
    setResponses((prev) => ({
      ...prev,
      [skillId]: { ...DEFAULTS, ...prev[skillId], ...updates },
    }));
    setSaved(false);
    // Track identified skills for two-pass mode
    if (updates.hasExperience) {
      setIdentifiedSkills(prev => new Set([...prev, skillId]));
    } else if (updates.hasExperience === false) {
      setIdentifiedSkills(prev => {
        const next = new Set(prev);
        next.delete(skillId);
        return next;
      });
    }
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
            level: Math.round(r.proficiency / 20),
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
      setLastSaveTime(new Date());
    } catch {
      alert('Failed to save evaluation');
    } finally {
      setSaving(false);
    }
  };

  // Jump to a skill from search
  const jumpToSkill = (categoryId: string, skillId: string) => {
    setSearchQuery('');
    setExpandedCategories(prev => new Set([...prev, categoryId]));
    setTimeout(() => {
      document.getElementById(`skill-${skillId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
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

  // Role Selector Modal
  if (showRoleSelector) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Your Skill Evaluation</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">What best describes your primary role?</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">This helps us prioritize the most relevant skill categories for you</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROLES.map((role) => (
              <button key={role.id} onClick={() => handleRoleSelect(role)}
                className="p-6 bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left group">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{role.icon}</span>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-blue-600">{role.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{role.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {showOnboarding && <OnboardingModal onComplete={() => setShowOnboarding(false)} />}
      <div className="space-y-6">
        {/* Header with save button */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Capability Evaluation</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {selectedRole && selectedRole.id !== 'all' ? (
                <span className="flex items-center gap-2">
                  <span className="text-xl">{selectedRole.icon}</span>
                  {selectedRole.name}
                  <button onClick={() => setShowRoleSelector(true)} className="text-blue-600 hover:underline text-sm ml-2">(change)</button>
                </span>
              ) : 'Build your multi-dimensional capability vector'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastSaveTime && (
              <span className="text-xs text-gray-400">
                Last saved {lastSaveTime.toLocaleTimeString()}
              </span>
            )}
            <button onClick={handleSubmit} disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg">
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Evaluation'}
            </button>
          </div>
        </div>

        {/* Control Bar: Search, Mode Toggle, Quick Mode */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <input type="text" placeholder="🔍 Search skills, tools, or technologies..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-sm" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              {/* Search Results Dropdown */}
              {searchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-64 overflow-auto">
                  {searchResults.slice(0, 10).map(({ category, skill }) => (
                    <button key={skill.id} onClick={() => jumpToSkill(category.id, skill.id)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700 border-b dark:border-slate-700 last:border-0">
                      <div className="font-medium text-gray-900 dark:text-white">{skill.name}</div>
                      <div className="text-xs text-gray-500">{category.name}</div>
                    </button>
                  ))}
                  {searchResults.length > 10 && (
                    <div className="px-4 py-2 text-xs text-gray-500 text-center">
                      +{searchResults.length - 10} more results
                    </div>
                  )}
                </div>
              )}
              {searchResults && searchResults.length === 0 && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-xl z-50 p-4 text-center text-gray-500">
                  No skills found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>

            {/* Mode Selector */}
            <div className="flex rounded-lg border dark:border-slate-600 overflow-hidden">
              <button onClick={() => { setEvalMode('browse'); sessionStorage.setItem(STORAGE_KEYS.evalMode, 'browse'); }}
                className={`px-4 py-2 text-sm font-medium ${evalMode === 'browse' ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                Browse
              </button>
              <button onClick={() => { setEvalMode('identify'); sessionStorage.setItem(STORAGE_KEYS.evalMode, 'identify'); }}
                className={`px-4 py-2 text-sm font-medium border-l dark:border-slate-600 ${evalMode === 'identify' ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                Quick ID
              </button>
              <button onClick={() => { setEvalMode('detail'); sessionStorage.setItem(STORAGE_KEYS.evalMode, 'detail'); }}
                className={`px-4 py-2 text-sm font-medium border-l dark:border-slate-600 ${evalMode === 'detail' ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                Detail ({identifiedSkills.size})
              </button>
            </div>

            {/* Quick Mode Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={quickModeEnabled} onChange={(e) => setQuickModeEnabled(e.target.checked)}
                className="w-4 h-4 rounded" />
              <span className="text-gray-600 dark:text-gray-300">Only show my skills</span>
            </label>
          </div>

          {/* Mode explanation */}
          <div className="mt-3 text-xs text-gray-500">
            {evalMode === 'browse' && '📋 Browse all categories and evaluate skills with full detail'}
            {evalMode === 'identify' && '⚡ Fast mode: quickly check skills you have experience with, then switch to Detail mode'}
            {evalMode === 'detail' && `🎯 Review and add details to the ${identifiedSkills.size} skills you've identified`}
          </div>
        </div>

        {/* Stats & Radar Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Your Progress</h3>
              <button onClick={() => setShowRadarChart(!showRadarChart)} className="text-sm text-blue-600">
                {showRadarChart ? 'Hide Chart' : 'Show Chart'}
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Skills evaluated</span>
                <span className="font-medium text-gray-900 dark:text-white">{assessedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Categories touched</span>
                <span className="font-medium text-gray-900 dark:text-white">{radarData.length} / {categories.length}</span>
              </div>
            </div>
            {/* Achievements */}
            {earnedAchievements.length > 0 && (
              <div className="mt-4 pt-4 border-t dark:border-slate-700">
                <div className="text-xs text-gray-500 mb-2">Achievements</div>
                <div className="flex flex-wrap gap-2">
                  {earnedAchievements.map(ach => (
                    <span key={ach.id} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full text-xs" title={ach.description}>
                      {ach.icon} {ach.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Radar Chart */}
          {showRadarChart && (
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex items-center justify-center">
              <SkillRadarChart categories={radarData} size={280} />
            </div>
          )}
        </div>

        {/* Categories Section */}
        {sortedCategories.map((category) => {
          // Calculate completion status for this category
          const categorySkillIds = category.skills?.map(s => s.id) || [];
          const filledCount = categorySkillIds.filter(id => responses[id]?.hasExperience || responses[id]?.wantsExperience).length;
          const totalInCategory = categorySkillIds.length;
          const isComplete = totalInCategory > 0 && filledCount === totalInCategory;
          const isPartial = filledCount > 0 && filledCount < totalInCategory;
          const relevance = getCategoryRelevance(category.name);

          // Skip categories in quick mode if they have no filled skills
          if (quickModeEnabled && filledCount === 0) return null;

          // In detail mode, only show categories with identified skills
          if (evalMode === 'detail') {
            const hasIdentified = categorySkillIds.some(id => identifiedSkills.has(id));
            if (!hasIdentified) return null;
          }

          const isExpanded = expandedCategories.has(category.id);

          // Header styles based on completion and relevance
          const relevanceColors = {
            primary: 'ring-2 ring-blue-400 dark:ring-blue-600',
            secondary: 'ring-1 ring-blue-200 dark:ring-blue-800',
            other: '',
          };
          const headerStyles = isComplete
            ? 'bg-green-100 dark:bg-green-900/40 border-l-4 border-l-green-500'
            : isPartial
            ? 'bg-amber-50 dark:bg-amber-900/30 border-l-4 border-l-amber-500'
            : 'bg-slate-200 dark:bg-slate-700 border-l-4 border-l-slate-400';

          return (
          <div key={category.id} className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden ${relevanceColors[relevance]}`}>
            <button onClick={() => toggleCategory(category.id)}
              className={`w-full px-6 py-4 flex justify-between items-center transition-colors hover:opacity-90 ${headerStyles}`}>
              <div className="text-left">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-gray-900 dark:text-white">{category.name}</h2>
                  {relevance === 'primary' && <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">Recommended</span>}
                  {isComplete && <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1"><span className="text-lg">✓</span> Complete</span>}
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

                  // In detail mode, only show identified skills
                  if (evalMode === 'detail' && !identifiedSkills.has(skill.id)) return null;

                  // In quick mode, only show skills with experience
                  if (quickModeEnabled && !r.hasExperience && !r.wantsExperience) return null;

                  const toggleTraining = (t: string) => {
                    const current = r.trainingBackground || [];
                    const updated = current.includes(t) ? current.filter(x => x !== t) : [...current, t];
                    updateResponse(skill.id, { trainingBackground: updated });
                  };

                  // Quick ID mode - simplified view
                  if (evalMode === 'identify') {
                    return (
                      <div key={skill.id} id={`skill-${skill.id}`} className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">{skill.name}</h3>
                        </div>
                        <button onClick={() => updateResponse(skill.id, { hasExperience: !r.hasExperience, wantsExperience: false })}
                          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all ${
                            r.hasExperience
                              ? 'bg-green-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-slate-700'
                          }`}>
                          {r.hasExperience ? '✓' : '○'}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={skill.id} id={`skill-${skill.id}`} className="px-6 py-5">
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

