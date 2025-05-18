// Initialize API client
const api = new IntelliWriteAPI();

// DOM elements
const closeSidebarButton = document.getElementById('close-sidebar');
const loadingContainer = document.getElementById('loading-container');
const loadingMessage = document.getElementById('loading-message');
const errorContainer = document.getElementById('error-container');
const errorMessage = document.getElementById('error-message');
const dismissErrorButton = document.getElementById('dismiss-error');
const paraphraseContainer = document.getElementById('paraphrase-container');
const originalText = document.getElementById('original-text');
const paraphrasedText = document.getElementById('paraphrased-text');
const copyParaphrasedButton = document.getElementById('copy-paraphrased');
const replaceWithParaphrasedButton = document.getElementById('replace-with-paraphrased');
const translationContainer = document.getElementById('translation-container');
const originalTranslationText = document.getElementById('original-translation-text');
const translatedText = document.getElementById('translated-text');
const targetLanguageDisplay = document.getElementById('target-language-display');
const copyTranslatedButton = document.getElementById('copy-translated');
const replaceWithTranslatedButton = document.getElementById('replace-with-translated');
const humanizeContainer = document.getElementById('humanize-container');
const originalHumanizeText = document.getElementById('original-humanize-text');
const humanizedText = document.getElementById('humanized-text');
const copyHumanizedButton = document.getElementById('copy-humanized');
const replaceWithHumanizedButton = document.getElementById('replace-with-humanized');
const toneContainer = document.getElementById('tone-container');
const originalToneText = document.getElementById('original-tone-text');
const toneChangedText = document.getElementById('tone-changed-text');
const toneDisplay = document.getElementById('tone-display');
const copyToneChangedButton = document.getElementById('copy-tone-changed');
const replaceWithToneChangedButton = document.getElementById('replace-with-tone-changed');
const generateContainer = document.getElementById('generate-container');
const sidebarPrompt = document.getElementById('sidebar-prompt');
const sidebarTone = document.getElementById('sidebar-tone');
const sidebarLength = document.getElementById('sidebar-length');
const sidebarGenerateButton = document.getElementById('sidebar-generate-button');
const sidebarResult = document.getElementById('sidebar-result');
const sidebarResultText = document.getElementById('sidebar-result-text');
const sidebarCopyResultButton = document.getElementById('sidebar-copy-result');
const sidebarInsertResultButton = document.getElementById('sidebar-insert-result');
const sidebarRegenerateButton = document.getElementById('sidebar-regenerate');
const showGenerateTabButton = document.getElementById('show-generate-tab');
const showSettingsTabButton = document.getElementById('show-settings-tab');

// Current state
let currentOriginalText = '';
let currentResultText = '';

// Initialize sidebar
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  await loadSettings();
  
  // Set up event listeners
  setupEventListeners();
  
  // Show generate tab by default
  showGenerateTab();
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
    
    // Initialize API client
    api.setApiKey(settings.apiKey);
    api.setBackendUrl(settings.backendUrl);
    
    // Set default tone
    if (settings.defaultTone) {
      sidebarTone.value = settings.defaultTone;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    showError('Failed to load settings. Please check your API key in the extension settings.');
  }
}

