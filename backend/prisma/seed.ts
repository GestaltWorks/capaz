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

  // Real MSP skills - what people ACTUALLY do, not job descriptions
  const mspSkillData = [
    // ===== THE FRONT LINES =====
    {
      name: 'Being the First Responder',
      description: 'When the phone rings and someone is panicking, you\'re the voice they hear',
      skills: [
        { name: 'Calming Panicked Users', description: 'Talking someone down when their email is "gone" before a board meeting' },
        { name: 'Diagnosing Over the Phone', description: 'Figuring out what\'s wrong when they say "nothing works"' },
        { name: 'The Art of the Password Reset', description: 'Handling the 10th reset this week with patience and grace' },
        { name: 'Remote Control Finesse', description: 'ConnectWise Control, Splashtop, TeamViewer — taking the wheel smoothly' },
        { name: 'Reading Between the Lines', description: 'Understanding what they MEAN vs what they SAY the problem is' },
        { name: 'Managing Expectations in Real-Time', description: 'Being honest about wait times without making them angrier' },
        { name: 'Juggling Multiple Chats', description: 'Handling 5 conversations at once without dropping any' },
        { name: 'Knowing When to Escalate', description: 'The wisdom to know this is above your pay grade — and doing it fast' },
      ],
    },
    {
      name: 'Showing Up On-Site',
      description: 'The reality of being the person who walks through the door',
      skills: [
        { name: 'Server Closet Archaeology', description: 'Working in a 90°F closet next to the mop bucket' },
        { name: 'Cable Detective Work', description: 'Tracing unlabeled cables through drop ceilings' },
        { name: 'Hardware Triage', description: 'Deciding if this laptop needs 10 minutes or a replacement' },
        { name: 'Conference Room Heroics', description: 'Making the projector work 5 minutes before the CEO\'s meeting' },
        { name: 'Printer Whispering', description: 'The dark art of making printers behave' },
        { name: 'Reading the Room', description: 'Sensing who\'s frustrated, who\'s the decision maker, who knows things' },
        { name: 'Looking Professional Under Pressure', description: 'Crawling under desks in business casual with dignity' },
        { name: 'The Graceful Exit', description: 'Wrapping up, explaining next steps, leaving them feeling good' },
      ],
    },
    {
      name: 'Running the PSA & RMM',
      description: 'The tools that run an MSP — and the people who actually know how to use them',
      skills: [
        { name: 'ConnectWise Manage Mastery', description: 'Tickets, time entries, workflows, configurations' },
        { name: 'Autotask Navigation', description: 'Finding your way through Datto\'s PSA' },
        { name: 'HaloPSA', description: 'The newer challenger — modern but different' },
        { name: 'Datto RMM', description: 'Monitoring, patching, scripting, component monitors' },
        { name: 'NinjaOne (NinjaRMM)', description: 'Clean interface, solid patching, good scripting' },
        { name: 'ConnectWise Automate', description: 'Powerful but complex — the steep learning curve' },
        { name: 'N-able / N-central', description: 'Enterprise-grade RMM, automation policies' },
        { name: 'Time Entry Discipline', description: 'Actually logging your time accurately (harder than it sounds)' },
      ],
    },
    {
      name: 'The Documentation Discipline',
      description: 'Writing it down so the next person (or future you) isn\'t lost',
      skills: [
        { name: 'IT Glue', description: 'Passwords, configurations, SOPs, flexible assets' },
        { name: 'Hudu', description: 'The self-hosted alternative, magic dash, integrations' },
        { name: 'Writing Runbooks', description: 'Step-by-step guides that actually help' },
        { name: 'Password Vault Hygiene', description: 'Keeping credentials organized, rotated, secure' },
        { name: 'Network Documentation', description: 'IP schemes, VLAN maps, firewall rules — the truth' },
        { name: 'Capturing Tribal Knowledge', description: 'Getting the "only Steve knows" stuff written down' },
        { name: 'Client-Facing Docs', description: 'Guides end users can actually follow' },
        { name: 'Keeping Docs Current', description: 'The discipline of updating when things change' },
      ],
    },

    // ===== THE ENGINEERING REALITY =====
    {
      name: 'Microsoft 365 — The Real Work',
      description: 'Not just "M365 Admin" — the actual daily grind',
      skills: [
        { name: 'Tenant Migrations', description: 'Moving mailboxes, SharePoint, Teams — the stress and the planning' },
        { name: 'Exchange Online Troubleshooting', description: 'Mail flow, quarantine, NDRs, the message trace' },
        { name: 'Conditional Access Policies', description: 'The art of security without locking everyone out' },
        { name: 'SharePoint Site Architecture', description: 'Permissions, libraries, the "why can\'t I find my file" call' },
        { name: 'Teams Governance', description: 'Team sprawl, guest access, the channel chaos' },
        { name: 'License Optimization', description: 'Right-sizing licenses, saving clients money' },
        { name: 'CIPP (CyberDrain)', description: 'The multi-tenant management lifesaver' },
        { name: 'Graph API & PowerShell', description: 'Automating the things the admin portal can\'t do' },
      ],
    },
    {
      name: 'Security That Actually Works',
      description: 'Protecting clients in the real world, not just checking boxes',
      skills: [
        { name: 'SentinelOne', description: 'Deploying, tuning, investigating threats' },
        { name: 'Huntress', description: 'The second set of eyes, the ThreatOps reports' },
        { name: 'CrowdStrike Falcon', description: 'Enterprise EDR, the Falcon console' },
        { name: 'ThreatLocker', description: 'Application whitelisting, ringfencing, the learning mode' },
        { name: 'DNS Filtering', description: 'Cisco Umbrella, DNSFilter, WebTitan' },
        { name: 'Email Security Layers', description: 'Proofpoint, Mimecast, Avanan — defense in depth' },
        { name: 'The 3am Ransomware Call', description: 'Incident response when it\'s real, not a drill' },
        { name: 'Having Hard Security Conversations', description: 'Telling clients what they don\'t want to hear' },
      ],
    },
    {
      name: 'Backup & Disaster Recovery',
      description: 'The thing nobody thinks about until everything is on fire',
      skills: [
        { name: 'Datto BCDR', description: 'SIRIS, ALTO, cloud retention, screenshot verification' },
        { name: 'Veeam', description: 'Jobs, repositories, SureBackup, restores' },
        { name: 'Axcient x360Recover', description: 'Local virtualization, cloud failover' },
        { name: 'Testing Restores', description: 'Actually proving backups work before the disaster' },
        { name: 'The 3-2-1 Rule Compliance', description: 'Making sure clients really have offsite' },
        { name: 'RTO/RPO Conversations', description: 'Helping clients understand what they\'re paying for' },
        { name: 'M365 Backup', description: 'Because Microsoft doesn\'t back up your data for you' },
        { name: 'Bare Metal Recovery', description: 'When you need to bring back an entire server' },
      ],
    },
    {
      name: 'Networking in the Field',
      description: 'The physical and logical reality of client networks',
      skills: [
        { name: 'UniFi Ecosystems', description: 'UDM, switches, APs — the affordable standard' },
        { name: 'Meraki', description: 'Dashboard management, licensing, the cloud-first approach' },
        { name: 'Fortinet', description: 'FortiGate firewalls, FortiSwitch, FortiAP' },
        { name: 'SonicWall', description: 'Still out there, still needs management' },
        { name: 'Draytek', description: 'The VPN router that\'s everywhere in some markets' },
        { name: 'Troubleshooting Slow WiFi', description: 'Channel overlap, interference, the site survey' },
        { name: 'ISP Liaison', description: 'Dealing with Comcast/AT&T/whoever when it\'s their problem' },
        { name: 'The Network That Grew Wrong', description: 'Untangling years of "temporary" fixes' },
      ],
    },

    // ===== THE AUTOMATION EDGE =====
    {
      name: 'Automation & Scripting',
      description: 'Making computers do the boring stuff so humans don\'t have to',
      skills: [
        { name: 'PowerShell for MSPs', description: 'The scripts that run at 2am and just work' },
        { name: 'Rewst Workflows', description: 'No-code automation that actually scales' },
        { name: 'Halo/Autotask Workflows', description: 'PSA automation, ticket routing, escalation' },
        { name: 'ConnectWise Automate Scripts', description: 'Monitor + Script = automation magic' },
        { name: 'API Integrations', description: 'Making tools talk to each other' },
        { name: 'Scheduled Task Hygiene', description: 'Knowing what\'s running, when, and why' },
        { name: 'User Provisioning Automation', description: 'New hire → fully set up in 10 minutes' },
        { name: 'The Automation Mindset', description: 'Seeing repetitive work and thinking "never again"' },
      ],
    },

    // ===== THE SERVICE DESK BEHIND THE SCENES =====
    {
      name: 'Dispatch & Service Coordination',
      description: 'The air traffic control of an MSP — keeping everything moving',
      skills: [
        { name: 'Triage & Prioritization', description: 'Knowing what\'s actually urgent vs what feels urgent' },
        { name: 'Scheduling Tetris', description: 'Fitting techs, clients, and emergencies together' },
        { name: 'Knowing Your Techs', description: 'Who\'s good with this client, this tech, this situation' },
        { name: 'Managing Client Expectations', description: '"We\'ll be there Tuesday" — and making it happen' },
        { name: 'Escalation Judgment', description: 'When to pull in senior help vs let it ride' },
        { name: 'SLA Clock Watching', description: 'Knowing which tickets are about to breach' },
        { name: 'The Daily Standup', description: 'Getting the team aligned in 15 minutes' },
        { name: 'Capacity Planning', description: 'Are we going to make it through next week?' },
      ],
    },

    // ===== CLIENT RELATIONSHIPS =====
    {
      name: 'The vCIO / Client Strategy Role',
      description: 'Being the trusted advisor, not just the IT vendor',
      skills: [
        { name: 'QBR Storytelling', description: 'Making reports mean something to business owners' },
        { name: 'Technology Roadmapping', description: 'Where should this client be in 3 years?' },
        { name: 'Budget Conversations', description: 'Helping them spend wisely, not just more' },
        { name: 'Risk Translation', description: 'Making security real without causing panic' },
        { name: 'Vendor Recommendations', description: 'Cutting through sales noise for clients' },
        { name: 'The Hard Conversation', description: 'Telling them what they don\'t want to hear' },
        { name: 'Executive Presence', description: 'Being taken seriously in the boardroom' },
        { name: 'Renewal Defense', description: 'When competitors come knocking' },
      ],
    },
    {
      name: 'New Client Onboarding',
      description: 'The critical first 90 days that set the tone for everything',
      skills: [
        { name: 'Network Assessment', description: 'What are we actually inheriting?' },
        { name: 'Documentation Blitz', description: 'Capturing everything before you forget' },
        { name: 'Credential Handoff', description: 'Getting all the passwords, safely' },
        { name: 'Standards Alignment', description: 'Moving them to your stack without breaking things' },
        { name: 'User Communication', description: 'Introducing yourself to confused employees' },
        { name: 'Quick Win Identification', description: 'Fixes that make them glad they switched' },
        { name: 'Expectation Setting', description: 'This is how we work — here\'s what to expect' },
        { name: 'The Previous MSP Problem', description: 'Cleaning up without badmouthing' },
      ],
    },

    // ===== THE BUSINESS SIDE =====
    {
      name: 'Sales (The Real Version)',
      description: 'Not "closing deals" — building relationships that become clients',
      skills: [
        { name: 'Discovery Conversations', description: 'Finding pain points they didn\'t know they had' },
        { name: 'QuoteWerks / Quoting Tools', description: 'Building proposals that make sense' },
        { name: 'Knowing When to Walk Away', description: 'Not every prospect is a good fit' },
        { name: 'The Technical Demo', description: 'Showing value without overwhelming' },
        { name: 'Referral Cultivation', description: 'Making clients want to recommend you' },
        { name: 'Partner Programs', description: 'Microsoft, vendor incentives, co-selling' },
        { name: 'Competitive Positioning', description: 'Why us instead of them?' },
        { name: 'Pipeline Reality', description: 'Honest forecasting, not wishful thinking' },
      ],
    },
    {
      name: 'Finance & Getting Paid',
      description: 'The money side of running an MSP — not glamorous, but critical',
      skills: [
        { name: 'ConnectWise/Autotask Billing', description: 'Agreements, billing rules, the monthly run' },
        { name: 'Chasing Overdue Invoices', description: 'The uncomfortable but necessary calls' },
        { name: 'MRR Calculations', description: 'Understanding recurring revenue health' },
        { name: 'Project Profitability', description: 'Did we actually make money on that project?' },
        { name: 'Vendor Bill Reconciliation', description: 'Microsoft, distributors, making it add up' },
        { name: 'Client Profitability Analysis', description: 'Which clients are we losing money on?' },
        { name: 'Payroll & Time Tracking', description: 'Making sure people get paid right' },
        { name: 'Cash Flow Awareness', description: 'Will we make payroll next month?' },
      ],
    },
    {
      name: 'People & Culture',
      description: 'The hardest part of running an MSP isn\'t the technology',
      skills: [
        { name: 'Hiring Technical People', description: 'Finding good engineers in a competitive market' },
        { name: 'Onboarding New Techs', description: 'Getting them productive without burning them out' },
        { name: 'Preventing Burnout', description: 'Recognizing the signs before it\'s too late' },
        { name: 'Career Path Conversations', description: 'Where do you want to be in 2 years?' },
        { name: 'The Underperformer Conversation', description: 'Addressing problems before they spread' },
        { name: 'Team Morale', description: 'Celebrations, recognition, making work not suck' },
        { name: 'Remote Team Cohesion', description: 'Building culture when everyone\'s distributed' },
        { name: 'Knowledge Transfer', description: 'When someone leaves, making sure the knowledge stays' },
      ],
    },
    {
      name: 'Procurement & Vendors',
      description: 'Getting the stuff clients need, at prices that work',
      skills: [
        { name: 'Ingram / TD SYNNEX / D&H', description: 'Navigating the big distributors' },
        { name: 'Pax8', description: 'Cloud marketplace, SaaS subscriptions' },
        { name: 'Hardware Quoting', description: 'Servers, laptops, networking gear' },
        { name: 'License True-Ups', description: 'Making sure clients aren\'t under or over licensed' },
        { name: 'Vendor Negotiations', description: 'Getting better pricing, terms, support' },
        { name: 'RMA & Warranty Claims', description: 'When hardware fails, getting it replaced' },
        { name: 'Inventory Tracking', description: 'Where is that spare switch we bought?' },
        { name: 'The Vendor Relationship', description: 'Being a good partner, getting priority support' },
      ],
    },
    // ===== THE HUMAN SIDE — HIDDEN TALENTS =====
    {
      name: 'The Emotional Labor',
      description: 'The invisible work that makes everything else possible',
      skills: [
        { name: 'Staying Calm in Crisis', description: 'When everything is on fire, you\'re the steady one' },
        { name: 'Client Empathy', description: 'Understanding their frustration isn\'t about you' },
        { name: 'Patience with Repetition', description: 'Explaining the same thing kindly, for the 50th time' },
        { name: 'Reading the Room', description: 'Sensing tension, politics, unspoken concerns' },
        { name: 'Delivering Bad News', description: 'The server is dead. Here\'s what we do now.' },
        { name: 'Supporting Struggling Colleagues', description: 'Noticing when someone\'s drowning' },
        { name: 'Managing Your Own Stress', description: 'Not bringing the last ticket\'s frustration to the next' },
        { name: 'Celebrating Others', description: 'Recognizing wins, giving credit, building people up' },
      ],
    },
    {
      name: 'Teaching & Knowledge Sharing',
      description: 'Making others better — the multiplier effect',
      skills: [
        { name: 'Explaining Tech to Non-Tech', description: 'Making complex things simple without condescension' },
        { name: 'Creating Training Materials', description: 'Videos, docs, guides that people actually use' },
        { name: 'New Hire Mentoring', description: 'Getting the new person up to speed with patience' },
        { name: 'Lunch & Learn Presentations', description: 'Sharing knowledge with the team' },
        { name: 'Client Training Sessions', description: 'Teaching end users how to help themselves' },
        { name: 'Writing That Gets Read', description: 'Documentation people actually follow' },
        { name: 'Screen Recording Tutorials', description: 'Loom, Snagit, showing how it\'s done' },
        { name: 'Asking Good Questions', description: 'Helping others find the answer themselves' },
      ],
    },
    {
      name: 'Problem Solving & Resourcefulness',
      description: 'When the playbook doesn\'t cover it',
      skills: [
        { name: 'Googling Like a Pro', description: 'Finding the answer when no one\'s seen this before' },
        { name: 'Pattern Recognition', description: 'Connecting dots across unrelated tickets' },
        { name: 'Creative Workarounds', description: 'When the "right" solution isn\'t available' },
        { name: 'Knowing When to Stop', description: 'This is taking too long — time to escalate or rethink' },
        { name: 'Root Cause Persistence', description: 'Not accepting "it works now" as a solution' },
        { name: 'Learning from Failures', description: 'Post-mortems without blame, real improvement' },
        { name: 'MacGyver Fixes', description: 'Making it work with what you have' },
        { name: 'Saying "I Don\'t Know"', description: 'The courage to admit it and find out' },
      ],
    },
    {
      name: 'The Hidden Office Skills',
      description: 'Things nobody lists on a resume but everyone needs',
      skills: [
        { name: 'Excel Wizardry', description: 'The person everyone asks to fix their spreadsheet' },
        { name: 'Calendar Tetris', description: 'Making meetings work across time zones and chaos' },
        { name: 'Email That Gets Responses', description: 'Clear, concise, actionable communication' },
        { name: 'Finding Things', description: 'Knowing where the documentation actually is' },
        { name: 'Remembering Context', description: 'The history of this client, this issue, this project' },
        { name: 'The Connector', description: 'Knowing who to ask for what' },
        { name: 'Meeting Facilitation', description: 'Keeping discussions productive and on track' },
        { name: 'Note Taking That Helps', description: 'Capturing what matters, not transcribing' },
      ],
    },
    {
      name: 'Self-Care & Sustainability',
      description: 'Surviving long-term in a demanding field',
      skills: [
        { name: 'On-Call Survival', description: 'Handling nights/weekends without losing your mind' },
        { name: 'Boundaries', description: 'Knowing when to stop, protecting personal time' },
        { name: 'Continuous Learning', description: 'Staying current without drowning in content' },
        { name: 'Imposter Syndrome Management', description: 'You know more than you think you do' },
        { name: 'Asking for Help', description: 'Before you\'re completely stuck' },
        { name: 'Celebrating Small Wins', description: 'Recognizing progress, not just completion' },
        { name: 'Physical Workspace', description: 'Ergonomics, lighting, a setup that works' },
        { name: 'Managing Energy', description: 'Knowing your productive hours, working with them' },
      ],
    },

    // ===== NICHE BUT REAL =====
    {
      name: 'Compliance & Audits (The Reality)',
      description: 'When the auditor shows up, someone has to handle it',
      skills: [
        { name: 'Evidence Gathering', description: 'Screenshots, logs, proof that we do what we say' },
        { name: 'Policy Writing', description: 'Documents that satisfy auditors and actually get followed' },
        { name: 'The Client Compliance Questionnaire', description: 'Helping clients answer their vendor surveys' },
        { name: 'HIPAA in Practice', description: 'BAAs, PHI, what it actually means day-to-day' },
        { name: 'Cyber Insurance Applications', description: 'Answering those 200 questions accurately' },
        { name: 'SOC 2 Readiness', description: 'Policies, controls, evidence — the journey' },
        { name: 'Security Baseline Enforcement', description: 'Making sure every client meets minimum standards' },
        { name: 'The Compliance Conversation', description: 'Explaining why this matters to resistant clients' },
      ],
    },
    {
      name: 'Marketing & Community',
      description: 'Getting the word out and building presence',
      skills: [
        { name: 'LinkedIn Presence', description: 'Posting, engaging, building professional brand' },
        { name: 'Case Study Writing', description: 'Turning client wins into marketing material' },
        { name: 'Speaking at Events', description: 'Local user groups, conferences, webinars' },
        { name: 'Podcast Guest', description: 'Sharing expertise on industry shows' },
        { name: 'Vendor Co-Marketing', description: 'Joint content with partners' },
        { name: 'Referral Relationship Building', description: 'CPAs, lawyers, the referral network' },
        { name: 'Client Newsletters', description: 'Regular communication that adds value' },
        { name: 'Community Involvement', description: 'Local business groups, chambers, visibility' },
      ],
    },
    {
      name: 'Special Expertise Areas',
      description: 'Deep knowledge in specific verticals or technologies',
      skills: [
        { name: 'Healthcare IT', description: 'EHR systems, HIPAA, medical device networking' },
        { name: 'Legal / Law Firm IT', description: 'Document management, ethical walls, compliance' },
        { name: 'Manufacturing IT', description: 'OT networks, SCADA, air-gapped systems' },
        { name: 'Financial Services IT', description: 'Compliance, encryption, audit trails' },
        { name: 'Nonprofit IT', description: 'Budget constraints, donated licenses, mission focus' },
        { name: 'Mac-Heavy Environments', description: 'Jamf, creative agencies, design firms' },
        { name: 'Multi-Location Retail', description: 'POS, SD-WAN, thin clients' },
        { name: 'Construction & Field Services', description: 'Rugged devices, field connectivity, mobile' },
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

