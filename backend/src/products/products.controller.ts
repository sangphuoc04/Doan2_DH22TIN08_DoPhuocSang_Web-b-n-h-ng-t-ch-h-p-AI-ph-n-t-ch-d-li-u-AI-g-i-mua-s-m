import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('categories')
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get('category/:name')
  findByCategory(@Param('name') name: string) {
    return this.productsService.findByCategory(name);
  }

  @Get('search')
  async search(@Query('q') q: string) {
    if (!q) return [];
    return this.productsService.searchProducts(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Post()
  create(@Body() createProductDto: any) {
    return this.productsService.create(createProductDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: any) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  @Post('visual-search')
  async visualSearch(@Body() body: { image_base64: string }) {
    console.log('>>> [NESTJS] Đã nhận được ảnh từ Client! Kích thước:', body.image_base64.length);
    console.log('>>> [NESTJS] Đang chuyển phát nhanh sang Python (Cổng 8000)...');

    return this.productsService.visualSearch(body.image_base64);
  }
}
