import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Post('visual-search')
  async visualSearch(@Body() body: { image_base64: string }) {
    // THÊM DÒNG NÀY ĐỂ TRACKING:
    console.log('>>> [NESTJS] Đã nhận được ảnh từ Client! Kích thước:', body.image_base64.length);
    console.log('>>> [NESTJS] Đang chuyển phát nhanh sang Python (Cổng 8000)...');

    return this.productsService.visualSearch(body.image_base64);
  }
}
