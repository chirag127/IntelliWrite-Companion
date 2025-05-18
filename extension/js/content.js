// Global variables
let selectedText = '';
let selectedElement = null;
let sidebarInjected = false;
let tooltipContainer = null;

// Initialize content script
(function() {
  console.log('IntelliWrite Companion content script loaded');
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    // Handle different actions
    switch (request.action) {
      case 'paraphrase':
        handleParaphrase(request.text);
        break;
      case 'grammar':
        handleGrammarCorrection(request.text);
        break;
      case 'translate':
        handleTranslation(request.text);
        break;
      case 'humanize':
        handleHumanize(request.text);
        break;
      case 'tone':
        handleToneChange(request.text, request.tone);
        break;
      case 'showSidebar':
        injectSidebar();
        break;
      case 'hideSidebar':
        removeSidebar();
        break;
    }
    
    sendResponse({ success: true });
    return true;
  });
  
  // Add event listeners for text selection
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keyup', handleTextSelection);
  
  // Create tooltip container
  createTooltipContainer();
})();

// Handle text selection
function handleTextSelection(event) {
  const selection = window.getSelection();
  
  if (selection.toString().trim().length > 0) {
    selectedText = selection.toString().trim();
    
    // Get the selected element
    const range = selection.getRangeAt(0);
    selectedElement = range.commonAncestorContainer;
    
    // If the selected element is a text node, get its parent
    if (selectedElement.nodeType === Node.TEXT_NODE) {
      selectedElement = selectedElement.parentNode;
    }
  } else {
    selectedText = '';
    selectedElement = null;
  }
}

// Create tooltip container
function createTooltipContainer() {
  tooltipContainer = document.createElement('div');
  tooltipContainer.id = 'intelliwrite-tooltip-container';
  tooltipContainer.style.position = 'absolute';
  tooltipContainer.style.zIndex = '9999';
  tooltipContainer.style.display = 'none';
  document.body.appendChild(tooltipContainer);
}

// Show tooltip with suggestions
function showTooltip(suggestions, position) {
  // Clear previous tooltip content
  tooltipContainer.innerHTML = '';
  
  // Create tooltip content
  const tooltipContent = document.createElement('div');
  tooltipContent.className = 'intelliwrite-tooltip';
  tooltipContent.style.backgroundColor = '#fff';
  tooltipContent.style.border = '1px solid #ccc';
  tooltipContent.style.borderRadius = '4px';
  tooltipContent.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  tooltipContent.style.padding = '10px';
  tooltipContent.style.maxWidth = '300px';
  
  // Add suggestions
  if (Array.isArray(suggestions)) {
    suggestions.forEach((suggestion, index) => {
      const suggestionElement = document.createElement('div');
      suggestionElement.className = 'intelliwrite-suggestion';
      suggestionElement.textContent = suggestion;
      suggestionElement.style.padding = '5px';
      suggestionElement.style.cursor = 'pointer';
      suggestionElement.style.borderBottom = index < suggestions.length - 1 ? '1px solid #eee' : 'none';
      
      // Add hover effect
      suggestionElement.addEventListener('mouseover', () => {
        suggestionElement.style.backgroundColor = '#f5f5f5';
      });
      
      suggestionElement.addEventListener('mouseout', () => {
        suggestionElement.style.backgroundColor = 'transparent';
      });
      
      // Add click handler to apply suggestion
      suggestionElement.addEventListener('click', () => {
        applySuggestion(suggestion);
        hideTooltip();
      });
      
      tooltipContent.appendChild(suggestionElement);
    });
  } else if (typeof suggestions === 'string') {
    const suggestionElement = document.createElement('div');
    suggestionElement.className = 'intelliwrite-suggestion';
    suggestionElement.textContent = suggestions;
    suggestionElement.style.padding = '5px';
    suggestionElement.style.cursor = 'pointer';
    
    // Add hover effect
    suggestionElement.addEventListener('mouseover', () => {
      suggestionElement.style.backgroundColor = '#f5f5f5';
    });
    
    suggestionElement.addEventListener('mouseout', () => {
      suggestionElement.style.backgroundColor = 'transparent';
    });
    
    // Add click handler to apply suggestion
    suggestionElement.addEventListener('click', () => {
      applySuggestion(suggestions);
      hideTooltip();
    });
    
    tooltipContent.appendChild(suggestionElement);
  }
  
  // Add close button
  const closeButton = document.createElement('div');
  closeButton.textContent = '×';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '5px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontSize = '16px';
  closeButton.style.fontWeight = 'bold';
  closeButton.style.color = '#999';
  
  closeButton.addEventListener('click', hideTooltip);
  
  tooltipContent.appendChild(closeButton);
  
  // Add tooltip to container
  tooltipContainer.appendChild(tooltipContent);
  
  // Position tooltip
  tooltipContainer.style.left = `${position.x}px`;
  tooltipContainer.style.top = `${position.y}px`;
  
  // Show tooltip
  tooltipContainer.style.display = 'block';
  
  // Add click outside listener to hide tooltip
  document.addEventListener('click', handleClickOutside);
}

