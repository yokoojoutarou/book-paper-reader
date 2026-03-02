// ============================
// App — root component with routing
// ============================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSettingsStore } from './stores/settingsStore';
import SetupPage from './pages/SetupPage';
import ReaderPage from './pages/ReaderPage';

export default function App() {
  const { githubToken, repoOwner, repoName } = useSettingsStore();
  const isConfigured = !!(githubToken && repoOwner && repoName);

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
