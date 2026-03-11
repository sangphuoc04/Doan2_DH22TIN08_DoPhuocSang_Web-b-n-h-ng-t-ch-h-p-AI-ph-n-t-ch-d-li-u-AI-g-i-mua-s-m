import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import moment from 'moment';

const prisma = new PrismaClient();

@Injectable()
export class OrdersService {

  async create(createOrderDto: any, userId: number) {
    const newOrder = await prisma.order.create({
      data: {
        userId: userId,
        totalAmount: createOrderDto.totalAmount,
        status: 'PENDING',
        shippingAddress: createOrderDto.shippingAddress,
        phoneNumber: createOrderDto.phoneNumber,
        paymentMethod: createOrderDto.paymentMethod,
        items: {
          create: createOrderDto.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: { items: true }
    });

    // Xóa giỏ hàng sau khi đặt
    await prisma.cartItem.deleteMany({
      where: { cart: { userId: userId } }
    });

    return newOrder;
  }

  // 2. CHỐT ĐƠN VÀ CỘNG DOANH THU KHI VỀ TRANG SUCCESS
  async confirmLatestOrder(userId: number) {
    // Tìm đơn PENDING mới nhất
    const latestOrder = await prisma.order.findFirst({
      where: { userId: userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestOrder) return { message: "Không có đơn hàng cần xác nhận" };

    // Tự động phân loại: ZaloPay -> Hoàn thành (tăng doanh thu), COD -> Đang xử lý
    const newStatus = latestOrder.paymentMethod === 'ZALOPAY' ? 'COMPLETED' : 'PROCESSING';

    return prisma.order.update({
      where: { id: latestOrder.id },
      data: { status: newStatus }
    });
  }

  async createZaloPayOrder(orderId: number, amount: number) {
    const config = {
      app_id: "2553",
      key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
      key2: "kLtgPl8YESDrtKVju65pTbn0PNOIM9sX",
      endpoint: "https://sb-openapi.zalopay.vn/v2/create"
    };

    const embed_data = { redirecturl: "http://localhost:3000/checkout/success" };
    const items = [{}];
    const transID = Math.floor(Math.random() * 1000000);
    const app_trans_id = `${moment().format('YYMMDD')}_${transID}`;

    const order = {
      app_id: config.app_id,
      app_trans_id: app_trans_id,
      app_user: "user123",
      app_time: Date.now(),
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      amount: amount,
      description: `Thanh toán đơn hàng #${orderId}`,
      bank_code: "",
      mac: ""
    };

    const data = config.app_id + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    const response = await axios.post(config.endpoint, null, { params: order });
    return {
      order_url: response.data.order_url,
    };
  }
}