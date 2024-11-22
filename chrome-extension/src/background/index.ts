import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openChatGPT' && request.content) {
    const chatGPTUrl = 'https://chat.openai.com/';
    chrome.tabs.create({ url: chatGPTUrl }, tab => {
      if (tab.id) {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);

            // Inject the content script
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id },
                files: ['content/index.iife.js'],
              },
              () => {
                if (chrome.runtime.lastError) {
                  console.error('Error injecting content script:', chrome.runtime.lastError.message);
                  sendResponse({ status: 'failure' });
                } else {
                  // Send the message after injecting the content script
                  chrome.tabs.sendMessage(tab.id!, { content: request.content }, response => {
                    if (response?.status === 'success') {
                      console.log('Content inserted successfully');
                      sendResponse({ status: 'success' });
                    } else {
                      console.error('Failed to insert content');
                      sendResponse({ status: 'failure' });
                    }
                  });
                }
              },
            );
          }
        });
      } else {
        console.error('Tab ID is undefined');
        sendResponse({ status: 'failure' });
      }
    });
    return true; // Keep the message channel open for sendResponse
  }
});

// Add the onInstalled listener to show a welcome tab once upon installation
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: 'welcome.html' });
    console.log('Welcome tab opened after installation');
  }
});
