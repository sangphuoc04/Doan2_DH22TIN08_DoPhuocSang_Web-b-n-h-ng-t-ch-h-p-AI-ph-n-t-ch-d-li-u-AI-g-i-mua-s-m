// frontend/app/admin/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, TrendingDown, Lightbulb, ShoppingBag, Calendar, AlertTriangle, Users,
    Download, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import CustomerSegmentationChart from './CustomerSegmentationChart/page';

const REFRESH_INTERVAL = 30; // giây

export default function AdminDashboard() {
    const [data, setData] = useState([]);
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // ✅ THÊM: state cho auto-refresh
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    const refreshRef = useRef<NodeJS.Timeout | null>(null);

    // ✅ THÊM: tách fetchData ra useCallback để dùng lại
    const fetchData = useCallback(async (isManual = false) => {
        if (isManual) {
            setIsRefreshing(true);
        }
        try {
            const response = await axios.get('http://localhost:3050/dashboard/revenue');
            setData(response.data.data);
            setAnalysis(response.data.analysis);
            setLastUpdated(new Date()); // ✅ Ghi nhận thời điểm cập nhật
        } catch (error) {
            console.error("Lỗi:", error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
            setCountdown(REFRESH_INTERVAL); // ✅ Reset đếm ngược sau mỗi lần fetch
        }
    }, []);

    // ✅ THÊM: setup auto-refresh và đếm ngược
    useEffect(() => {
        fetchData(); // Lần đầu load

        // Auto-refresh mỗi 30 giây
        refreshRef.current = setInterval(() => {
            fetchData();
        }, REFRESH_INTERVAL * 1000);

        // Đếm ngược hiển thị cho admin biết còn bao lâu refresh
        countdownRef.current = setInterval(() => {
            setCountdown(prev => (prev <= 1 ? REFRESH_INTERVAL : prev - 1));
        }, 1000);

        // Cleanup khi unmount (tránh memory leak)
        return () => {
            if (refreshRef.current) clearInterval(refreshRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [fetchData]);

    const handleExportExcel = async () => {
        try {
            const response = await axios.get('http://localhost:3050/dashboard/customer-segments');
            const details = response.data.details;

            if (!details || details.length === 0) {
                alert("Chưa có dữ liệu khách hàng để xuất!");
                return;
            }

            const exportData = details.map((user: any) => ({
                "Mã Khách Hàng": user.userId,
                "Phân Khúc AI": user.Label,
                "Ngày mua gần nhất (Recency)": user.Recency,
                "Số đơn hàng (Frequency)": user.Frequency,
                "Tổng chi tiêu VNĐ (Monetary)": user.Monetary
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            worksheet['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 25 }];
            XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachKhachHang");
            XLSX.writeFile(workbook, "Phan_Khuc_Khach_Hang_AI.xlsx");
        } catch (error) {
            console.error("Lỗi xuất Excel:", error);
            alert("Có lỗi xảy ra khi tạo file Excel!");
        }
    };

    if (loading) return <div className="p-8 text-blue-600 font-bold">Đang phân tích dữ liệu AI...</div>;

    const isGrowing = analysis?.trend === "TĂNG TRƯỞNG";

    return (
        <div className="space-y-6 pb-10">

            {/* HEADER + ✅ THÊM: thanh trạng thái refresh */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">AI Dashboard</h2>
                    <p className="text-gray-500">Phân tích dữ liệu kinh doanh & Dự báo thông minh</p>
                </div>

                {/* ✅ THÊM: nút refresh + trạng thái */}
                <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-gray-400">
                        {lastUpdated && (
                            <p>Cập nhật lúc: <span className="font-medium text-gray-600">{lastUpdated.toLocaleTimeString('vi-VN')}</span></p>
                        )}
                        <p>Tự động làm mới sau: <span className="font-medium text-blue-600">{countdown}s</span></p>
                    </div>
                    <button
                        onClick={() => fetchData(true)}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={isRefreshing ? 'animate-spin text-blue-500' : 'text-gray-500'}
                        />
                        {isRefreshing ? 'Đang cập nhật...' : 'Làm mới'}
                    </button>
                </div>
            </div>

            {/* 1. KHU VỰC TƯ VẤN CHIẾN LƯỢC */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl border-l-8 shadow-sm ${isGrowing ? 'bg-green-50 border-green-500' : 'bg-orange-50 border-orange-500'}`}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${isGrowing ? 'bg-green-200 text-green-700' : 'bg-orange-200 text-orange-700'}`}>
                            {isGrowing ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${isGrowing ? 'text-green-800' : 'text-orange-800'}`}>
                                Dự báo: {analysis?.trend} ({analysis?.growth_rate}%)
                            </h3>
                            <p className="text-gray-700 mt-2 font-medium">
                                <span className="font-bold">AI Khuyên: </span> {analysis?.advice}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-blue-50 border-l-8 border-blue-500 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-blue-200 text-blue-700">
                            <Calendar size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-blue-800">Gợi ý nhập hàng theo Mùa</h3>
                            <p className="text-gray-700 mt-2 font-medium">{analysis?.season_tip}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-112.5">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-500" /> Biểu đồ Doanh thu & Dự báo
                        {isRefreshing && (
                            <span className="ml-auto flex items-center gap-1 text-xs text-blue-500 font-normal">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                Đang cập nhật...
                            </span>
                        )}
                    </h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}tr`}
                            />
                            <Tooltip
                                formatter={(value: any, name: any) => {
                                    // ✅ FIX: name là prop name của <Line> = "Thực tế" / "AI Dự báo"
                                    // trả null để Recharts tự ẩn dòng có value null khỏi tooltip
                                    if (value === null || value === undefined) return null;
                                    const formatted = new Intl.NumberFormat('vi-VN', {
                                        style: 'currency', currency: 'VND'
                                    }).format(value);
                                    return [formatted, name];
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                name="Thực tế"
                                connectNulls={false}
                                dot={{ r: 3 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="prediction"
                                stroke="#ef4444"
                                strokeWidth={3}
                                strokeDasharray="5 5"
                                name="AI Dự báo"
                                connectNulls={false}
                                dot={{ r: 6, fill: '#ef4444', strokeWidth: 2 }}
                                activeDot={{ r: 9 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <ShoppingBag size={20} className="text-purple-500" /> Top 3 Bán Chạy
                    </h3>
                    <div className="space-y-6">
                        {analysis?.top_products?.map((prod: any, index: number) => (
                            <div key={index} className="flex items-center gap-4 border-b border-gray-100 pb-4 last:border-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                                    ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                                    #{index + 1}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800 line-clamp-1">{prod.name}</h4>
                                    <p className="text-sm text-gray-500">Đã bán: {prod.total_sold} cái</p>
                                </div>
                            </div>
                        ))}
                        {(!analysis?.top_products || analysis?.top_products.length === 0) && (
                            <p className="text-gray-400 italic">Chưa có dữ liệu bán hàng. Hãy đợi khách mua nhé!</p>
                        )}
                        {analysis?.top_products && analysis.top_products.length > 0 && (
                            <div className="pt-4 mt-2 bg-purple-50 p-4 rounded-lg">
                                <p className="text-xs text-purple-700 flex gap-2">
                                    <Lightbulb size={16} />
                                    <strong>Mẹo:</strong> Hãy chạy quảng cáo cho sản phẩm "{analysis.top_products[0].name}" để tối ưu lợi nhuận.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. KHU VỰC PHÂN KHÚC KHÁCH HÀNG */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="w-full">
                    <CustomerSegmentationChart />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Users size={20} className="text-green-500" /> Phân tích Insights
                        </h3>
                        <p className="text-gray-600 text-sm">
                            Thuật toán <strong>K-Means Clustering</strong> đang chia tập khách hàng dựa trên 3 chỉ số RFM (Recency - Thời gian mua gần nhất, Frequency - Tần suất mua, Monetary - Số tiền chi tiêu).
                        </p>
                        <ul className="mt-4 space-y-2 text-sm text-gray-700">
                            <li>🎯 <strong>VIP:</strong> Khách chi tiêu nhiều nhất. Cần chăm sóc kỹ.</li>
                            <li>⭐ <strong>Tiềm năng:</strong> Có mua hàng nhưng chưa đều. Cần gửi mã giảm giá.</li>
                            <li>⚠️ <strong>Nguy cơ rời bỏ:</strong> Đã lâu không quay lại. Cần chiến dịch Remarketing.</li>
                        </ul>
                    </div>
                    <button
                        onClick={handleExportExcel}
                        className="mt-6 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-colors shadow-sm"
                    >
                        <Download size={18} />
                        Xuất file Excel Tệp Khách Hàng
                    </button>
                </div>
            </div>

        </div>
    );
}