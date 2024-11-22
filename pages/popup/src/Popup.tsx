// File: pages/popup/src/Popup.tsx

import '@src/Popup.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import type { ComponentPropsWithoutRef } from 'react';

const notificationOptions = {
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icon-34.png'),
  title: 'Injecting Content Script Error',
  message: 'Cannot inject script on this page.',
} as const;

const Popup = () => {
  const logo = 'popup/logo_vertical.svg'; // Removed theme-related logic

  const injectContentScript = async () => {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });

    if (tab.url!.startsWith('about:') || tab.url!.startsWith('chrome:')) {
      chrome.notifications.create('inject-error', notificationOptions);
      return;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ['/content-runtime/index.iife.js'],
      });
      console.log('Content script injected successfully.');
    } catch (err: any) {
      console.error('Error injecting content script:', err.message);
      chrome.notifications.create('inject-error', notificationOptions);
    }
  };

  const handleSummarize = () => {
    // Your summarize logic here
    console.log('Summarize button clicked');
    // Implement the summarization functionality
  };

  return (
    <div className="App bg-gray-800 text-gray-100">
      <header className="App-header text-center p-4">
        <img src={chrome.runtime.getURL(logo)} className="App-logo" alt="logo" />
        <h1>Tidder</h1>
        <p className="description">
          Tidder is a Chrome extension that leverages AI to summarize Reddit threads, helping you quickly grasp the main
          points without scrolling through lengthy discussions.
        </p>
        {/* <button
          onClick={handleSummarize}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2"
        >
          Summarize Thread
        </button>
        <button
          className="mt-4 py-1 px-4 rounded shadow hover:scale-105 bg-blue-700 text-white"
          onClick={injectContentScript}
        >
          Inject Content Script
        </button> */}
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div>Loading...</div>), <div>An error occurred.</div>);
