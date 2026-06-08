import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5005') + '/api';

// Payload Types
export interface MessagePayload {
  _id?: string;
  conversationId: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

export interface ChatMessageResponse {
  success: boolean;
  data: {
    reply: string;
    sessionId: string;
  };
  timestamp: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  data: {
    sessionId: string;
    messages: MessagePayload[];
  };
  timestamp: string;
}

// Instantiate Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure Custom Retry Strategy Interceptor
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // Delay in milliseconds between retries

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as any;
    
    if (!config) {
      return Promise.reject(error);
    }

    config.retryCount = config.retryCount || 0;

    // Retry only on network/connection errors or 5xx server issues
    const isNetworkOrServerError = !error.response || (error.response.status >= 500 && error.response.status <= 599);

    if (isNetworkOrServerError && config.retryCount < MAX_RETRIES) {
      config.retryCount += 1;
      console.warn(`[API Client] Attempt failed. Retrying request (${config.retryCount}/${MAX_RETRIES}) in ${RETRY_DELAY}ms...`);
      
      // Await retry backoff timer
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

// REST API Service Layer Wrapper
export const ChatApiService = {
  async sendMessage(message: string, sessionId?: string): Promise<ChatMessageResponse> {
    const response = await apiClient.post<ChatMessageResponse>('/chat/message', {
      message,
      sessionId,
    });
    return response.data;
  },

  async getHistory(sessionId: string): Promise<ChatHistoryResponse> {
    const response = await apiClient.get<ChatHistoryResponse>(`/chat/history/${sessionId}`);
    return response.data;
  },
};

export default ChatApiService;
