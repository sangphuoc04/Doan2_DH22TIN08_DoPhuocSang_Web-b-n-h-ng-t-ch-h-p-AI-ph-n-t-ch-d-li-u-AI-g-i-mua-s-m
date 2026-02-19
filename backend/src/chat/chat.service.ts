// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ChatService {
  constructor(private readonly httpService: HttpService) { }

  async sendMessage(message: string) {
    try {
      // Gọi sang Python Service đang chạy ở port 8000
      const response = await firstValueFrom(
        this.httpService.post('http://127.0.0.1:8000/chatbot', {
          question: message,
        }),
      );
      return response.data; // Trả về { reply: "..." }
    } catch (error) {
      console.error('Lỗi gọi AI:', error.message);
      return { reply: 'Xin lỗi, AI đang bận. Vui lòng thử lại sau.' };
    }
  }
}