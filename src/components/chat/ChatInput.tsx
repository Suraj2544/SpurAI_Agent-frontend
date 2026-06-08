import React, { useState, FormEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;
    onSendMessage(content.trim());
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 px-6 py-4 border-t border-white/10 bg-slate-900/60 backdrop-blur-md">
      <div className="relative flex-1">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ask AI anything or type a message..."
          disabled={disabled}
          className="w-full pr-11 bg-black/20 border border-white/10 text-slate-100 rounded-xl px-4 py-3 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/35 transition-all disabled:opacity-50"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-cyan-400/70">
          <Sparkles size={16} />
        </div>
      </div>
      
      <button
        type="submit"
        className="primary p-3 px-5 flex items-center justify-center transition-all disabled:opacity-50 disabled:pointer-events-none"
        disabled={disabled || !content.trim()}
      >
        <Send size={18} />
      </button>
    </form>
  );
};

export default ChatInput;
