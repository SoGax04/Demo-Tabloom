import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { generateExport, loadLatestExport, runExportJob } from '../services/export.js';

const router = Router();

function getPrisma(req: Request): PrismaClient {
  return req.app.locals.prisma as PrismaClient;
}

// GET /api/export/json - Public endpoint
router.get('/json', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { fresh } = req.query;

    let data;

    if (fresh === 'true') {
      // Generate fresh export
      data = await generateExport(prisma);
    } else {
      // Try to load cached export, fall back to fresh
      data = await loadLatestExport();
      if (!data) {
        data = await generateExport(prisma);
      }
    }

    res.json(data);
  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({ error: 'Failed to generate export' });
  }
});

// POST /api/export/trigger - Authenticated
router.post('/trigger', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);

    const jobId = await runExportJob(prisma);

    res.json({ message: 'Export started', jobId });
  } catch (error) {
    console.error('Trigger export error:', error);
    res.status(500).json({ error: 'Failed to trigger export' });
  }
});

// GET /api/export/jobs - Authenticated
router.get('/jobs', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { limit = '10' } = req.query;

    const jobs = await prisma.exportJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: Math.min(50, parseInt(limit as string, 10)),
    });

    res.json({ jobs });
  } catch (error) {
    console.error('Get export jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/export/jobs/:id - Authenticated
router.get('/jobs/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { id } = req.params;

    const job = await prisma.exportJob.findUnique({ where: { id } });

    if (!job) {
      res.status(404).json({ error: 'Export job not found' });
      return;
    }

    res.json(job);
  } catch (error) {
    console.error('Get export job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
