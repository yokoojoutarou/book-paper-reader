// ============================
// ContextMenu — popup on text selection (highlight colors + translate)
// ============================
import { useState } from 'react';
import { useAnnotationStore } from '../../stores/annotationStore';
import { useSettingsStore } from '../../stores/settingsStore';
import TranslationTooltip from './TranslationTooltip';
import styles from './ContextMenu.module.css';

const COLORS = [
    { name: 'yellow', css: 'var(--highlight-yellow)' },
    { name: 'green', css: 'var(--highlight-green)' },
    { name: 'blue', css: 'var(--highlight-blue)' },
    { name: 'pink', css: 'var(--highlight-pink)' },
    { name: 'orange', css: 'var(--highlight-orange)' },
];

export default function ContextMenu({ selection, onClose }) {
    const { addHighlight } = useAnnotationStore();
    const { deeplApiKey } = useSettingsStore();
    const [showTranslation, setShowTranslation] = useState(false);

    function handleHighlight(color) {
        addHighlight({
            page: selection.page,
            rects: selection.rects,
            color,
            selectedText: selection.text,
        });
        onClose();
    }

    return (
        <div
            className={styles.menu}
            style={{ left: selection.menuX, top: selection.menuY }}
            onMouseDown={e => e.stopPropagation()}
        >
            {/* Highlight color choices */}
            <div className={styles.colorRow}>
                {COLORS.map(c => (
                    <button
                        key={c.name}
                        className={styles.colorBtn}
                        style={{ backgroundColor: c.css }}
                        onClick={() => handleHighlight(c.name)}
                        title={`Highlight ${c.name}`}
                    />
                ))}
            </div>

            {/* Translate button */}
            {deeplApiKey && (
                <button
                    className={styles.translateBtn}
                    onClick={() => setShowTranslation(!showTranslation)}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 8l6 6" />
                        <path d="M4 14l6-6 2-3" />
                        <path d="M2 5h12" />
                        <path d="M7 2h1" />
                        <path d="M22 22l-5-10-5 10" />
                        <path d="M14 18h6" />
                    </svg>
                    Translate
                </button>
            )}

            {/* Translation result */}
            {showTranslation && (
                <TranslationTooltip text={selection.text} />
            )}
        </div>
    );
}
