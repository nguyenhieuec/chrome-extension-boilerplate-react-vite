import { useEffect, useState } from 'react';

function App() {
  const [summary, setSummary] = useState('Loading summary...');

  useEffect(() => {
    // Function to extract thread content
    function extractThreadContent(): string {
      const posts = document.querySelectorAll('[data-test-id="post-content"]');
      let content = '';
      posts.forEach(post => {
        const text = post.textContent || '';
        content += text + '\n';
      });
      return content;
    }

    // Function to summarize the content
    function summarizeContent(content: string): string {
      // Simple summarization logic (e.g., first 500 characters)
      return content.length > 500 ? content.substring(0, 500) + '...' : content;
    }

    // Initial extraction and summarization
    const initialContent = extractThreadContent();
    setSummary(summarizeContent(initialContent));

    // Update summary when new content is loaded
    const observer = new MutationObserver(() => {
      const updatedContent = extractThreadContent();
      setSummary(summarizeContent(updatedContent));
    });

    // Observe changes in the posts container
    const postsContainer = document.querySelector('#2x-container');
    if (postsContainer) {
      observer.observe(postsContainer, { childList: true, subtree: true });
    }

    // Clean up observer on component unmount
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="p-4 bg-white shadow-md rounded max-w-sm text-sm">
      <h2 className="text-lg font-bold mb-2">Thread Summary</h2>
      <p>{summary}</p>
    </div>
  );
}

export default App;
