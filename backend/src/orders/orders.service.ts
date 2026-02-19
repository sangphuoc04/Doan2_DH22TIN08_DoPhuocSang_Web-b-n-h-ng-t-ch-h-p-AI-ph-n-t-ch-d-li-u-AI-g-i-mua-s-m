// backend/src/orders/orders.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class OrdersService {
  async create(createOrderDto: any) {
    const { productId, quantity, totalAmount } = createOrderDto;

    // 1. LẤY DANH SÁCH USER ID THẬT TỪ DATABASE
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    if (users.length === 0) {
      throw new Error("Không có User nào trong DB!");
    }

    // 2. CHỌN NGẪU NHIÊN 1 USER TỪ DANH SÁCH THẬT
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const validUserId = randomUser.id;

    // 3. TẠO ĐƠN HÀNG VỚI ID HỢP LỆ (SỬA Ở ĐOẠN NÀY)
    const newOrder = await prisma.order.create({
      data: {
        userId: validUserId,
        totalAmount: totalAmount,
        status: 'COMPLETED',
        items: {
          create: {
            productId: productId,
            quantity: quantity,
            price: totalAmount / quantity,
          },
        },
      },
      include: { items: true } // <-- BẢO PRISMA LẤY LUÔN CHI TIẾT ĐỂ KIỂM TRA
    });

    // 4. IN RA TERMINAL ĐỂ THEO DÕI
    console.log("🛒 Đã tạo đơn mới thành công:", newOrder);

    // 5. TRẢ KẾT QUẢ VỀ CHO FRONTEND
    return newOrder;
  }
}