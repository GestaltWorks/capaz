const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface RequestOptions extends RequestInit {
  token?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

// Auth API
export const auth = {
  login: (email: string, password: string) =>
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: RegisterData) =>
    request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: (token: string) =>
    request<{ user: User }>('/auth/me', { token }),
};

// Skills API
export const skills = {
  getCategories: (token: string) =>
    request<{ categories: SkillCategory[] }>('/skills/categories', { token }),

  createCategory: (token: string, data: Partial<SkillCategory>) =>
    request<{ category: SkillCategory }>('/skills/categories', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  createSkill: (token: string, data: Partial<Skill>) =>
    request<{ skill: Skill }>('/skills', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),
};

// Assessments API
export const assessments = {
  getCurrent: (token: string) =>
    request<{ assessment: Assessment | null }>('/assessments/current', { token }),

  getAll: (token: string) =>
    request<{ assessments: Assessment[] }>('/assessments', { token }),

  submit: (token: string, data: SubmitAssessmentData) =>
    request<{ assessment: Assessment }>('/assessments', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  getTeam: (token: string) =>
    request<{ users: UserWithAssessment[] }>('/assessments/team', { token }),
};

// Users API
export const users = {
  list: (token: string, params?: { search?: string; department?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ users: User[]; pagination: Pagination }>(`/users${query ? `?${query}` : ''}`, { token });
  },

  updateProfile: (token: string, data: Partial<User>) =>
    request<{ user: User }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),
};

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  department?: string;
  role: 'PLATFORM_ADMIN' | 'ORG_ADMIN' | 'MANAGER' | 'USER';
  isTrainer: boolean;
  isProjectLead: boolean;
  isMentor: boolean;
  organization?: { id: string; name: string; slug: string };
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationSlug: string;
  jobTitle?: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  skills: Skill[];
  childCategories?: SkillCategory[];
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  tooltip?: string;
  levelDescriptions?: Record<string, string>;
  isCertifiable: boolean;
}

export interface Assessment {
  id: string;
  version: number;
  isComplete: boolean;
  submittedAt?: string;
  responses: AssessmentResponse[];
}

export interface AssessmentResponse {
  id: string;
  skillId: string;
  level: number;
  hasCertification: boolean;
  certificationName?: string;
  wantsTraining: boolean;
  skill?: Skill & { category?: SkillCategory };
}

export interface SubmitAssessmentData {
  responses: {
    skillId: string;
    level: number;
    hasCertification?: boolean;
    certificationName?: string;
    wantsTraining?: boolean;
  }[];
  notes?: string;
}

export interface UserWithAssessment extends User {
  assessments: Assessment[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

