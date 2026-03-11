"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SuccessPage() {
    const [status, setStatus] = useState("Đang xác nhận thanh toán...");

    useEffect(() => {
        const confirmOrder = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                // Gọi API xác nhận chốt đơn để tăng doanh thu
                await fetch("http://localhost:3050/orders/confirm-payment", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setStatus("Thanh toán thành công! Đơn hàng đã được ghi nhận.");
            } catch (error) {
                setStatus("Có lỗi xảy ra khi xác nhận đơn hàng.");
            }
        };

        confirmOrder();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{status}</h1>
            <p className="text-gray-500 mb-8">Cảm ơn bạn đã mua sắm tại cửa hàng của chúng tôi.</p>
            <Link href="/" className="px-8 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition shadow">
                TIẾP TỤC MUA SẮM
            </Link>
        </div>
    );
}