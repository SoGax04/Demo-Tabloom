import { PrismaClient, Folder, Bookmark, Tag } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const EXPORT_DIR = process.env.EXPORT_DIR || '/app/exports';
const EXPORT_FILE = 'bookmarks.json';

interface BookmarkWithTags extends Bookmark {
  tags: Array<{ tag: Tag }>;
}

interface FolderWithBookmarks extends Folder {
  bookmarks: BookmarkWithTags[];
  children: FolderWithBookmarks[];
}

export interface ExportData {
  exportedAt: string;
  version: string;
  folders: ExportFolder[];
  bookmarks: ExportBookmark[];
  tags: ExportTag[];
}

export interface ExportFolder {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  children: ExportFolder[];
  bookmarks: ExportBookmark[];
}

export interface ExportBookmark {
  id: string;
  url: string;
  title: string | null;
  note: string | null;
  folderId: string | null;
  folderName: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExportTag {
  id: string;
  name: string;
  bookmarkCount: number;
}

export async function generateExport(prisma: PrismaClient): Promise<ExportData> {
  // Fetch all active data
  const [folders, bookmarks, tags] = await Promise.all([
    prisma.folder.findMany({
      where: { isDeleted: false },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.bookmark.findMany({
      where: { isDeleted: false },
      include: {
        folder: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.tag.findMany({
      include: { _count: { select: { bookmarks: true } } },
      orderBy: { name: 'asc' },
    }),
  ]);

  // Build folder tree
  const folderMap = new Map<string, ExportFolder>();
  const rootFolders: ExportFolder[] = [];

  // First pass: create folder objects
  for (const folder of folders) {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      sortOrder: folder.sortOrder,
      children: [],
      bookmarks: [],
    });
  }

  // Second pass: build tree and assign bookmarks
  for (const folder of folders) {
    const node = folderMap.get(folder.id)!;
    if (folder.parentId && folderMap.has(folder.parentId)) {
      folderMap.get(folder.parentId)!.children.push(node);
    } else {
      rootFolders.push(node);
    }
  }

  // Format bookmarks and assign to folders
  const exportBookmarks: ExportBookmark[] = bookmarks.map((b) => {
    const exportBookmark: ExportBookmark = {
      id: b.id,
      url: b.url,
      title: b.title,
      note: b.note,
      folderId: b.folderId,
      folderName: b.folder?.name ?? null,
      tags: b.tags.map((t) => t.tag.name),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    };

    // Also add to folder tree
    if (b.folderId && folderMap.has(b.folderId)) {
      folderMap.get(b.folderId)!.bookmarks.push(exportBookmark);
    }

    return exportBookmark;
  });

  // Format tags
  const exportTags: ExportTag[] = tags.map((t) => ({
    id: t.id,
    name: t.name,
    bookmarkCount: t._count.bookmarks,
  }));

  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    folders: rootFolders,
    bookmarks: exportBookmarks,
    tags: exportTags,
  };
}

export async function saveExport(data: ExportData): Promise<string> {
  await fs.mkdir(EXPORT_DIR, { recursive: true });
  const filePath = path.join(EXPORT_DIR, EXPORT_FILE);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}

export async function loadLatestExport(): Promise<ExportData | null> {
  try {
    const filePath = path.join(EXPORT_DIR, EXPORT_FILE);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as ExportData;
  } catch {
    return null;
  }
}

export async function runExportJob(prisma: PrismaClient): Promise<string> {
  const job = await prisma.exportJob.create({
    data: { status: 'running' },
  });

  try {
    const data = await generateExport(prisma);
    await saveExport(data);

    await prisma.exportJob.update({
      where: { id: job.id },
      data: { status: 'success', finishedAt: new Date() },
    });

    return job.id;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await prisma.exportJob.update({
      where: { id: job.id },
      data: { status: 'failure', finishedAt: new Date(), errorMessage },
    });
    throw error;
  }
}
