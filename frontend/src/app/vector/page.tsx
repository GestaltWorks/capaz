'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { assessments, skills, SkillCategory, UserWithAssessment } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

const LEVEL_COLORS = [
  'bg-gray-200 dark:bg-slate-600',
  'bg-red-400',
  'bg-orange-400',
  'bg-yellow-400',
  'bg-lime-400',
  'bg-green-500',
];

const LEVEL_LABELS = ['None', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

export default function MatrixPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [teamData, setTeamData] = useState<UserWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<UserWithAssessment | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (token) {
      Promise.all([
        skills.getCategories(token),
        assessments.getTeam(token).catch(() => ({ users: [] })),
      ]).then(([catRes, teamRes]) => {
        setCategories(catRes.categories);
        setTeamData(teamRes.users);
        setExpandedCats(new Set(catRes.categories.map(c => c.id)));
      }).finally(() => setLoading(false));
    }
  }, [token]);

  const toggleCat = (id: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getLevel = (member: UserWithAssessment, skillId: string): number => {
    const assessment = member.assessments?.[0];
    if (!assessment) return -1;
    const response = assessment.responses?.find(r => r.skillId === skillId);
    return response?.level ?? -1;
  };

  const getMemberSkills = (member: UserWithAssessment) => {
    const assessment = member.assessments?.[0];
    if (!assessment?.responses) return [];
    return assessment.responses
      .filter(r => r.level !== undefined && r.level !== null)
      .map(r => {
        const category = categories.find(c => c.skills?.some(s => s.id === r.skillId));
        const skill = category?.skills?.find(s => s.id === r.skillId);
        return { ...r, skillName: skill?.name, categoryName: category?.name };
      })
      .sort((a, b) => (b.level || 0) - (a.level || 0));
  };

  const getCategoryAverage = (member: UserWithAssessment, categoryId: string): number => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat?.skills) return -1;
    const levels = cat.skills.map(s => getLevel(member, s.id)).filter(l => l >= 0);
    if (levels.length === 0) return -1;
    return Math.round(levels.reduce((a, b) => a + b, 0) / levels.length * 10) / 10;
  };

  // Filter team data
  const filteredTeam = teamData.filter(member => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Filter categories
  const displayCategories = selectedCategory === 'all'
    ? categories
    : categories.filter(c => c.id === selectedCategory);

  if (isLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isManager = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'MANAGER'].includes(user.role);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Capability Vector</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isManager ? 'Team capabilities overview' : 'Organization capabilities overview'}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-sm mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
            <span className="text-gray-600 dark:text-gray-400">Levels:</span>
            {['N/A', ...LEVEL_LABELS].map((label, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-4 h-4 rounded ${i === 0 ? 'bg-gray-400' : LEVEL_COLORS[i-1]}`}></div>
                <span className="text-gray-600 dark:text-gray-300">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {!isManager || teamData.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-gray-200 dark:border-slate-700">
            <p className="text-gray-600 dark:text-gray-400">
              {isManager
                ? 'No team evaluations available yet.'
                : 'Vector view is available for managers and admins.'}
            </p>
          </div>
        ) : (
          <>
            {filteredTeam.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-gray-200 dark:border-slate-700">
                <p className="text-gray-600 dark:text-gray-400">No team members match your search.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-700">
                      <th className="sticky left-0 z-10 bg-gray-50 dark:bg-slate-700 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-slate-600">
                        Team Member ({filteredTeam.length})
                      </th>
                      {displayCategories.map((cat) => (
                        <th key={cat.id} colSpan={expandedCats.has(cat.id) ? cat.skills?.length || 1 : 1}
                          className="px-2 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600"
                          onClick={() => toggleCat(cat.id)}>
                          {cat.name} {expandedCats.has(cat.id) ? '▼' : '▶'}
                        </th>
                      ))}
                    </tr>
                    {/* Skills subheader */}
                    <tr className="bg-gray-100 dark:bg-slate-600">
                      <th className="sticky left-0 z-10 bg-gray-100 dark:bg-slate-600 px-4 py-2 border-r border-gray-200 dark:border-slate-500"></th>
                      {displayCategories.map((cat) => (
                        expandedCats.has(cat.id) && cat.skills ? (
                          cat.skills.map((skill) => (
                            <th key={skill.id} className="px-2 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-slate-500 max-w-[100px]">
                              <div className="truncate" title={skill.name}>{skill.name}</div>
                            </th>
                          ))
                        ) : (
                          <th key={cat.id} className="px-2 py-2 text-xs text-gray-500 border-r border-gray-200 dark:border-slate-500">Avg</th>
                        )
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {filteredTeam.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => setSelectedMember(member)}>
                        <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 px-4 py-3 border-r border-gray-200 dark:border-slate-600">
                          <div className="font-medium text-gray-900 dark:text-white hover:text-blue-600">{member.firstName} {member.lastName}</div>
                          <div className="text-sm text-gray-500">{member.jobTitle || member.department || member.email}</div>
                        </td>
                        {displayCategories.map((cat) => (
                          expandedCats.has(cat.id) && cat.skills ? (
                            cat.skills.map((skill) => {
                              const level = getLevel(member, skill.id);
                              return (
                                <td key={skill.id} className="px-2 py-3 text-center border-r border-gray-100 dark:border-slate-700">
                                  <div className={`w-6 h-6 mx-auto rounded ${level < 0 ? 'bg-gray-400' : LEVEL_COLORS[level]} flex items-center justify-center text-xs font-medium text-white`}>
                                    {level < 0 ? '-' : level}
                                  </div>
                                </td>
                              );
                            })
                          ) : (
                            <td key={cat.id} className="px-2 py-3 text-center border-r border-gray-100 dark:border-slate-700">
                              {(() => {
                                const avg = getCategoryAverage(member, cat.id);
                                const colorIndex = avg < 0 ? -1 : Math.round(avg);
                                return (
                                  <div className={`w-8 h-6 mx-auto rounded ${avg < 0 ? 'bg-gray-400' : LEVEL_COLORS[colorIndex]} flex items-center justify-center text-xs font-medium text-white`}>
                                    {avg < 0 ? '-' : avg}
                                  </div>
                                );
                              })()}
                            </td>
                          )
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Member Profile Modal */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedMember(null)} />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{selectedMember.email}</p>
                    {(selectedMember.jobTitle || selectedMember.department) && (
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedMember.jobTitle}{selectedMember.jobTitle && selectedMember.department ? ' • ' : ''}{selectedMember.department}
                      </p>
                    )}
                  </div>
                  <button onClick={() => setSelectedMember(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl">&times;</button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Capability Summary</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {categories.map(cat => {
                    const avg = getCategoryAverage(selectedMember, cat.id);
                    const colorIndex = avg < 0 ? -1 : Math.round(avg);
                    return (
                      <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
                        <div className={`px-3 py-1 rounded ${avg < 0 ? 'bg-gray-400' : LEVEL_COLORS[colorIndex]} text-white text-sm font-medium`}>
                          {avg < 0 ? 'N/A' : `${avg} - ${LEVEL_LABELS[colorIndex]}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Skills</h3>
                <div className="space-y-2">
                  {getMemberSkills(selectedMember).slice(0, 10).map((skill, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded">
                      <div>
                        <span className="text-sm text-gray-900 dark:text-white">{skill.skillName}</span>
                        <span className="text-xs text-gray-500 ml-2">{skill.categoryName}</span>
                      </div>
                      <div className={`w-6 h-6 rounded ${LEVEL_COLORS[skill.level || 0]} flex items-center justify-center text-xs font-medium text-white`}>
                        {skill.level}
                      </div>
                    </div>
                  ))}
                  {getMemberSkills(selectedMember).length === 0 && (
                    <p className="text-gray-500 text-sm">No skills assessed yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

