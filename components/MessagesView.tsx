import React, { useState, useEffect, useRef } from 'react';
import { type User, type Conversation, type Message, type View } from '../types';
import { SearchIcon, PlusIcon, ChatBubbleIcon, ArrowLeftIcon, SendIcon } from './icons/Icons';
import { messageService } from '../lib/messageService';
import { profileService } from '../lib/profileService';

interface MessagesViewProps {
  currentUser: User;
  conversations: Conversation[];
  onSearchUsers: (query: string) => Promise<Array<{ id: string; name: string; avatarUrl: string }>>;
  onSendMessage: (conversationId: string, content: string, receiverId: string) => void;
  onCreateConversation: (participantIds: string[]) => string | Promise<string>;
  initialConversationId?: string;
  onNavigate: (view: View) => void;
}

interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  is_read: boolean;
  created_at: string;
}

interface DbConversation {
  id: string;
  participant_ids: string[];
  updated_at: string;
}

interface ProfileCache {
  [id: string]: { name: string; avatarUrl: string; username: string };
}

const MessagesView: React.FC<MessagesViewProps> = ({
  currentUser,
  conversations: mockConversations,
  onSearchUsers,
  onSendMessage,
  onCreateConversation,
  initialConversationId,
  onNavigate,
}) => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [newChatResults, setNewChatResults] = useState<Array<{ id: string; name: string; avatarUrl: string }>>([]);
  const [newChatSearching, setNewChatSearching] = useState(false);
  const [sending, setSending] = useState(false);

  // Supabase state
  const [dbConversations, setDbConversations] = useState<DbConversation[]>([]);
  const [messagesMap, setMessagesMap] = useState<Record<string, DbMessage[]>>({});
  const [profiles, setProfiles] = useState<ProfileCache>({});
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeChannelRef = useRef<ReturnType<typeof messageService.subscribeToMessages> | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesMap, activeConversationId]);

  // Sync initialConversationId
  useEffect(() => {
    if (initialConversationId) setActiveConversationId(initialConversationId);
  }, [initialConversationId]);

  // Load conversations from Supabase on mount
  useEffect(() => {
    let mounted = true;
    messageService.getConversations(currentUser.id).then(async (convs) => {
      if (!mounted) return;
      setDbConversations(convs as DbConversation[]);

      // Load profiles for all participants except self
      const otherIds = new Set<string>();
      (convs as DbConversation[]).forEach((c) =>
        c.participant_ids.forEach((id) => { if (id !== currentUser.id) otherIds.add(id); })
      );
      await loadProfiles(Array.from(otherIds));
    }).catch(() => {
      // Supabase not reachable yet — fall back silently to mock data
    });
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]);

  const loadProfiles = async (ids: string[]) => {
    const toFetch = ids.filter((id) => !profiles[id]);
    if (toFetch.length === 0) return;
    const results = await Promise.allSettled(toFetch.map((id) => profileService.getById(id)));
    setProfiles((prev) => {
      const next = { ...prev };
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          const p = r.value as any;
          next[toFetch[i]] = { name: p.name || p.username, avatarUrl: p.avatar_url || '', username: p.username };
        }
      });
      return next;
    });
  };

  // Live search for new chat
  useEffect(() => {
    const q = newChatSearch.trim();
    if (!showNewChat || !q) {
      setNewChatResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setNewChatSearching(true);
      onSearchUsers(q)
        .then(res => setNewChatResults(res.filter(u => u.id !== currentUser.id)))
        .catch(() => setNewChatResults([]))
        .finally(() => setNewChatSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [newChatSearch, showNewChat]);

  // Load messages + subscribe when active conversation changes
  useEffect(() => {
    if (!activeConversationId) return;

    // Clean up previous subscription
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.unsubscribe();
      realtimeChannelRef.current = null;
    }

    setLoadingMessages(true);
    messageService.getMessages(activeConversationId).then((msgs) => {
      setMessagesMap((prev) => ({ ...prev, [activeConversationId]: msgs as DbMessage[] }));
      setLoadingMessages(false);

      // Mark as read
      messageService.markMessagesRead(activeConversationId, currentUser.id).catch(() => {});
    }).catch(() => setLoadingMessages(false));

    // Subscribe to new messages in this conversation
    const channel = messageService.subscribeToMessages(activeConversationId, (newMsg: DbMessage) => {
      // Only add if not already present (avoid duplicates from our own send)
      setMessagesMap((prev) => {
        const existing = prev[activeConversationId] || [];
        if (existing.some((m) => m.id === newMsg.id)) return prev;
        return { ...prev, [activeConversationId]: [...existing, newMsg] };
      });
      // If incoming message is from the other user, mark it read
      if (newMsg.sender_id !== currentUser.id) {
        messageService.markMessagesRead(activeConversationId, currentUser.id).catch(() => {});
      }
    });
    realtimeChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
      realtimeChannelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, currentUser.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId) return;

    const activeConv = dbConversations.find((c) => c.id === activeConversationId)
      || mockConversations.find((c) => c.id === activeConversationId);
    if (!activeConv) return;

    const receiverId = ('participant_ids' in activeConv
      ? (activeConv as DbConversation).participant_ids
      : (activeConv as Conversation).participantIds
    ).find((id) => id !== currentUser.id);

    if (!receiverId) return;

    const content = newMessage;
    setNewMessage('');
    setSending(true);

    try {
      const sent = await messageService.sendMessage({
        conversationId: activeConversationId,
        senderId: currentUser.id,
        text: content,
      });

      // Optimistically add our own message (realtime won't fire for sender)
      setMessagesMap((prev) => {
        const existing = prev[activeConversationId] || [];
        if (existing.some((m) => m.id === (sent as any).id)) return prev;
        return { ...prev, [activeConversationId]: [...existing, sent as DbMessage] };
      });

      // Update conversation updated_at in our list
      setDbConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId ? { ...c, updated_at: new Date().toISOString() } : c
        )
      );

      // Also call the App.tsx handler (keeps notification state in sync)
      onSendMessage(activeConversationId, content, receiverId);
    } catch {
      setNewMessage(content); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const handleStartNewChat = async (userId: string) => {
    try {
      const convId = await messageService.getOrCreateConversation(currentUser.id, userId);

      // Add to local list if not already there
      setDbConversations((prev) => {
        if (prev.find((c) => c.id === convId)) return prev;
        return [
          { id: convId, participant_ids: [currentUser.id, userId], updated_at: new Date().toISOString() },
          ...prev,
        ];
      });

      await loadProfiles([userId]);
      setActiveConversationId(convId);

      // Keep App.tsx in sync
      onCreateConversation([currentUser.id, userId]);
    } catch {
      // Fallback: use mock
      const existing = mockConversations.find(
        (c) => c.participantIds.includes(userId) && c.participantIds.includes(currentUser.id)
      );
      const result = existing ? existing.id : onCreateConversation([currentUser.id, userId]);
      const newId = result instanceof Promise ? await result : result;
      setActiveConversationId(newId);
    }
    setShowNewChat(false);
    setNewChatSearch('');
  };

  // Merge Supabase conversations with mock fallback conversations
  const allConversations = dbConversations.length > 0 ? dbConversations : null;

  const getParticipantId = (conv: DbConversation | Conversation): string | undefined => {
    if ('participant_ids' in conv) return (conv as DbConversation).participant_ids.find((id) => id !== currentUser.id);
    return (conv as Conversation).participantIds.find((id) => id !== currentUser.id);
  };

  const getParticipantInfo = (participantId: string) => {
    const cached = profiles[participantId];
    if (cached) return { name: cached.name, avatarUrl: cached.avatarUrl };
    return { name: 'Unknown', avatarUrl: '' };
  };

  const getLastMessage = (convId: string): DbMessage | Message | undefined => {
    const msgs = messagesMap[convId];
    if (msgs && msgs.length > 0) return msgs[msgs.length - 1];
    const mockConv = mockConversations.find((c) => c.id === convId);
    return mockConv?.lastMessage;
  };

  const getUpdatedAt = (conv: DbConversation | Conversation): string =>
    'updated_at' in conv ? (conv as DbConversation).updated_at : (conv as Conversation).updatedAt;

  const displayConversations: Array<DbConversation | Conversation> = allConversations
    ? allConversations.filter((c) => {
        const pid = getParticipantId(c);
        if (!pid) return false;
        const info = getParticipantInfo(pid);
        return info.name.toLowerCase().includes(searchQuery.toLowerCase());
      }).sort((a, b) => new Date(getUpdatedAt(b)).getTime() - new Date(getUpdatedAt(a)).getTime())
    : mockConversations.filter((c) => {
        const pid = c.participantIds.find((id) => id !== currentUser.id);
        if (!pid) return true;
        const info = getParticipantInfo(pid);
        return info.name.toLowerCase().includes(searchQuery.toLowerCase());
      }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const activeConv = displayConversations.find((c) => c.id === activeConversationId)
    || mockConversations.find((c) => c.id === activeConversationId);
  const activeParticipantId = activeConv ? getParticipantId(activeConv) : undefined;
  const activeParticipantInfo = activeParticipantId ? getParticipantInfo(activeParticipantId) : null;

  const activeMessages: Array<{ id: string; senderId: string; receiverId: string; content: string; timestamp: string; sharedPromptId?: string }> = (
    messagesMap[activeConversationId || ''] || []
  ).map((m) => ({
    id: (m as any).id,
    senderId: (m as any).sender_id ?? (m as any).senderId,
    receiverId: (m as any).receiver_id ?? (m as any).receiverId,
    content: (m as any).text ?? (m as any).content,
    timestamp: (m as any).created_at ?? (m as any).timestamp,
    sharedPromptId: (m as any).shared_prompt_id ?? (m as any).sharedPromptId,
  }));


  return (
    <div className="flex h-[calc(100vh-6rem)] bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {/* Conversations List (Sidebar) */}
      <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${activeConversationId && 'hidden md:flex'}`}>
        <div className="p-4 border-b border-gray-200 h-16 flex items-center justify-between">
          <h2 className="text-xl font-bold">Messages</h2>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-orange focus:border-brand-orange"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showNewChat ? (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Start New Chat</h3>
              <div className="mb-4 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-orange focus:border-brand-orange"
                />
              </div>
              <div className="space-y-2">
                {newChatSearching && (
                  <p className="text-center text-gray-400 text-sm">Searching...</p>
                )}
                {!newChatSearching && newChatResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleStartNewChat(u.id)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <img src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                    <span className="font-medium text-gray-900">{u.name}</span>
                  </button>
                ))}
                {!newChatSearching && newChatSearch.trim() && newChatResults.length === 0 && (
                  <p className="text-center text-gray-500 text-sm">No users found.</p>
                )}
                {!newChatSearch.trim() && (
                  <p className="text-center text-gray-400 text-sm">Type a name to search</p>
                )}
              </div>
            </div>
          ) : displayConversations.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {displayConversations.map((c) => {
                const participantId = getParticipantId(c);
                if (!participantId) return null;
                const participant = getParticipantInfo(participantId);
                const isActive = activeConversationId === c.id;
                const lastMsg = getLastMessage(c.id);
                const hasUnread = lastMsg && (lastMsg as any).receiver_id === currentUser.id && !(lastMsg as any).is_read
                  || lastMsg && (lastMsg as Message).receiverId === currentUser.id && !(lastMsg as Message).isRead;

                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConversationId(c.id)}
                    className={`w-full flex items-center justify-between p-4 transition-colors text-left ${isActive ? 'bg-orange-50 border-l-4 border-brand-orange' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        {participant.avatarUrl ? (
                          <img src={participant.avatarUrl} alt={participant.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                            <span className="text-gray-500 font-medium">{participant.name[0]?.toUpperCase()}</span>
                          </div>
                        )}
                        {hasUnread && (
                          <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className={`font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                          {participant.name}
                        </h3>
                        <p className={`text-sm truncate ${hasUnread ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                          {(lastMsg as any)?.text || (lastMsg as any)?.content || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    {lastMsg && (
                      <span className="text-xs text-gray-400 whitespace-nowrap self-start mt-1 ms-2">
                        {new Date((lastMsg as any).created_at ?? (lastMsg as Message).timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <ChatBubbleIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p>No conversations yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Conversation (Main Area) */}
      <div className={`w-full md:w-2/3 flex flex-col ${!activeConversationId && 'hidden md:flex'}`}>
        {activeConversationId && activeParticipantInfo ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-4 h-16 shrink-0 bg-white shadow-sm z-10">
              <button
                onClick={() => setActiveConversationId(null)}
                className="md:hidden p-2 rounded-full hover:bg-gray-100"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              {activeParticipantInfo.avatarUrl ? (
                <img src={activeParticipantInfo.avatarUrl} alt={activeParticipantInfo.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 font-medium">{activeParticipantInfo.name[0]?.toUpperCase()}</span>
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-900 leading-tight">{activeParticipantInfo.name}</h3>
                {activeParticipantId && (
                  <button
                    onClick={() => onNavigate({ type: 'profile', payload: { userId: activeParticipantId } })}
                    className="text-xs text-brand-orange hover:text-orange-600 font-medium"
                  >
                    View Profile
                  </button>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
              {loadingMessages ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                  Send a message to start the conversation!
                </div>
              ) : (
                activeMessages.map((msg, index) => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id || index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isMine ? 'bg-brand-orange text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'}`}>
                        {msg.sharedPromptId && (
                          <div className="mb-2 p-2 bg-white/20 rounded border border-white/30 text-sm">
                            <p className="font-semibold mb-1 flex items-center gap-1">
                              <ChatBubbleIcon className="w-3 h-3" /> Shared a Prompt
                            </p>
                            <button
                              onClick={() => { window.location.hash = `#prompt/${msg.sharedPromptId}`; }}
                              className="underline hover:no-underline"
                            >
                              View Prompt
                            </button>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <span className={`text-[10px] block text-right mt-1 ${isMine ? 'text-orange-200' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-gray-200 grow-0 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 border-gray-300 rounded-full pl-4 pr-4 py-2.5 focus:ring-brand-orange focus:border-brand-orange bg-gray-50 shadow-inner"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-brand-orange text-white p-2.5 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-md"
                >
                  <SendIcon className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
            <ChatBubbleIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">Your Messages</h3>
            <p className="text-sm">Select a conversation or start a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesView;
