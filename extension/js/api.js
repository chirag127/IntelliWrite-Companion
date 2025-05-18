/**
 * IntelliWrite Companion API Client
 * Handles communication with the backend proxy server
 */
class IntelliWriteAPI {
  /**
   * Initialize the API client
   * @param {string} backendUrl - URL of the backend server
   */
  constructor(backendUrl = null) {
    this.backendUrl = backendUrl;
    this.apiKey = null;
  }
  
  /**
   * Set the API key
   * @param {string} apiKey - Gemini API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }
  
  /**
   * Set the backend URL
   * @param {string} backendUrl - URL of the backend server
   */
  setBackendUrl(backendUrl) {
    this.backendUrl = backendUrl;
  }
  
  /**
   * Make a request to the backend
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise<Object>} - Response data
   */
  async request(endpoint, method = 'POST', data = {}) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'apiRequest',
        endpoint,
        method,
        data
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }
  
  /**
   * Paraphrase text
   * @param {string} text - Text to paraphrase
   * @param {string} tone - Desired tone
   * @param {string} creativity - Creativity level
   * @returns {Promise<Object>} - Response with paraphrased text
   */
  async paraphraseText(text, tone = 'Casual', creativity = 'balanced') {
    return this.request('paraphrase', 'POST', { text, tone, creativity });
  }
  
  /**
   * Correct grammar in text
   * @param {string} text - Text to correct
   * @returns {Promise<Object>} - Response with corrected text
   */
  async correctGrammar(text) {
    return this.request('grammar', 'POST', { text });
  }
  
  /**
   * Generate text based on a prompt
   * @param {string} prompt - Text generation prompt
   * @param {string} tone - Desired tone
   * @param {string} length - Desired length
   * @param {string} context - Optional context
   * @returns {Promise<Object>} - Response with generated text
   */
  async generateText(prompt, tone = 'Casual', length = 'medium', context = '') {
    return this.request('generate', 'POST', { prompt, tone, length, context });
  }
  
  /**
   * Translate text
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language
   * @param {string} sourceLanguage - Source language
   * @returns {Promise<Object>} - Response with translated text
   */
  async translateText(text, targetLanguage = 'English', sourceLanguage = 'auto') {
    return this.request('translate', 'POST', { text, targetLanguage, sourceLanguage });
  }
  
  /**
   * Make text more human-like (AI detection resistant)
   * @param {string} text - Text to humanize
   * @param {string} tone - Desired tone
   * @returns {Promise<Object>} - Response with humanized text
   */
  async humanizeText(text, tone = 'Casual') {
    return this.request('humanize', 'POST', { text, tone });
  }
  
  /**
   * Change the tone of text
   * @param {string} text - Text to change tone
   * @param {string} tone - Desired tone
   * @returns {Promise<Object>} - Response with tone-changed text
   */
  async changeTone(text, tone) {
    return this.request('tone', 'POST', { text, tone });
  }
  
  /**
   * Create a streaming request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Function} onChunk - Callback for each chunk
   * @param {Function} onDone - Callback when stream is complete
   * @param {Function} onError - Callback for errors
   */
  async stream(endpoint, data, onChunk, onDone, onError) {
    try {
      // Get settings from storage
      const settings = await new Promise((resolve, reject) => {
        chrome.storage.local.get('settings', (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result.settings || {});
          }
        });
      });
      
      const apiKey = settings.apiKey;
      const backendUrl = settings.backendUrl || this.backendUrl;
      
      if (!apiKey) {
        throw new Error('API key not found. Please set your Gemini API key in the extension settings.');
      }
      
      // Create EventSource for streaming
      const eventSource = new EventSource(`${backendUrl}/api/${endpoint}/stream?apiKey=${encodeURIComponent(apiKey)}`);
      
      // Set up event handlers
      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();
          if (onDone) onDone();
        } else {
          try {
            const parsedData = JSON.parse(event.data);
            if (onChunk) onChunk(parsedData.chunk);
          } catch (error) {
            console.error('Error parsing stream data:', error);
            if (onError) onError(error);
          }
        }
      };
      
      eventSource.onerror = (error) => {
        eventSource.close();
        if (onError) onError(error);
      };
      
      // Send data in a separate POST request
      fetch(`${backendUrl}/api/${endpoint}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(data)
      }).catch((error) => {
        eventSource.close();
        if (onError) onError(error);
      });
    } catch (error) {
      if (onError) onError(error);
    }
  }
  
  /**
   * Stream generated text
   * @param {string} prompt - Text generation prompt
   * @param {string} tone - Desired tone
   * @param {string} length - Desired length
   * @param {string} context - Optional context
   * @param {Function} onChunk - Callback for each chunk
   * @param {Function} onDone - Callback when stream is complete
   * @param {Function} onError - Callback for errors
   */
  streamGenerateText(prompt, tone = 'Casual', length = 'medium', context = '', onChunk, onDone, onError) {
    this.stream('generate', { prompt, tone, length, context }, onChunk, onDone, onError);
  }
  
  /**
   * Stream translated text
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language
   * @param {string} sourceLanguage - Source language
   * @param {Function} onChunk - Callback for each chunk
   * @param {Function} onDone - Callback when stream is complete
   * @param {Function} onError - Callback for errors
   */
  streamTranslateText(text, targetLanguage = 'English', sourceLanguage = 'auto', onChunk, onDone, onError) {
    this.stream('translate', { text, targetLanguage, sourceLanguage }, onChunk, onDone, onError);
  }
}

// Export the API client
window.IntelliWriteAPI = IntelliWriteAPI;
