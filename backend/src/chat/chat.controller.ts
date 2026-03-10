// backend/src/chat/chat.controller.ts
import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type HistoryItem = {
  role: 'user' | 'model';
  content: string;
};

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  getHistory(@Req() req) {
    // ✅ Đổi req.user.id thành req.user.sub
    return this.chatService.getHistory(Number(req.user.sub));
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  sendMessage(
    @Req() req,
    @Body('message') message: string,
    @Body('history') history: HistoryItem[] = [],
  ) {
    // ✅ Đổi req.user.id thành req.user.sub
    return this.chatService.sendMessage(Number(req.user.sub), message, history);
  }
}