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

  // THÊM MỚI: Gọi AI phân tích cảm xúc đánh giá (Feature 4)
  async getReviewsAnalysis() {
    try {
      const response = await firstValueFrom(
        // NestJS gọi nội bộ sang port 8000 của Python
        this.httpService.get('http://127.0.0.1:8000/analyze-reviews'),
      );
      return response.data;
    } catch (error) {
      console.error('Lỗi gọi AI Sentiment Analysis:', error);
      // Trả về format rỗng an toàn nếu lỗi mạng để Frontend không bị sập
      return { status: "error", stats: {}, warnings: [], details: [] };
    }
  }
}