import { WebSocket } from "ws";

export interface ChatMessage {
  id: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: number;
  userId?: string;
  badges?: string[];
}

export interface ChatUser {
  id: string;
  username: string;
  avatar?: string;
  ws: WebSocket;
}

class ChatService {
  private clients: Map<string, ChatUser> = new Map();
  private messages: ChatMessage[] = [];
  private readonly MAX_MESSAGES = 100;

  addClient(userId: string, username: string, avatar: string | undefined, ws: WebSocket) {
    this.clients.set(userId, { id: userId, username, avatar, ws });
    console.log(`[Chat] User joined: ${username} (Total: ${this.clients.size})`);

    // Send recent messages to the new user
    ws.send(JSON.stringify({
      type: 'history',
      messages: this.messages.slice(-50) // Last 50 messages
    }));

    // Broadcast join message (IRC-style)
    this.broadcast({
      type: 'system',
      message: `* ${username} has joined the chat`,
      timestamp: Date.now()
    });

    // Broadcast user count update
    this.broadcastUserCount();
  }

  removeClient(userId: string) {
    const user = this.clients.get(userId);
    if (user) {
      console.log(`[Chat] User left: ${user.username} (Total: ${this.clients.size - 1})`);
      this.clients.delete(userId);

      // Broadcast leave message (IRC-style)
      this.broadcast({
        type: 'system',
        message: `* ${user.username} has left the chat`,
        timestamp: Date.now()
      });

      this.broadcastUserCount();
    }
  }

  sendMessage(userId: string, message: string) {
    const user = this.clients.get(userId);
    if (!user) {
      console.error(`[Chat] User not found: ${userId}`);
      return;
    }

    // Create message object
    const chatMessage: ChatMessage = {
      id: `${Date.now()}-${userId}`,
      username: user.username,
      avatar: user.avatar,
      message: message.trim(),
      timestamp: Date.now(),
      userId: userId,
      badges: []
    };

    // Add to message history
    this.messages.push(chatMessage);

    // Keep only last MAX_MESSAGES
    if (this.messages.length > this.MAX_MESSAGES) {
      this.messages = this.messages.slice(-this.MAX_MESSAGES);
    }

    // Broadcast to all clients
    this.broadcast({
      type: 'message',
      message: chatMessage
    });

    console.log(`[Chat] ${user.username}: ${message}`);
  }

  private broadcast(data: any) {
    const payload = JSON.stringify(data);
    this.clients.forEach((user) => {
      if (user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(payload);
      }
    });
  }

  private broadcastUserCount() {
    this.broadcast({
      type: 'user_count',
      count: this.clients.size
    });
  }

  getUserCount(): number {
    return this.clients.size;
  }

  getMessages(): ChatMessage[] {
    return this.messages.slice(-50);
  }
}

export const chatService = new ChatService();
