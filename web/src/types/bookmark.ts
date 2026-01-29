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
