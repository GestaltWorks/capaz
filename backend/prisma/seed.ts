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

  // Create MSP skill categories with skills
  const mspSkillData = [
    {
      name: 'End-User Technical Support',
      description: 'Help desk and desktop support capabilities',
      skills: [
        { name: 'Windows Desktop Support', description: 'Windows 10/11 troubleshooting and configuration' },
        { name: 'macOS Support', description: 'Apple macOS troubleshooting and configuration' },
        { name: 'Printer & Peripheral Support', description: 'Printer, scanner, and peripheral device support' },
        { name: 'Email Client Support', description: 'Outlook, Apple Mail, and email troubleshooting' },
        { name: 'Remote Support Tools', description: 'RMM tools, remote desktop, screen sharing' },
        { name: 'Ticket Management', description: 'PSA ticketing, documentation, time entry' },
        { name: 'Password Resets & Account Mgmt', description: 'AD/Entra password resets, account unlocks' },
        { name: 'VPN & Remote Access', description: 'VPN client setup and troubleshooting' },
      ],
    },
    {
      name: 'Network Infrastructure',
      description: 'Network design, implementation, and management',
      skills: [
        { name: 'Switching & VLANs', description: 'Managed switches, VLAN configuration, trunking' },
        { name: 'Routing & Firewalls', description: 'Router configuration, firewall rules, NAT' },
        { name: 'Wireless Networks', description: 'WiFi design, APs, controllers, troubleshooting' },
        { name: 'DNS & DHCP', description: 'DNS management, DHCP scopes, IP addressing' },
        { name: 'Network Monitoring', description: 'SNMP, NetFlow, network monitoring tools' },
        { name: 'VPN & Site-to-Site', description: 'IPsec, SSL VPN, site-to-site tunnels' },
        { name: 'SD-WAN', description: 'SD-WAN deployment and management' },
        { name: 'Network Documentation', description: 'Network diagrams, IP documentation' },
      ],
    },
    {
      name: 'Security & Compliance',
      description: 'Cybersecurity and compliance frameworks',
      skills: [
        { name: 'Endpoint Protection', description: 'EDR, antivirus, endpoint security platforms' },
        { name: 'Email Security', description: 'Spam filtering, phishing protection, DMARC' },
        { name: 'MFA Implementation', description: 'Multi-factor authentication deployment' },
        { name: 'Security Awareness', description: 'Phishing simulations, user training' },
        { name: 'Vulnerability Management', description: 'Scanning, patching, remediation' },
        { name: 'Backup & DR', description: 'Backup solutions, disaster recovery planning' },
        { name: 'Incident Response', description: 'Security incident handling and response' },
        { name: 'Compliance Frameworks', description: 'HIPAA, PCI-DSS, SOC 2, NIST, CIS' },
      ],
    },
    {
      name: 'Cloud Services',
      description: 'Cloud platforms and services',
      skills: [
        { name: 'Microsoft 365 Admin', description: 'M365 tenant administration, Exchange Online' },
        { name: 'Azure AD / Entra ID', description: 'Identity management, SSO, conditional access' },
        { name: 'Azure Infrastructure', description: 'Azure VMs, networking, storage' },
        { name: 'AWS Fundamentals', description: 'EC2, S3, VPC, IAM basics' },
        { name: 'Google Workspace', description: 'Google Workspace administration' },
        { name: 'Cloud Backup Solutions', description: 'Veeam, Datto, Acronis cloud backup' },
        { name: 'SaaS App Management', description: 'SaaS application provisioning and management' },
        { name: 'Cloud Cost Optimization', description: 'Cloud spend analysis and optimization' },
      ],
    },
    {
      name: 'Server & Virtualization',
      description: 'Server administration and virtualization platforms',
      skills: [
        { name: 'Windows Server', description: 'Windows Server administration, AD, GPO' },
        { name: 'Linux Administration', description: 'Linux server management, CLI, services' },
        { name: 'VMware vSphere', description: 'ESXi, vCenter, VM management' },
        { name: 'Hyper-V', description: 'Hyper-V deployment and management' },
        { name: 'Active Directory', description: 'AD design, GPO, replication, trusts' },
        { name: 'File & Print Services', description: 'File shares, DFS, print servers' },
        { name: 'PowerShell Scripting', description: 'PowerShell automation and scripting' },
        { name: 'Server Monitoring', description: 'Server health monitoring and alerting' },
      ],
    },
  ];

  for (const cat of mspSkillData) {
    const catId = `seed-${cat.name.toLowerCase().replace(/\s+/g, '-')}`;
    await prisma.skillCategory.upsert({
      where: { id: catId },
      update: {},
      create: {
        id: catId,
        name: cat.name,
        description: cat.description,
        isTemplate: true,
        templateType: 'MSP',
      },
    });

    for (const skill of cat.skills) {
      const skillId = `seed-${skill.name.toLowerCase().replace(/\s+/g, '-')}`;
      await prisma.skill.upsert({
        where: { id: skillId },
        update: {},
        create: {
          id: skillId,
          name: skill.name,
          description: skill.description,
          categoryId: catId,
        },
      });
    }
  }

  console.log('✅ Seed completed');
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

