import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useChatStore from './store/chatStore.ts';
import ChatWindow from './components/chat/ChatWindow.tsx';
import { Bot } from 'lucide-react';

const API_BASE = 'http://localhost:5005/api';

export const App: React.FC = () => {
  const {
    activeConversationId,
    setConversations,
    setActiveConversationId,
    setMessages,
  } = useChatStore();

  const [loading, setLoading] = useState(true);

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
    <div className="flex flex-col w-screen h-screen bg-[#0b0c15] overflow-hidden font-sans items-center justify-center p-0 md:p-6 lg:p-8 relative">
      {/* Background Radial Glow Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.07)_0%,transparent_70%)] pointer-events-none" />

      {/* Centered chat window container with beautiful glassmorphism */}
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
    </div>
  );
};

export default App;
