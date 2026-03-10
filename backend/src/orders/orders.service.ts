// backend/src/orders/orders.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import moment from 'moment';

const prisma = new PrismaClient();

@Injectable()
export class OrdersService {
  // Cập nhật hàm create trong OrdersService
  async create(createOrderDto: any, userId: number) {
    try {
      const newOrder = await prisma.order.create({
        data: {
          userId: userId, // Lấy từ Token người dùng đang đăng nhập
          totalAmount: createOrderDto.totalAmount,
          status: "PENDING", // Mặc định là chờ xử lý
          shippingAddress: createOrderDto.shippingAddress,
          phoneNumber: createOrderDto.phoneNumber,
          paymentMethod: createOrderDto.paymentMethod,

          // Lưu danh sách sản phẩm vào bảng OrderItem
          items: {
            create: createOrderDto.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          items: true // Trả về kèm danh sách sản phẩm vừa tạo
        }
      });

      // Sau khi tạo đơn hàng thành công, xóa giỏ hàng của user
      await prisma.cartItem.deleteMany({
        where: { cart: { userId: userId } }
      });

      return newOrder;
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      throw new Error("Không thể tạo đơn hàng, vui lòng kiểm tra lại dữ liệu.");
    }
  }


  async createZaloPayOrder(orderId: number, amount: number) {
    const config = {
      app_id: "2553",
      key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
      key2: "kLtgPl8YESDrtKVju65pTbn0PNOIM9sX",
      endpoint: "https://sb-openapi.zalopay.vn/v2/create"
    };

    const embed_data = {
      // Đặt URL để ZaloPay chuyển hướng về sau khi thanh toán xong trên web
      redirecturl: "http://localhost:3000/checkout/success"
    };

    const items = [{}]; // Có thể truyền danh sách sản phẩm vào đây nếu muốn chi tiết
    const transID = Math.floor(Math.random() * 1000000);
    const app_trans_id = `${moment().format('YYMMDD')}_${transID}`;

    const order = {
      app_id: config.app_id,
      app_trans_id: app_trans_id, // Mã giao dịch của bạn (phải duy nhất)
      app_user: "user123", // Tên user
      app_time: Date.now(),
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      amount: amount, // Số tiền thanh toán
      description: `Lazada - Thanh toán đơn hàng #${orderId}`,
      bank_code: "", // Để trống để khách tự chọn kênh thanh toán
      mac: ""
    };

    // 1. Tạo chữ ký bảo mật (MAC) theo chuẩn ZaloPay
    const data = config.app_id + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    try {
      // 2. Gọi API ZaloPay
      const response = await axios.post(config.endpoint, null, { params: order });

      // 3. ZaloPay trả về order_url
      return {
        app_trans_id: app_trans_id,
        order_url: response.data.order_url, // URL để người dùng quét QR
        zp_trans_token: response.data.zp_trans_token,
      };
    } catch (error) {
      console.error("Lỗi tạo đơn ZaloPay:", error);
      throw new BadRequestException('Không thể khởi tạo thanh toán ZaloPay');
    }
  }
}