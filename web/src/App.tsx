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
        <div className="loading-spinner"></div>
        <p>Loading bookmarks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app error">
        <div className="error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <p>Error: {error}</p>
        <button type="button" onClick={refresh} className="refresh-button">
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
        <div className="header-logo">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-logo">
             <path d="M2 12h5"></path>
             <path d="M17 12h5"></path>
             <path d="M7 12v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-5"></path>
             <path d="M12 2l-5 5v5h10V7L12 2z"></path>
           </svg>
           <h1>Tabloom</h1>
        </div>
        <div className="header-meta">
          <span>Last updated: {new Date(data.exportedAt).toLocaleString()}</span>
          <button type="button" onClick={refresh} className="refresh-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-refresh">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
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
