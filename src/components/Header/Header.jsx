// ============================
// Header — minimal top bar
// ============================
import { useLibraryStore } from '../../stores/libraryStore';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

export default function Header({ onToggleSidebar, sidebarOpen }) {
    const { currentBook, saveStatus } = useLibraryStore();
    const navigate = useNavigate();

    const statusLabels = {
        idle: '',
        saving: 'Saving...',
        saved: 'Saved',
        error: 'Save failed',
    };

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <button
                    className={styles.sidebarToggle}
                    onClick={onToggleSidebar}
                    title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {sidebarOpen ? (
                            <>
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <line x1="9" y1="3" x2="9" y2="21" />
                            </>
                        ) : (
                            <>
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </>
                        )}
                    </svg>
                </button>
                <span className={styles.title}>
                    {currentBook ? currentBook.metadata?.title || currentBook.name : 'Book & Paper Reader'}
                </span>
            </div>
            <div className={styles.right}>
                {saveStatus !== 'idle' && (
                    <span className={`${styles.saveStatus} ${styles[saveStatus]}`}>
                        {statusLabels[saveStatus]}
                    </span>
                )}
                <button
                    className={styles.iconBtn}
                    onClick={() => navigate('/setup')}
                    title="Settings"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
