// backend/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';

// ✅ THÊM: timeout tập trung một chỗ, dễ chỉnh sau này
const PYTHON_TIMEOUT_MS = 15_000; // 15 giây

@Injectable()
export class DashboardService {
  constructor(private readonly httpService: HttpService) { }

  async getRevenueStats() {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get('http://127.0.0.1:8000/predict-revenue')
          .pipe(timeout(PYTHON_TIMEOUT_MS)), // ✅ THÊM timeout
      );
      return response.data;
    } catch (error) {
      // ✅ FIX: log lỗi rõ hơn, phân biệt timeout vs lỗi khác
      if (error?.name === 'TimeoutError') {
        console.error('>>> [DASHBOARD] Timeout khi gọi predict-revenue (>15s)');
        return { data: [], analysis: { trend: 'CHƯA RÕ', advice: 'Python service timeout', top_products: [] } };
      }
      console.error('>>> [DASHBOARD] Lỗi gọi predict-revenue:', error.message);
      return { data: [] };
    }
  }

  async getCustomerSegments() {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get('http://127.0.0.1:8000/customer-segments')
          .pipe(timeout(PYTHON_TIMEOUT_MS)), // ✅ THÊM timeout
      );
      return response.data;
    } catch (error) {
      if (error?.name === 'TimeoutError') {
        console.error('>>> [DASHBOARD] Timeout khi gọi customer-segments (>15s)');
        return { status: 'error', message: 'Python service timeout', chart_data: [], details: [] };
      }
      console.error('>>> [DASHBOARD] Lỗi gọi customer-segments:', error.message);
      return { status: 'error', chart_data: [], details: [] };
    }
  }

  async getReviewsAnalysis() {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get('http://127.0.0.1:8000/analyze-reviews')
          .pipe(timeout(PYTHON_TIMEOUT_MS)), // ✅ THÊM timeout
      );
      return response.data;
    } catch (error) {
      if (error?.name === 'TimeoutError') {
        console.error('>>> [DASHBOARD] Timeout khi gọi analyze-reviews (>15s)');
        return { status: 'error', message: 'Python service timeout', stats: {}, warnings: [], details: [] };
      }
      console.error('>>> [DASHBOARD] Lỗi gọi analyze-reviews:', error.message);
      return { status: 'error', stats: {}, warnings: [], details: [] };
    }
  }
}