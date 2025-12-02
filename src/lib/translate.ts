import translate from 'google-translate-api-x';

const translationCache = new Map<string, string>();

export const translateText = async (text: string, targetLanguage: string = 'ru'): Promise<string> => {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // Check cache first
  const cacheKey = `${text}:${targetLanguage}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey) || text;
  }

  try {
    // Detect if text is already in target language or if it's too short
    if (text.length < 3) {
      translationCache.set(cacheKey, text);
      return text;
    }

    const result = await translate(text, { to: targetLanguage });
    const translatedText = result.text || text;
    
    // Cache the translation
    translationCache.set(cacheKey, translatedText);
    
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text if translation fails
    return text;
  }
};

export const translateHtml = async (html: string, targetLanguage: string = 'ru'): Promise<string> => {
  if (!html || html.trim().length === 0) {
    return html;
  }

  try {
    // Extract text content from HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const textContent = temp.textContent || '';

    if (textContent.length < 3) {
      return html;
    }

    const result = await translate(textContent, { to: targetLanguage });
    const translatedText = result.text || textContent;
    
    // Return HTML with translated text
    return `<p>${translatedText}</p>`;
  } catch (error) {
    console.error('HTML translation error:', error);
    return html;
  }
};
