const { GoogleGenAI } = require('@google/genai');

// Default model to use
const DEFAULT_MODEL = process.env.GEMINI_API_MODEL || 'gemini-2.5-flash-preview-04-17';

/**
 * Initialize Gemini client with the provided API key
 * @param {string} apiKey - User's Gemini API key
 * @returns {Object} - Gemini client instance
 */
const initializeGeminiClient = (apiKey) => {
  return new GoogleGenAI({ apiKey });
};

/**
 * Paraphrase text using Gemini API
 * @param {string} apiKey - User's Gemini API key
 * @param {string} text - Text to paraphrase
 * @param {string} tone - Desired tone (Formal, Casual, etc.)
 * @param {string} creativity - Creativity level (balanced, creative, precise)
 * @returns {Promise<string>} - Paraphrased text
 */
const paraphraseText = async (apiKey, text, tone = 'Casual', creativity = 'balanced') => {
  const genAI = initializeGeminiClient(apiKey);
  const model = genAI.models.getGenerativeModel({ model: DEFAULT_MODEL });
  
  // Adjust temperature based on creativity level
  let temperature = 0.7; // balanced by default
  if (creativity === 'creative') {
    temperature = 0.9;
  } else if (creativity === 'precise') {
    temperature = 0.4;
  }
  
  const prompt = `Paraphrase the following text in a ${tone} tone. 
  Maintain the original meaning but use different wording and sentence structure.
  
  Text to paraphrase: "${text}"
  
  Paraphrased text:`;
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      responseMimeType: 'text/plain',
    }
  });
  
  return result.text.trim();
};

/**
 * Correct grammar in text using Gemini API
 * @param {string} apiKey - User's Gemini API key
 * @param {string} text - Text to correct
 * @returns {Promise<string>} - Corrected text
 */
const correctGrammar = async (apiKey, text) => {
  const genAI = initializeGeminiClient(apiKey);
  const model = genAI.models.getGenerativeModel({ model: DEFAULT_MODEL });
  
  const prompt = `Correct any grammar, spelling, or punctuation errors in the following text. 
  Only make corrections where necessary and preserve the original meaning and style.
  
  Text to correct: "${text}"
  
  Corrected text:`;
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2, // Lower temperature for more precise corrections
      responseMimeType: 'text/plain',
    }
  });
  
  return result.text.trim();
};

/**
 * Generate text using Gemini API
 * @param {string} apiKey - User's Gemini API key
 * @param {string} prompt - User's prompt for text generation
 * @param {string} tone - Desired tone (Formal, Casual, etc.)
 * @param {string} length - Desired length (short, medium, long)
 * @param {string} context - Optional context from the webpage
 * @returns {Promise<string>} - Generated text
 */
const generateText = async (apiKey, prompt, tone = 'Casual', length = 'medium', context = '') => {
  const genAI = initializeGeminiClient(apiKey);
  const model = genAI.models.getGenerativeModel({ model: DEFAULT_MODEL });
  
  // Adjust max tokens based on desired length
  let maxTokens;
  switch (length) {
    case 'short':
      maxTokens = 150;
      break;
    case 'medium':
      maxTokens = 300;
      break;
    case 'long':
      maxTokens = 500;
      break;
    default:
      maxTokens = 300;
  }
  
  let fullPrompt = `Generate text in a ${tone} tone based on the following prompt: "${prompt}"`;
  
  // Add context if provided
  if (context) {
    fullPrompt += `\n\nConsider this additional context: "${context}"`;
  }
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxTokens,
      responseMimeType: 'text/plain',
    }
  });
  
  return result.text.trim();
};

/**
 * Stream generated text using Gemini API
 * @param {string} apiKey - User's Gemini API key
 * @param {string} prompt - User's prompt for text generation
 * @param {string} tone - Desired tone (Formal, Casual, etc.)
 * @param {string} length - Desired length (short, medium, long)
 * @param {string} context - Optional context from the webpage
 * @param {Function} chunkCallback - Callback function for each chunk
 * @returns {Promise<void>}
 */
const streamGenerateText = async (apiKey, prompt, tone = 'Casual', length = 'medium', context = '', chunkCallback) => {
  const genAI = initializeGeminiClient(apiKey);
  const model = genAI.models.getGenerativeModel({ model: DEFAULT_MODEL });
  
  // Adjust max tokens based on desired length
  let maxTokens;
  switch (length) {
    case 'short':
      maxTokens = 150;
      break;
    case 'medium':
      maxTokens = 300;
      break;
    case 'long':
      maxTokens = 500;
      break;
    default:
      maxTokens = 300;
  }
  
  let fullPrompt = `Generate text in a ${tone} tone based on the following prompt: "${prompt}"`;
  
  // Add context if provided
  if (context) {
    fullPrompt += `\n\nConsider this additional context: "${context}"`;
  }
  
  const result = await model.generateContentStream({
    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxTokens,
      responseMimeType: 'text/plain',
    }
  });
  
  for await (const chunk of result) {
    if (chunk.text) {
      chunkCallback(chunk.text);
    }
  }
};

