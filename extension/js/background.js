// Default backend URL
const DEFAULT_BACKEND_URL = 'http://localhost:3000';

// Default settings
const DEFAULT_SETTINGS = {
  apiKey: '',
  backendUrl: DEFAULT_BACKEND_URL,
  defaultTone: 'Casual',
  preferredSourceLang: 'auto',
  preferredTargetLang: 'en',
  featureToggles: {},
  recentActivity: []
};

// Initialize extension settings
chrome.runtime.onInstalled.addListener(async () => {
  console.log('IntelliWrite Companion extension installed');
  
  // Initialize storage with default settings
  const settings = await chrome.storage.local.get('settings');
  if (!settings.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
  
  // Create context menu items
  createContextMenus();
});

// Create context menu items
function createContextMenus() {
  // Remove existing items
  chrome.contextMenus.removeAll(() => {
    // Parent menu item
    chrome.contextMenus.create({
      id: 'intelliwrite',
      title: 'IntelliWrite Companion',
      contexts: ['selection']
    });
    
    // Paraphrase submenu
    chrome.contextMenus.create({
      id: 'paraphrase',
      parentId: 'intelliwrite',
      title: 'Paraphrase',
      contexts: ['selection']
    });
    
    // Grammar correction submenu
    chrome.contextMenus.create({
      id: 'grammar',
      parentId: 'intelliwrite',
      title: 'Perfect Grammar',
      contexts: ['selection']
    });
    
    // Translate submenu
    chrome.contextMenus.create({
      id: 'translate',
      parentId: 'intelliwrite',
      title: 'Translate',
      contexts: ['selection']
    });
    
    // Humanize (AI detection resistant) submenu
    chrome.contextMenus.create({
      id: 'humanize',
      parentId: 'intelliwrite',
      title: 'Make Human-like',
      contexts: ['selection']
    });
    
    // Change tone submenu
    chrome.contextMenus.create({
      id: 'tone',
      parentId: 'intelliwrite',
      title: 'Change Tone',
      contexts: ['selection']
    });
    
    // Tone options
    const tones = ['Formal', 'Casual', 'Persuasive', 'Confident', 'Friendly', 'Empathetic', 'Academic'];
    tones.forEach(tone => {
      chrome.contextMenus.create({
        id: `tone-${tone.toLowerCase()}`,
        parentId: 'tone',
        title: tone,
        contexts: ['selection']
      });
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText;
  
  if (!selectedText) {
    return;
  }
  
  // Get the menu item ID
  const menuItemId = info.menuItemId;
  
  // Send message to content script based on menu item
  if (menuItemId === 'paraphrase') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'paraphrase',
      text: selectedText
    });
  } else if (menuItemId === 'grammar') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'grammar',
      text: selectedText
    });
  } else if (menuItemId === 'translate') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'translate',
      text: selectedText
    });
  } else if (menuItemId === 'humanize') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'humanize',
      text: selectedText
    });
  } else if (menuItemId.startsWith('tone-')) {
    const tone = menuItemId.replace('tone-', '');
    chrome.tabs.sendMessage(tab.id, {
      action: 'tone',
      text: selectedText,
      tone: tone.charAt(0).toUpperCase() + tone.slice(1) // Capitalize first letter
    });
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle API requests
  if (request.action === 'apiRequest') {
    handleApiRequest(request.endpoint, request.method, request.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Required for async sendResponse
  }
  
  // Handle storage requests
  if (request.action === 'getSettings') {
    chrome.storage.local.get('settings', (result) => {
      sendResponse(result.settings || DEFAULT_SETTINGS);
    });
    return true; // Required for async sendResponse
  }
  
  // Handle storage update requests
  if (request.action === 'updateSettings') {
    chrome.storage.local.get('settings', (result) => {
      const currentSettings = result.settings || DEFAULT_SETTINGS;
      const newSettings = { ...currentSettings, ...request.settings };
      
      chrome.storage.local.set({ settings: newSettings }, () => {
        sendResponse({ success: true, settings: newSettings });
      });
    });
    return true; // Required for async sendResponse
  }
  
  // Handle activity logging
  if (request.action === 'logActivity') {
    logActivity(request.activity)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Required for async sendResponse
  }
});

// Handle API requests to the backend
async function handleApiRequest(endpoint, method = 'POST', data = {}) {
  try {
    // Get API key from storage
    const settings = await chrome.storage.local.get('settings');
    const apiKey = settings.settings?.apiKey;
    const backendUrl = settings.settings?.backendUrl || DEFAULT_BACKEND_URL;
    
    if (!apiKey) {
      throw new Error('API key not found. Please set your Gemini API key in the extension settings.');
    }
    
    // Make request to backend
    const response = await fetch(`${backendUrl}/api/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(data)
    });
    
    // Check for errors
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'An error occurred while processing your request.');
    }
    
    // Return response data
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Log user activity
async function logActivity(activity) {
  try {
    const settings = await chrome.storage.local.get('settings');
    const currentSettings = settings.settings || DEFAULT_SETTINGS;
    
    // Add timestamp to activity
    const activityWithTimestamp = {
      ...activity,
      timestamp: new Date().toISOString()
    };
    
    // Add to recent activity (limit to 10 items)
    const recentActivity = [
      activityWithTimestamp,
      ...(currentSettings.recentActivity || [])
    ].slice(0, 10);
    
    // Update settings
    const newSettings = {
      ...currentSettings,
      recentActivity
    };
    
    // Save to storage
    await chrome.storage.local.set({ settings: newSettings });
    
    return true;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
}
