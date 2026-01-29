import { z } from 'zod';

export const urlSchema = z.string().url('Invalid URL format');

export const bookmarkCreateSchema = z.object({
  url: urlSchema,
  title: z.string().optional(),
  note: z.string().optional(),
  folderId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const bookmarkUpdateSchema = z.object({
  url: urlSchema.optional(),
  title: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  folderId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const folderCreateSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export const folderUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export const tagCreateSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
});

export const tagUpdateSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
