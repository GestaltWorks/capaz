import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
});

// GET /users - List users in organization (managers+ only)
router.get('/', requireRole('PLATFORM_ADMIN', 'ORG_ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '50', search, department } = req.query;

  const where: any = {
    organizationId: req.user!.organizationId,
    isActive: true,
  };

  if (search) {
    where.OR = [
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (department) {
    where.department = department as string;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
});

// GET /users/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findFirst({
    where: {
      id: req.params.id,
      organizationId: req.user!.organizationId,
    },
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
      manager: { select: { id: true, firstName: true, lastName: true } },
      directReports: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user });
});

// PATCH /users/me - Update own profile
router.patch('/me', async (req: AuthRequest, res: Response): Promise<void> => {
  const data = updateProfileSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      department: true,
      language: true,
      timezone: true,
    },
  });

  res.json({ user });
});

// GET /users/departments - List unique departments
router.get('/departments', async (req: AuthRequest, res: Response): Promise<void> => {
  const departments = await prisma.user.findMany({
    where: {
      organizationId: req.user!.organizationId,
      department: { not: null },
    },
    select: { department: true },
    distinct: ['department'],
  });

  res.json({ departments: departments.map(d => d.department).filter(Boolean) });
});

export default router;

