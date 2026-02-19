// frontend/app/admin/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, TrendingDown, Lightbulb, ShoppingBag, Calendar, AlertTriangle
} from 'lucide-react';
import axios from 'axios';

export default function AdminDashboard() {
    const [data, setData] = useState([]);
    const [analysis, setAnalysis] = useState<any>(null); // Chứa lời khuyên AI
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:3050/dashboard/revenue');
                setData(response.data.data);
                setAnalysis(response.data.analysis);
            } catch (error) {
                console.error("Lỗi:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-blue-600 font-bold">Đang phân tích dữ liệu AI...</div>;

    const isGrowing = analysis?.trend === "TĂNG TRƯỞNG";

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div>
                <h2 className="text-3xl font-bold text-gray-800">AI Dashboard</h2>
                <p className="text-gray-500">Phân tích dữ liệu kinh doanh & Dự báo thông minh</p>
            </div>

            {/* 1. KHU VỰC TƯ VẤN CHIẾN LƯỢC (FEATURE MỚI) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Card A: Chiến lược nhập hàng (Dựa trên Dự báo) */}
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

                {/* Card B: Gợi ý theo mùa (Seasonality) */}
                <div className="p-6 rounded-2xl bg-blue-50 border-l-8 border-blue-500 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-blue-200 text-blue-700">
                            <Calendar size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-blue-800">Gợi ý Mùa vụ</h3>
                            <p className="text-gray-700 mt-2 font-medium">
                                {analysis?.season_tip}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. BIỂU ĐỒ & TOP SẢN PHẨM */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Biểu đồ (Chiếm 2 phần) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-112.5">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-500" /> Biểu đồ Doanh thu & Dự báo
                    </h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                            <Tooltip formatter={(value: number | undefined) => value !== undefined ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value) : ''} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} name="Thực tế" />
                            <Line type="monotone" dataKey="prediction" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" name="AI Dự báo" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Top 3 Sản phẩm (Chiếm 1 phần) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <ShoppingBag size={20} className="text-purple-500" /> Top 3 Bán Chạy
                    </h3>
                    <div className="space-y-6">
                        {analysis?.top_products?.map((prod: any, index: number) => (
                            <div key={index} className="flex items-center gap-4 border-b border-gray-100 pb-4 last:border-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                  ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}
                `}>
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

                        {/* SỬA Ở ĐÂY: Chỉ hiện "Mẹo AI" nếu danh sách Top Sản Phẩm lớn hơn 0 */}
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
        </div>
    );
}