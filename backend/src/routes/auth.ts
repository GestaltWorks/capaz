import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  organizationSlug: z.string().min(1),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /auth/register
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  const data = registerSchema.parse(req.body);

  // Find organization
  const org = await prisma.organization.findUnique({
    where: { slug: data.organizationSlug },
  });

  if (!org || !org.isActive) {
    res.status(400).json({ error: 'Organization not found or inactive' });
    return;
  }

  // Check if email exists
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    res.status(400).json({ error: 'Email already registered' });
    return;
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      jobTitle: data.jobTitle,
      department: data.department,
      organizationId: org.id,
      role: 'USER',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      organizationId: true,
      organization: { select: { name: true, slug: true } },
    },
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role,
  });

  res.status(201).json({ user, token });
});

// POST /auth/login
router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { organization: { select: { name: true, slug: true } } },
  });

  if (!user || !user.hashedPassword) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (!user.isActive) {
    res.status(401).json({ error: 'Account is disabled' });
    return;
  }

  const valid = await bcrypt.compare(data.password, user.hashedPassword);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role,
  });

  const { hashedPassword, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword, token });
});

// GET /auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      department: true,
      role: true,
      isTrainer: true,
      isProjectLead: true,
      isMentor: true,
      profileImageUrl: true,
      language: true,
      timezone: true,
      organization: { select: { id: true, name: true, slug: true } },
      manager: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user });
});

export default router;

