export interface ChatMessage {
  id: string;
  content: string;
  user: {
    name: string;
  };
  createdAt: string; // Make sure this is always a string
}

export interface DatabaseMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  users?: {
    username: string;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  is_online?: boolean;
  last_active?: string;
  created_at?: string;
}
