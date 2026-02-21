import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

const prisma = new PrismaClient();

@Injectable()
export class ProductsService {
  constructor(private readonly httpService: HttpService) { }

  async findAll() {
    return prisma.product.findMany({
      orderBy: { id: 'desc' } // Lấy sản phẩm mới nhất lên đầu
    });
  }

  async visualSearch(imageBase64: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('http://127.0.0.1:8000/visual-search', {
          image_base64: imageBase64,
        }),
      );
      return response.data;
    } catch (error) {
      console.error('Lỗi Visual Search:', error);
      return { status: 'error', data: [] };
    }
  }
}