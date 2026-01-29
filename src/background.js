// src/background.js
// Handles context menu and messaging for 'Read from here' extension

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'read-from-here',
    title: 'Read from here',
    contexts: ['all']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'read-from-here' && tab.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (elementXPath) => {
        window.dispatchEvent(new CustomEvent('read-from-here', { detail: { elementXPath } }));
      },
      args: [info.targetElementId || null]
    });
  }
});

// Messaging relay (if needed for future popup/overlay communication)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // ...future message handling...
});