// Set up event listeners
function setupEventListeners() {
  // Close sidebar button
  closeSidebarButton.addEventListener('click', () => {
    window.parent.postMessage({ 
      source: 'intelliwrite-sidebar',
      action: 'closeSidebar'
    }, '*');
  });
  
  // Dismiss error button
  dismissErrorButton.addEventListener('click', () => {
    errorContainer.style.display = 'none';
  });
  
  // Copy paraphrased button
  copyParaphrasedButton.addEventListener('click', () => {
    copyToClipboard(paraphrasedText.textContent, copyParaphrasedButton);
  });
  
  // Replace with paraphrased button
  replaceWithParaphrasedButton.addEventListener('click', () => {
    replaceOriginalText(paraphrasedText.textContent);
  });
  
  // Copy translated button
  copyTranslatedButton.addEventListener('click', () => {
    copyToClipboard(translatedText.textContent, copyTranslatedButton);
  });
  
  // Replace with translated button
  replaceWithTranslatedButton.addEventListener('click', () => {
    replaceOriginalText(translatedText.textContent);
  });
  
  // Copy humanized button
  copyHumanizedButton.addEventListener('click', () => {
    copyToClipboard(humanizedText.textContent, copyHumanizedButton);
  });
  
  // Replace with humanized button
  replaceWithHumanizedButton.addEventListener('click', () => {
    replaceOriginalText(humanizedText.textContent);
  });
  
  // Copy tone changed button
  copyToneChangedButton.addEventListener('click', () => {
    copyToClipboard(toneChangedText.textContent, copyToneChangedButton);
  });
  
  // Replace with tone changed button
  replaceWithToneChangedButton.addEventListener('click', () => {
    replaceOriginalText(toneChangedText.textContent);
  });
  
  // Sidebar generate button
  sidebarGenerateButton.addEventListener('click', async () => {
    const prompt = sidebarPrompt.value.trim();
    
    if (!prompt) {
      showError('Please enter a prompt');
      return;
    }
    
    try {
      // Show loading
      showLoading('Generating text...');
      sidebarResult.style.display = 'none';
      
      // Get settings
      const tone = sidebarTone.value;
      const length = sidebarLength.value;
      
      // Generate text
      const response = await api.generateText(prompt, tone, length);
      
      // Show result
      hideLoading();
      sidebarResultText.textContent = response.result;
      sidebarResult.style.display = 'block';
      currentResultText = response.result;
      
      // Log activity
      await logActivity({
        type: 'generate',
        input: prompt,
        output: response.result
      });
    } catch (error) {
      console.error('Generate error:', error);
      showError(error.message || 'An error occurred while generating text.');
    }
  });
  
  // Sidebar copy result button
  sidebarCopyResultButton.addEventListener('click', () => {
    copyToClipboard(sidebarResultText.textContent, sidebarCopyResultButton);
  });
  
  // Sidebar insert result button
  sidebarInsertResultButton.addEventListener('click', () => {
    insertTextIntoPage(sidebarResultText.textContent);
  });
  
  // Sidebar regenerate button
  sidebarRegenerateButton.addEventListener('click', async () => {
    const prompt = sidebarPrompt.value.trim();
    
    if (!prompt) {
      showError('Please enter a prompt');
      return;
    }
    
    try {
      // Show loading
      showLoading('Regenerating text...');
      sidebarResult.style.display = 'none';
      
      // Get settings
      const tone = sidebarTone.value;
      const length = sidebarLength.value;
      
      // Generate text
      const response = await api.generateText(prompt, tone, length);
      
      // Show result
      hideLoading();
      sidebarResultText.textContent = response.result;
      sidebarResult.style.display = 'block';
      currentResultText = response.result;
      
      // Log activity
      await logActivity({
        type: 'generate',
        input: prompt,
        output: response.result
      });
    } catch (error) {
      console.error('Generate error:', error);
      showError(error.message || 'An error occurred while regenerating text.');
    }
  });
  
  // Tab buttons
  showGenerateTabButton.addEventListener('click', showGenerateTab);
  showSettingsTabButton.addEventListener('click', showSettingsTab);
  
  // Listen for messages from content script
  window.addEventListener('message', handleMessage);
}

// Handle messages from content script
function handleMessage(event) {
  // Verify message source
  if (event.data.source !== 'intelliwrite-content') {
    return;
  }
  
  const message = event.data;
  
  switch (message.action) {
    case 'showLoading':
      showLoading(message.message);
      break;
    case 'hideLoading':
      hideLoading();
      break;
    case 'showError':
      showError(message.message);
      break;
    case 'showParaphraseResult':
      showParaphraseResult(message.original, message.paraphrased);
      break;
    case 'showTranslationResult':
      showTranslationResult(message.original, message.translated, message.targetLanguage);
      break;
    case 'showHumanizeResult':
      showHumanizeResult(message.original, message.humanized);
      break;
    case 'showToneResult':
      showToneResult(message.original, message.changed, message.tone);
      break;
  }
}

