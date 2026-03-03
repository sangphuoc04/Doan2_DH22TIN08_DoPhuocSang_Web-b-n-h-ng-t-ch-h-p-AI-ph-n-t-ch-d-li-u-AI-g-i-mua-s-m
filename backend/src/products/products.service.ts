// backend/src/products/products.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { firstValueFrom, timeout } from 'rxjs';
import { HttpService } from '@nestjs/axios';

const prisma = new PrismaClient();

const VISUAL_SEARCH_TIMEOUT_MS = 32_000;

@Injectable()
export class ProductsService {
  constructor(private readonly httpService: HttpService) { }

  async findAll() {
    return prisma.product.findMany({
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    return prisma.product.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return prisma.product.create({
      data: {
        ...data,
        price: Number(data.price),
        costPrice: Number(data.costPrice),
        stock: Number(data.stock),
      },
    });
  }

  async update(id: number, data: any) {
    return prisma.product.update({
      where: { id },
      data: {
        ...data,
        price: data.price ? Number(data.price) : undefined,
        costPrice: data.costPrice ? Number(data.costPrice) : undefined,
        stock: data.stock ? Number(data.stock) : undefined,
      },
    });
  }

  async remove(id: number) {
    return prisma.product.delete({
      where: { id },
    });
  }

  async visualSearch(imageBase64: string) {
    try {
      const response = await firstValueFrom(
        this.httpService
          .post('http://127.0.0.1:8000/visual-search', {
            image_base64: imageBase64,
          })
          .pipe(timeout(VISUAL_SEARCH_TIMEOUT_MS)),
      );
      return response.data;
    } catch (error) {
      if (error?.name === 'TimeoutError') {
        console.error('>>> [PRODUCTS] Timeout khi gọi visual-search (>32s)');
        return { status: 'error', message: 'AI phân tích ảnh quá lâu, vui lòng thử lại.', data: [] };
      }
      console.error('>>> [PRODUCTS] Lỗi Visual Search:', error.message);
      return { status: 'error', message: 'Lỗi kết nối tới AI service.', data: [] };
    }
  }
}