import { createRoot } from 'react-dom/client';
import App from '@src/App';
import tailwindcssOutput from '../dist/tailwind-output.css?inline';

const rootElementId = 'reddit-summary-extension-root';

if (!document.getElementById(rootElementId)) {
  const rootElement = document.createElement('div');
  rootElement.id = rootElementId;
  rootElement.style.position = 'fixed';
  rootElement.style.bottom = '20px';
  rootElement.style.right = '20px';
  rootElement.style.zIndex = '9999';

  document.body.appendChild(rootElement);

  const shadowRoot = rootElement.attachShadow({ mode: 'open' });

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
