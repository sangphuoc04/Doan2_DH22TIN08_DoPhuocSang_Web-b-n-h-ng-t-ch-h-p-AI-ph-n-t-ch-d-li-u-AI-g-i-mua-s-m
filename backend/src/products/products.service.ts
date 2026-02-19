import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ProductsService {
  async findAll() {
    return prisma.product.findMany({
      orderBy: { id: 'desc' } // Lấy sản phẩm mới nhất lên đầu
    });
  }
}