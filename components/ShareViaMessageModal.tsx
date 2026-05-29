import React, { useState, useEffect } from 'react';
import { type Prompt, type User } from '../types';
import { XIcon, SearchIcon, SendIcon } from './icons/Icons';

interface ShareViaMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
  currentUser: User;
  onSearchUsers: (query: string) => Promise<Array<{ id: string; name: string; avatarUrl: string }>>;
  onShare: (userId: string, promptId: string) => void;
}

const ShareViaMessageModal: React.FC<ShareViaMessageModalProps> = ({
    isOpen,
    onClose,
    prompt,
    currentUser,
    onSearchUsers,
    onShare,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string; avatarUrl: string }>>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setResults([]);
      return;
    }
    const q = searchQuery.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      onSearchUsers(q)
        .then(found => setResults(found.filter(u => u.id !== currentUser.id)))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  if (!isOpen || !prompt) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold">Send to...</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 bg-white p-1 rounded-full"><XIcon className="w-5 h-5"/></button>
        </div>

        <div className="p-4 border-b">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-orange focus:border-brand-orange shadow-sm"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
            {searching && (
              <p className="text-center text-gray-400 text-sm py-4">Searching...</p>
            )}
            {!searching && results.map(u => (
                <div key={u.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                    <div className="flex items-center gap-3">
                        <img src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt={u.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                        <span className="font-medium text-gray-800">{u.name}</span>
                    </div>
                    <button
                        onClick={() => {
                            onShare(u.id, prompt.id);
                            onClose();
                        }}
                        className="px-4 py-1.5 bg-brand-orange text-white rounded-md text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-600 flex items-center gap-2"
                    >
                        Send <SendIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
            {!searching && searchQuery.trim() && results.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                    No users found matching "{searchQuery}"
                </div>
            )}
            {!searching && !searchQuery.trim() && (
                <div className="text-center py-8 text-gray-400 text-sm">
                    Type a name to search for users
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ShareViaMessageModal;
