'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

type Toast = {
    id: number;
    type: 'success' | 'error';
    message: string;
};

export default function CartPage() {
    const [cart, setCart] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState<Toast[]>([]);

    // State lưu trữ ID sản phẩm đang trong trạng thái "chờ xác nhận xoá"
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);

    const showToast = useCallback((type: 'success' | 'error', message: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }

                const res = await axios.get('http://localhost:3050/cart', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setCart(res.data);
            } catch (error) {
                console.error('Lỗi khi tải giỏ hàng', error);
                showToast('error', 'Không thể tải giỏ hàng!');
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, [showToast]);

    const handleRemoveItem = async (productId: number, productName: string) => {
        // Lần 1: Yêu cầu xác nhận
        if (confirmingDeleteId !== productId) {
            setConfirmingDeleteId(productId);
            // Tự động huỷ trạng thái xác nhận sau 3 giây
            setTimeout(() => setConfirmingDeleteId(null), 3000);
            return;
        }

        // Lần 2: Tiến hành xoá
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3050/cart/${cart.userId}/product/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setCart((prevCart: any) => ({
                ...prevCart,
                items: prevCart.items.filter((item: any) => item.productId !== productId)
            }));
            setConfirmingDeleteId(null);
            showToast('success', `Đã xoá ${productName} khỏi giỏ hàng!`);
        } catch (error) {
            console.error('Lỗi khi xoá sản phẩm khỏi giỏ hàng', error);
            showToast('error', 'Có lỗi xảy ra khi huỷ sản phẩm!');
            setConfirmingDeleteId(null);
        }
    };

    if (loading) {
        return <div className="min-h-screen pt-32 text-center text-xl font-semibold">Đang tải giỏ hàng... 🛒</div>;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Khu vực chứa Toast Notifications */}
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
                    {toasts.map(toast => (
                        <div
                            key={toast.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
                                min-w-75 max-w-100 pointer-events-auto
                                animate-in slide-in-from-right-5 fade-in duration-300
                                ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
                        >
                            {toast.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                            <span className="flex-1">{toast.message}</span>
                            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="pt-32 pb-12 flex flex-col items-center justify-center">
                    <div className="text-6xl mb-6">🛒</div>
                    <h1 className="text-2xl font-bold mb-4 text-gray-800">Giỏ hàng của bạn đang trống</h1>
                    <p className="text-gray-500 mb-8">Hãy tìm thêm những sản phẩm tuyệt vời nhé!</p>
                    <Link href="/" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all">
                        Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        );
    }

    const totalAmount = cart.items.reduce(
        (sum: number, item: any) => sum + (item.product.price * item.quantity),
        0
    );

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            {/* Khu vực chứa Toast Notifications */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
                            min-w-75 max-w-100 pointer-events-auto
                            animate-in slide-in-from-right-5 fade-in duration-300
                            ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
                    >
                        {toast.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                        <span className="flex-1">{toast.message}</span>
                        <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Giỏ hàng của bạn</h1>

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {cart.items.map((item: any) => (
                            <li key={item.id} className="p-6 flex items-center gap-6 hover:bg-gray-50 transition-colors relative">
                                <button
                                    onClick={() => handleRemoveItem(item.productId, item.product.name)}
                                    className={`absolute top-4 right-6 font-semibold text-sm transition-all px-3 py-1.5 rounded-md
                                        ${confirmingDeleteId === item.productId
                                            ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                                            : 'text-red-500 hover:bg-red-50'}`}
                                    title="Huỷ sản phẩm"
                                >
                                    {confirmingDeleteId === item.productId ? 'Xác nhận xoá?' : '✕ Huỷ'}
                                </button>

                                <div className="w-24 h-24 shrink-0 bg-gray-100 rounded-xl overflow-hidden mt-2">
                                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                </div>

                                <div className="flex-1 mt-2">
                                    <h3 className="text-lg font-bold text-gray-900 pr-8">{item.product.name}</h3>
                                    <p className="text-gray-500 text-sm mt-1">Đơn giá: {item.product.price.toLocaleString('vi-VN')} đ</p>
                                </div>

                                <div className="text-center px-4 mt-2">
                                    <p className="text-sm text-gray-500 font-medium">Số lượng</p>
                                    <p className="text-xl font-bold text-gray-900 mt-1">x{item.quantity}</p>
                                </div>

                                <div className="text-right pl-4 mt-2">
                                    <p className="text-xl font-bold text-blue-600">
                                        {(item.product.price * item.quantity).toLocaleString('vi-VN')} đ
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="bg-gray-100 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200">
                        <div>
                            <p className="text-gray-500 text-lg">Tổng thanh toán:</p>
                            <p className="text-3xl font-extrabold text-red-600">
                                {totalAmount.toLocaleString('vi-VN')} đ
                            </p>
                        </div>

                        <button className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg transition-transform active:scale-95">
                            TIẾN HÀNH ĐẶT HÀNG
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}