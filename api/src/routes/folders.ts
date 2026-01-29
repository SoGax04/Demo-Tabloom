import { Router, Response } from 'express';
import { PrismaClient, Folder } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { folderCreateSchema, folderUpdateSchema } from '../utils/validation.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma as PrismaClient;
}

interface FolderWithChildren extends Folder {
  children: FolderWithChildren[];
}

function buildFolderTree(folders: Folder[]): FolderWithChildren[] {
  const folderMap = new Map<string, FolderWithChildren>();
  const roots: FolderWithChildren[] = [];

  // First pass: create all nodes
  for (const folder of folders) {
    folderMap.set(folder.id, { ...folder, children: [] });
  }

  // Second pass: build tree
  for (const folder of folders) {
    const node = folderMap.get(folder.id)!;
    if (folder.parentId && folderMap.has(folder.parentId)) {
      folderMap.get(folder.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort by sortOrder
  const sortFolders = (list: FolderWithChildren[]) => {
    list.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const folder of list) {
      sortFolders(folder.children);
    }
  };
  sortFolders(roots);

  return roots;
}

// GET /api/folders
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { flat } = req.query;

    const folders = await prisma.folder.findMany({
      where: { isDeleted: false },
      orderBy: { sortOrder: 'asc' },
    });

    if (flat === 'true') {
      res.json({ folders });
    } else {
      res.json({ folders: buildFolderTree(folders) });
    }
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/folders/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { id } = req.params;

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          where: { isDeleted: false },
          select: { id: true, name: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
        bookmarks: {
          where: { isDeleted: false },
          select: { id: true, url: true, title: true },
        },
      },
    });

    if (!folder || folder.isDeleted) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    res.json(folder);
  } catch (error) {
    console.error('Get folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/folders
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const parsed = folderCreateSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { name, parentId, sortOrder } = parsed.data;

    // Verify parent exists if specified
    if (parentId) {
      const parent = await prisma.folder.findUnique({ where: { id: parentId } });
      if (!parent || parent.isDeleted) {
        res.status(400).json({ error: 'Parent folder not found' });
        return;
      }
    }

    const folder = await prisma.folder.create({
      data: { name, parentId, sortOrder: sortOrder ?? 0 },
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/folders/:id
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { id } = req.params;
    const parsed = folderUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const existing = await prisma.folder.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    const { name, parentId, sortOrder } = parsed.data;

    // Prevent circular reference
    if (parentId === id) {
      res.status(400).json({ error: 'Folder cannot be its own parent' });
      return;
    }

    // Verify new parent exists if specified
    if (parentId) {
      const parent = await prisma.folder.findUnique({ where: { id: parentId } });
      if (!parent || parent.isDeleted) {
        res.status(400).json({ error: 'Parent folder not found' });
        return;
      }
    }

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(parentId !== undefined && { parentId }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    res.json(folder);
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/folders/:id (soft delete)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { id } = req.params;

    const existing = await prisma.folder.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    // Soft delete folder and all its bookmarks
    await prisma.$transaction([
      prisma.folder.update({ where: { id }, data: { isDeleted: true } }),
      prisma.bookmark.updateMany({ where: { folderId: id }, data: { isDeleted: true } }),
    ]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
