import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { tagCreateSchema, tagUpdateSchema } from '../utils/validation.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma as PrismaClient;
}

// GET /api/tags
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);

    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { bookmarks: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formattedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      bookmarkCount: tag._count.bookmarks,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    }));

    res.json({ tags: formattedTags });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tags/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { id } = req.params;

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        bookmarks: {
          include: {
            bookmark: {
              select: { id: true, url: true, title: true, isDeleted: true },
            },
          },
        },
      },
    });

    if (!tag) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    res.json({
      id: tag.id,
      name: tag.name,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      bookmarks: tag.bookmarks
        .filter((b) => !b.bookmark.isDeleted)
        .map((b) => b.bookmark),
    });
  } catch (error) {
    console.error('Get tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tags
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const parsed = tagCreateSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { name } = parsed.data;

    // Check if tag name already exists
    const existing = await prisma.tag.findUnique({ where: { name } });
    if (existing) {
      res.status(400).json({ error: 'Tag name already exists' });
      return;
    }

    const tag = await prisma.tag.create({ data: { name } });

    res.status(201).json(tag);
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tags/:id
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { id } = req.params;
    const parsed = tagUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    const { name } = parsed.data;

    // Check if new name conflicts
    const nameConflict = await prisma.tag.findFirst({
      where: { name, NOT: { id } },
    });
    if (nameConflict) {
      res.status(400).json({ error: 'Tag name already exists' });
      return;
    }

    const tag = await prisma.tag.update({ where: { id }, data: { name } });

    res.json(tag);
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tags/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { id } = req.params;

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    // Delete tag (BookmarkTag relations will be cascade deleted)
    await prisma.tag.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
