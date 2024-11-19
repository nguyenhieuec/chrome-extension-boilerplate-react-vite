import { createRoot } from 'react-dom/client';
import App from '@src/App';
import tailwindcssOutput from '../dist/tailwind-output.css?inline';

function injectApp() {
  const targetElement = document.querySelector('shreddit-subreddit-header');
  if (targetElement) {
    const container = document.createElement('div');
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
  }
}

injectApp();
