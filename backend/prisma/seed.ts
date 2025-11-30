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

  // MSP/IT Services skill categories — grounded in real work
  const mspSkillData = [
    // ===== SERVICE DELIVERY =====
    {
      name: 'Help Desk & End-User Support',
      description: 'First-line support, troubleshooting, and client communication',
      skills: [
        { name: 'User Crisis Management', description: 'De-escalating urgent situations while gathering information' },
        { name: 'Remote Diagnostics', description: 'Troubleshooting effectively with limited information over phone/chat' },
        { name: 'Identity & Access Support', description: 'Password resets, MFA recovery, account unlocks' },
        { name: 'Remote Support Tools', description: 'ConnectWise Control, Splashtop, TeamViewer, ScreenConnect' },
        { name: 'Interpreting User Requests', description: 'Translating symptoms into technical problems' },
        { name: 'Setting Response Expectations', description: 'Communicating timelines honestly and managing queues' },
        { name: 'Multi-Channel Support', description: 'Managing concurrent chats, calls, and tickets effectively' },
        { name: 'Escalation Judgment', description: 'Recognizing when issues require senior resources' },
        { name: 'Ticket Documentation Quality', description: 'Writing clear notes that help the next technician' },
        { name: 'VIP & Priority Handling', description: 'Managing high-profile users with appropriate urgency' },
      ],
    },
    {
      name: 'On-Site Service Delivery',
      description: 'Field work, hardware, and face-to-face client interaction',
      skills: [
        { name: 'Legacy Infrastructure Assessment', description: 'Evaluating inherited systems and undocumented environments' },
        { name: 'Cable Tracing & Labeling', description: 'Physical network troubleshooting and documentation' },
        { name: 'Hardware Diagnostics', description: 'Assessing repair vs. replace decisions efficiently' },
        { name: 'Conference Room Technology', description: 'A/V systems, displays, video conferencing equipment' },
        { name: 'Printer & Peripheral Support', description: 'Network printing, drivers, scanning, multifunction devices' },
        { name: 'Client Relationship at Site', description: 'Reading organizational dynamics, building trust in person' },
        { name: 'Professional Presence', description: 'Representing the company in client environments' },
        { name: 'Handoff & Follow-Up', description: 'Documenting visit outcomes and next steps clearly' },
        { name: 'Workstation Deployment', description: 'New PC setup, data migration, user onboarding' },
        { name: 'Physical Security Awareness', description: 'Server room access, visitor protocols, secure disposal' },
      ],
    },
    {
      name: 'PSA Platform Administration',
      description: 'Professional Services Automation — tickets, time, workflows',
      skills: [
        { name: 'ConnectWise Manage', description: 'Tickets, time entries, agreements, configurations, workflows' },
        { name: 'Datto Autotask', description: 'Service desk, contracts, resource management' },
        { name: 'HaloPSA', description: 'Modern PSA, integrations, automation' },
        { name: 'Kaseya BMS', description: 'Ticketing, billing, project tracking' },
        { name: 'Syncro', description: 'Combined PSA/RMM for smaller operations' },
        { name: 'Accurate Time Entry', description: 'Consistent, detailed time tracking for billing and metrics' },
        { name: 'Workflow Optimization', description: 'Ticket routing, SLA rules, automation triggers' },
        { name: 'Reporting & Metrics', description: 'Extracting insights from PSA data' },
        { name: 'Agreement & Contract Setup', description: 'Configuring recurring services and SLAs' },
        { name: 'Board & Queue Management', description: 'Organizing ticket flow for team efficiency' },
      ],
    },
    {
      name: 'RMM Platform Administration',
      description: 'Remote Monitoring & Management — the technical backbone',
      skills: [
        { name: 'Datto RMM', description: 'Monitoring, patching, scripting, component monitors' },
        { name: 'NinjaOne', description: 'Endpoint management, patching, scripting, documentation' },
        { name: 'ConnectWise Automate', description: 'Advanced automation, monitors, scripts, agent management' },
        { name: 'N-able N-central', description: 'Enterprise RMM, automation policies, patch management' },
        { name: 'Patch Management', description: 'Windows updates, third-party patching, compliance reporting' },
        { name: 'Alert Tuning', description: 'Reducing noise while catching real issues' },
        { name: 'Script Deployment', description: 'Pushing automation across managed endpoints' },
        { name: 'Agent Health Management', description: 'Ensuring coverage and resolving offline agents' },
        { name: 'Custom Monitor Creation', description: 'Building monitors for client-specific applications' },
        { name: 'Endpoint Reporting', description: 'Compliance dashboards, inventory, health status' },
      ],
    },
    {
      name: 'Technical Documentation',
      description: 'Knowledge management, runbooks, and institutional memory',
      skills: [
        { name: 'IT Glue', description: 'Passwords, configurations, SOPs, flexible assets, integrations' },
        { name: 'Hudu', description: 'Self-hosted documentation, knowledge base, integrations' },
        { name: 'Runbook Development', description: 'Step-by-step procedures that enable consistent delivery' },
        { name: 'Credential Management', description: 'Password rotation, access control, secure storage' },
        { name: 'Network Documentation', description: 'IP schemes, topology diagrams, firewall rules' },
        { name: 'Knowledge Capture', description: 'Documenting undocumented systems and processes' },
        { name: 'End-User Guides', description: 'Client-facing documentation that reduces support calls' },
        { name: 'Documentation Maintenance', description: 'Keeping records current as environments change' },
        { name: 'Diagram Creation', description: 'Visio, draw.io, Lucidchart network and process diagrams' },
      ],
    },

    // ===== TECHNICAL ENGINEERING =====
    {
      name: 'Microsoft 365 Administration',
      description: 'Exchange, SharePoint, Teams, Entra ID, and tenant management',
      skills: [
        { name: 'Tenant-to-Tenant Migration', description: 'Mailbox, SharePoint, and Teams migrations between tenants' },
        { name: 'Exchange Online Troubleshooting', description: 'Mail flow, message trace, quarantine, transport rules' },
        { name: 'Conditional Access', description: 'Identity policies, MFA enforcement, device compliance' },
        { name: 'SharePoint Administration', description: 'Site architecture, permissions, storage management' },
        { name: 'Teams Governance', description: 'Team lifecycle, guest access, policies, voice' },
        { name: 'License Management', description: 'Optimization, assignment, E3/E5/Business Premium decisions' },
        { name: 'CIPP (CyberDrain)', description: 'Multi-tenant M365 management and automation' },
        { name: 'Microsoft Graph API', description: 'PowerShell and API-based administration and reporting' },
        { name: 'Entra ID (Azure AD)', description: 'User management, groups, hybrid identity, SSO' },
        { name: 'Intune / Endpoint Manager', description: 'MDM, device policies, application deployment' },
      ],
    },
    {
      name: 'Endpoint Security',
      description: 'EDR, threat detection, and endpoint protection platforms',
      skills: [
        { name: 'SentinelOne', description: 'Deployment, policy management, threat investigation' },
        { name: 'Huntress', description: 'Managed detection, persistent footholds, ThreatOps' },
        { name: 'CrowdStrike Falcon', description: 'Enterprise EDR, Falcon console, threat hunting' },
        { name: 'Microsoft Defender for Endpoint', description: 'MDE deployment, policies, security portal' },
        { name: 'ThreatLocker', description: 'Application whitelisting, ringfencing, elevation control' },
        { name: 'DNS Security', description: 'Cisco Umbrella, DNSFilter, content filtering' },
        { name: 'Security Awareness Training', description: 'KnowBe4, Proofpoint SAT, phishing simulations' },
        { name: 'Vulnerability Management', description: 'Scanning, prioritization, remediation tracking' },
      ],
    },
    {
      name: 'Email Security & Messaging',
      description: 'Email protection, filtering, encryption, and archiving',
      skills: [
        { name: 'Email Gateway Administration', description: 'Policy configuration, routing rules, tenant setup' },
        { name: 'Quarantine Management', description: 'Reviewing held messages, release decisions, user training' },
        { name: 'Spam Filter Tuning', description: 'Adjusting sensitivity, reducing false positives/negatives' },
        { name: 'Allow/Block List Management', description: 'Safe senders, blocked domains, organizational policies' },
        { name: 'Email Authentication', description: 'SPF, DKIM, DMARC configuration, monitoring, and troubleshooting' },
        { name: 'Mail Flow Troubleshooting', description: 'Message trace, header analysis, delivery issues' },
        { name: 'Impersonation Protection', description: 'Executive protection, domain spoofing prevention' },
        { name: 'Email Encryption', description: 'Message encryption policies, secure portals, TLS enforcement' },
        { name: 'Email Archiving & eDiscovery', description: 'Retention policies, legal hold, compliance search' },
        { name: 'Phishing Analysis', description: 'Investigating reported emails, URL analysis, attachment sandboxing' },
        { name: 'Business Email Compromise Response', description: 'BEC detection, inbox rule review, containment' },
        { name: 'Data Loss Prevention (Email)', description: 'Sensitive data policies, blocking/encrypting outbound content' },
      ],
    },
    {
      name: 'Security Operations (SOC)',
      description: 'Monitoring, detection, analysis, and threat response',
      skills: [
        { name: 'SIEM Administration', description: 'Platform configuration, data source integration, rule tuning' },
        { name: 'Log Collection & Normalization', description: 'Syslog configuration, event forwarding, parsing' },
        { name: 'Alert Triage', description: 'Prioritizing alerts, distinguishing true vs false positives' },
        { name: 'Threat Hunting', description: 'Proactive search for indicators of compromise in telemetry' },
        { name: 'Security Incident Investigation', description: 'Timeline reconstruction, scope determination, evidence gathering' },
        { name: 'Digital Forensics', description: 'Disk imaging, memory analysis, artifact preservation' },
        { name: 'Threat Intelligence Analysis', description: 'IOC correlation, threat actor tracking, intelligence application' },
        { name: 'Security Metrics & Reporting', description: 'KPIs, trend analysis, executive communication' },
        { name: 'Detection Rule Development', description: 'Writing and tuning detection logic, reducing noise' },
        { name: 'Incident Response Coordination', description: 'Cross-team communication during active incidents' },
      ],
    },
    {
      name: 'Backup & Disaster Recovery',
      description: 'Data protection, business continuity, and recovery services',
      skills: [
        { name: 'Datto BCDR', description: 'SIRIS, ALTO, image-based backup, cloud failover' },
        { name: 'Veeam', description: 'Backup jobs, repositories, SureBackup, recovery verification' },
        { name: 'Axcient', description: 'x360Recover, local virtualization, cloud continuity' },
        { name: 'Backup Testing', description: 'Scheduled restore verification and documentation' },
        { name: 'Offsite Strategy', description: '3-2-1 compliance, cloud targets, air-gapped copies' },
        { name: 'RTO/RPO Planning', description: 'Recovery objectives aligned to business requirements' },
        { name: 'M365 Backup', description: 'Third-party backup for Exchange, SharePoint, OneDrive, Teams' },
        { name: 'Disaster Recovery Execution', description: 'Bare-metal recovery, failover procedures, DR testing' },
        { name: 'Immutable Backup Strategy', description: 'Ransomware-resistant backup configurations' },
      ],
    },
    {
      name: 'Network Infrastructure',
      description: 'Firewalls, switching, wireless, and network management',
      skills: [
        { name: 'Ubiquiti / UniFi', description: 'UDM, switches, access points, Network application' },
        { name: 'Cisco Meraki', description: 'Dashboard management, MX, MS, MR, licensing' },
        { name: 'Fortinet', description: 'FortiGate, FortiSwitch, FortiAP, Security Fabric' },
        { name: 'SonicWall', description: 'Firewall management, VPN, security services' },
        { name: 'Wireless Assessment', description: 'Site surveys, channel planning, interference mitigation' },
        { name: 'ISP Coordination', description: 'Troubleshooting circuit issues with carriers' },
        { name: 'Network Remediation', description: 'Addressing inherited misconfigurations and technical debt' },
        { name: 'VPN & Remote Access', description: 'Site-to-site, client VPN, always-on configurations' },
        { name: 'SD-WAN', description: 'Multi-site connectivity, failover, traffic shaping' },
        { name: 'VLAN & Segmentation', description: 'Network isolation, guest networks, IoT separation' },
      ],
    },

    // ===== DATA & SOFTWARE =====
    {
      name: 'Line-of-Business Applications',
      description: 'Client business software, integrations, and support',
      skills: [
        { name: 'ERP Systems', description: 'QuickBooks, Sage, NetSuite, industry-specific ERP' },
        { name: 'CRM Platforms', description: 'Salesforce, HubSpot, Dynamics 365, Zoho' },
        { name: 'Practice Management Software', description: 'Legal, medical, accounting vertical applications' },
        { name: 'Document Management', description: 'SharePoint, NetDocuments, iManage, M-Files' },
        { name: 'Industry Vertical Software', description: 'Dental, construction, real estate specific apps' },
        { name: 'Application Integrations', description: 'API connections, data sync between systems' },
        { name: 'Legacy Application Support', description: 'Older software requiring compatibility workarounds' },
        { name: 'Software Licensing', description: 'Subscription management, compliance, renewals' },
        { name: 'Application Deployment', description: 'Packaging, silent installs, deployment tools' },
        { name: 'SaaS Administration', description: 'Third-party cloud application management' },
      ],
    },
    {
      name: 'Database & Data Services',
      description: 'Database administration, reporting, and data management',
      skills: [
        { name: 'SQL Server', description: 'Installation, maintenance, backup, performance' },
        { name: 'MySQL / MariaDB', description: 'Open-source database administration' },
        { name: 'Database Backup & Recovery', description: 'Backup strategies, point-in-time recovery' },
        { name: 'Data Migration', description: 'Moving data between systems, format conversion' },
        { name: 'Reporting & BI', description: 'Power BI, SSRS, Crystal Reports, data visualization' },
        { name: 'Data Import/Export', description: 'CSV, Excel, API data transfers' },
        { name: 'Database Performance', description: 'Query optimization, indexing, monitoring' },
        { name: 'Data Cleanup', description: 'Deduplication, validation, quality improvement' },
      ],
    },

    // ===== AUTOMATION & INTEGRATION =====
    {
      name: 'Automation & Scripting',
      description: 'Reducing manual work through automation and integration',
      skills: [
        { name: 'PowerShell', description: 'Scripts for M365, AD, Azure, RMM, and bulk operations' },
        { name: 'Rewst', description: 'No-code/low-code automation platform for MSPs' },
        { name: 'PSA Workflow Automation', description: 'Ticket routing, escalation rules, status automation' },
        { name: 'RMM Scripting', description: 'Scheduled scripts, remediation, deployment' },
        { name: 'API Integration', description: 'Connecting tools, data sync, custom integrations' },
        { name: 'User Lifecycle Automation', description: 'Onboarding/offboarding, provisioning, deprovisioning' },
        { name: 'Scheduled Task Management', description: 'Maintenance windows, automated jobs, monitoring' },
        { name: 'Process Improvement', description: 'Identifying manual work that should be automated' },
        { name: 'Python / Bash Scripting', description: 'Cross-platform automation beyond PowerShell' },
      ],
    },

    // ===== OPERATIONS =====
    {
      name: 'Service Coordination & Dispatch',
      description: 'Resource scheduling, triage, and service delivery management',
      skills: [
        { name: 'Ticket Triage', description: 'Assessing priority, impact, and urgency accurately' },
        { name: 'Resource Scheduling', description: 'Matching technicians to work based on skills and availability' },
        { name: 'Team Knowledge', description: 'Understanding individual strengths and client relationships' },
        { name: 'Client Communication', description: 'Proactive updates on timelines and scheduling' },
        { name: 'Escalation Management', description: 'Routing complex issues to appropriate resources' },
        { name: 'SLA Monitoring', description: 'Tracking response/resolution times, preventing breaches' },
        { name: 'Daily Operations', description: 'Team standups, queue management, workload balancing' },
        { name: 'Capacity Forecasting', description: 'Anticipating resource needs based on trends' },
        { name: 'Project Scheduling', description: 'Coordinating project work alongside service delivery' },
      ],
    },

    // ===== CLIENT MANAGEMENT =====
    {
      name: 'vCIO & Strategic Advisory',
      description: 'Technology strategy, planning, and executive-level client relationships',
      skills: [
        { name: 'Quarterly Business Reviews', description: 'Preparing and delivering strategic review meetings' },
        { name: 'Technology Roadmapping', description: 'Multi-year planning aligned with business goals' },
        { name: 'IT Budget Planning', description: 'CapEx/OpEx planning, ROI discussions, cost optimization' },
        { name: 'Risk Communication', description: 'Translating technical risk into business terms' },
        { name: 'Vendor Evaluation', description: 'Assessing solutions and making recommendations' },
        { name: 'Difficult Conversations', description: 'Delivering unwelcome news professionally' },
        { name: 'Executive Communication', description: 'Presenting to leadership, board-level discussions' },
        { name: 'Competitive Response', description: 'Handling client retention when competitors engage' },
        { name: 'Compliance Advisory', description: 'Guiding clients on regulatory requirements' },
      ],
    },
    {
      name: 'Client Onboarding',
      description: 'New client implementation, transition, and standardization',
      skills: [
        { name: 'Environment Assessment', description: 'Evaluating current state of inherited infrastructure' },
        { name: 'Rapid Documentation', description: 'Capturing credentials, configs, and tribal knowledge quickly' },
        { name: 'Secure Credential Transition', description: 'Taking over access from previous providers' },
        { name: 'Stack Standardization', description: 'Migrating clients to standard tools and configurations' },
        { name: 'User Introduction', description: 'Communicating changes to end users effectively' },
        { name: 'Quick Wins', description: 'Identifying visible improvements early in relationship' },
        { name: 'Expectation Alignment', description: 'Establishing service levels and communication norms' },
        { name: 'Transition Management', description: 'Professional handoff from previous IT provider' },
        { name: 'Security Baseline Deployment', description: 'Implementing minimum security standards immediately' },
      ],
    },

    // ===== BUSINESS FUNCTIONS =====
    {
      name: 'Sales & Business Development',
      description: 'Client acquisition, proposals, and revenue growth',
      skills: [
        { name: 'Discovery & Needs Analysis', description: 'Uncovering client pain points and requirements' },
        { name: 'Proposal Development', description: 'QuoteWerks, statements of work, pricing' },
        { name: 'Prospect Qualification', description: 'Identifying good-fit clients, declining poor fits' },
        { name: 'Solution Demonstrations', description: 'Presenting capabilities without overwhelming' },
        { name: 'Referral Development', description: 'Building relationships that generate introductions' },
        { name: 'Partner & Vendor Programs', description: 'Leveraging Microsoft, vendor incentives, co-sell' },
        { name: 'Competitive Differentiation', description: 'Articulating unique value vs competitors' },
        { name: 'Pipeline Management', description: 'Accurate forecasting and opportunity tracking' },
        { name: 'Contract Negotiation', description: 'Terms, SLAs, scope discussions' },
      ],
    },
    {
      name: 'Finance & Billing',
      description: 'Invoicing, collections, profitability, and financial management',
      skills: [
        { name: 'PSA Billing Operations', description: 'Agreement billing, time billing, invoicing runs' },
        { name: 'Accounts Receivable', description: 'Collections, aging management, payment follow-up' },
        { name: 'MRR & Revenue Analysis', description: 'Recurring revenue tracking, churn analysis' },
        { name: 'Project Profitability', description: 'Tracking margins on project work' },
        { name: 'Vendor Reconciliation', description: 'Matching vendor bills to client charges' },
        { name: 'Client Profitability', description: 'Identifying underperforming client relationships' },
        { name: 'Payroll & Compensation', description: 'Time tracking accuracy, payroll processing' },
        { name: 'Cash Flow Management', description: 'Working capital, payment cycles, forecasting' },
        { name: 'Financial Reporting', description: 'P&L, balance sheet, management dashboards' },
      ],
    },
    {
      name: 'Human Resources & Team Development',
      description: 'Hiring, retention, culture, and professional development',
      skills: [
        { name: 'Technical Recruiting', description: 'Sourcing and hiring engineers in competitive market' },
        { name: 'New Hire Onboarding', description: 'Getting new team members productive effectively' },
        { name: 'Burnout Prevention', description: 'Recognizing warning signs, managing workload' },
        { name: 'Career Development', description: 'Growth paths, skill development, advancement' },
        { name: 'Performance Conversations', description: 'Feedback, coaching, addressing underperformance' },
        { name: 'Team Recognition', description: 'Celebrating wins, acknowledging contributions' },
        { name: 'Remote Culture', description: 'Building connection in distributed teams' },
        { name: 'Knowledge Continuity', description: 'Ensuring critical knowledge survives turnover' },
        { name: 'Compensation & Benefits', description: 'Salary benchmarking, benefits administration' },
      ],
    },
    {
      name: 'Procurement & Vendor Management',
      description: 'Hardware, software, and services purchasing',
      skills: [
        { name: 'Distribution Relationships', description: 'Ingram, TD SYNNEX, D&H navigation' },
        { name: 'Cloud Marketplace', description: 'Pax8, AppRiver, SaaS subscription management' },
        { name: 'Hardware Quoting', description: 'Servers, workstations, networking equipment' },
        { name: 'License Management', description: 'Microsoft licensing, true-ups, compliance' },
        { name: 'Vendor Negotiations', description: 'Pricing, terms, support agreements' },
        { name: 'RMA Processing', description: 'Warranty claims, hardware replacement' },
        { name: 'Asset Tracking', description: 'Inventory management, spare equipment' },
        { name: 'Partner Relationships', description: 'Vendor program benefits, priority support' },
        { name: 'Lease & Finance Options', description: 'Hardware-as-a-Service, leasing programs' },
      ],
    },
    // ===== MANAGEMENT & LEADERSHIP =====
    {
      name: 'Team Management',
      description: 'Leading teams, delegation, and operational leadership',
      skills: [
        { name: 'Team Leadership', description: 'Setting direction, motivating, and supporting team members' },
        { name: 'Delegation', description: 'Assigning work appropriately based on skills and development' },
        { name: 'One-on-Ones', description: 'Regular individual meetings, coaching, and feedback' },
        { name: 'Performance Management', description: 'Goal setting, reviews, addressing issues' },
        { name: 'Workload Balancing', description: 'Distributing work fairly, managing capacity' },
        { name: 'Conflict Resolution', description: 'Addressing interpersonal issues within teams' },
        { name: 'Hiring Decisions', description: 'Interviewing, candidate evaluation, team fit assessment' },
        { name: 'Cross-Team Coordination', description: 'Working with other departments effectively' },
        { name: 'Meeting Leadership', description: 'Running productive team meetings and standups' },
        { name: 'Remote Team Management', description: 'Leading distributed and hybrid teams' },
      ],
    },
    {
      name: 'Organizational Leadership',
      description: 'Strategic leadership, business operations, and company direction',
      skills: [
        { name: 'Strategic Planning', description: 'Vision, goals, multi-year business direction' },
        { name: 'P&L Ownership', description: 'Revenue, cost management, profitability responsibility' },
        { name: 'Organizational Design', description: 'Team structure, roles, reporting relationships' },
        { name: 'Change Management', description: 'Leading transitions, tool adoption, process changes' },
        { name: 'Culture Development', description: 'Values, behaviors, company identity' },
        { name: 'Executive Decision Making', description: 'High-stakes decisions with incomplete information' },
        { name: 'Board & Stakeholder Relations', description: 'Reporting to owners, advisors, investors' },
        { name: 'M&A Integration', description: 'Acquisitions, mergers, consolidation' },
        { name: 'Partnerships & Alliances', description: 'Strategic relationships with vendors and peers' },
        { name: 'Industry Leadership', description: 'Peer groups, associations, community contribution' },
      ],
    },

    // ===== INTERPERSONAL & SOFT SKILLS =====
    {
      name: 'Client & Stakeholder Communication',
      description: 'Managing relationships, expectations, and difficult conversations',
      skills: [
        { name: 'Crisis Communication', description: 'Remaining calm and clear during outages or incidents' },
        { name: 'Empathy Under Pressure', description: 'Understanding frustration without taking it personally' },
        { name: 'Repetition with Patience', description: 'Explaining the same concept multiple times effectively' },
        { name: 'Organizational Awareness', description: 'Understanding politics, decision-makers, and dynamics' },
        { name: 'Delivering Difficult News', description: 'Communicating failures or limitations professionally' },
        { name: 'Peer Support', description: 'Recognizing when colleagues need help' },
        { name: 'Self-Regulation', description: 'Managing personal stress between interactions' },
        { name: 'Recognition & Encouragement', description: 'Acknowledging contributions and building morale' },
        { name: 'Active Listening', description: 'Fully understanding before responding' },
      ],
    },
    {
      name: 'Training & Knowledge Transfer',
      description: 'Teaching, mentoring, and enabling others to succeed',
      skills: [
        { name: 'Technical to Non-Technical Translation', description: 'Explaining concepts without jargon' },
        { name: 'Training Material Development', description: 'Creating videos, guides, and documentation' },
        { name: 'New Employee Mentoring', description: 'Onboarding and developing junior team members' },
        { name: 'Internal Presentations', description: 'Lunch & learns, team knowledge sharing' },
        { name: 'End-User Training', description: 'Teaching clients to be more self-sufficient' },
        { name: 'Effective Documentation', description: 'Writing that people actually read and follow' },
        { name: 'Video Tutorial Creation', description: 'Loom, Snagit, screen recording instruction' },
        { name: 'Socratic Guidance', description: 'Helping others find answers themselves' },
        { name: 'Cross-Training', description: 'Enabling team coverage and reducing single points of failure' },
      ],
    },
    {
      name: 'Critical Thinking & Problem Solving',
      description: 'Troubleshooting methodology and analytical skills',
      skills: [
        { name: 'Research Skills', description: 'Finding answers when documentation does not exist' },
        { name: 'Pattern Recognition', description: 'Connecting related issues across tickets and systems' },
        { name: 'Creative Problem Solving', description: 'Finding solutions when standard approaches fail' },
        { name: 'Escalation Judgment', description: 'Knowing when to persist vs. ask for help' },
        { name: 'Root Cause Analysis', description: 'Not settling for symptoms, finding underlying issues' },
        { name: 'Post-Incident Review', description: 'Learning from failures without blame' },
        { name: 'Resourcefulness', description: 'Working with available tools and constraints' },
        { name: 'Intellectual Humility', description: 'Admitting gaps in knowledge and learning' },
        { name: 'Hypothesis Testing', description: 'Systematic approach to isolating variables' },
      ],
    },
    {
      name: 'Business Productivity',
      description: 'General office and administrative effectiveness',
      skills: [
        { name: 'Advanced Spreadsheets', description: 'Excel/Sheets formulas, pivot tables, data analysis' },
        { name: 'Calendar Management', description: 'Scheduling across time zones and priorities' },
        { name: 'Written Communication', description: 'Clear, concise emails and documentation' },
        { name: 'Information Retrieval', description: 'Finding documentation and institutional knowledge' },
        { name: 'Context Retention', description: 'Remembering client history and project details' },
        { name: 'Organizational Networking', description: 'Knowing who to ask for what' },
        { name: 'Meeting Facilitation', description: 'Keeping discussions productive and on-track' },
        { name: 'Effective Note-Taking', description: 'Capturing actionable information' },
        { name: 'Task Prioritization', description: 'Managing competing priorities effectively' },
      ],
    },
    {
      name: 'Personal Effectiveness',
      description: 'Self-management, resilience, and sustainable performance',
      skills: [
        { name: 'After-Hours Coverage', description: 'Managing on-call responsibilities effectively' },
        { name: 'Work-Life Boundaries', description: 'Protecting personal time and preventing overwork' },
        { name: 'Continuous Learning', description: 'Staying current in a changing field' },
        { name: 'Confidence Building', description: 'Overcoming self-doubt and imposter feelings' },
        { name: 'Help-Seeking', description: 'Asking for assistance before problems compound' },
        { name: 'Progress Recognition', description: 'Acknowledging incremental achievements' },
        { name: 'Workspace Optimization', description: 'Ergonomics, environment, productivity setup' },
        { name: 'Energy Management', description: 'Aligning work with personal productivity patterns' },
        { name: 'Focus & Deep Work', description: 'Protecting time for concentrated effort' },
      ],
    },

    // ===== SPECIALIZED FUNCTIONS =====
    {
      name: 'Compliance & Regulatory',
      description: 'Audits, frameworks, and regulatory requirements',
      skills: [
        { name: 'Audit Evidence Collection', description: 'Screenshots, logs, proof of controls' },
        { name: 'Policy Development', description: 'Creating policies that satisfy audits and are followed' },
        { name: 'Vendor Questionnaires', description: 'Helping clients complete security assessments' },
        { name: 'HIPAA Compliance', description: 'BAAs, PHI handling, healthcare requirements' },
        { name: 'Cyber Insurance', description: 'Application completion and control alignment' },
        { name: 'SOC 2 / ISO 27001', description: 'Framework implementation and readiness' },
        { name: 'Security Baseline Standards', description: 'Ensuring minimum controls across clients' },
        { name: 'Compliance Communication', description: 'Explaining requirements to resistant stakeholders' },
        { name: 'PCI-DSS', description: 'Payment card industry requirements and assessments' },
        { name: 'CMMC / NIST 800-171', description: 'Government contractor compliance requirements' },
      ],
    },
    {
      name: 'Marketing & Business Development',
      description: 'Brand visibility, content, and referral relationships',
      skills: [
        { name: 'Professional Social Presence', description: 'LinkedIn, thought leadership, engagement' },
        { name: 'Case Study Development', description: 'Documenting client success stories' },
        { name: 'Public Speaking', description: 'User groups, conferences, webinar presentations' },
        { name: 'Podcast & Media', description: 'Industry show participation, interviews' },
        { name: 'Partner Co-Marketing', description: 'Joint content and campaigns with vendors' },
        { name: 'Referral Networks', description: 'Relationships with CPAs, attorneys, complementary services' },
        { name: 'Client Communication', description: 'Newsletters, updates, value-add content' },
        { name: 'Community Engagement', description: 'Local business groups, chambers, industry associations' },
        { name: 'Event Planning', description: 'Client appreciation, technology showcases, lunch & learns' },
      ],
    },
    {
      name: 'Vertical Industry Expertise',
      description: 'Specialized knowledge in specific industries',
      skills: [
        { name: 'Healthcare', description: 'EHR systems, HIPAA, medical device integration' },
        { name: 'Legal', description: 'Document management, ethical walls, legal hold' },
        { name: 'Manufacturing', description: 'OT networks, SCADA, industrial systems' },
        { name: 'Financial Services', description: 'Regulatory compliance, encryption, audit requirements' },
        { name: 'Nonprofit', description: 'Budget constraints, donated licensing, grant compliance' },
        { name: 'Creative & Design', description: 'Mac environments, Jamf, creative workflows' },
        { name: 'Retail & Hospitality', description: 'POS systems, multi-location, guest networks' },
        { name: 'Construction & Field Services', description: 'Mobile, rugged devices, remote connectivity' },
        { name: 'Education (K-12)', description: 'CIPA, student privacy, 1:1 device programs' },
        { name: 'Government & Municipal', description: 'Public records, accessibility, procurement requirements' },
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

