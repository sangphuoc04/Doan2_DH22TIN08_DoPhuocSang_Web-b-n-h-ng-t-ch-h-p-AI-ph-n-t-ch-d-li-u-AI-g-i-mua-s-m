import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DashboardService {
  constructor(private readonly httpService: HttpService) { }

  async getRevenueStats() {
    try {
      // Gọi sang Python
      const response = await firstValueFrom(
        this.httpService.get('http://127.0.0.1:8000/predict-revenue'),
      );
      return response.data;
    } catch (error) {
      console.error('Lỗi gọi AI:', error);
      return { data: [] };
    }
  }
}