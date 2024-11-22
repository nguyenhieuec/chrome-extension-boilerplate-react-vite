import { useEffect, useState } from 'react';
import debounce from 'lodash.debounce';

interface ThreadData {
  title: string;
  author: string;
  selftext: string;
  comments: CommentData[];
  [key: string]: any;
}

interface CommentData {
  author: string;
  body: string;
  replies: CommentData[];
  [key: string]: any;
}

function App() {
  console.log('App component mounted');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filteredData, setFilteredData] = useState<ThreadData | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  /**
   * Fetches the current thread data from Reddit.
   */
  async function fetchThreadData() {
    console.log('Fetching thread data...');
    const isThreadPage = /^\/r\/.+\/comments\/.+/.test(window.location.pathname);
    if (!isThreadPage) {
      console.error('Not on a Reddit thread page. Cannot fetch thread data.');
      return;
    }
    try {
      const threadUrl = window.location.pathname + '.json';
      const response = await fetch(`https://www.reddit.com${threadUrl}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const keysToKeep = ['title', 'author', 'selftext', 'comments', 'body', 'score', 'created_utc', 'subreddit'];
      const filtered = filterThreadData(data, keysToKeep);
      console.log('Filtered Data:', filtered);
      setFilteredData(filtered);
    } catch (error) {
      console.error('Error fetching thread data:', error);
    }
  }

  /**
   * Handles the summarization of the thread.
   */
  const handleSummarize = () => {
    console.log('Summarize button clicked');
    if (!filteredData) {
      console.error('No filtered data available for summarization.');
      return;
    }

    setIsProcessing(true); // Disable the button

    let summaryStr = `Below is a Reddit thread with top comments. Summarize the thread with 5-10 bullet points:\n\n`;
    summaryStr += `**Title:** ${filteredData.title}\n\n`;
    summaryStr += `**Author:** ${filteredData.author}\n\n`;
    summaryStr += `**Message:**\n${filteredData.selftext}\n\n`;
    summaryStr += `**Top Comments:**\n`;
    filteredData.comments.forEach(comment => {
      summaryStr += `- **${comment.author}**: ${comment.body}\n`;
    });

    // Inside the message callback
    chrome.runtime.sendMessage({ action: 'openChatGPT', content: summaryStr }, response => {
      setIsProcessing(false); // Re-enable the button
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError.message);
        setStatusMessage('Error sending summary to ChatGPT.');
      } else if (response?.status === 'success') {
        console.log('Request to open ChatGPT sent successfully');
        setStatusMessage('Summary sent to ChatGPT.');
      } else {
        console.error('Failed to send request to open ChatGPT');
        setStatusMessage('Failed to send summary.');
      }
    });
  };

  // Handle URL changes
  const handleUrlChange = debounce(() => {
    console.log('Detected navigation to:', window.location.pathname);
    setFilteredData(null);
    fetchThreadData();
  }, 300);

  useEffect(() => {
    console.log('Setting up MutationObserver...');
    let lastUrl = window.location.href;

    const observer = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('URL changed:', currentUrl);
        handleUrlChange();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial data fetch
    fetchThreadData();

    return () => {
      console.log('Disconnecting MutationObserver and cancelling debounce');
      observer.disconnect();
      handleUrlChange.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 bg-white shadow-md rounded max-w-sm text-sm">
      <h2 className="text-lg font-bold mb-2">Thread Summary</h2>
      <button
        onClick={handleSummarize}
        disabled={isProcessing}
        className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${
          isProcessing ? 'opacity-50 cursor-not-allowed' : ''
        }`}>
        {isProcessing ? 'Summarizing...' : 'Summarize Thread'}
      </button>
      {statusMessage && <p>{statusMessage}</p>}
    </div>
  );
}

/**
 * Filters the raw Reddit thread data to include only specific keys.
 * @param rawData - The raw data fetched from Reddit.
 * @param keysToKeep - The keys to retain in the filtered data.
 * @returns The filtered thread data.
 */
function filterThreadData(rawData: any, keysToKeep: string[]): ThreadData {
  console.log('Filtering thread data...');
  const thread = rawData[0]?.data?.children[0]?.data;

  if (!thread) {
    console.error('Invalid thread data format.');
    return {
      title: '',
      author: '',
      selftext: '',
      comments: [],
    };
  }

  const threadData: ThreadData = {
    title: thread.title,
    author: thread.author,
    selftext: thread.selftext,
    comments: [],
  };

  /**
   * Recursively extracts comments from the Reddit API response.
   * @param commentsArray - The array of comment objects.
   * @returns An array of CommentData.
   */
  function extractComments(commentsArray: any[]): CommentData[] {
    return commentsArray.map((commentObj: any) => {
      const comment = commentObj.data;
      const commentData: CommentData = {
        author: comment.author,
        body: comment.body,
        replies: [],
      };
      if (comment.replies && comment.replies.data) {
        commentData.replies = extractComments(comment.replies.data.children);
      }
      return commentData;
    });
  }

  const comments = rawData[1]?.data?.children || [];
  threadData.comments = extractComments(comments);

  // Filter keys if keysToKeep is provided
  if (keysToKeep && keysToKeep.length > 0) {
    const filterKeys = (obj: any): any => {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([key]) => keysToKeep.includes(key))
          .map(([key, value]) => [
            key,
            typeof value === 'object' && value !== null
              ? Array.isArray(value)
                ? value.map(filterKeys)
                : filterKeys(value)
              : value,
          ]),
      );
    };
    return filterKeys(threadData);
  }

  return threadData;
}

export default App;