/**
 * Translate text using Gemini API
 * @param {string} apiKey - User's Gemini API key
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language
 * @param {string} sourceLanguage - Source language (or 'auto' for auto-detection)
 * @returns {Promise<string>} - Translated text
 */
const translateText = async (apiKey, text, targetLanguage = 'English', sourceLanguage = 'auto') => {
  const genAI = initializeGeminiClient(apiKey);
  const model = genAI.models.getGenerativeModel({ model: DEFAULT_MODEL });
  
  let prompt;
  if (sourceLanguage === 'auto') {
    prompt = `Translate the following text to ${targetLanguage}:
    
    "${text}"
    
    Translation:`;
  } else {
    prompt = `Translate the following ${sourceLanguage} text to ${targetLanguage}:
    
    "${text}"
    
    Translation:`;
  }
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2, // Lower temperature for more accurate translations
      responseMimeType: 'text/plain',
    }
  });
  
  return result.text.trim();
};

/**
 * Stream translated text using Gemini API
 * @param {string} apiKey - User's Gemini API key
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language
 * @param {string} sourceLanguage - Source language (or 'auto' for auto-detection)
 * @param {Function} chunkCallback - Callback function for each chunk
 * @returns {Promise<void>}
 */
const streamTranslateText = async (apiKey, text, targetLanguage = 'English', sourceLanguage = 'auto', chunkCallback) => {
  const genAI = initializeGeminiClient(apiKey);
  const model = genAI.models.getGenerativeModel({ model: DEFAULT_MODEL });
  
  let prompt;
  if (sourceLanguage === 'auto') {
    prompt = `Translate the following text to ${targetLanguage}:
    
    "${text}"
    
    Translation:`;
  } else {
    prompt = `Translate the following ${sourceLanguage} text to ${targetLanguage}:
    
    "${text}"
    
    Translation:`;
  }
  
  const result = await model.generateContentStream({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2, // Lower temperature for more accurate translations
      responseMimeType: 'text/plain',
    }
  });
  
  for await (const chunk of result) {
    if (chunk.text) {
      chunkCallback(chunk.text);
    }
  }
};

/**
 * Make text more human-like (AI detection resistant)
 * @param {string} apiKey - User's Gemini API key
 * @param {string} text - Text to humanize
 * @param {string} tone - Desired tone (Formal, Casual, etc.)
 * @returns {Promise<string>} - Humanized text
 */
const humanizeText = async (apiKey, text, tone = 'Casual') => {
  const genAI = initializeGeminiClient(apiKey);
  const model = genAI.models.getGenerativeModel({ model: DEFAULT_MODEL });
  
  const prompt = `Rewrite the following text to make it sound more human and less likely to be detected as AI-generated. 
  Use a ${tone} tone. Add natural human elements like occasional contractions, varied sentence structures, 
  and slight imperfections where appropriate. Maintain the original meaning.
  
  Text to humanize: "${text}"
  
  Humanized text:`;
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.8, // Higher temperature for more human-like variations
      responseMimeType: 'text/plain',
    }
  });
  
  return result.text.trim();
};

/**
 * Change the tone of text
 * @param {string} apiKey - User's Gemini API key
 * @param {string} text - Text to change tone
 * @param {string} tone - Desired tone (Formal, Casual, Persuasive, Confident, Friendly, Empathetic, Academic)
 * @returns {Promise<string>} - Text with changed tone
 */
const changeTone = async (apiKey, text, tone) => {
  const genAI = initializeGeminiClient(apiKey);
  const model = genAI.models.getGenerativeModel({ model: DEFAULT_MODEL });
  
  const prompt = `Rewrite the following text in a ${tone} tone. 
  Maintain the original meaning but adjust the language, word choice, and sentence structure to match the ${tone} tone.
  
  Original text: "${text}"
  
  ${tone} tone version:`;
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'text/plain',
    }
  });
  
  return result.text.trim();
};

module.exports = {
  paraphraseText,
  correctGrammar,
  generateText,
  streamGenerateText,
  translateText,
  streamTranslateText,
  humanizeText,
  changeTone
};
