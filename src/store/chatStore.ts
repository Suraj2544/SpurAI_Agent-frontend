import { create } from 'zustand';

export interface Message {
  _id?: string;
  conversationId: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

export interface Conversation {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isAiTyping: boolean;
  
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversationId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  appendChunkToLastMessage: (chunk: string) => void;
  setIsAiTyping: (isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isAiTyping: false,

  setConversations: (conversations) => set({ conversations }),
  
  setActiveConversationId: (id) => set({ activeConversationId: id, messages: [] }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => {
    // Avoid duplicate messages if socket event arrives for a message we already received or optimistically added
    const exists = state.messages.some((m) => m._id && m._id === message._id);
    if (exists) return state;

    // If we receive a completed AI message, and the last message is a streamed AI message placeholder (no _id),
    // replace/update the placeholder with the completed message.
    const lastIndex = state.messages.length - 1;
    if (message.sender === 'ai' && lastIndex >= 0) {
      const lastMsg = state.messages[lastIndex];
      if (lastMsg.sender === 'ai' && !lastMsg._id) {
        const updatedMessages = [...state.messages];
        updatedMessages[lastIndex] = message;
        return { messages: updatedMessages };
      }
    }

    return { messages: [...state.messages, message] };
  }),

  appendChunkToLastMessage: (chunk) => set((state) => {
    const lastIndex = state.messages.length - 1;
    if (lastIndex < 0) return state;
    
    const lastMsg = state.messages[lastIndex];
    if (lastMsg.sender !== 'ai') {
      // If the last message is not AI, create a new AI message placeholder
      return {
        messages: [
          ...state.messages,
          {
            conversationId: state.activeConversationId || '',
            sender: 'ai',
            text: chunk,
          },
        ],
      };
    }

    const updatedMessages = [...state.messages];
    updatedMessages[lastIndex] = {
      ...lastMsg,
      text: lastMsg.text + chunk,
    };
    return { messages: updatedMessages };
  }),

  setIsAiTyping: (isAiTyping) => set({ isAiTyping }),
}));

export default useChatStore;
