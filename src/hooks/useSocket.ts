import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import useChatStore, { Message } from '../store/chatStore.ts';

const SOCKET_URL = 'http://localhost:5005';

export const useSocket = (conversationId: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  
  const addMessage = useChatStore((state) => state.addMessage);
  const appendChunkToLastMessage = useChatStore((state) => state.appendChunkToLastMessage);
  const setIsAiTyping = useChatStore((state) => state.setIsAiTyping);

  useEffect(() => {
    // 1. Instantiate the socket client
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to WebSocket server:', socket.id);
      if (conversationId) {
        socket.emit('join_room', conversationId);
      }
    });

    // Handle normal incoming messages (both from Customer, Agent, or final AI message)
    socket.on('message_received', (message: Message) => {
      addMessage(message);
    });

    // Handle token streaming from AI
    socket.on('ai_chunk', (data: { conversationId: string; text: string }) => {
      if (data.conversationId === conversationId) {
        appendChunkToLastMessage(data.text);
      }
    });

    // Handle typing status updates
    socket.on('ai_typing', (data: { typing: boolean }) => {
      setIsAiTyping(data.typing);
    });

    // Handle final AI message updates (e.g. saving final object with Mongo _id)
    socket.on('ai_response_complete', (message: Message) => {
      addMessage(message);
    });

    return () => {
      socket.disconnect();
    };
  }, [conversationId, addMessage, appendChunkToLastMessage, setIsAiTyping]);

  const sendMessage = (text: string) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('client_message', {
        conversationId,
        text,
      });
    }
  };

  return {
    sendMessage,
    isConnected: socketRef.current?.connected || false,
  };
};

export default useSocket;
