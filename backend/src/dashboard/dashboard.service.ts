import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DashboardService {
  constructor(private readonly httpService: HttpService) { }

  async getRevenueStats() {
    try {
      const response = await firstValueFrom(
        this.httpService.get('http://127.0.0.1:8000/predict-revenue'),
      );
      return response.data;
    } catch (error) {
      console.error('Lỗi gọi AI Predict Revenue:', error);
      return { data: [] };
    }
  }

  // THÊM MỚI: Lấy dữ liệu phân khúc khách hàng từ Python
  async getCustomerSegments() {
    try {
      // Chỉ cần gọi GET sang Python Service, Python sẽ tự lo phần lấy data và tính K-Means
      const response = await firstValueFrom(
        this.httpService.get('http://127.0.0.1:8000/customer-segments'),
      );
      return response.data;
    } catch (error) {
      console.error('Lỗi gọi AI Customer Segmentation:', error);
      return { status: "error", chart_data: [], details: [] };
    }
  }
}