export interface User {
  id: string;
  name: string;
  roomId: string;
}

export interface Message {
  roomId: string;
  message: string;
  sender: string;
  senderName: string;
  timestamp?: Date;
}

export interface Room {
  id: string;
  users: User[];
} 