// Hide tooltip
function hideTooltip() {
  tooltipContainer.style.display = 'none';
  document.removeEventListener('click', handleClickOutside);
}

// Handle click outside tooltip
function handleClickOutside(event) {
  if (!tooltipContainer.contains(event.target)) {
    hideTooltip();
  }
}

// Apply suggestion to selected text
function applySuggestion(suggestion) {
  if (!selectedElement) {
    return;
  }
  
  // Check if element is an input or textarea
  if (selectedElement.tagName === 'INPUT' || selectedElement.tagName === 'TEXTAREA') {
    const start = selectedElement.selectionStart;
    const end = selectedElement.selectionEnd;
    
    selectedElement.value = 
      selectedElement.value.substring(0, start) + 
      suggestion + 
      selectedElement.value.substring(end);
    
    // Update cursor position
    selectedElement.selectionStart = start + suggestion.length;
    selectedElement.selectionEnd = start + suggestion.length;
  } 
  // Check if element is contentEditable
  else if (selectedElement.isContentEditable || 
           selectedElement.parentNode.isContentEditable || 
           isInIframe()) {
    
    // Replace text in the current selection
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(suggestion));
    }
  }
}

// Check if we're in an iframe (like Google Docs)
function isInIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

// Inject sidebar
function injectSidebar() {
  if (sidebarInjected) {
    return;
  }
  
  // Create sidebar container
  const sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'intelliwrite-sidebar-container';
  sidebarContainer.style.position = 'fixed';
  sidebarContainer.style.top = '0';
  sidebarContainer.style.right = '0';
  sidebarContainer.style.width = '350px';
  sidebarContainer.style.height = '100%';
  sidebarContainer.style.zIndex = '9999';
  sidebarContainer.style.boxShadow = '-2px 0 10px rgba(0, 0, 0, 0.1)';
  sidebarContainer.style.backgroundColor = '#fff';
  sidebarContainer.style.transition = 'transform 0.3s ease-in-out';
  
  // Create iframe for sidebar content
  const sidebarIframe = document.createElement('iframe');
  sidebarIframe.id = 'intelliwrite-sidebar-iframe';
  sidebarIframe.src = chrome.runtime.getURL('html/sidebar.html');
  sidebarIframe.style.width = '100%';
  sidebarIframe.style.height = '100%';
  sidebarIframe.style.border = 'none';
  
  // Add iframe to container
  sidebarContainer.appendChild(sidebarIframe);
  
  // Add container to body
  document.body.appendChild(sidebarContainer);
  
  sidebarInjected = true;
}

// Remove sidebar
function removeSidebar() {
  const sidebarContainer = document.getElementById('intelliwrite-sidebar-container');
  
  if (sidebarContainer) {
    document.body.removeChild(sidebarContainer);
    sidebarInjected = false;
  }
}

// Handle paraphrase request
async function handleParaphrase(text) {
  try {
    // Get settings
    const settings = await getSettings();
    
    // Show loading in sidebar
    injectSidebar();
    sendMessageToSidebar({
      action: 'showLoading',
      message: 'Paraphrasing text...'
    });
    
    // Make API request
    const response = await chrome.runtime.sendMessage({
      action: 'apiRequest',
      endpoint: 'paraphrase',
      method: 'POST',
      data: {
        text,
        tone: settings.defaultTone
      }
    });
    
    // Log activity
    await logActivity({
      type: 'paraphrase',
      input: text,
      output: response.result
    });
    
    // Show result in sidebar
    sendMessageToSidebar({
      action: 'showParaphraseResult',
      original: text,
      paraphrased: response.result
    });
  } catch (error) {
    console.error('Paraphrase error:', error);
    
    // Show error in sidebar
    sendMessageToSidebar({
      action: 'showError',
      message: error.message || 'An error occurred while paraphrasing text.'
    });
  }
}

