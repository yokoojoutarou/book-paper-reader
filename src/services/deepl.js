// ============================
// DeepL Translation Service
// ============================

/**
 * Translate text via DeepL API
 */
export async function translateText(text, targetLang, apiKey, apiType = 'free', sourceLang = null) {
    if (!apiKey) throw new Error('DeepL API key not configured.');

    const baseUrl = apiType === 'pro'
        ? 'https://api.deepl.com/v2/translate'
        : 'https://api-free.deepl.com/v2/translate';

    const params = new URLSearchParams();
    params.append('text', text);
    params.append('target_lang', targetLang);
    if (sourceLang && sourceLang !== 'auto') {
        params.append('source_lang', sourceLang);
    }

    const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Authorization': `DeepL-Auth-Key ${apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) {
        if (response.status === 403) throw new Error('DeepL: Invalid API key.');
        if (response.status === 456) throw new Error('DeepL: Character limit exceeded.');
        throw new Error(`DeepL Error (${response.status})`);
    }

    const data = await response.json();
    return {
        translatedText: data.translations[0].text,
        detectedSourceLang: data.translations[0].detected_source_language,
    };
}
