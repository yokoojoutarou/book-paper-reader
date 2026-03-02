// ============================
// App — root component with routing
// ============================
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSettingsStore } from './stores/settingsStore';
import { initOctokit } from './services/github';
import SetupPage from './pages/SetupPage';
import ReaderPage from './pages/ReaderPage';

export default function App() {
  const { githubToken, repoOwner, repoName } = useSettingsStore();
  const isConfigured = !!(githubToken && repoOwner && repoName);

  // Initialize Octokit as early as possible
  useEffect(() => {
    if (githubToken) {
      initOctokit(githubToken);
    }
  }, [githubToken]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={isConfigured ? <ReaderPage /> : <Navigate to="/setup" replace />}
        />
        <Route path="/setup" element={<SetupPage />} />
      </Routes>
    </BrowserRouter>
  );
}

