import React from 'react';
import MessageList from './MessageList.tsx';
import ChatInput from './ChatInput.tsx';
import useSocket from '../../hooks/useSocket.ts';
import useChatStore from '../../store/chatStore.ts';
import { Bot, Sparkles } from 'lucide-react';

export const ChatWindow: React.FC = () => {
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const { sendMessage } = useSocket(activeConversationId);

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  if (!activeConversationId) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-full text-slate-400 p-8 gap-4">
        <div className="p-5 rounded-full bg-white/5 border border-white/10 shadow-lg shadow-violet-500/5">
          <Bot size={48} className="text-violet-400 animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-slate-100 mb-2">
            Connecting to Spur Support
          </h3>
          <p className="max-w-sm text-sm text-slate-400">
            Establishing a chat session with our AI support assistant. Please wait...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-[#0b0c15]/20">
      {/* Customer Support Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121323]/80 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20 relative">
            <Bot size={20} />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#121323]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">Spur Support Assistant</h4>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <span>Typically replies instantly</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 px-3 py-1.5 rounded-full text-xs font-semibold">
          <Sparkles size={12} className="animate-pulse text-cyan-400" />
          <span>Spur AI Support</span>
        </div>
      </div>

      {/* Message List */}
      <MessageList onSelectSuggestion={handleSend} />

      {/* Chat Input */}
      <ChatInput onSendMessage={handleSend} />
    </div>
  );
};

export default ChatWindow;
