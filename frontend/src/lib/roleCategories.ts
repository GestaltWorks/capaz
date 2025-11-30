// Role definitions with their primary and secondary category mappings
export interface RoleDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  primaryCategories: string[]; // Category names that are most relevant
  secondaryCategories: string[]; // Somewhat relevant
}

export const ROLES: RoleDefinition[] = [
  {
    id: 'technician',
    name: 'Technician / Engineer',
    icon: '🔧',
    description: 'Hands-on technical work, troubleshooting, and implementations',
    primaryCategories: [
      'Help Desk & End-User Support',
      'On-Site Service Delivery',
      'Microsoft 365 Administration',
      'Network Infrastructure',
      'Endpoint Security',
      'Backup & Disaster Recovery',
      'RMM Platform Administration',
    ],
    secondaryCategories: [
      'Technical Documentation',
      'Email Security & Messaging',
      'Line-of-Business Applications',
      'Automation & Scripting',
    ],
  },
  {
    id: 'service-desk',
    name: 'Service Desk / Support',
    icon: '🎧',
    description: 'First-line support, ticket handling, and user communication',
    primaryCategories: [
      'Help Desk & End-User Support',
      'PSA Platform Administration',
      'Technical Documentation',
      'Client & Stakeholder Communication',
    ],
    secondaryCategories: [
      'Microsoft 365 Administration',
      'On-Site Service Delivery',
      'Training & Knowledge Transfer',
      'Critical Thinking & Problem Solving',
    ],
  },
  {
    id: 'security',
    name: 'Security / Compliance',
    icon: '🛡️',
    description: 'Cybersecurity, compliance frameworks, and risk management',
    primaryCategories: [
      'Endpoint Security',
      'Email Security & Messaging',
      'Security Operations (SOC)',
      'Compliance & Regulatory',
      'Backup & Disaster Recovery',
    ],
    secondaryCategories: [
      'Network Infrastructure',
      'Microsoft 365 Administration',
      'Technical Documentation',
    ],
  },
  {
    id: 'management',
    name: 'Management / Leadership',
    icon: '👔',
    description: 'Team leadership, operations management, and strategic direction',
    primaryCategories: [
      'Team Management',
      'Organizational Leadership',
      'vCIO & Strategic Advisory',
      'Service Coordination & Dispatch',
      'Human Resources & Team Development',
    ],
    secondaryCategories: [
      'Client & Stakeholder Communication',
      'Finance & Billing',
      'Sales & Business Development',
      'Training & Knowledge Transfer',
    ],
  },
  {
    id: 'sales',
    name: 'Sales / Account Management',
    icon: '💼',
    description: 'Client relationships, sales, and business development',
    primaryCategories: [
      'Sales & Business Development',
      'vCIO & Strategic Advisory',
      'Client Onboarding',
      'Marketing & Business Development',
    ],
    secondaryCategories: [
      'Client & Stakeholder Communication',
      'Procurement & Vendor Management',
      'Finance & Billing',
    ],
  },
  {
    id: 'operations',
    name: 'Operations / Admin',
    icon: '📋',
    description: 'Dispatch, scheduling, billing, and operational coordination',
    primaryCategories: [
      'Service Coordination & Dispatch',
      'PSA Platform Administration',
      'Finance & Billing',
      'Procurement & Vendor Management',
      'Business Productivity',
    ],
    secondaryCategories: [
      'Client & Stakeholder Communication',
      'Human Resources & Team Development',
      'Technical Documentation',
    ],
  },
  {
    id: 'all',
    name: 'Show Everything',
    icon: '📚',
    description: 'View all categories without role-based filtering',
    primaryCategories: [],
    secondaryCategories: [],
  },
];

// Achievement definitions
export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  check: (categoryName: string, filledCount: number, totalCount: number) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'security-specialist', name: 'Security Specialist', icon: '🛡️', description: 'Completed all security categories',
    check: (cat) => ['Endpoint Security', 'Email Security & Messaging', 'Security Operations (SOC)'].includes(cat) },
  { id: 'cloud-master', name: 'Cloud Master', icon: '☁️', description: 'Completed Microsoft 365 Administration',
    check: (cat) => cat === 'Microsoft 365 Administration' },
  { id: 'network-ninja', name: 'Network Ninja', icon: '🌐', description: 'Completed Network Infrastructure',
    check: (cat) => cat === 'Network Infrastructure' },
  { id: 'automation-ace', name: 'Automation Ace', icon: '⚡', description: 'Completed Automation & Scripting',
    check: (cat) => cat === 'Automation & Scripting' },
  { id: 'people-person', name: 'People Person', icon: '🤝', description: 'Completed soft skill categories',
    check: (cat) => ['Client & Stakeholder Communication', 'Training & Knowledge Transfer'].includes(cat) },
  { id: 'leader', name: 'Leader', icon: '👑', description: 'Completed leadership categories',
    check: (cat) => ['Team Management', 'Organizational Leadership'].includes(cat) },
];

// Get short name for radar chart
export function getShortCategoryName(name: string): string {
  const shortNames: Record<string, string> = {
    'Help Desk & End-User Support': 'Help Desk',
    'On-Site Service Delivery': 'On-Site',
    'PSA Platform Administration': 'PSA',
    'RMM Platform Administration': 'RMM',
    'Technical Documentation': 'Docs',
    'Microsoft 365 Administration': 'M365',
    'Endpoint Security': 'Endpoint Sec',
    'Email Security & Messaging': 'Email Sec',
    'Security Operations (SOC)': 'SOC',
    'Backup & Disaster Recovery': 'Backup/DR',
    'Network Infrastructure': 'Network',
    'Line-of-Business Applications': 'LOB Apps',
    'Database & Data Services': 'Database',
    'Automation & Scripting': 'Automation',
    'Service Coordination & Dispatch': 'Dispatch',
    'vCIO & Strategic Advisory': 'vCIO',
    'Client Onboarding': 'Onboarding',
    'Sales & Business Development': 'Sales',
    'Finance & Billing': 'Finance',
    'Human Resources & Team Development': 'HR',
    'Procurement & Vendor Management': 'Procurement',
    'Team Management': 'Team Mgmt',
    'Organizational Leadership': 'Leadership',
    'Client & Stakeholder Communication': 'Comms',
    'Training & Knowledge Transfer': 'Training',
    'Critical Thinking & Problem Solving': 'Problem Solving',
    'Business Productivity': 'Productivity',
    'Personal Effectiveness': 'Personal',
    'Compliance & Regulatory': 'Compliance',
    'Marketing & Business Development': 'Marketing',
    'Vertical Industry Expertise': 'Verticals',
  };
  return shortNames[name] || name.split(' ')[0];
}

