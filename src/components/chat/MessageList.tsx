import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem.tsx';
import useChatStore from '../../store/chatStore.ts';
import { Bot, Sparkles, HelpCircle } from 'lucide-react';

interface MessageListProps {
  onSelectSuggestion?: (text: string) => void;
}

const SUGGESTIONS = [
  "What’s your return policy?",
  "Do you ship to USA?",
  "How long does shipping take?"
];

export const MessageList: React.FC<MessageListProps> = ({ onSelectSuggestion }) => {
  const messages = useChatStore((state) => state.messages);
  const isAiTyping = useChatStore((state) => state.isAiTyping);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping]);

  const showSuggestions = !isAiTyping && messages.length <= 2;

  return (
    <div className="flex flex-col flex-1 overflow-y-auto p-6 gap-4">
      {/* Welcome Greeting Header Card */}
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 opacity-90 text-center gap-5 max-w-md mx-auto my-auto py-8">
          <div className="p-4 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/30">
            <Bot size={44} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Chat with Spur Support</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Hello! I'm your Spur AI Support Assistant. Ask me anything about our return policy, shipping fees, delivery times, or worldwide shipping.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Welcome header for chat log context */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/5 text-slate-500 text-[11px] font-semibold tracking-wider justify-center">
            <HelpCircle size={12} className="text-violet-400" />
            <span>SECURE ENCRYPTED CHAT SESSION ACTIVE</span>
          </div>

          {messages.map((message, idx) => (
            <MessageItem key={message._id || idx} message={message} />
          ))}
        </div>
      )}

      {/* Suggested Questions Pills */}
      {showSuggestions && (
        <div className="flex flex-col gap-2 mt-2 self-start w-full max-w-lg fade-in">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
            Suggested Questions
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestion?.(suggestion)}
                className="bg-white/5 border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/10 text-xs text-slate-300 hover:text-white px-4 py-2.5 rounded-full transition-all duration-200 shadow-sm active:scale-95 whitespace-nowrap"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI is thinking/typing loader */}
      {isAiTyping && (
        <div className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 self-start text-slate-300 text-xs animate-pulse fade-in">
          <Sparkles size={14} className="text-cyan-400 animate-spin" />
          <span>AI Support is typing...</span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
