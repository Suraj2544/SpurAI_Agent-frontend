import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useChatStore, { Conversation } from './store/chatStore.ts';
import ChatWindow from './components/chat/ChatWindow.tsx';
import { Bot, Sparkles, Plus, MessageSquare, Trash2 } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5005') + '/api';

export const App: React.FC = () => {
  const {
    activeConversationId,
    conversations,
    setConversations,
    setActiveConversationId,
    messages,
    setMessages,
    isCollapsed,
    setIsCollapsed,
  } = useChatStore();

  const [loading, setLoading] = useState(true);

  const handleNewChatSidebar = async () => {
    try {
      const startRes = await axios.post(`${API_BASE}/conversations/start`, {
        initialMessage: 'Hi, I would like to ask some questions about Spur Store.',
      });
      if (startRes.data && startRes.data.conversation) {
        const newConv = startRes.data.conversation;
        setConversations([newConv, ...conversations]);
        setActiveConversationId(newConv._id);
        setMessages([
          {
            conversationId: newConv._id,
            sender: 'user',
            text: 'Hi, I would like to ask some questions about Spur Store.',
          }
        ]);
        setIsCollapsed(false); // Make sure it's expanded
      }
    } catch (err) {
      console.warn('Failed to start new chat session on backend. Starting local demo.');
      const demoConv = {
        _id: 'conv_demo_' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversations([demoConv, ...conversations]);
      setActiveConversationId(demoConv._id);
      setMessages([
        {
          conversationId: demoConv._id,
          sender: 'user',
          text: 'Hi, I would like to ask some questions about Spur Store.',
        },
        {
          conversationId: demoConv._id,
          sender: 'ai',
          text: 'Hello! Welcome to Spur Store Support. I am happy to help you today. Ask me anything about our 30-day return policy, shipping details, or domestic/international shipping regions!',
        }
      ]);
      setIsCollapsed(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/conversations/${id}`);
    } catch (err) {
      console.warn('Failed to delete chat session on backend, removing locally:', err);
    }
    
    // Remove from local list
    const updated = conversations.filter((c: Conversation) => c._id !== id);
    setConversations(updated);
    
    // If we deleted the active conversation, switch to the next available or start a new one
    if (activeConversationId === id) {
      if (updated.length > 0) {
        setActiveConversationId(updated[0]._id);
      } else {
        // No conversations left, start a new one
        setActiveConversationId(null);
        try {
          const startRes = await axios.post(`${API_BASE}/conversations/start`, {
            initialMessage: 'Hi, I would like to ask some questions about Spur Store.',
          });
          if (startRes.data && startRes.data.conversation) {
            const newConv = startRes.data.conversation;
            setConversations([newConv]);
            setActiveConversationId(newConv._id);
          }
        } catch {
          // Fallback
          const demoConv = {
            _id: 'conv_demo_customer_support',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setConversations([demoConv]);
          setActiveConversationId(demoConv._id);
        }
      }
    }
  };

  // Load existing active conversations or start a new one on mount
  useEffect(() => {
    const initChatSession = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/conversations/active`);
        if (res.data && res.data.conversations && res.data.conversations.length > 0) {
          // Select the most recent active conversation
          const latestConv = res.data.conversations[0];
          setConversations(res.data.conversations);
          setActiveConversationId(latestConv._id);
        } else {
          // No active sessions, start a new one automatically
          const startRes = await axios.post(`${API_BASE}/conversations/start`, {
            initialMessage: 'Hi, I would like to ask some questions about Spur Store.',
          });
          if (startRes.data && startRes.data.conversation) {
            const newConv = startRes.data.conversation;
            setConversations([newConv]);
            setActiveConversationId(newConv._id);
          }
        }
      } catch (err) {
        console.warn('Backend server unreachable. Falling back to local customer support session.');
        // Fallback demo session so the app remains interactive offline
        const demoConv = {
          _id: 'conv_demo_customer_support',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setConversations([demoConv]);
        setActiveConversationId(demoConv._id);
      } finally {
        setLoading(false);
      }
    };

    initChatSession();
  }, [setConversations, setActiveConversationId]);

  // Load message logs when switching conversation sessions
  useEffect(() => {
    if (!activeConversationId) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API_BASE}/conversations/${activeConversationId}/messages`);
        if (res.data && res.data.messages) {
          // MongoDB returns messages in descending order; reverse it for chronological UI list
          setMessages(res.data.messages.reverse());
        }
      } catch (err) {
        console.warn('Backend server offline. Setting simulated logs.');
        if (activeConversationId === 'conv_demo_customer_support') {
          setMessages([
            {
              conversationId: 'conv_demo_customer_support',
              sender: 'user',
              text: 'Hi, I would like to ask some questions about Spur Store.',
            },
            {
              conversationId: 'conv_demo_customer_support',
              sender: 'ai',
              text: 'Hello! Welcome to Spur Store Support. I am happy to help you today. Ask me anything about our 30-day return policy, shipping details, or domestic/international shipping regions!',
            }
          ]);
        }
      }
    };

    fetchMessages();
  }, [activeConversationId, setMessages]);

  return (
    <div className="flex w-screen h-screen bg-[#0b0c15] overflow-hidden font-sans p-0 md:p-6 lg:p-8 relative gap-6">
      {/* Background Radial Glow Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.07)_0%,transparent_70%)] pointer-events-none" />

      {/* Left Sidebar for Chat History */}
      <div className="w-72 hidden md:flex flex-col glass-panel border border-white/5 p-4 h-full relative z-20 shrink-0">
        {/* Sidebar Header / New Chat CTA */}
        <button
          onClick={handleNewChatSidebar}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm py-3 rounded-xl transition-all duration-300 shadow-md shadow-violet-500/10 active:scale-95 mb-4"
          style={{ padding: '10px 16px' }}
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>

        {/* Scrollable list of past conversations */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 scrollbar-thin">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">
            Chat History
          </div>
          {conversations.length === 0 ? (
            <div className="text-xs text-slate-500 px-2 py-4 italic">No previous chats</div>
          ) : (
            conversations.map((conv: Conversation) => {
              const isActive = conv._id === activeConversationId;
              const dateStr = new Date(conv.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              return (
                <div
                  key={conv._id}
                  onClick={() => {
                    setActiveConversationId(conv._id);
                    setIsCollapsed(false); // Make sure it's expanded when switching
                  }}
                  className={`group flex items-center justify-between gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'bg-violet-600/10 border-violet-500/30 text-white'
                      : 'bg-white/0 border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <MessageSquare size={14} className={isActive ? 'text-violet-400' : 'text-slate-500'} />
                    <span className="text-xs font-medium truncate">
                      {dateStr}
                    </span>
                  </div>
                  
                  {/* Delete button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-1 rounded transition-all duration-150"
                    style={{ padding: 0 }}
                    title="Delete Chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative items-center justify-center">
        {/* Centered chat window container with beautiful glassmorphism */}
        {!isCollapsed && (
          <div className="w-full h-full md:max-w-4xl md:h-[85vh] glass-panel overflow-hidden flex flex-col shadow-2xl relative z-10 border border-white/10">
            {loading ? (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-8 gap-4">
                <div className="p-4 rounded-full bg-violet-600/10 border border-violet-500/20 animate-pulse">
                  <Bot size={48} className="text-violet-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-100 mb-1">
                    Connecting to Support Assistant
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Please wait a moment while we initialize your secure chat session.
                  </p>
                </div>
              </div>
            ) : activeConversationId ? (
              <ChatWindow />
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-8 gap-4">
                <div className="p-4 rounded-full bg-rose-600/10 border border-rose-500/20">
                  <Bot size={48} className="text-rose-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-100 mb-1">
                    Connection Error
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    We could not establish a chat session. Please refresh the page.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsed UI Dashboard Layout */}
        {isCollapsed && (
          <div className="w-full h-full flex flex-col md:flex-row gap-6 relative z-10 animate-fade-in max-w-7xl">
            
            {/* Left / Main Dashboard Area */}
            <div className="flex-1 flex flex-col justify-between p-6 md:p-8 glass-panel border border-white/5 relative overflow-hidden">
              {/* Ambient background glow inside dashboard */}
              <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
              
              {/* Top Bar / Welcome */}
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-violet-400 font-semibold text-xs tracking-wider uppercase">
                  <Sparkles size={14} className="text-cyan-400" />
                  <span>Chatbot Dashboard</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-2 tracking-tight">
                  Spur AI <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Chatbot</span>
                </h1>
                <p className="text-slate-400 text-sm mt-3 max-w-xl leading-relaxed">
                  Welcome to your command center. Monitor active virtual customer representatives, analyze system throughput, and orchestrate chat threads in real-time.
                </p>
              </div>

              {/* Middle Dashboard Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8 relative z-10">
                {/* Card 1 */}
                <div className="bg-[#121323]/50 border border-white/5 p-5 rounded-2xl flex flex-col gap-3 hover:border-violet-500/20 transition-all duration-300">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Response Time</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">140ms</span>
                    <span className="text-cyan-400 text-xs font-medium">99.9% LCP</span>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-[#121323]/50 border border-white/5 p-5 rounded-2xl flex flex-col gap-3 hover:border-violet-500/20 transition-all duration-300">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Chatbot Integrity</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">Secured</span>
                    <span className="text-violet-400 text-xs font-medium">SSL Encrypted</span>
                  </div>
                </div>
              </div>

              {/* Bottom Info / Action call */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-t border-white/5 pt-6 relative z-10 gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs text-slate-400 font-medium">All systems operational. Listening for customer requests.</span>
                </div>
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm px-6 py-3 rounded-full transition-all duration-300 shadow-lg shadow-violet-500/20 active:scale-95"
                  style={{ padding: '10px 24px' }}
                >
                  <Bot size={18} />
                  <span>Maximize Support Terminal</span>
                </button>
              </div>
            </div>

            {/* Right / Scrollable Message Log Sidebar */}
            <div className="w-full md:w-80 lg:w-96 flex flex-col glass-panel border border-white/5 p-5 h-full max-h-[85vh]">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  <h3 className="font-bold text-sm text-slate-200">Active Message Log</h3>
                </div>
                <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-full uppercase font-mono">
                  {messages.length} messages
                </span>
              </div>

              {/* Message log items - Scrollable both vertically and horizontally */}
              <div className="flex-1 overflow-y-auto overflow-x-auto pr-1 flex flex-col gap-3.5 scrollbar-thin">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-slate-500 text-xs text-center p-4 gap-2">
                    <Bot size={24} className="text-slate-600 animate-pulse" />
                    <span>No message history in the current thread.</span>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex flex-col gap-1 p-3 rounded-xl border ${
                        msg.sender === 'user' 
                          ? 'bg-[#181a2e]/60 border-violet-500/10 self-end ml-4' 
                          : 'bg-[#121323]/40 border-white/5 self-start mr-4'
                      } max-w-[90%] min-w-[120px]`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          msg.sender === 'user' ? 'text-violet-400' : 'text-cyan-400'
                        }`}>
                          {msg.sender === 'user' ? 'User' : 'Assistant'}
                        </span>
                      </div>
                      {/* Inner message body - scrollable if content overflows horizontally */}
                      <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap overflow-x-auto max-w-full">
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex justify-center">
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="w-full bg-white/5 border border-white/10 hover:border-violet-500/30 hover:bg-violet-500/10 text-xs text-slate-300 hover:text-white py-2 rounded-xl transition-all duration-200"
                  style={{ padding: '8px 16px' }}
                >
                  Open full conversation
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default App;