// Show loading state
function showLoading(message) {
  // Hide all containers
  hideAllContainers();
  
  // Set loading message
  loadingMessage.textContent = message || 'Processing...';
  
  // Show loading container
  loadingContainer.style.display = 'flex';
}

// Hide loading state
function hideLoading() {
  loadingContainer.style.display = 'none';
}

// Show error state
function showError(message) {
  // Hide all containers
  hideAllContainers();
  
  // Set error message
  errorMessage.textContent = message;
  
  // Show error container
  errorContainer.style.display = 'flex';
}

// Show paraphrase result
function showParaphraseResult(original, paraphrased) {
  // Hide all containers
  hideAllContainers();
  
  // Set text
  originalText.textContent = original;
  paraphrasedText.textContent = paraphrased;
  
  // Store current text
  currentOriginalText = original;
  currentResultText = paraphrased;
  
  // Show paraphrase container
  paraphraseContainer.style.display = 'block';
}

// Show translation result
function showTranslationResult(original, translated, targetLanguage) {
  // Hide all containers
  hideAllContainers();
  
  // Set text
  originalTranslationText.textContent = original;
  translatedText.textContent = translated;
  targetLanguageDisplay.textContent = targetLanguage || 'English';
  
  // Store current text
  currentOriginalText = original;
  currentResultText = translated;
  
  // Show translation container
  translationContainer.style.display = 'block';
}

// Show humanize result
function showHumanizeResult(original, humanized) {
  // Hide all containers
  hideAllContainers();
  
  // Set text
  originalHumanizeText.textContent = original;
  humanizedText.textContent = humanized;
  
  // Store current text
  currentOriginalText = original;
  currentResultText = humanized;
  
  // Show humanize container
  humanizeContainer.style.display = 'block';
}

// Show tone result
function showToneResult(original, changed, tone) {
  // Hide all containers
  hideAllContainers();
  
  // Set text
  originalToneText.textContent = original;
  toneChangedText.textContent = changed;
  toneDisplay.textContent = tone || 'Formal';
  
  // Store current text
  currentOriginalText = original;
  currentResultText = changed;
  
  // Show tone container
  toneContainer.style.display = 'block';
}

// Show generate tab
function showGenerateTab() {
  // Hide all containers
  hideAllContainers();
  
  // Update tab buttons
  showGenerateTabButton.classList.add('active');
  showSettingsTabButton.classList.remove('active');
  
  // Show generate container
  generateContainer.style.display = 'block';
}

// Show settings tab
function showSettingsTab() {
  // Hide all containers
  hideAllContainers();
  
  // Update tab buttons
  showGenerateTabButton.classList.remove('active');
  showSettingsTabButton.classList.add('active');
  
  // TODO: Show settings container
  // For now, just show generate container
  generateContainer.style.display = 'block';
}

// Hide all containers
function hideAllContainers() {
  loadingContainer.style.display = 'none';
  errorContainer.style.display = 'none';
  paraphraseContainer.style.display = 'none';
  translationContainer.style.display = 'none';
  humanizeContainer.style.display = 'none';
  toneContainer.style.display = 'none';
  generateContainer.style.display = 'none';
}

// Copy text to clipboard
function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text)
    .then(() => {
      // Show success feedback
      const originalText = button.textContent;
      button.textContent = '✓';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1500);
    })
    .catch(error => {
      console.error('Copy error:', error);
      showError('Failed to copy text to clipboard');
    });
}

// Replace original text
function replaceOriginalText(text) {
  window.parent.postMessage({
    source: 'intelliwrite-sidebar',
    action: 'replaceText',
    text
  }, '*');
  
  // Close sidebar
  window.parent.postMessage({ 
    source: 'intelliwrite-sidebar',
    action: 'closeSidebar'
  }, '*');
}

// Insert text into page
function insertTextIntoPage(text) {
  window.parent.postMessage({
    source: 'intelliwrite-sidebar',
    action: 'insertText',
    text
  }, '*');
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
