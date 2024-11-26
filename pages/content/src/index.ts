console.log('content script loaded');

/**
 * Handles inserting content into ChatGPT's prompt textarea and sending the message.
 * @param content The text to insert and send.
 */
export function handleChatGPTInput(content: string) {
  const promptDiv = document.getElementById('prompt-textarea');
  if (promptDiv) {
    insertContentAndSend(content, promptDiv);
  } else {
    console.error('Prompt textarea not found');
    // Set up a MutationObserver to wait for the promptDiv if not found
    waitForPromptDiv(content);
  }
}

/**
 * Sets up a MutationObserver to detect when the prompt textarea is added to the DOM.
 * @param content The text to insert and send once the promptDiv is found.
 */
let isObserving = false;

function waitForPromptDiv(content: string) {
  if (isObserving) {
    console.log('Already observing for prompt textarea.');
    return;
  }
  isObserving = true;

  const observer = new MutationObserver((mutations, obs) => {
    const promptDiv = document.getElementById('prompt-textarea');
    if (promptDiv) {
      console.log('Found prompt textarea via MutationObserver:', promptDiv);
      obs.disconnect();
      isObserving = false;
      insertContentAndSend(content, promptDiv);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Timeout after 10 seconds to prevent infinite waiting
  setTimeout(() => {
    observer.disconnect();
    isObserving = false;
    console.error('Prompt textarea not found within timeout');
  }, 10000); // 10 seconds
}

/**
 * Inserts the content into the prompt div and triggers the send action.
 * @param content The text to insert.
 * @param promptDiv The prompt div element.
 */
function insertContentAndSend(content: string, promptDiv: HTMLElement) {
  console.log('Found prompt textarea:', promptDiv);

  // Focus the prompt div
  promptDiv.focus();
  console.log('Prompt textarea focused');

  // Select the entire content in the prompt div
  const selection = window.getSelection();
  if (!selection) {
    console.error('No selection available');
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(promptDiv);
  selection.removeAllRanges();
  selection.addRange(range);
  console.log('Range selected');

  // Insert the text at the cursor position
  const textNode = document.createTextNode(content);
  range.insertNode(textNode);
  console.log('Content inserted into prompt textarea:', content);

  // Move the cursor after the inserted text
  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  console.log('Cursor moved after inserted text');

  // Dispatch input event to ensure React detects the change
  const inputEvent = new Event('input', { bubbles: true, cancelable: true });
  promptDiv.dispatchEvent(inputEvent);
  console.log('Input event dispatched');

  // Simulate pressing Enter key to send the message
  // Delay before simulating Enter key
  setTimeout(() => {
    simulateEnterKey(promptDiv);
  }, 700); // 700ms delay

  // Delay before clicking send button
  // setTimeout(() => {
  //     const sendButton = document.querySelector('button[data-testid="send-button"]');
  //     if (sendButton instanceof HTMLButtonElement) {
  //     sendButton.click();
  //     console.log('Send button clicked');
  //     } else {
  //     console.error('Send button not found');
  //     }
  // }, 300); // 300ms delay
  // Inside insertContentAndSend function, after simulating the Enter key
  setTimeout(() => {
    observeSendButtonAndScroll();
  }, 3000); // Adjust the delay as needed
}

/**
 * Simulates pressing the Enter key to send the message.
 * @param element The element to dispatch the Enter key events on.
 */
function simulateEnterKey(element: HTMLElement) {
  const enterKeyDown = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(enterKeyDown);
  console.log('Enter key down dispatched');

  const enterKeyPress = new KeyboardEvent('keypress', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(enterKeyPress);
  console.log('Enter key press dispatched');

  const enterKeyUp = new KeyboardEvent('keyup', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(enterKeyUp);
  console.log('Enter key up dispatched');
}

/**
 * Observes the send button and scrolls to the end of the page when it is disabled.
 */
function observeSendButtonAndScroll() {
  const sendButton = document.querySelector('button[data-testid="send-button"]');
  if (sendButton) {
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'disabled') {
          const isDisabled = sendButton.hasAttribute('disabled');
          if (isDisabled) {
            console.log('Send button disabled - scrolling to bottom');
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            // Disconnect the observer after scrolling
            observer.disconnect();
          }
        }
      }
    });
    observer.observe(sendButton, { attributes: true });
    console.log('Started observing send button for disabled attribute');
  } else {
    console.error('Send button not found');
  }
}
// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  if (message.content) {
    handleChatGPTInput(message.content);
    sendResponse({ status: 'success' });
  } else {
    sendResponse({ status: 'failure' });
  }
});
