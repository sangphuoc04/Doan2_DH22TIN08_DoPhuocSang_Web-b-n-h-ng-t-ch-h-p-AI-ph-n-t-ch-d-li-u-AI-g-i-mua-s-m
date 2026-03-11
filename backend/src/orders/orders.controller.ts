import { Controller, Post, Body, Req, UseGuards, UnauthorizedException, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(@Req() req, @Body() createOrderDto: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }
    const newOrder = await this.ordersService.create(createOrderDto, Number(userId));
    if (createOrderDto.paymentMethod === 'ZALOPAY') {
      const zaloPayInfo = await this.ordersService.createZaloPayOrder(newOrder.id, newOrder.totalAmount);
      return {
        message: 'Đang chuyển hướng sang ZaloPay...',
        order: newOrder,
        paymentUrl: zaloPayInfo.order_url
      };
    }
    return {
      message: 'Đặt hàng thành công!',
      order: newOrder
    };
  }
  // Bổ sung API xác nhận thanh toán
  @UseGuards(JwtAuthGuard)
  @Get('confirm-payment')
  async confirmPayment(@Req() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.ordersService.confirmLatestOrder(Number(userId));
  }
}