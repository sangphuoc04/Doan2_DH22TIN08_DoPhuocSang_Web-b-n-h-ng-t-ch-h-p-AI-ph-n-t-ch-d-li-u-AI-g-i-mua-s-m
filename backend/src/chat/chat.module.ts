// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule], // Nhớ thêm cái này
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule { }