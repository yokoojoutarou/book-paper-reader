// ============================
// Library Store — manages file tree, current document
// ============================
import { create } from 'zustand';
import { listContents, getFileContent, downloadPDF } from '../services/github';

export const useLibraryStore = create((set, get) => ({
    // Tree data
    tree: [],          // Top-level folders under library/
    loading: false,
    error: null,

    // Current selection
    currentBook: null,  // { path, name, metadata }
    currentPdf: null,   // { arrayBuffer, sha }
    currentMemo: null,  // { content, sha }
    currentAnnotations: null, // { data, sha }

    // Save status
    saveStatus: 'idle', // 'idle' | 'saving' | 'saved' | 'error'

    /**
     * Load the library/ folder tree
     */
    async loadTree(owner, repo) {
        set({ loading: true, error: null });
        try {
            // List library/ root — should contain category folders
            const libraryContents = await listContents(owner, repo, 'library');
            const categories = libraryContents.filter(item => item.type === 'dir');

            // For each category, list book folders
            const tree = await Promise.all(
                categories.map(async (category) => {
                    const catContents = await listContents(owner, repo, category.path);
                    const books = catContents.filter(item => item.type === 'dir');
                    return {
                        name: category.name,
                        path: category.path,
                        books: books.map(b => ({ name: b.name, path: b.path })),
                    };
                })
            );

            set({ tree, loading: false });
        } catch (err) {
            console.error('Failed to load library:', err);
            set({ error: err.message, loading: false });
        }
    },

    /**
     * Open a book — load PDF, memo, annotations, metadata
     */
    async openBook(owner, repo, bookPath, bookName) {
        set({
            loading: true,
            error: null,
            currentBook: { path: bookPath, name: bookName },
            currentPdf: null,
            currentMemo: null,
            currentAnnotations: null,
        });

        try {
            // Load PDF
            const pdfData = await downloadPDF(owner, repo, `${bookPath}/document.pdf`);
            set({ currentPdf: { arrayBuffer: pdfData.arrayBuffer, sha: pdfData.sha } });

            // Load memo (may not exist)
            try {
                const memo = await getFileContent(owner, repo, `${bookPath}/memo.md`);
                set({ currentMemo: { content: memo.content, sha: memo.sha } });
            } catch {
                set({ currentMemo: { content: '', sha: null } });
            }

            // Load annotations (may not exist)
            try {
                const ann = await getFileContent(owner, repo, `${bookPath}/annotations.json`);
                set({ currentAnnotations: { data: JSON.parse(ann.content), sha: ann.sha } });
            } catch {
                set({
                    currentAnnotations: {
                        data: { version: 1, highlights: [], textInsertions: [] },
                        sha: null,
                    },
                });
            }

            // Load metadata (optional)
            try {
                const meta = await getFileContent(owner, repo, `${bookPath}/metadata.json`);
                set(state => ({
                    currentBook: { ...state.currentBook, metadata: JSON.parse(meta.content) },
                }));
            } catch {
                // metadata.json is optional
            }

            set({ loading: false });
        } catch (err) {
            console.error('Failed to open book:', err);
            set({ error: err.message, loading: false });
        }
    },

    setSaveStatus(status) {
        set({ saveStatus: status });
    },

    updateMemo(content) {
        set(state => ({
            currentMemo: { ...state.currentMemo, content },
        }));
    },

    updateAnnotations(data) {
        set(state => ({
            currentAnnotations: { ...state.currentAnnotations, data },
        }));
    },

    updateMemoSha(sha) {
        set(state => ({
            currentMemo: { ...state.currentMemo, sha },
        }));
    },

    updateAnnotationsSha(sha) {
        set(state => ({
            currentAnnotations: { ...state.currentAnnotations, sha },
        }));
    },

    updatePdfSha(sha) {
        set(state => ({
            currentPdf: { ...state.currentPdf, sha },
        }));
    },
}));
