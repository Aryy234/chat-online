export interface User {
  id: string;
  username: string;
}

export interface Message {
  id: string;
  text: string;
  userId: string;
  username: string;
  roomId: string;
  timestamp: string;
} 