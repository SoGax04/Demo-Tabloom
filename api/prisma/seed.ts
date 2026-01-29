import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tabloom.local' },
    update: {},
    create: {
      email: 'admin@tabloom.local',
      passwordHash,
      role: 'admin',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create sample folders
  const devFolder = await prisma.folder.upsert({
    where: { id: 'folder-dev' },
    update: {},
    create: {
      id: 'folder-dev',
      name: '開発',
      sortOrder: 0,
    },
  });

  const designFolder = await prisma.folder.upsert({
    where: { id: 'folder-design' },
    update: {},
    create: {
      id: 'folder-design',
      name: 'デザイン',
      sortOrder: 1,
    },
  });

  const jsFolder = await prisma.folder.upsert({
    where: { id: 'folder-js' },
    update: {},
    create: {
      id: 'folder-js',
      name: 'JavaScript',
      parentId: devFolder.id,
      sortOrder: 0,
    },
  });

  console.log('Created folders:', devFolder.name, designFolder.name, jsFolder.name);

  // Create sample tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'TypeScript' },
      update: {},
      create: { name: 'TypeScript' },
    }),
    prisma.tag.upsert({
      where: { name: 'React' },
      update: {},
      create: { name: 'React' },
    }),
    prisma.tag.upsert({
      where: { name: 'Node.js' },
      update: {},
      create: { name: 'Node.js' },
    }),
    prisma.tag.upsert({
      where: { name: 'CSS' },
      update: {},
      create: { name: 'CSS' },
    }),
  ]);
  console.log('Created tags:', tags.map((t) => t.name).join(', '));

  // Create sample bookmarks
  const bookmark1 = await prisma.bookmark.upsert({
    where: { id: 'bookmark-1' },
    update: {},
    create: {
      id: 'bookmark-1',
      url: 'https://www.typescriptlang.org/',
      title: 'TypeScript 公式サイト',
      note: 'TypeScriptの公式ドキュメント',
      folderId: jsFolder.id,
    },
  });

  const bookmark2 = await prisma.bookmark.upsert({
    where: { id: 'bookmark-2' },
    update: {},
    create: {
      id: 'bookmark-2',
      url: 'https://react.dev/',
      title: 'React 公式サイト',
      note: 'React の新しい公式ドキュメント',
      folderId: jsFolder.id,
    },
  });

  const bookmark3 = await prisma.bookmark.upsert({
    where: { id: 'bookmark-3' },
    update: {},
    create: {
      id: 'bookmark-3',
      url: 'https://nodejs.org/',
      title: 'Node.js 公式サイト',
      folderId: devFolder.id,
    },
  });

  // Create bookmark-tag relations
  await prisma.bookmarkTag.upsert({
    where: { bookmarkId_tagId: { bookmarkId: bookmark1.id, tagId: tags[0].id } },
    update: {},
    create: { bookmarkId: bookmark1.id, tagId: tags[0].id },
  });

  await prisma.bookmarkTag.upsert({
    where: { bookmarkId_tagId: { bookmarkId: bookmark2.id, tagId: tags[1].id } },
    update: {},
    create: { bookmarkId: bookmark2.id, tagId: tags[1].id },
  });

  await prisma.bookmarkTag.upsert({
    where: { bookmarkId_tagId: { bookmarkId: bookmark3.id, tagId: tags[2].id } },
    update: {},
    create: { bookmarkId: bookmark3.id, tagId: tags[2].id },
  });

  console.log('Created sample bookmarks');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