// Handle grammar correction request
async function handleGrammarCorrection(text) {
  try {
    // Make API request
    const response = await chrome.runtime.sendMessage({
      action: 'apiRequest',
      endpoint: 'grammar',
      method: 'POST',
      data: { text }
    });
    
    // Log activity
    await logActivity({
      type: 'grammar',
      input: text,
      output: response.result
    });
    
    // Show tooltip with correction
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    const position = {
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 10
    };
    
    showTooltip(response.result, position);
  } catch (error) {
    console.error('Grammar correction error:', error);
    
    // Show error in tooltip
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    const position = {
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 10
    };
    
    showTooltip(error.message || 'An error occurred while correcting grammar.', position);
  }
}

// Handle translation request
async function handleTranslation(text) {
  try {
    // Get settings
    const settings = await getSettings();
    
    // Show loading in sidebar
    injectSidebar();
    sendMessageToSidebar({
      action: 'showLoading',
      message: 'Translating text...'
    });
    
    // Make API request
    const response = await chrome.runtime.sendMessage({
      action: 'apiRequest',
      endpoint: 'translate',
      method: 'POST',
      data: {
        text,
        targetLanguage: getLanguageName(settings.preferredTargetLang),
        sourceLanguage: settings.preferredSourceLang === 'auto' ? 'auto' : getLanguageName(settings.preferredSourceLang)
      }
    });
    
    // Log activity
    await logActivity({
      type: 'translate',
      input: text,
      output: response.result
    });
    
    // Show result in sidebar
    sendMessageToSidebar({
      action: 'showTranslationResult',
      original: text,
      translated: response.result,
      targetLanguage: getLanguageName(settings.preferredTargetLang)
    });
  } catch (error) {
    console.error('Translation error:', error);
    
    // Show error in sidebar
    sendMessageToSidebar({
      action: 'showError',
      message: error.message || 'An error occurred while translating text.'
    });
  }
}

// Handle humanize request
async function handleHumanize(text) {
  try {
    // Get settings
    const settings = await getSettings();
    
    // Show loading in sidebar
    injectSidebar();
    sendMessageToSidebar({
      action: 'showLoading',
      message: 'Making text more human-like...'
    });
    
    // Make API request
    const response = await chrome.runtime.sendMessage({
      action: 'apiRequest',
      endpoint: 'humanize',
      method: 'POST',
      data: {
        text,
        tone: settings.defaultTone
      }
    });
    
    // Log activity
    await logActivity({
      type: 'humanize',
      input: text,
      output: response.result
    });
    
    // Show result in sidebar
    sendMessageToSidebar({
      action: 'showHumanizeResult',
      original: text,
      humanized: response.result
    });
  } catch (error) {
    console.error('Humanize error:', error);
    
    // Show error in sidebar
    sendMessageToSidebar({
      action: 'showError',
      message: error.message || 'An error occurred while making text more human-like.'
    });
  }
}

// Handle tone change request
async function handleToneChange(text, tone) {
  try {
    // Show loading in sidebar
    injectSidebar();
    sendMessageToSidebar({
      action: 'showLoading',
      message: `Changing tone to ${tone}...`
    });
    
    // Make API request
    const response = await chrome.runtime.sendMessage({
      action: 'apiRequest',
      endpoint: 'tone',
      method: 'POST',
      data: {
        text,
        tone
      }
    });
    
    // Log activity
    await logActivity({
      type: 'tone',
      input: text,
      output: response.result,
      tone
    });
    
    // Show result in sidebar
    sendMessageToSidebar({
      action: 'showToneResult',
      original: text,
      changed: response.result,
      tone
    });
  } catch (error) {
    console.error('Tone change error:', error);
    
    // Show error in sidebar
    sendMessageToSidebar({
      action: 'showError',
      message: error.message || 'An error occurred while changing tone.'
    });
  }
}

// Send message to sidebar
function sendMessageToSidebar(message) {
  const sidebarIframe = document.getElementById('intelliwrite-sidebar-iframe');
  
  if (sidebarIframe) {
    sidebarIframe.contentWindow.postMessage({
      source: 'intelliwrite-content',
      ...message
    }, '*');
  }
}

// Get settings from storage
async function getSettings() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
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
      } else {
        resolve(response);
      }
    });
  });
}

// Convert language code to language name
function getLanguageName(code) {
  const languageMap = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi'
  };
  
  return languageMap[code] || code;
}
