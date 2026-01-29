import type { ExportTag } from '../types/bookmark';

interface TagFilterProps {
  tags: ExportTag[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
}

export function TagFilter({ tags, selectedTags, onToggleTag }: TagFilterProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="tag-filter">
      <h3 className="filter-title">Tags</h3>
      <div className="tag-list">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggleTag(tag.name)}
            className={`tag-button ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
          >
            {tag.name}
            <span className="tag-count">({tag.bookmarkCount})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
