import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { HttpModule } from '@nestjs/axios'; // 1. IMPORT DÒNG NÀY

@Module({
  imports: [HttpModule], // 2. THÊM VÀO MẢNG IMPORTS
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule { }