// ============================
// FileTree — shows library/ folder hierarchy
// ============================
import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useLibraryStore } from '../../stores/libraryStore';
import styles from './FileTree.module.css';

export default function FileTree() {
    const { repoOwner, repoName } = useSettingsStore();
    const { tree, loading, error, currentBook, loadTree, openBook } = useLibraryStore();
    const [expandedCategories, setExpandedCategories] = useState({});

    useEffect(() => {
        if (repoOwner && repoName) {
            loadTree(repoOwner, repoName);
        }
    }, [repoOwner, repoName]);

    function toggleCategory(catName) {
        setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
    }

    function handleBookClick(book) {
        openBook(repoOwner, repoName, book.path, book.name);
    }

    if (loading && tree.length === 0) {
        return <div className={styles.placeholder}>Loading library...</div>;
    }
    if (error) {
        return <div className={styles.error}>{error}</div>;
    }
    if (tree.length === 0) {
        return (
            <div className={styles.placeholder}>
                <p>No books found.</p>
                <p className={styles.hint}>
                    Create a <code>library/</code> folder in your repository with category subfolders containing PDFs.
                </p>
            </div>
        );
    }

    return (
        <div className={styles.tree}>
            {tree.map(category => (
                <div key={category.path} className={styles.category}>
                    <button
                        className={styles.categoryHeader}
                        onClick={() => toggleCategory(category.name)}
                    >
                        <svg
                            width="12" height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className={`${styles.chevron} ${expandedCategories[category.name] ? styles.expanded : ''}`}
                        >
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                        </svg>
                        <span>{category.name}</span>
                        <span className={styles.count}>{category.books.length}</span>
                    </button>
                    {expandedCategories[category.name] && (
                        <div className={styles.bookList}>
                            {category.books.map(book => (
                                <button
                                    key={book.path}
                                    className={`${styles.bookItem} ${currentBook?.path === book.path ? styles.active : ''}`}
                                    onClick={() => handleBookClick(book)}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    <span className={styles.bookName}>{book.name.replace(/_/g, ' ')}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
