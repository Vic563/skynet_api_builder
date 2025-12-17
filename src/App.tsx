import { lazy, Suspense, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useSkynet } from './hooks/useSkynet';
import { Sidebar } from './components/Sidebar';
import { EndpointForm } from './components/EndpointForm';
import { YamlPreview } from './components/YamlPreview';
import './App.css';

// Lazy load WorkflowView for code splitting
const WorkflowView = lazy(() =>
  import('./components/WorkflowView').then((mod) => ({ default: mod.WorkflowView }))
);

const THEME_STORAGE_KEY = 'app-theme';

// Read initial theme synchronously to prevent flash
function getInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

// Memoized loading fallback
const LoadingFallback = memo(function LoadingFallback() {
  return (
    <div className="workspace" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="empty-state-full">
        <h2>Loading workflows...</h2>
      </div>
    </div>
  );
});

// Memoized mode toggle buttons
const ModeToggle = memo(function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: 'endpoints' | 'workflows';
  onModeChange: (mode: 'endpoints' | 'workflows') => void;
}) {
  return (
    <div className="view-toggle">
      <button
        type="button"
        className={`btn btn-secondary ${mode === 'endpoints' ? 'active' : ''}`}
        onClick={() => onModeChange('endpoints')}
      >
        Endpoint Builder
      </button>
      <button
        type="button"
        className={`btn btn-secondary ${mode === 'workflows' ? 'active' : ''}`}
        onClick={() => onModeChange('workflows')}
      >
        Workflows Builder
      </button>
    </div>
  );
});

// Sun icon for light mode
const SunIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// Moon icon for dark mode
const MoonIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// Memoized theme toggle button
const ThemeToggle = memo(function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: 'dark' | 'light';
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="btn btn-secondary theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
      <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  );
});

function App() {
  const [mode, setMode] = useState<'endpoints' | 'workflows'>('endpoints');
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [dragging, setDragging] = useState(false);

  // Initialize theme from localStorage synchronously
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);

  // Apply theme to DOM and persist - only when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Memoize toggle function
  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleModeChange = useCallback((newMode: 'endpoints' | 'workflows') => {
    setMode(newMode);
  }, []);

  const {
    query,
    setQuery,
    selectedId,
    selected,
    grouped,
    form,
    onSubmit,
    yamlText,
    showOptional,
    setShowOptional,
    copyState,
    copyText,
    setSelectedId,
  } = useSkynet();

  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const stopDrag = useCallback(() => setDragging(false), []);

  // Memoize drag handler
  const onDrag = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    setSidebarWidth((current) => {
      const next = current + e.movementX;
      const min = 240;
      const max = 450;
      return Math.min(Math.max(next, min), max);
    });
  }, [dragging]);

  useEffect(() => {
    const handleUp = () => stopDrag();
    const handleMove = (e: MouseEvent) => onDrag(e);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('mousemove', handleMove);
    };
  }, [dragging, stopDrag, onDrag]);

  // Memoize sidebar style
  const sidebarStyle = useMemo(
    () => ({ ['--sidebar-width' as string]: `${sidebarWidth}px` }),
    [sidebarWidth],
  );

  return (
    <div className="app-shell">
      <div className="top-row">
        <ModeToggle mode={mode} onModeChange={handleModeChange} />
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      {mode === 'endpoints' ? (
        <div className="content-row" style={sidebarStyle}>
          <div className="sidebar-shell">
            <div className="sidebar-inner">
              <Sidebar
                query={query}
                setQuery={setQuery}
                grouped={grouped}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
            <div
              className={`sidebar-resizer ${dragging ? 'dragging' : ''}`}
              onMouseDown={startDrag}
              role="presentation"
            />
          </div>

          <main className="main-content">
            {selected ? (
              <div className="workspace">
                <div className="workspace-left">
                  <EndpointForm
                    selected={selected}
                    form={form}
                    onSubmit={onSubmit}
                    showOptional={showOptional}
                    setShowOptional={setShowOptional}
                  />
                </div>
                <div className="workspace-right">
                  <YamlPreview
                    yamlText={yamlText}
                    copyText={copyText}
                    copyState={copyState}
                  />
                </div>
              </div>
            ) : (
              <div className="empty-state-full">
                <h2>Select an endpoint to get started</h2>
                <p>Choose from the sidebar to configure your request.</p>
              </div>
            )}
          </main>
        </div>
      ) : (
        <div className="content-row">
          <main className="main-content">
            <Suspense fallback={<LoadingFallback />}>
              <WorkflowView />
            </Suspense>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
