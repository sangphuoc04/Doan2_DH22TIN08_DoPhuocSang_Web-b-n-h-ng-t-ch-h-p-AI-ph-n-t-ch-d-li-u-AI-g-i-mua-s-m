// frontend/app/admin/reviews/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
    MessageSquare, AlertOctagon, ThumbsUp, ThumbsDown, MinusCircle, Search
} from 'lucide-react';

// Bảng màu chuẩn cho Cảm xúc
const COLORS = {
    "Tích cực": "#10b981", // Xanh lá
    "Trung lập": "#f59e0b", // Vàng cam
    "Tiêu cực": "#ef4444"  // Đỏ
};

export default function ReviewsAnalysisPage() {
    const [stats, setStats] = useState<any[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [details, setDetails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("Tất cả");

    useEffect(() => {
        const fetchSentimentData = async () => {
            try {
                const res = await axios.get('http://localhost:3050/dashboard/reviews-analysis');

                if (res.data.status === "success") {
                    const chartData = [
                        { name: 'Tích cực', value: res.data.stats.positive },
                        { name: 'Trung lập', value: res.data.stats.neutral },
                        { name: 'Tiêu cực', value: res.data.stats.negative }
                    ];
                    setStats(chartData);
                    setWarnings(res.data.warnings);
                    setDetails(res.data.details);
                }
            } catch (error) {
                console.error("Lỗi lấy dữ liệu AI Sentiment:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSentimentData();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-600 font-bold text-lg">AI đang đọc và phân tích hàng loạt bình luận...</p>
        </div>
    );

    // Xử lý Lọc dữ liệu Review
    const filteredDetails = filter === "Tất cả"
        ? details
        : details.filter(r => r.sentiment === filter);

    return (
        <div className="space-y-6 pb-10">
            {/* HEADER */}
            <div>
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <MessageSquare className="text-blue-600" size={32} />
                    Phân tích Đánh giá (AI Sentiment)
                </h2>
                <p className="text-gray-500 mt-1">Sử dụng Google Gemini để hiểu cảm xúc thực sự của khách hàng.</p>
            </div>

            {/* 1. KHU VỰC CẢNH BÁO ĐỎ (WARNINGS) */}
            {warnings.length > 0 && (
                <div className="bg-red-50 border-l-8 border-red-500 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-red-800 font-bold flex items-center gap-2 text-lg mb-3">
                        <AlertOctagon size={24} /> Cảnh báo chất lượng Sản phẩm!
                    </h3>
                    <ul className="space-y-2">
                        {warnings.map((warn, idx) => (
                            <li key={idx} className="text-red-700 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span> {warn}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 2. BIỂU ĐỒ BAR CHART THỐNG KÊ */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold mb-6 text-gray-800">Sức khỏe Thương hiệu (%)</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontWeight: 'bold' }} />
                            <YAxis unit="%" />
                            <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => [`${value}%`, 'Tỷ lệ']} />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={80}>
                                {stats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 3. BẢNG CHI TIẾT REVIEW (CÓ FILTER) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-800">Chi tiết Feedback khách hàng</h3>

                    {/* Bộ lọc */}
                    <div className="flex gap-2">
                        {["Tất cả", "Tích cực", "Trung lập", "Tiêu cực"].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === f
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-sm">
                                <th className="p-4 font-medium border-b w-16">ID</th>
                                <th className="p-4 font-medium border-b w-1/5">Sản phẩm</th>
                                <th className="p-4 font-medium border-b w-1/2">Nội dung khách viết</th>
                                <th className="p-4 font-medium border-b">AI Phân loại</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-700">
                            {filteredDetails.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                                        Không có đánh giá nào trong mục này.
                                    </td>
                                </tr>
                            ) : (
                                filteredDetails.map((review, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors border-b last:border-0">
                                        <td className="p-4 font-semibold">#{review.id}</td>
                                        <td className="p-4 font-medium">{review.productName}</td>
                                        <td className="p-4">{review.content}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs ${review.sentiment === 'Tích cực' ? 'bg-green-100 text-green-700' :
                                                review.sentiment === 'Tiêu cực' ? 'bg-red-100 text-red-700' :
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                {review.sentiment === 'Tích cực' && <ThumbsUp size={14} />}
                                                {review.sentiment === 'Tiêu cực' && <ThumbsDown size={14} />}
                                                {review.sentiment === 'Trung lập' && <MinusCircle size={14} />}
                                                {review.sentiment}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}