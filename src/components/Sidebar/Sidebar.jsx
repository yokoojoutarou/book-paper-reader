// ============================
// Sidebar — toggle-able with FileTree / Memo tabs
// ============================
import { useState } from 'react';
import FileTree from './FileTree';
import MemoEditor from './MemoEditor';
import styles from './Sidebar.module.css';

export default function Sidebar({ open }) {
    const [activeTab, setActiveTab] = useState('files');

    if (!open) return null;

    return (
        <aside className={styles.sidebar}>
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'files' ? styles.active : ''}`}
                    onClick={() => setActiveTab('files')}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                    </svg>
                    Files
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'memo' ? styles.active : ''}`}
                    onClick={() => setActiveTab('memo')}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    Memo
                </button>
            </div>
            <div className={styles.content}>
                {activeTab === 'files' ? <FileTree /> : <MemoEditor />}
            </div>
        </aside>
    );
}
