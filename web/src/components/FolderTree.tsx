import { useState } from 'react';
import type { ExportFolder } from '../types/bookmark';

interface FolderTreeProps {
  folders: ExportFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
}

interface FolderItemProps {
  folder: ExportFolder;
  level: number;
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
}

function FolderItem({ folder, level, selectedFolderId, onSelectFolder }: FolderItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;

  return (
    <div className="folder-item">
      <div
        className={`folder-row ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 16}px` }}
      >
        {hasChildren && (
          <button
            type="button"
            className="folder-toggle"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? '[-]' : '[+]'}
          </button>
        )}
        {!hasChildren && <span className="folder-spacer"></span>}
        <button
          type="button"
          className="folder-name"
          onClick={() => onSelectFolder(isSelected ? null : folder.id)}
        >
          {folder.name}
          <span className="folder-count">({folder.bookmarks.length})</span>
        </button>
      </div>
      {hasChildren && expanded && (
        <div className="folder-children">
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({ folders, selectedFolderId, onSelectFolder }: FolderTreeProps) {
  return (
    <div className="folder-tree">
      <h3 className="filter-title">Folders</h3>
      <button
        type="button"
        className={`folder-all ${selectedFolderId === null ? 'selected' : ''}`}
        onClick={() => onSelectFolder(null)}
      >
        All Bookmarks
      </button>
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          level={0}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
        />
      ))}
    </div>
  );
}
