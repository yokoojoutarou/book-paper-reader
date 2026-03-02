// ============================
// MemoEditor — CodeMirror 6 markdown editor with auto-save
// ============================
import { useEffect, useRef, useCallback, useState } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { useSettingsStore } from '../../stores/settingsStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { saveFile } from '../../services/github';
import styles from './MemoEditor.module.css';

// Light theme for CodeMirror
const lightTheme = EditorView.theme({
    '&': {
        fontSize: '13px',
        height: '100%',
        fontFamily: "'Inter', sans-serif",
    },
    '.cm-content': {
        padding: '12px 0',
        fontFamily: "'Inter', sans-serif",
    },
    '.cm-gutters': {
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        color: 'var(--text-muted)',
    },
    '.cm-activeLineGutter': {
        backgroundColor: 'var(--bg-hover)',
    },
    '.cm-activeLine': {
        backgroundColor: 'var(--accent-muted)',
    },
    '&.cm-focused .cm-cursor': {
        borderLeftColor: 'var(--accent)',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'var(--accent-light)',
    },
    '.cm-line': {
        padding: '0 12px',
    },
});

export default function MemoEditor() {
    const editorRef = useRef(null);
    const viewRef = useRef(null);
    const saveTimerRef = useRef(null);
    const [saving, setSaving] = useState(false);

    const { repoOwner, repoName } = useSettingsStore();
    const { currentBook, currentMemo, updateMemo, updateMemoSha, setSaveStatus } = useLibraryStore();

    const handleSave = useCallback(async () => {
        if (!currentBook || !currentMemo) return;
        const content = currentMemo.content;
        setSaving(true);
        setSaveStatus('saving');
        try {
            const result = await saveFile(
                repoOwner, repoName,
                `${currentBook.path}/memo.md`,
                content,
                `Update memo: ${currentBook.name}`,
                currentMemo.sha,
            );
            updateMemoSha(result.content.sha);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            console.error('Failed to save memo:', err);
            setSaveStatus('error');
        }
        setSaving(false);
    }, [currentBook, currentMemo, repoOwner, repoName]);

    // Initialize CodeMirror
    useEffect(() => {
        if (!editorRef.current) return;

        const state = EditorState.create({
            doc: currentMemo?.content || '',
            extensions: [
                lineNumbers(),
                highlightActiveLine(),
                history(),
                keymap.of([...defaultKeymap, ...historyKeymap]),
                markdown(),
                lightTheme,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        const content = update.state.doc.toString();
                        updateMemo(content);

                        // Auto-save after 5 seconds of no input
                        clearTimeout(saveTimerRef.current);
                        saveTimerRef.current = setTimeout(() => {
                            handleSave();
                        }, 5000);
                    }
                }),
                EditorView.lineWrapping,
            ],
        });

        const view = new EditorView({ state, parent: editorRef.current });
        viewRef.current = view;

        return () => {
            clearTimeout(saveTimerRef.current);
            view.destroy();
        };
    }, [currentBook?.path]); // Rebuild when switching books

    if (!currentBook) {
        return (
            <div className={styles.placeholder}>
                Select a book to edit its memo.
            </div>
        );
    }

    return (
        <div className={styles.memoEditor}>
            <div className={styles.toolbar}>
                <span className={styles.filename}>memo.md</span>
                <button
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>
            <div className={styles.editorWrap} ref={editorRef} />
        </div>
    );
}
