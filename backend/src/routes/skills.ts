import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// === SKILL CATEGORIES ===

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  parentCategoryId: z.string().uuid().optional(),
  sortOrder: z.number().int().optional(),
});

// GET /skills/categories - List categories for org (+ templates)
router.get('/categories', async (req: AuthRequest, res: Response): Promise<void> => {
  const categories = await prisma.skillCategory.findMany({
    where: {
      OR: [
        { organizationId: req.user!.organizationId },
        { isTemplate: true },
      ],
      isActive: true,
    },
    include: {
      skills: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      childCategories: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  res.json({ categories });
});

// POST /skills/categories - Create category (admin/manager)
router.post('/categories', requireRole('PLATFORM_ADMIN', 'ORG_ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response): Promise<void> => {
  const data = categorySchema.parse(req.body);

  const category = await prisma.skillCategory.create({
    data: {
      ...data,
      organizationId: req.user!.organizationId,
    },
  });

  res.status(201).json({ category });
});

// PATCH /skills/categories/:id
router.patch('/categories/:id', requireRole('PLATFORM_ADMIN', 'ORG_ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response): Promise<void> => {
  const data = categorySchema.partial().parse(req.body);

  const category = await prisma.skillCategory.updateMany({
    where: {
      id: req.params.id,
      organizationId: req.user!.organizationId,
    },
    data,
  });

  if (category.count === 0) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const updated = await prisma.skillCategory.findUnique({ where: { id: req.params.id } });
  res.json({ category: updated });
});

// DELETE /skills/categories/:id (soft delete)
router.delete('/categories/:id', requireRole('PLATFORM_ADMIN', 'ORG_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await prisma.skillCategory.updateMany({
    where: {
      id: req.params.id,
      organizationId: req.user!.organizationId,
    },
    data: { isActive: false },
  });

  if (result.count === 0) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  res.json({ success: true });
});

// === INDIVIDUAL SKILLS ===

const skillSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  tooltip: z.string().optional(),
  levelDescriptions: z.record(z.string()).optional(),
  isCertifiable: z.boolean().optional(),
  certificationNames: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
});

// POST /skills - Create skill
router.post('/', requireRole('PLATFORM_ADMIN', 'ORG_ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response): Promise<void> => {
  const data = skillSchema.parse(req.body);

  // Verify category belongs to org
  const category = await prisma.skillCategory.findFirst({
    where: {
      id: data.categoryId,
      OR: [
        { organizationId: req.user!.organizationId },
        { isTemplate: true },
      ],
    },
  });

  if (!category) {
    res.status(400).json({ error: 'Invalid category' });
    return;
  }

  const skill = await prisma.skill.create({ data });
  res.status(201).json({ skill });
});

// PATCH /skills/:id
router.patch('/:id', requireRole('PLATFORM_ADMIN', 'ORG_ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response): Promise<void> => {
  const data = skillSchema.partial().parse(req.body);

  const skill = await prisma.skill.update({
    where: { id: req.params.id },
    data,
  });

  res.json({ skill });
});

// DELETE /skills/:id (soft delete)
router.delete('/:id', requireRole('PLATFORM_ADMIN', 'ORG_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.skill.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({ success: true });
});

export default router;

