// backend/src/chat/chat.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

type HistoryItem = {
  role: 'user' | 'model';
  content: string;
};

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Post()
  sendMessage(
    @Body('message') message: string,
    @Body('history') history: HistoryItem[] = [],
  ) {
    return this.chatService.sendMessage(message, history);
  }
}