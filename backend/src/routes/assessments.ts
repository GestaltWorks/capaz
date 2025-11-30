import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const responseSchema = z.object({
  skillId: z.string(),
  // Capability Vector Dimensions
  level: z.number().int().min(0).max(5),                    // Proficiency
  interestLevel: z.number().int().min(1).max(5).optional(), // Interest (1-5)
  growthDesire: z.number().int().min(1).max(5).optional(),  // Training desire (1-5)
  useFrequency: z.number().int().min(1).max(5).optional(),  // Usage frequency (1-5)
  mentorLevel: z.number().int().min(0).max(3).optional(),   // Mentor capability (0-3)
  leadLevel: z.number().int().min(0).max(3).optional(),     // Lead capability (0-3)
  // Experience
  yearsExperience: z.number().int().min(0).max(50).optional(),
  lastUsed: z.string().datetime().optional(),
  // Training & Certs
  trainingSource: z.string().optional(),
  certifications: z.string().optional(), // JSON array
  // Future intent - 1=Don't consider me, 2=If needed, 3=Happy to, 4=Highly eager
  futureWillingness: z.number().int().min(1).max(4).optional(),
  mobilityForSkill: z.boolean().optional(),
  // Notes
  notes: z.string().optional(),
});

const submitAssessmentSchema = z.object({
  responses: z.array(responseSchema),
  notes: z.string().optional(),
});

// GET /assessments - Get current user's assessments
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const assessments = await prisma.assessment.findMany({
    where: { userId: req.user!.userId },
    include: {
      responses: {
        include: {
          skill: {
            include: { category: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ assessments });
});

// GET /assessments/current - Get user's current assessment
router.get('/current', async (req: AuthRequest, res: Response): Promise<void> => {
  const assessment = await prisma.assessment.findFirst({
    where: {
      userId: req.user!.userId,
      isCurrent: true,
    },
    include: {
      responses: {
        include: {
          skill: {
            include: { category: true },
          },
        },
      },
    },
  });

  res.json({ assessment });
});

// POST /assessments - Create/update assessment
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const data = submitAssessmentSchema.parse(req.body);

  // Mark old assessments as not current
  await prisma.assessment.updateMany({
    where: { userId: req.user!.userId, isCurrent: true },
    data: { isCurrent: false },
  });

  // Get latest version
  const lastAssessment = await prisma.assessment.findFirst({
    where: { userId: req.user!.userId },
    orderBy: { version: 'desc' },
  });

  const assessment = await prisma.assessment.create({
    data: {
      userId: req.user!.userId,
      version: (lastAssessment?.version || 0) + 1,
      notes: data.notes,
      isComplete: true,
      isCurrent: true,
      submittedAt: new Date(),
      responses: {
        create: data.responses.map((r) => ({
          skillId: r.skillId,
          // Core dimensions
          level: r.level,
          interestLevel: r.interestLevel ?? 3,
          growthDesire: r.growthDesire ?? 3,
          useFrequency: r.useFrequency ?? 1,
          mentorLevel: r.mentorLevel ?? 0,
          leadLevel: r.leadLevel ?? 0,
          // Experience
          yearsExperience: r.yearsExperience ?? 0,
          lastUsed: r.lastUsed ? new Date(r.lastUsed) : null,
          // Training & certs
          trainingSource: r.trainingSource,
          // certifications comes as a JSON string from frontend, parse for JSON db field
          certifications: r.certifications ? (typeof r.certifications === 'string' ? JSON.parse(r.certifications) : r.certifications) : [],
          // Intent - 1=Don't consider me, 2=If needed, 3=Happy to, 4=Highly eager
          futureWillingness: r.futureWillingness ?? 3,
          mobilityForSkill: r.mobilityForSkill ?? false,
          notes: r.notes,
        })),
      },
    },
    include: { responses: true },
  });

  res.status(201).json({ assessment });
});

// GET /assessments/team - Manager view of team assessments
router.get('/team', requireRole('PLATFORM_ADMIN', 'ORG_ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response): Promise<void> => {
  // Get users in org with their current assessments
  const users = await prisma.user.findMany({
    where: {
      organizationId: req.user!.organizationId,
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      department: true,
      assessments: {
        where: { isCurrent: true },
        include: {
          responses: {
            include: { skill: true },
          },
        },
      },
    },
  });

  res.json({ users });
});

// GET /assessments/user/:userId - View specific user's assessment (manager+)
router.get('/user/:userId', requireRole('PLATFORM_ADMIN', 'ORG_ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response): Promise<void> => {
  const assessment = await prisma.assessment.findFirst({
    where: {
      userId: req.params.userId,
      user: { organizationId: req.user!.organizationId },
      isCurrent: true,
    },
    include: {
      user: { select: { firstName: true, lastName: true, jobTitle: true } },
      responses: {
        include: { skill: { include: { category: true } } },
      },
    },
  });

  if (!assessment) {
    res.status(404).json({ error: 'Assessment not found' });
    return;
  }

  res.json({ assessment });
});

export default router;

