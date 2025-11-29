import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const responseSchema = z.object({
  skillId: z.string().uuid(),
  level: z.number().int().min(0).max(5),
  hasCertification: z.boolean().optional(),
  certificationName: z.string().optional(),
  certificationExpiry: z.string().datetime().optional(),
  wantsTraining: z.boolean().optional(),
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
          level: r.level,
          hasCertification: r.hasCertification || false,
          certificationName: r.certificationName,
          certificationExpiry: r.certificationExpiry ? new Date(r.certificationExpiry) : null,
          wantsTraining: r.wantsTraining || false,
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

