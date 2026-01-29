// src/background.js
// Handles context menu and messaging for 'Read from here' extension



// On install, create all menu items up front (Manifest V3 compatible)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'read-selection',
    title: 'Read selection',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'read-from-selection',
    title: 'Read page from here',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'read-page',
    title: 'Read page',
    contexts: ['page']
  });
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab.id) return;
  let mode = 'page';
  if (info.menuItemId === 'read-selection') mode = 'selection';
  if (info.menuItemId === 'read-from-selection') mode = 'from-here';
  chrome.tabs.sendMessage(tab.id, {
    type: 'READ_FROM_HERE',
    mode,
    clientX: info?.pageX,
    clientY: info?.pageY
  });
});

// Messaging relay (if needed for future popup/overlay communication)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // ...future message handling...
});
