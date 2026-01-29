import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { bookmarkCreateSchema, bookmarkUpdateSchema } from '../utils/validation.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma as PrismaClient;
}

// GET /api/bookmarks
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { search, folderId, tagId, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { isDeleted: false };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { url: { contains: search as string, mode: 'insensitive' } },
        { note: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (folderId) {
      where.folderId = folderId as string;
    }

    if (tagId) {
      where.tags = { some: { tagId: tagId as string } };
    }

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where,
        include: {
          folder: { select: { id: true, name: true } },
          tags: { include: { tag: { select: { id: true, name: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.bookmark.count({ where }),
    ]);

    const formattedBookmarks = bookmarks.map((b) => ({
      ...b,
      tags: b.tags.map((t) => t.tag),
    }));

    res.json({
      bookmarks: formattedBookmarks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bookmarks/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { id } = req.params;

    const bookmark = await prisma.bookmark.findUnique({
      where: { id },
      include: {
        folder: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
    });

    if (!bookmark || bookmark.isDeleted) {
      res.status(404).json({ error: 'Bookmark not found' });
      return;
    }

    res.json({
      ...bookmark,
      tags: bookmark.tags.map((t) => t.tag),
    });
  } catch (error) {
    console.error('Get bookmark error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/bookmarks
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const parsed = bookmarkCreateSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { url, title, note, folderId, tagIds } = parsed.data;

    const bookmark = await prisma.bookmark.create({
      data: {
        url,
        title,
        note,
        folderId,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: {
        folder: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
    });

    res.status(201).json({
      ...bookmark,
      tags: bookmark.tags.map((t) => t.tag),
    });
  } catch (error) {
    console.error('Create bookmark error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/bookmarks/:id
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { id } = req.params;
    const parsed = bookmarkUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const existing = await prisma.bookmark.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      res.status(404).json({ error: 'Bookmark not found' });
      return;
    }

    const { url, title, note, folderId, tagIds } = parsed.data;

    // If tagIds provided, update tags
    if (tagIds !== undefined) {
      await prisma.bookmarkTag.deleteMany({ where: { bookmarkId: id } });
      if (tagIds.length > 0) {
        await prisma.bookmarkTag.createMany({
          data: tagIds.map((tagId) => ({ bookmarkId: id, tagId })),
        });
      }
    }

    const bookmark = await prisma.bookmark.update({
      where: { id },
      data: {
        ...(url !== undefined && { url }),
        ...(title !== undefined && { title }),
        ...(note !== undefined && { note }),
        ...(folderId !== undefined && { folderId }),
      },
      include: {
        folder: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
    });

    res.json({
      ...bookmark,
      tags: bookmark.tags.map((t) => t.tag),
    });
  } catch (error) {
    console.error('Update bookmark error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/bookmarks/:id (soft delete)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { id } = req.params;

    const existing = await prisma.bookmark.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      res.status(404).json({ error: 'Bookmark not found' });
      return;
    }

    await prisma.bookmark.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete bookmark error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
