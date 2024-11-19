import { useEffect, useState } from 'react';

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

function filterThreadData(rawData: any, keysToKeep: string[]): ThreadData {
  const thread = rawData[0]?.data?.children[0]?.data;

  const threadData: ThreadData = {
    title: thread.title,
    author: thread.author,
    selftext: thread.selftext,
    comments: [],
  };

  function extractComments(commentsArray: any[]): CommentData[] {
    return commentsArray.map(commentObj => {
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

function App() {
  const [summary, setSummary] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<ThreadData | null>(null);

  useEffect(() => {
    async function fetchThreadData() {
      const threadUrl = window.location.pathname + '.json';
      const response = await fetch(`https://www.reddit.com${threadUrl}`);
      const data = await response.json();
      // could log the raw here.

      const keysToKeep = ['title', 'author', 'selftext', 'comments', 'body', 'score', 'created_utc', 'subreddit'];
      const filteredData = filterThreadData(data, keysToKeep);

      // You can now use filteredData for summarization
      console.log(filteredData);
      setFilteredData(filteredData);
    }
    fetchThreadData();
  }, []);

  const handleSummarize = () => {
    if (!filteredData) return;
    // Prepare the content to be summarized
    const contentToSummarize = JSON.stringify(filteredData);
    // Encode the content to make it URL-safe
    // const encodedContent = encodeURIComponent(contentToSummarize);
    // Prepare the ChatGPT URL (Note: ChatGPT doesn't support URL prompts directly)
    const chatGPTUrl = `https://chat.openai.com/`;
    // Open the ChatGPT page in a new tab
    window.open(chatGPTUrl, '_blank');
    // Optionally, you might display the content for copy-pasting
    // Or integrate with an API if available

    chrome.tabs.query({ url: chatGPTUrl }, tabs => {
      if (tabs[0]) {
        if (tabs[0].id !== undefined) {
          chrome.tabs.sendMessage(tabs[0].id, { content: contentToSummarize });
        }
      }
    });
  };

  return (
    <div className="p-4 bg-white shadow-md rounded max-w-sm text-sm">
      <h2 className="text-lg font-bold mb-2">Thread Summary</h2>
      {summary ? (
        <p>{summary}</p>
      ) : (
        <button onClick={handleSummarize} className="bg-blue-500 text-white px-4 py-2 rounded">
          Summarize Thread
        </button>
      )}
    </div>
  );
}

export default App;
