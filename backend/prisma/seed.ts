import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create platform owner organization
  const platformOrg = await prisma.organization.upsert({
    where: { slug: 'capaz-platform' },
    update: {},
    create: {
      name: 'Capaz Platform',
      slug: 'capaz-platform',
      type: 'PLATFORM_OWNER',
      description: 'Platform owner organization',
    },
  });

  // Create demo MSP organization
  const demoMsp = await prisma.organization.upsert({
    where: { slug: 'demo-msp' },
    update: {},
    create: {
      name: 'Demo MSP',
      slug: 'demo-msp',
      type: 'MSP_RESELLER',
      description: 'Demo MSP reseller organization',
    },
  });

  // Create demo client organization (under MSP)
  const demoClient = await prisma.organization.upsert({
    where: { slug: 'demo-client' },
    update: {},
    create: {
      name: 'Demo Client',
      slug: 'demo-client',
      type: 'END_CLIENT',
      parentOrgId: demoMsp.id,
      description: 'Demo end client organization',
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123!', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@capaz.io' },
    update: {},
    create: {
      email: 'admin@capaz.io',
      hashedPassword,
      firstName: 'Platform',
      lastName: 'Admin',
      role: 'PLATFORM_ADMIN',
      organizationId: platformOrg.id,
      isVerified: true,
    },
  });

  // Create MSP admin
  const mspAdmin = await prisma.user.upsert({
    where: { email: 'admin@demo-msp.com' },
    update: {},
    create: {
      email: 'admin@demo-msp.com',
      hashedPassword,
      firstName: 'MSP',
      lastName: 'Admin',
      role: 'ORG_ADMIN',
      organizationId: demoMsp.id,
      isVerified: true,
    },
  });

  // Comprehensive skill categories covering ALL roles at an MSP/IT Services company
  const mspSkillData = [
    // ===== TECHNICAL CATEGORIES =====
    {
      name: 'End-User Support',
      description: 'Help desk, desktop support, and direct client interaction',
      skills: [
        { name: 'Windows Troubleshooting', description: 'Windows 10/11 issues, crashes, performance' },
        { name: 'macOS Troubleshooting', description: 'Apple macOS issues, configurations, updates' },
        { name: 'Mobile Device Support', description: 'iOS, Android, MDM enrollment, email setup' },
        { name: 'Printer & Peripheral Setup', description: 'Printers, scanners, docks, monitors' },
        { name: 'Remote Support Delivery', description: 'Screen sharing, remote desktop, RMM tools' },
        { name: 'Password & Account Recovery', description: 'Resets, unlocks, MFA recovery' },
        { name: 'Client Communication', description: 'Explaining tech issues in plain language' },
        { name: 'Ticket Documentation', description: 'Clear notes, time tracking, escalation' },
      ],
    },
    {
      name: 'Network Engineering',
      description: 'Design, implementation, and management of network infrastructure',
      skills: [
        { name: 'Switching & VLANs', description: 'Managed switches, VLAN design, trunking' },
        { name: 'Routing & NAT', description: 'Static routes, dynamic routing, NAT rules' },
        { name: 'Firewall Configuration', description: 'Firewall rules, policies, UTM features' },
        { name: 'Wireless Design', description: 'WiFi site surveys, AP placement, optimization' },
        { name: 'DNS & DHCP', description: 'DNS zones, DHCP scopes, IP planning' },
        { name: 'VPN Technologies', description: 'Site-to-site, client VPN, SSL/IPsec' },
        { name: 'SD-WAN', description: 'SD-WAN deployment, policy routing, failover' },
        { name: 'Network Diagrams', description: 'Visio, Lucidchart, topology documentation' },
      ],
    },
    {
      name: 'Cybersecurity',
      description: 'Security tools, practices, and incident response',
      skills: [
        { name: 'Endpoint Detection & Response', description: 'EDR platforms, threat hunting' },
        { name: 'Email Security', description: 'Spam filtering, DMARC, phishing protection' },
        { name: 'Identity & Access', description: 'MFA, SSO, conditional access policies' },
        { name: 'Vulnerability Scanning', description: 'Nessus, Qualys, patch management' },
        { name: 'SIEM & Log Analysis', description: 'Security logging, correlation, alerting' },
        { name: 'Incident Response', description: 'Breach handling, forensics, containment' },
        { name: 'Security Awareness Training', description: 'Phishing simulations, user education' },
        { name: 'Penetration Testing', description: 'Ethical hacking, vulnerability assessment' },
      ],
    },
    {
      name: 'Compliance & Risk',
      description: 'Regulatory frameworks, audits, and risk management',
      skills: [
        { name: 'HIPAA Compliance', description: 'Healthcare privacy, BAAs, PHI handling' },
        { name: 'PCI-DSS', description: 'Payment card security, SAQ completion' },
        { name: 'SOC 2 / SOC 1', description: 'Trust services criteria, audit preparation' },
        { name: 'NIST / CIS Frameworks', description: 'Security frameworks, controls mapping' },
        { name: 'CMMC / FedRAMP', description: 'Government contractor requirements' },
        { name: 'Cyber Insurance', description: 'Applications, requirements, claims' },
        { name: 'Risk Assessments', description: 'Identifying and documenting business risks' },
        { name: 'Policy Development', description: 'Security policies, acceptable use, procedures' },
      ],
    },
    {
      name: 'Cloud Platforms',
      description: 'Public cloud infrastructure and services',
      skills: [
        { name: 'Microsoft 365 Admin', description: 'Exchange, SharePoint, Teams admin' },
        { name: 'Entra ID / Azure AD', description: 'Identity, SSO, conditional access' },
        { name: 'Azure IaaS', description: 'VMs, storage, networking in Azure' },
        { name: 'Azure PaaS', description: 'App services, Functions, SQL databases' },
        { name: 'AWS Core Services', description: 'EC2, S3, VPC, IAM' },
        { name: 'Google Cloud Platform', description: 'Compute, storage, GKE' },
        { name: 'Google Workspace Admin', description: 'Gmail, Drive, admin console' },
        { name: 'Cloud Cost Management', description: 'Budgets, tagging, optimization' },
      ],
    },
    {
      name: 'Server & Infrastructure',
      description: 'On-premises servers, virtualization, and data center',
      skills: [
        { name: 'Windows Server Admin', description: 'Roles, features, updates, troubleshooting' },
        { name: 'Active Directory', description: 'AD design, GPO, replication, trusts' },
        { name: 'Linux Administration', description: 'Command line, services, packages' },
        { name: 'VMware vSphere', description: 'ESXi, vCenter, VM operations' },
        { name: 'Hyper-V', description: 'Hyper-V Manager, clustering, replication' },
        { name: 'Storage Systems', description: 'SAN, NAS, iSCSI, storage tiering' },
        { name: 'Backup & Recovery', description: 'Veeam, Datto, backup testing, RTO/RPO' },
        { name: 'Physical Server Hardware', description: 'Dell, HPE, firmware, RAID' },
      ],
    },
    {
      name: 'Automation & DevOps',
      description: 'Scripting, automation, and modern development practices',
      skills: [
        { name: 'PowerShell', description: 'Scripts, modules, automation' },
        { name: 'Bash / Shell Scripting', description: 'Linux automation, cron jobs' },
        { name: 'Python', description: 'Automation scripts, API integrations' },
        { name: 'Infrastructure as Code', description: 'Terraform, ARM templates, CloudFormation' },
        { name: 'CI/CD Pipelines', description: 'GitHub Actions, Azure DevOps, Jenkins' },
        { name: 'Containers & Docker', description: 'Docker images, compose, registries' },
        { name: 'Kubernetes', description: 'K8s clusters, pods, services' },
        { name: 'Configuration Management', description: 'Ansible, Puppet, DSC' },
      ],
    },
    {
      name: 'Unified Communications',
      description: 'VoIP, video conferencing, and collaboration tools',
      skills: [
        { name: 'Microsoft Teams Voice', description: 'Teams Phone, calling plans, auto attendants' },
        { name: 'VoIP Systems', description: '3CX, RingCentral, Zoom Phone' },
        { name: 'Video Conferencing', description: 'Zoom, Teams Rooms, conference setups' },
        { name: 'Contact Center', description: 'Call queues, IVR, reporting' },
        { name: 'SIP & PBX', description: 'SIP trunks, on-prem PBX systems' },
        { name: 'Collaboration Platforms', description: 'Teams, Slack, workspace setup' },
        { name: 'Fax & Document Workflow', description: 'eFax, document scanning, OCR' },
        { name: 'A/V Equipment', description: 'Displays, cameras, audio systems' },
      ],
    },

    // ===== BUSINESS & OPERATIONS CATEGORIES =====
    {
      name: 'Sales & Business Development',
      description: 'Revenue generation, client acquisition, and growth',
      skills: [
        { name: 'Solution Selling', description: 'Consultative sales, needs analysis' },
        { name: 'Proposal Writing', description: 'SOWs, quotes, RFP responses' },
        { name: 'Pipeline Management', description: 'CRM usage, forecasting, stages' },
        { name: 'Client Presentations', description: 'Demos, QBRs, executive meetings' },
        { name: 'Contract Negotiation', description: 'Terms, pricing, renewals' },
        { name: 'Partner Relationships', description: 'Vendor partnerships, referrals' },
        { name: 'Cold Outreach', description: 'Prospecting, cold calls, emails' },
        { name: 'Cross-sell & Upsell', description: 'Identifying expansion opportunities' },
      ],
    },
    {
      name: 'Account Management',
      description: 'Client relationships, retention, and satisfaction',
      skills: [
        { name: 'Client Relationship Building', description: 'Trust, rapport, regular touchpoints' },
        { name: 'QBR Delivery', description: 'Quarterly business reviews, reporting' },
        { name: 'Escalation Handling', description: 'Managing upset clients, resolution' },
        { name: 'Renewal Management', description: 'Contract renewals, retention strategies' },
        { name: 'SLA Management', description: 'Tracking SLAs, reporting, remediation' },
        { name: 'Client Onboarding', description: 'New client implementation, expectations' },
        { name: 'Satisfaction Surveys', description: 'NPS, CSAT, feedback collection' },
        { name: 'Strategic Planning', description: 'Technology roadmaps with clients' },
      ],
    },
    {
      name: 'Project Management',
      description: 'Planning, execution, and delivery of projects',
      skills: [
        { name: 'Project Planning', description: 'Scope, timeline, resource allocation' },
        { name: 'Agile / Scrum', description: 'Sprints, standups, retrospectives' },
        { name: 'Waterfall Methodology', description: 'Phases, milestones, gates' },
        { name: 'Risk Management', description: 'Identifying risks, mitigation plans' },
        { name: 'Stakeholder Communication', description: 'Status updates, expectation setting' },
        { name: 'Budget Management', description: 'Project budgets, change orders' },
        { name: 'Resource Coordination', description: 'Team scheduling, capacity planning' },
        { name: 'Project Documentation', description: 'Plans, change logs, lessons learned' },
      ],
    },
    {
      name: 'Finance & Accounting',
      description: 'Financial management, reporting, and operations',
      skills: [
        { name: 'Accounts Receivable', description: 'Invoicing, collections, aging' },
        { name: 'Accounts Payable', description: 'Vendor payments, expense processing' },
        { name: 'Financial Reporting', description: 'P&L, balance sheet, cash flow' },
        { name: 'Budgeting & Forecasting', description: 'Annual budgets, projections' },
        { name: 'Payroll Processing', description: 'Payroll, benefits, tax withholding' },
        { name: 'Contract Billing', description: 'MRR calculations, recurring billing' },
        { name: 'Profitability Analysis', description: 'Service margins, client profitability' },
        { name: 'Tax & Compliance', description: 'Tax filings, audits, compliance' },
      ],
    },
    {
      name: 'Human Resources',
      description: 'People management, culture, and employee lifecycle',
      skills: [
        { name: 'Recruiting & Hiring', description: 'Job postings, interviews, offers' },
        { name: 'Onboarding', description: 'New hire orientation, training plans' },
        { name: 'Performance Management', description: 'Reviews, feedback, improvement plans' },
        { name: 'Benefits Administration', description: 'Health, 401k, PTO management' },
        { name: 'Employee Relations', description: 'Conflict resolution, investigations' },
        { name: 'Training & Development', description: 'Learning paths, certifications, growth' },
        { name: 'Culture Building', description: 'Team events, recognition, engagement' },
        { name: 'HR Compliance', description: 'Labor laws, policies, documentation' },
      ],
    },
    {
      name: 'Marketing & Brand',
      description: 'Brand awareness, lead generation, and communications',
      skills: [
        { name: 'Content Creation', description: 'Blog posts, whitepapers, case studies' },
        { name: 'Social Media', description: 'LinkedIn, Twitter, posting, engagement' },
        { name: 'Email Marketing', description: 'Newsletters, campaigns, automation' },
        { name: 'SEO / SEM', description: 'Search optimization, Google Ads' },
        { name: 'Website Management', description: 'CMS updates, landing pages' },
        { name: 'Event Planning', description: 'Webinars, trade shows, client events' },
        { name: 'Graphic Design', description: 'Canva, Adobe, branded materials' },
        { name: 'Marketing Analytics', description: 'Campaign tracking, attribution' },
      ],
    },
    {
      name: 'Operations & Administration',
      description: 'Day-to-day business operations and office management',
      skills: [
        { name: 'Process Documentation', description: 'SOPs, runbooks, checklists' },
        { name: 'Vendor Management', description: 'Vendor relationships, negotiations' },
        { name: 'Office Management', description: 'Facilities, supplies, logistics' },
        { name: 'Meeting Coordination', description: 'Scheduling, agendas, minutes' },
        { name: 'Travel Arrangements', description: 'Booking, itineraries, expenses' },
        { name: 'Inventory Management', description: 'Asset tracking, procurement' },
        { name: 'Quality Assurance', description: 'Service quality, audits, improvement' },
        { name: 'Business Continuity', description: 'BCP planning, testing, updates' },
      ],
    },
    {
      name: 'Leadership & Strategy',
      description: 'Strategic thinking, team leadership, and business growth',
      skills: [
        { name: 'Team Leadership', description: 'Coaching, mentoring, delegation' },
        { name: 'Strategic Planning', description: 'Vision, goals, execution roadmap' },
        { name: 'Change Management', description: 'Leading transitions, adoption' },
        { name: 'Decision Making', description: 'Data-driven decisions, prioritization' },
        { name: 'Stakeholder Management', description: 'Board, investors, partners' },
        { name: 'M&A / Integration', description: 'Acquisitions, mergers, integration' },
        { name: 'P&L Ownership', description: 'Revenue, costs, profitability' },
        { name: 'Business Development', description: 'New markets, partnerships, growth' },
      ],
    },

    // ===== SPECIALIZED / HIDDEN TALENT CATEGORIES =====
    {
      name: 'Communication & Training',
      description: 'Teaching, writing, and presentation skills',
      skills: [
        { name: 'Technical Writing', description: 'Documentation, KB articles, guides' },
        { name: 'Presentation Skills', description: 'Public speaking, slides, demos' },
        { name: 'Training Delivery', description: 'Teaching, workshops, onboarding' },
        { name: 'Video Production', description: 'Screen recordings, editing, tutorials' },
        { name: 'Cross-team Communication', description: 'Bridging departments, translating' },
        { name: 'Client Education', description: 'Explaining complex topics simply' },
        { name: 'Conflict Resolution', description: 'De-escalation, mediation' },
        { name: 'Written Communication', description: 'Emails, reports, proposals' },
      ],
    },
    {
      name: 'Data & Analytics',
      description: 'Data analysis, reporting, and business intelligence',
      skills: [
        { name: 'Excel / Spreadsheets', description: 'Formulas, pivot tables, analysis' },
        { name: 'Power BI', description: 'Dashboards, data modeling, DAX' },
        { name: 'SQL Queries', description: 'Database queries, data extraction' },
        { name: 'Data Visualization', description: 'Charts, graphs, storytelling' },
        { name: 'KPI Definition', description: 'Metrics that matter, benchmarking' },
        { name: 'Process Mining', description: 'Workflow analysis, bottlenecks' },
        { name: 'Forecasting', description: 'Trends, predictions, modeling' },
        { name: 'Report Automation', description: 'Scheduled reports, dashboards' },
      ],
    },
    {
      name: 'Creative & Design',
      description: 'Visual design, UX, and creative problem solving',
      skills: [
        { name: 'UI/UX Design', description: 'User interfaces, experience design' },
        { name: 'Graphic Design', description: 'Adobe Creative Suite, Canva, Figma' },
        { name: 'Branding', description: 'Logos, style guides, brand identity' },
        { name: 'Video Editing', description: 'Premiere, Final Cut, motion graphics' },
        { name: 'Photography', description: 'Product shots, headshots, events' },
        { name: 'Copywriting', description: 'Marketing copy, taglines, messaging' },
        { name: 'Wireframing', description: 'Mockups, prototypes, user flows' },
        { name: 'Print Design', description: 'Brochures, business cards, signage' },
      ],
    },
    {
      name: 'Personal Effectiveness',
      description: 'Individual productivity, mindset, and self-management',
      skills: [
        { name: 'Time Management', description: 'Prioritization, calendaring, focus' },
        { name: 'Problem Solving', description: 'Root cause analysis, creative solutions' },
        { name: 'Adaptability', description: 'Handling change, learning quickly' },
        { name: 'Attention to Detail', description: 'Accuracy, thoroughness, quality' },
        { name: 'Self-motivation', description: 'Initiative, drive, accountability' },
        { name: 'Stress Management', description: 'Handling pressure, work-life balance' },
        { name: 'Continuous Learning', description: 'Staying current, self-improvement' },
        { name: 'Organization', description: 'File management, task tracking' },
      ],
    },
  ];

  let totalCategories = 0;
  let totalSkills = 0;

  for (const cat of mspSkillData) {
    const catId = `seed-${cat.name.toLowerCase().replace(/\s+/g, '-')}`;
    await prisma.skillCategory.upsert({
      where: { id: catId },
      update: { name: cat.name, description: cat.description },
      create: {
        id: catId,
        name: cat.name,
        description: cat.description,
        isTemplate: true,
        templateType: 'MSP',
      },
    });
    totalCategories++;
    console.log(`   Category: ${cat.name}`);

    for (const skill of cat.skills) {
      const skillId = `seed-${skill.name.toLowerCase().replace(/\s+/g, '-')}`;
      await prisma.skill.upsert({
        where: { id: skillId },
        update: { name: skill.name, description: skill.description, categoryId: catId },
        create: {
          id: skillId,
          name: skill.name,
          description: skill.description,
          categoryId: catId,
        },
      });
      totalSkills++;
    }
  }

  console.log(`✅ Seed completed: ${totalCategories} categories, ${totalSkills} skills`);
  console.log(`   Platform org: ${platformOrg.name}`);
  console.log(`   Demo MSP: ${demoMsp.name}`);
  console.log(`   Demo Client: ${demoClient.name}`);
  console.log(`   Admin user: ${admin.email}`);
  console.log(`   MSP admin: ${mspAdmin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

