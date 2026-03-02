// ============================
// SetupPage — Initial configuration screen
// ============================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { testConnection, testRepoAccess } from '../services/github';

export default function SetupPage() {
    const settings = useSettingsStore();
    const navigate = useNavigate();

    const [token, setToken] = useState(settings.githubToken);
    const [owner, setOwner] = useState(settings.repoOwner);
    const [repo, setRepo] = useState(settings.repoName);
    const [deeplKey, setDeeplKey] = useState(settings.deeplApiKey);
    const [deeplType, setDeeplType] = useState(settings.deeplApiType);
    const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
    const [testing, setTesting] = useState(false);

    async function handleTest() {
        setTesting(true);
        setStatus(null);
        try {
            const user = await testConnection(token);
            await testRepoAccess(token, owner, repo);
            setStatus({ type: 'success', message: `Connected as ${user.login}. Repository "${owner}/${repo}" accessible.` });
        } catch (err) {
            setStatus({ type: 'error', message: err.message || 'Connection failed.' });
        }
        setTesting(false);
    }

    function handleSave() {
        settings.updateSettings({
            githubToken: token,
            repoOwner: owner,
            repoName: repo,
            deeplApiKey: deeplKey,
            deeplApiType: deeplType,
        });
        navigate('/');
    }

    const canSave = token && owner && repo;

    return (
        <div className="setup-page">
            <div className="setup-card">
                <div className="setup-header">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                    </svg>
                    <h1>Book & Paper Reader</h1>
                </div>
                <p className="setup-desc">
                    Connect your GitHub repository to start managing PDFs, annotations, and notes.
                </p>

                <div className="setup-section">
                    <h2>GitHub Settings</h2>
                    <div className="form-group">
                        <label htmlFor="token">Personal Access Token</label>
                        <input
                            id="token"
                            type="password"
                            value={token}
                            onChange={e => setToken(e.target.value)}
                            placeholder="ghp_xxxxxxxxxxxx"
                        />
                        <span className="form-hint">
                            Required scopes: <code>repo</code> (full control of private repositories)
                        </span>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="owner">Repository Owner</label>
                            <input
                                id="owner"
                                value={owner}
                                onChange={e => setOwner(e.target.value)}
                                placeholder="username"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="repo">Repository Name</label>
                            <input
                                id="repo"
                                value={repo}
                                onChange={e => setRepo(e.target.value)}
                                placeholder="my-library"
                            />
                        </div>
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={handleTest}
                        disabled={!canSave || testing}
                    >
                        {testing ? 'Testing...' : 'Test Connection'}
                    </button>
                    {status && (
                        <div className={`status-msg status-${status.type}`}>
                            {status.message}
                        </div>
                    )}
                </div>

                <div className="setup-section">
                    <h2>DeepL Translation (Optional)</h2>
                    <div className="form-group">
                        <label htmlFor="deepl-key">API Key</label>
                        <input
                            id="deepl-key"
                            type="password"
                            value={deeplKey}
                            onChange={e => setDeeplKey(e.target.value)}
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="deepl-type">Plan</label>
                        <select id="deepl-type" value={deeplType} onChange={e => setDeeplType(e.target.value)}>
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                        </select>
                    </div>
                </div>

                <button
                    className="btn btn-primary btn-full"
                    onClick={handleSave}
                    disabled={!canSave}
                >
                    Save & Continue
                </button>
            </div>

            <style>{`
        .setup-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--bg-secondary);
          padding: 24px;
        }
        .setup-card {
          width: 100%;
          max-width: 520px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 40px;
          box-shadow: var(--shadow-lg);
        }
        .setup-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .setup-header h1 {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .setup-desc {
          color: var(--text-secondary);
          font-size: 13px;
          margin-bottom: 28px;
          line-height: 1.6;
        }
        .setup-section {
          margin-bottom: 28px;
        }
        .setup-section h2 {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          margin-bottom: 14px;
        }
        .form-group {
          margin-bottom: 14px;
        }
        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 5px;
        }
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 9px 12px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-size: 13px;
          transition: border-color var(--transition-fast);
        }
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-muted);
        }
        .form-hint {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .form-hint code {
          background: var(--bg-tertiary);
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 11px;
        }
        .form-row {
          display: flex;
          gap: 12px;
        }
        .form-row .form-group { flex: 1; }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 600;
          border-radius: var(--radius);
          transition: all var(--transition-fast);
        }
        .btn-primary {
          background: var(--accent);
          color: var(--text-inverse);
        }
        .btn-primary:hover:not(:disabled) {
          background: var(--accent-hover);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-secondary {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        .btn-secondary:hover:not(:disabled) {
          background: var(--bg-hover);
        }
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-full { width: 100%; }
        .status-msg {
          margin-top: 10px;
          padding: 10px 12px;
          border-radius: var(--radius);
          font-size: 12px;
          line-height: 1.5;
        }
        .status-success {
          background: var(--success-bg);
          color: var(--success);
        }
        .status-error {
          background: var(--error-bg);
          color: var(--error);
        }
      `}</style>
        </div>
    );
}
