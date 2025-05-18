// Initialize API client
const api = new IntelliWriteAPI();

// DOM elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanes = document.querySelectorAll('.tab-pane');
const toolCards = document.querySelectorAll('.tool-card');
const generateButton = document.getElementById('generate-button');
const generatePrompt = document.getElementById('generate-prompt');
const generateTone = document.getElementById('generate-tone');
const generateLength = document.getElementById('generate-length');
const generateResult = document.querySelector('.generate-result');
const resultText = document.getElementById('result-text');
const copyResultButton = document.getElementById('copy-result');
const insertResultButton = document.getElementById('insert-result');
const regenerateButton = document.getElementById('regenerate-button');
const generateLoading = document.getElementById('generate-loading');
const apiKeyInput = document.getElementById('api-key');
const toggleApiKeyButton = document.getElementById('toggle-api-key');
const backendUrlInput = document.getElementById('backend-url');
const defaultToneSelect = document.getElementById('default-tone');
const targetLanguageSelect = document.getElementById('target-language');
const sourceLanguageSelect = document.getElementById('source-language');
const saveSettingsButton = document.getElementById('save-settings');
const settingsStatus = document.getElementById('settings-status');
const historyItems = document.getElementById('history-items');
const noHistory = document.getElementById('no-history');
const clearHistoryButton = document.getElementById('clear-history');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  await loadSettings();
  
  // Load history
  await loadHistory();
  
  // Set up event listeners
  setupEventListeners();
});

