import { Controller, Post, Body, Req, UseGuards, Get, Delete, Param } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Đường dẫn có thể khác tùy thư mục của bạn

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addToCart(@Req() req, @Body() body: { productId: number; quantity: number }) {
    console.log("Dữ liệu user từ Token:", req.user);
    const userId = req.user.userId || req.user.id || req.user.sub;
    if (!userId) {
      throw new Error("Không tìm thấy User ID trong token");
    }
    return await this.cartService.addToCart(Number(userId), body.productId, body.quantity);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCart(@Req() req) {
    const userId = req.user.userId || req.user.id || req.user.sub;
    return await this.cartService.getCart(Number(userId));
  }

  @Delete(':userId/product/:productId')
  async removeFromCart(
    @Param('userId') userId: string,
    @Param('productId') productId: string
  ) {
    return await this.cartService.removeFromCart(Number(userId), Number(productId));
  }
}