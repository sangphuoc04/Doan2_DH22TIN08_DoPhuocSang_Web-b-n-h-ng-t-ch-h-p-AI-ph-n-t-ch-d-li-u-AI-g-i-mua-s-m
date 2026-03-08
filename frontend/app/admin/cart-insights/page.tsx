"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { TrendingUp, Tags } from "lucide-react";

export default function CartInsightsPage() {
    const [data, setData] = useState({ trending: [], flashsale_needed: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const response = await axios.get("http://localhost:8000/cart-insights");
                setData(response.data);
            } catch (error) {
                console.error("Lỗi lấy dữ liệu AI:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, []);

    if (loading) return <div className="p-8 text-center">Đang phân tích dữ liệu AI...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">AI Phân tích Hành vi Giỏ hàng</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CỘT 1: XU HƯỚNG */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
                    <div className="flex items-center gap-2 mb-4 text-green-600">
                        <TrendingUp size={24} />
                        <h2 className="text-xl font-bold">Xu hướng mua sắm</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Sản phẩm được thêm vào giỏ nhiều, khả năng chốt đơn cao.</p>

                    <div className="space-y-4">
                        {data.trending.map((item: any) => (
                            <div key={item.id} className="flex gap-4 items-center p-3 bg-green-50 rounded-lg">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                                    <p className="text-sm text-green-700">{item.reason}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600">+{item.adds_count} Thêm</p>
                                </div>
                            </div>
                        ))}
                        {data.trending.length === 0 && <p className="text-gray-400 text-sm">Chưa có dữ liệu xu hướng.</p>}
                    </div>
                </div>

                {/* CỘT 2: CẦN FLASHSALE */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
                    <div className="flex items-center gap-2 mb-4 text-red-500">
                        <Tags size={24} />
                        <h2 className="text-xl font-bold">Giá cao - Cần Flashsale</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Sản phẩm bị khách hàng huỷ/xoá khỏi giỏ hàng nhiều lần.</p>

                    <div className="space-y-4">
                        {data.flashsale_needed.map((item: any) => (
                            <div key={item.id} className="flex gap-4 items-center p-3 bg-red-50 rounded-lg">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                                    <p className="text-sm text-red-600">{item.reason}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-red-500">-{item.removes_count} Xoá</p>
                                    <button className="mt-2 text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">
                                        Tạo mã giảm giá
                                    </button>
                                </div>
                            </div>
                        ))}
                        {data.flashsale_needed.length === 0 && <p className="text-gray-400 text-sm">Không có sản phẩm nào bị bỏ rơi nhiều.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}