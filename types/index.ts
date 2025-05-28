export interface ChatMessage {
  id: string;
  content: string;
  user: {
    name: string;
  };
  createdAt: string;
}

export interface User {
  id: string;
  created_at: Date;
  username: string;
  email: string;
  password: string | null;
  is_anonymous: boolean;
}
