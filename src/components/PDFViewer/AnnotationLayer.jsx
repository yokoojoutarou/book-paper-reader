// ============================
// AnnotationLayer — renders highlights and text insertions over a PDF page
// ============================
import { useAnnotationStore } from '../../stores/annotationStore';
import styles from './AnnotationLayer.module.css';

const COLOR_MAP = {
    yellow: 'var(--highlight-yellow)',
    green: 'var(--highlight-green)',
    blue: 'var(--highlight-blue)',
    pink: 'var(--highlight-pink)',
    orange: 'var(--highlight-orange)',
};

export default function AnnotationLayer({ pageNum, scale }) {
    const { highlights, textInsertions } = useAnnotationStore();

    const pageHighlights = highlights.filter(h => h.page === pageNum);
    const pageTexts = textInsertions.filter(t => t.page === pageNum);

    if (pageHighlights.length === 0 && pageTexts.length === 0) return null;

    return (
        <div className={styles.layer}>
            {/* Highlights */}
            {pageHighlights.map(h => (
                h.rects.map((rect, i) => (
                    <div
                        key={`${h.id}-${i}`}
                        className={styles.highlight}
                        style={{
                            left: rect.x * scale,
                            top: rect.y * scale,
                            width: rect.w * scale,
                            height: rect.h * scale,
                            backgroundColor: COLOR_MAP[h.color] || COLOR_MAP.yellow,
                        }}
                        title={h.selectedText}
                    />
                ))
            ))}

            {/* Text Insertions */}
            {pageTexts.map(t => (
                <div
                    key={t.id}
                    className={styles.textInsertion}
                    style={{
                        left: t.x * scale,
                        top: t.y * scale,
                        fontSize: (t.fontSize || 10) * scale,
                        color: t.color || 'var(--error)',
                    }}
                >
                    {t.text}
                </div>
            ))}
        </div>
    );
}
