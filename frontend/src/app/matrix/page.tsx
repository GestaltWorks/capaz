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

export default function MatrixPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [teamData, setTeamData] = useState<UserWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

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

  const getLevel = (user: UserWithAssessment, skillId: string): number => {
    const assessment = user.assessments?.[0];
    if (!assessment) return -1;
    const response = assessment.responses?.find(r => r.skillId === skillId);
    return response?.level ?? -1;
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Skills Matrix</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isManager ? 'Team skills overview' : 'Organization skills overview'}
          </p>
        </div>

        {/* Legend */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Skill Levels:</span>
            {['N/A', 'None', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'].map((label, i) => (
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
                ? 'No team assessments available yet.' 
                : 'Matrix view is available for managers and admins.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700">
                  <th className="sticky left-0 z-10 bg-gray-50 dark:bg-slate-700 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-slate-600">
                    Team Member
                  </th>
                  {categories.map((cat) => (
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
                  {categories.map((cat) => (
                    expandedCats.has(cat.id) && cat.skills ? (
                      cat.skills.map((skill) => (
                        <th key={skill.id} className="px-2 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-slate-500 max-w-[100px]">
                          <div className="truncate" title={skill.name}>{skill.name}</div>
                        </th>
                      ))
                    ) : (
                      <th key={cat.id} className="px-2 py-2 text-xs text-gray-500 border-r border-gray-200 dark:border-slate-500">...</th>
                    )
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {teamData.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 px-4 py-3 border-r border-gray-200 dark:border-slate-600">
                      <div className="font-medium text-gray-900 dark:text-white">{member.firstName} {member.lastName}</div>
                      <div className="text-sm text-gray-500">{member.jobTitle || member.department}</div>
                    </td>
                    {categories.map((cat) => (
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
                        <td key={cat.id} className="px-2 py-3 text-center text-gray-400 border-r border-gray-100 dark:border-slate-700">...</td>
                      )
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