// Load settings from storage
async function loadSettings() {
  try {
    const settings = await new Promise((resolve, reject) => {
      chrome.storage.local.get('settings', (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result.settings || {});
        }
      });
    });
    
    // Set input values
    if (settings.apiKey) {
      apiKeyInput.value = settings.apiKey;
    }
    
    if (settings.backendUrl) {
      backendUrlInput.value = settings.backendUrl;
    } else {
      backendUrlInput.value = 'http://localhost:3000';
    }
    
    if (settings.defaultTone) {
      defaultToneSelect.value = settings.defaultTone;
      generateTone.value = settings.defaultTone;
    }
    
    if (settings.preferredTargetLang) {
      targetLanguageSelect.value = settings.preferredTargetLang;
    }
    
    if (settings.preferredSourceLang) {
      sourceLanguageSelect.value = settings.preferredSourceLang;
    }
    
    // Initialize API client
    api.setApiKey(settings.apiKey);
    api.setBackendUrl(settings.backendUrl);
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Load history from storage
async function loadHistory() {
  try {
    const settings = await new Promise((resolve, reject) => {
      chrome.storage.local.get('settings', (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result.settings || {});
        }
      });
    });
    
    const recentActivity = settings.recentActivity || [];
    
    if (recentActivity.length === 0) {
      noHistory.style.display = 'block';
      historyItems.style.display = 'none';
      clearHistoryButton.style.display = 'none';
    } else {
      noHistory.style.display = 'none';
      historyItems.style.display = 'block';
      clearHistoryButton.style.display = 'block';
      
      // Clear previous history items
      historyItems.innerHTML = '';
      
      // Add history items
      recentActivity.forEach((activity) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const date = new Date(activity.timestamp);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        let typeLabel = '';
        switch (activity.type) {
          case 'paraphrase':
            typeLabel = 'Paraphrase';
            break;
          case 'grammar':
            typeLabel = 'Grammar Correction';
            break;
          case 'generate':
            typeLabel = 'Text Generation';
            break;
          case 'translate':
            typeLabel = 'Translation';
            break;
          case 'humanize':
            typeLabel = 'Make Human-like';
            break;
          case 'tone':
            typeLabel = `Tone Change (${activity.tone})`;
            break;
          default:
            typeLabel = activity.type;
        }
        
        historyItem.innerHTML = `
          <div class="history-header">
            <span class="history-type">${typeLabel}</span>
            <span class="history-date">${formattedDate}</span>
          </div>
          <div class="history-content">
            <div class="history-input">${truncateText(activity.input, 100)}</div>
            <div class="history-arrow">→</div>
            <div class="history-output">${truncateText(activity.output, 100)}</div>
          </div>
        `;
        
        historyItems.appendChild(historyItem);
      });
    }
  } catch (error) {
    console.error('Error loading history:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update active tab pane
      tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
  
  // Tool cards
  toolCards.forEach(card => {
    card.addEventListener('click', () => {
      // Get the tool ID
      const toolId = card.id.replace('-tool', '');
      
      // Send message to active tab to show sidebar
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'showSidebar' });
      });
      
      // Close popup
      window.close();
    });
  });
  
  // Generate button
  generateButton.addEventListener('click', async () => {
    const prompt = generatePrompt.value.trim();
    
    if (!prompt) {
      alert('Please enter a prompt');
      return;
    }
    
    try {
      // Show loading
      generateResult.style.display = 'none';
      generateLoading.style.display = 'flex';
      
      // Get settings
      const tone = generateTone.value;
      const length = generateLength.value;
      
      // Generate text
      const response = await api.generateText(prompt, tone, length);
      
      // Show result
      resultText.textContent = response.result;
      generateLoading.style.display = 'none';
      generateResult.style.display = 'block';
      
      // Log activity
      await logActivity({
        type: 'generate',
        input: prompt,
        output: response.result
      });
    } catch (error) {
      console.error('Generate error:', error);
      alert(`Error: ${error.message}`);
      generateLoading.style.display = 'none';
    }
  });
  
  // Copy result button
  copyResultButton.addEventListener('click', () => {
    navigator.clipboard.writeText(resultText.textContent)
      .then(() => {
        // Show success feedback
        copyResultButton.textContent = '✓';
        setTimeout(() => {
          copyResultButton.textContent = '📋';
        }, 1500);
      })
      .catch(error => {
        console.error('Copy error:', error);
        alert('Failed to copy text');
      });
  });
  
  // Insert result button
  insertResultButton.addEventListener('click', () => {
    // Send message to active tab to insert text
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'insertText',
        text: resultText.textContent
      });
    });
    
    // Close popup
    window.close();
  });
  
  // Regenerate button
  regenerateButton.addEventListener('click', async () => {
    const prompt = generatePrompt.value.trim();
    
    if (!prompt) {
      alert('Please enter a prompt');
      return;
    }
    
    try {
      // Show loading
      generateResult.style.display = 'none';
      generateLoading.style.display = 'flex';
      
      // Get settings
      const tone = generateTone.value;
      const length = generateLength.value;
      
      // Generate text
      const response = await api.generateText(prompt, tone, length);
      
      // Show result
      resultText.textContent = response.result;
      generateLoading.style.display = 'none';
      generateResult.style.display = 'block';
      
      // Log activity
      await logActivity({
        type: 'generate',
        input: prompt,
        output: response.result
      });
    } catch (error) {
      console.error('Generate error:', error);
      alert(`Error: ${error.message}`);
      generateLoading.style.display = 'none';
    }
  });
  
  // Toggle API key visibility
  toggleApiKeyButton.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKeyButton.textContent = '🔒';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKeyButton.textContent = '👁️';
    }
  });
  
  // Save settings button
  saveSettingsButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const backendUrl = backendUrlInput.value.trim();
    const defaultTone = defaultToneSelect.value;
    const preferredTargetLang = targetLanguageSelect.value;
    const preferredSourceLang = sourceLanguageSelect.value;
    
    if (!apiKey) {
      settingsStatus.textContent = 'Please enter your Gemini API key';
      settingsStatus.style.color = 'red';
      return;
    }
    
    if (!backendUrl) {
      settingsStatus.textContent = 'Please enter the backend URL';
      settingsStatus.style.color = 'red';
      return;
    }
    
    try {
      // Save settings
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'updateSettings',
          settings: {
            apiKey,
            backendUrl,
            defaultTone,
            preferredTargetLang,
            preferredSourceLang
          }
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
      
      // Update API client
      api.setApiKey(apiKey);
      api.setBackendUrl(backendUrl);
      
      // Show success message
      settingsStatus.textContent = 'Settings saved successfully';
      settingsStatus.style.color = 'green';
      
      // Clear message after 3 seconds
      setTimeout(() => {
        settingsStatus.textContent = '';
      }, 3000);
    } catch (error) {
      console.error('Save settings error:', error);
      settingsStatus.textContent = `Error: ${error.message}`;
      settingsStatus.style.color = 'red';
    }
  });
  
  // Clear history button
  clearHistoryButton.addEventListener('click', async () => {
    try {
      // Get current settings
      const settings = await new Promise((resolve, reject) => {
        chrome.storage.local.get('settings', (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result.settings || {});
          }
        });
      });
      
      // Clear recent activity
      const newSettings = {
        ...settings,
        recentActivity: []
      };
      
      // Save to storage
      await new Promise((resolve, reject) => {
        chrome.storage.local.set({ settings: newSettings }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
      
      // Reload history
      await loadHistory();
    } catch (error) {
      console.error('Clear history error:', error);
      alert(`Error: ${error.message}`);
    }
  });
}

// Log activity
async function logActivity(activity) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ 
      action: 'logActivity',
      activity
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

// Truncate text
function truncateText(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
}
