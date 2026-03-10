// backend/src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CHATBOT_TIMEOUT_MS = 20_000; // 20 giây (> Python timeout 18s)

type HistoryItem = {
  role: 'user' | 'model';
  content: string;
};

@Injectable()
export class ChatService {
  constructor(private readonly httpService: HttpService) { }

  async getHistory(userId: number) {
    return prisma.chatMessage.findMany({ // Dùng trực tiếp biến prisma
      where: { userId },
      orderBy: { createdAt: 'asc' }, // Lấy từ cũ đến mới
    });
  }

  async sendMessage(userId: any, message: string, history: HistoryItem[] = []) {
    try {
      if (userId) {
        await prisma.chatMessage.create({
          data: { userId: Number(userId), sender: 'user', message }, // ✅ Ép kiểu số
        });
      }

      const response = await firstValueFrom(
        this.httpService
          .post('http://127.0.0.1:8000/chatbot', {
            question: message,
            history: history,
          })
          .pipe(timeout(CHATBOT_TIMEOUT_MS)),
      );

      const botReply = response.data.reply;

      // 2. Lưu câu trả lời của Bot vào DB
      if (userId) {
        await prisma.chatMessage.create({
          data: { userId: Number(userId), sender: 'bot', message: botReply }, // ✅ Ép kiểu số
        });
      }
      return { reply: botReply };

    } catch (error) {
      if (error?.name === 'TimeoutError') {
        console.error('>>> [CHAT] Timeout khi gọi chatbot (>20s)');
        return { reply: 'AI đang bận xử lý, vui lòng thử lại sau vài giây nhé!' };
      }
      console.error('>>> [CHAT] Lỗi gọi AI:', error.message);
      return { reply: 'Xin lỗi, AI đang bận. Vui lòng thử lại sau.' };
    }
  }
}