import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../../store/chatStore.ts';
import { User, Cpu } from 'lucide-react';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isAI = message.sender === 'ai';

  let containerClass = 'flex w-full mb-4 gap-3 ';
  let bubbleClass = 'p-4 rounded-2xl max-w-[70%] shadow-lg transition-all ';
  
  if (isUser) {
    containerClass += 'justify-end';
    bubbleClass += 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-none';
  } else {
    containerClass += 'justify-start';
    bubbleClass += 'bg-white/5 border border-white/10 text-slate-100 rounded-bl-none';
  }

  return (
    <div className={containerClass}>
      {!isUser && (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 mt-1 flex-shrink-0">
          <Cpu size={16} />
        </div>
      )}
      
      <div className={bubbleClass}>
        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
          {isAI ? (
            <ReactMarkdown>{message.text}</ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap">{message.text}</p>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-900 border border-indigo-700 text-white mt-1 flex-shrink-0">
          <User size={16} />
        </div>
      )}
    </div>
  );
};

export default MessageItem;
