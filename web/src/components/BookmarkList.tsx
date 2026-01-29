import { useState } from 'react';
import type { ExportBookmark } from '../types/bookmark';

interface BookmarkListProps {
  bookmarks: ExportBookmark[];
}

interface BookmarkItemProps {
  bookmark: ExportBookmark;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

function BookmarkItem({ bookmark, selected, onSelect }: BookmarkItemProps) {
  const displayTitle = bookmark.title || bookmark.url;
  const hostname = new URL(bookmark.url).hostname;

  return (
    <div className={`bookmark-item ${selected ? 'selected' : ''}`}>
      <label className="bookmark-checkbox">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(bookmark.id, e.target.checked)}
        />
      </label>
      <div className="bookmark-content">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bookmark-title"
        >
          {displayTitle}
        </a>
        <div className="bookmark-meta">
          <span className="bookmark-host">{hostname}</span>
          {bookmark.folderName && (
            <span className="bookmark-folder">{bookmark.folderName}</span>
          )}
          {bookmark.tags.length > 0 && (
            <span className="bookmark-tags">
              {bookmark.tags.map((tag) => (
                <span key={tag} className="bookmark-tag">{tag}</span>
              ))}
            </span>
          )}
        </div>
        {bookmark.note && (
          <p className="bookmark-note">{bookmark.note}</p>
        )}
      </div>
    </div>
  );
}

export function BookmarkList({ bookmarks }: BookmarkListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === bookmarks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(bookmarks.map((b) => b.id)));
    }
  };

  const handleOpenSelected = () => {
    const selectedBookmarks = bookmarks.filter((b) => selectedIds.has(b.id));
    for (const bookmark of selectedBookmarks) {
      window.open(bookmark.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (bookmarks.length === 0) {
    return (
      <div className="bookmark-list-empty">
        <p>No bookmarks found.</p>
      </div>
    );
  }

  return (
    <div className="bookmark-list">
      <div className="bookmark-actions">
        <label className="select-all">
          <input
            type="checkbox"
            checked={selectedIds.size === bookmarks.length && bookmarks.length > 0}
            onChange={handleSelectAll}
          />
          Select all ({selectedIds.size}/{bookmarks.length})
        </label>
        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={handleOpenSelected}
            className="open-selected"
          >
            Open {selectedIds.size} in new tabs
          </button>
        )}
      </div>
      <div className="bookmark-items">
        {bookmarks.map((bookmark) => (
          <BookmarkItem
            key={bookmark.id}
            bookmark={bookmark}
            selected={selectedIds.has(bookmark.id)}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
