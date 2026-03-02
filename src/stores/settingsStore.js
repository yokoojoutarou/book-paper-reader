// ============================
// Settings Store — Zustand + localStorage persistence
// ============================
import { create } from 'zustand';

const STORAGE_KEY = 'book-paper-reader-settings';

function loadFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
}

function saveToStorage(state) {
    const toSave = {
        githubToken: state.githubToken,
        repoOwner: state.repoOwner,
        repoName: state.repoName,
        deeplApiKey: state.deeplApiKey,
        deeplApiType: state.deeplApiType,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

const defaults = {
    githubToken: '',
    repoOwner: '',
    repoName: '',
    deeplApiKey: '',
    deeplApiType: 'free', // 'free' | 'pro'
};

const saved = loadFromStorage();

export const useSettingsStore = create((set, get) => ({
    ...defaults,
    ...saved,

    // Derived: are all required fields configured?
    get isConfigured() {
        const s = get();
        return !!(s.githubToken && s.repoOwner && s.repoName);
    },

    updateSettings(partial) {
        set(partial);
        saveToStorage({ ...get(), ...partial });
    },

    clearSettings() {
        set(defaults);
        localStorage.removeItem(STORAGE_KEY);
    },
}));
