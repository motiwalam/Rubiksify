import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const ShareUrlWithCopy = ({ shareUrl }: { shareUrl: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset the copied state after 2 seconds
    });
  };

  return (
    <div className="flex w-full items-center justify-between space-x-2">
        <div className="relative flex items-center bg-gray-100 rounded-lg px-4 py-2 w-72 overflow-x-auto whitespace-nowrap border border-gray-300 shadow-sm">
            <span className="font-mono text-sm">{shareUrl}</span>
        </div>
        <button
            onClick={handleCopyClick}
            className="p-2 bg-gray-400 text-white rounded-full hover:bg-gray-600 focus:outline-none "
            // title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
            {copied ? <Check /> : <Copy />}
        </button>
    </div>
  );
};

export default ShareUrlWithCopy;
