import { createRoot } from 'react-dom/client';
import App from '@src/App';
import tailwindcssOutput from '../dist/tailwind-output.css?inline';

console.log('Content script for Reddit loaded');

function injectApp() {
  console.log('Attempting to inject app...');
  const isThreadPage = /^\/r\/.+\/comments\/.+/.test(window.location.pathname);
  if (!isThreadPage) {
    console.log('Not a Reddit thread page. Aborting injection.');
    return;
  }
  if (document.getElementById('my-extension-root')) {
    console.log('App already injected. Skipping injection.');
    return;
  }
  const checkExist = setInterval(() => {
    const targetElement = document.querySelector('shreddit-subreddit-header');
    if (targetElement && !document.getElementById('my-extension-root')) {
      console.log('Injecting React app...');
      const container = document.createElement('div');
      container.id = 'my-extension-root';
      targetElement.insertAdjacentElement('afterend', container);

      const shadowRoot = container.attachShadow({ mode: 'open' });

      if (navigator.userAgent.includes('Firefox')) {
        const styleElement = document.createElement('style');
        styleElement.innerHTML = tailwindcssOutput;
        shadowRoot.appendChild(styleElement);
      } else {
        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(tailwindcssOutput);
        shadowRoot.adoptedStyleSheets = [styleSheet];
      }

      const appContainer = document.createElement('div');
      shadowRoot.appendChild(appContainer);

      const root = createRoot(appContainer);
      root.render(<App />);
      clearInterval(checkExist);
    }
  }, 100);
}

// Initial injection
injectApp();

// Observe URL changes to handle SPA navigation
function observeUrlChanges() {
  let lastUrl = window.location.href;

  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      console.log('URL changed:', currentUrl);
      lastUrl = currentUrl;
      injectApp(); // Re-inject your app on URL change
    }
  });

  // Observe changes in the document body
  observer.observe(document.body, { childList: true, subtree: true });
}

// Start observing
observeUrlChanges();
