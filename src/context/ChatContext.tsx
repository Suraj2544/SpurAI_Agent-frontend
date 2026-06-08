import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import ChatApiService from '../services/api.ts';
const LOCAL_STORAGE_KEY = 'aether_chat_session_id';

export interface Message {
  _id?: string;
  conversationId: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

export interface ChatState {
  messages: Message[];
  sessionId: string | null;
  loading: boolean;
  error: string | null;
}

export type ChatAction =
  | { type: 'START_REQUEST' }
  | { type: 'SET_SESSION_ID'; payload: string | null }
  | { type: 'LOAD_HISTORY_SUCCESS'; payload: { sessionId: string; messages: Message[] } }
  | { type: 'SEND_MESSAGE_SUCCESS'; payload: { text: string; reply: string } }
  | { type: 'ADD_MESSAGE_OPTIMISTIC'; payload: Message }
  | { type: 'ADD_MESSAGE_SUCCESS'; payload: Message }
  | { type: 'REQUEST_FAILURE'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

const initialState: ChatState = {
  messages: [],
  sessionId: typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null,
  loading: false,
  error: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'START_REQUEST':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'SET_SESSION_ID':
      if (action.payload) {
        localStorage.setItem(LOCAL_STORAGE_KEY, action.payload);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
      return {
        ...state,
        sessionId: action.payload,
      };
    case 'LOAD_HISTORY_SUCCESS':
      localStorage.setItem(LOCAL_STORAGE_KEY, action.payload.sessionId);
      return {
        ...state,
        loading: false,
        sessionId: action.payload.sessionId,
        messages: action.payload.messages,
        error: null,
      };
    case 'ADD_MESSAGE_OPTIMISTIC':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        error: null,
      };
    case 'ADD_MESSAGE_SUCCESS':
      // Prevent duplicates by checking if message with _id already exists
      const exists = state.messages.some(m => m._id && m._id === action.payload._id);
      if (exists) return state;
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SEND_MESSAGE_SUCCESS':
      return {
        ...state,
        loading: false,
      };
    case 'REQUEST_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'RESET':
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return {
        messages: [],
        sessionId: null,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
}

interface ChatContextProps {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (text: string) => Promise<void>;
  loadHistory: (sessionId: string) => Promise<void>;
  startNewSession: () => Promise<void>;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Load history helper
  const loadHistory = async (sessionId: string) => {
    dispatch({ type: 'START_REQUEST' });
    try {
      const data = await ChatApiService.getHistory(sessionId);
      if (data && data.success) {
        dispatch({
          type: 'LOAD_HISTORY_SUCCESS',
          payload: {
            sessionId: data.data.sessionId,
            messages: data.data.messages,
          },
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to load conversation history.';
      dispatch({ type: 'REQUEST_FAILURE', payload: msg });
    }
  };

  // Send message helper
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Dispatch optimistic update
    const optimisticMsg: Message = {
      conversationId: state.sessionId || 'pending',
      sender: 'user',
      text,
    };
    dispatch({ type: 'ADD_MESSAGE_OPTIMISTIC', payload: optimisticMsg });
    dispatch({ type: 'START_REQUEST' });

    try {
      // 2. Execute POST request
      const data = await ChatApiService.sendMessage(text, state.sessionId || undefined);

      if (data && data.success) {
        const { reply, sessionId } = data.data;
        
        // If session ID changed (e.g. brand new session started), set it
        if (sessionId !== state.sessionId) {
          dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
        }

        // Add the AI reply message
        const aiMsg: Message = {
          conversationId: sessionId,
          sender: 'ai',
          text: reply,
        };
        dispatch({ type: 'ADD_MESSAGE_SUCCESS', payload: aiMsg });
        dispatch({ type: 'SEND_MESSAGE_SUCCESS', payload: { text, reply } });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Failed to send message.';
      dispatch({ type: 'REQUEST_FAILURE', payload: errMsg });
    }
  };

  // Start new session helper
  const startNewSession = async () => {
    dispatch({ type: 'RESET' });
  };

  // Restore session on initial mount
  useEffect(() => {
    if (state.sessionId) {
      loadHistory(state.sessionId);
    }
  }, []);

  return (
    <ChatContext.Provider value={{ state, dispatch, sendMessage, loadHistory, startNewSession }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextProps => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
