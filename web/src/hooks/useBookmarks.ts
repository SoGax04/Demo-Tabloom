import { useState, useEffect, useCallback } from 'react';
import type { ExportData, ExportBookmark } from '../types/bookmark';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UseBookmarksState {
  data: ExportData | null;
  loading: boolean;
  error: string | null;
}

interface UseBookmarksResult extends UseBookmarksState {
  refresh: () => Promise<void>;
  filteredBookmarks: ExportBookmark[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
}

export function useBookmarks(): UseBookmarksResult {
  const [state, setState] = useState<UseBookmarksState>({
    data: null,
    loading: true,
    error: null,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${API_URL}/api/export/json`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data: ExportData = await response.json();
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookmarks';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  // Filter bookmarks based on search, folder, and tags
  const filteredBookmarks = state.data?.bookmarks.filter((bookmark) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = bookmark.title?.toLowerCase().includes(query);
      const matchesUrl = bookmark.url.toLowerCase().includes(query);
      const matchesNote = bookmark.note?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesUrl && !matchesNote) {
        return false;
      }
    }

    // Folder filter
    if (selectedFolderId && bookmark.folderId !== selectedFolderId) {
      return false;
    }

    // Tag filter (AND logic - bookmark must have all selected tags)
    if (selectedTags.length > 0) {
      const hasAllTags = selectedTags.every((tag) => bookmark.tags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }

    return true;
  }) ?? [];

  return {
    ...state,
    refresh: fetchData,
    filteredBookmarks,
    searchQuery,
    setSearchQuery,
    selectedFolderId,
    setSelectedFolderId,
    selectedTags,
    setSelectedTags,
    toggleTag,
  };
}
