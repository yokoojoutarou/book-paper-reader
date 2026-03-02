// ============================
// TranslationTooltip — shows DeepL translation result
// ============================
import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { translateText } from '../../services/deepl';
import styles from './TranslationTooltip.module.css';

export default function TranslationTooltip({ text }) {
    const { deeplApiKey, deeplApiType } = useSettingsStore();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function doTranslate() {
            setLoading(true);
            setError(null);
            try {
                const data = await translateText(text, 'JA', deeplApiKey, deeplApiType);
                if (!cancelled) {
                    setResult(data);
                    setLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        }

        doTranslate();
        return () => { cancelled = true; };
    }, [text, deeplApiKey, deeplApiType]);

    function handleCopy() {
        if (result) {
            navigator.clipboard.writeText(result.translatedText);
        }
    }

    return (
        <div className={styles.tooltip}>
            {loading && (
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                    <span>Translating...</span>
                </div>
            )}
            {error && <div className={styles.error}>{error}</div>}
            {result && (
                <>
                    <div className={styles.sourceLang}>
                        {result.detectedSourceLang}
                    </div>
                    <div className={styles.translatedText}>
                        {result.translatedText}
                    </div>
                    <button className={styles.copyBtn} onClick={handleCopy}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                        Copy
                    </button>
                </>
            )}
        </div>
    );
}
