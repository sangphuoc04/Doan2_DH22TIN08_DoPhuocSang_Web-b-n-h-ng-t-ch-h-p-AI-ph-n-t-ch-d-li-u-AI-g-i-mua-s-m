import { Controller, Post, Body, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(@Req() req, @Body() createOrderDto: any) {

    // 1. Lấy ID an toàn với dấu chấm hỏi (?) để tránh crash app nếu req.user bị thiếu
    const userId = req.user?.userId || req.user?.id || req.user?.sub;

    // 2. Kiểm tra nếu vẫn không có userId thì báo lỗi ngay lập tức
    if (!userId) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    // 3. Tiến hành tạo đơn hàng (Ép kiểu userId về số)
    const newOrder = await this.ordersService.create(createOrderDto, Number(userId));

    // 4. Xử lý thanh toán ZaloPay
    if (createOrderDto.paymentMethod === 'ZALOPAY') {
      const zaloPayInfo = await this.ordersService.createZaloPayOrder(newOrder.id, newOrder.totalAmount);
      return {
        message: 'Đang chuyển hướng sang ZaloPay...',
        order: newOrder,
        paymentUrl: zaloPayInfo.order_url
      };
    }

    // 5. Thanh toán COD
    return {
      message: 'Đặt hàng thành công!',
      order: newOrder
    };
  }
}