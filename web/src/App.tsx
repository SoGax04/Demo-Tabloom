import { useBookmarks } from './hooks/useBookmarks';
import { SearchBar } from './components/SearchBar';
import { FolderTree } from './components/FolderTree';
import { TagFilter } from './components/TagFilter';
import { BookmarkList } from './components/BookmarkList';
import './App.css';

function App() {
  const {
    data,
    loading,
    error,
    refresh,
    filteredBookmarks,
    searchQuery,
    setSearchQuery,
    selectedFolderId,
    setSelectedFolderId,
    selectedTags,
    toggleTag,
  } = useBookmarks();

  if (loading) {
    return (
      <div className="app loading">
        <p>Loading bookmarks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app error">
        <p>Error: {error}</p>
        <button type="button" onClick={refresh}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app empty">
        <p>No data available.</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tabloom</h1>
        <div className="header-meta">
          <span>Last updated: {new Date(data.exportedAt).toLocaleString()}</span>
          <button type="button" onClick={refresh} className="refresh-button">
            Refresh
          </button>
        </div>
      </header>

      <div className="app-content">
        <aside className="sidebar">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <FolderTree
            folders={data.folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
          />
          <TagFilter
            tags={data.tags}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
          />
        </aside>

        <main className="main-content">
          <div className="results-info">
            <span>{filteredBookmarks.length} bookmarks</span>
            {(searchQuery || selectedFolderId || selectedTags.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFolderId(null);
                  selectedTags.forEach(toggleTag);
                }}
                className="clear-filters"
              >
                Clear filters
              </button>
            )}
          </div>
          <BookmarkList bookmarks={filteredBookmarks} />
        </main>
      </div>
    </div>
  );
}

export default App;
