// ============================
// Annotation Store — highlights & text insertions
// ============================
import { create } from 'zustand';

export const useAnnotationStore = create((set, get) => ({
    highlights: [],
    textInsertions: [],
    activeColor: 'yellow', // 'yellow' | 'green' | 'blue' | 'pink' | 'orange'
    mode: 'highlight',     // 'highlight' | 'text' | 'select'

    loadAnnotations(data) {
        set({
            highlights: data.highlights || [],
            textInsertions: data.textInsertions || [],
        });
    },

    addHighlight(highlight) {
        set(state => ({
            highlights: [...state.highlights, {
                ...highlight,
                id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                createdAt: new Date().toISOString(),
            }],
        }));
    },

    removeHighlight(id) {
        set(state => ({
            highlights: state.highlights.filter(h => h.id !== id),
        }));
    },

    addTextInsertion(insertion) {
        set(state => ({
            textInsertions: [...state.textInsertions, {
                ...insertion,
                id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                createdAt: new Date().toISOString(),
            }],
        }));
    },

    removeTextInsertion(id) {
        set(state => ({
            textInsertions: state.textInsertions.filter(t => t.id !== id),
        }));
    },

    updateTextInsertion(id, updates) {
        set(state => ({
            textInsertions: state.textInsertions.map(t =>
                t.id === id ? { ...t, ...updates } : t
            ),
        }));
    },

    setActiveColor(color) {
        set({ activeColor: color });
    },

    setMode(mode) {
        set({ mode });
    },

    toJSON() {
        const { highlights, textInsertions } = get();
        return { version: 1, highlights, textInsertions };
    },

    clear() {
        set({ highlights: [], textInsertions: [] });
    },
}));
