'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function CartPage() {
    const [cart, setCart] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, []);

    // Hàm xử lý việc huỷ/xoá sản phẩm khỏi giỏ hàng
    const handleRemoveItem = async (productId: number) => {
        const confirmDelete = window.confirm("Bạn có chắc chắn muốn bỏ sản phẩm này khỏi giỏ hàng?");
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            // Gọi API Delete, cart.userId đã có sẵn từ dữ liệu cart được fetch về
            await axios.delete(`http://localhost:3050/cart/${cart.userId}/product/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Cập nhật lại giao diện ngay lập tức bằng cách lọc bỏ sản phẩm vừa xoá
            setCart((prevCart: any) => ({
                ...prevCart,
                items: prevCart.items.filter((item: any) => item.productId !== productId)
            }));
        } catch (error) {
            console.error('Lỗi khi xoá sản phẩm khỏi giỏ hàng', error);
            alert('Có lỗi xảy ra khi huỷ sản phẩm!');
        }
    };

    if (loading) {
        return <div className="min-h-screen pt-32 text-center text-xl font-semibold">Đang tải giỏ hàng... 🛒</div>;
    }

    // Trường hợp chưa đăng nhập hoặc giỏ hàng trống
    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="min-h-screen pt-32 pb-12 flex flex-col items-center justify-center">
                <div className="text-6xl mb-6">🛒</div>
                <h1 className="text-2xl font-bold mb-4 text-gray-800">Giỏ hàng của bạn đang trống</h1>
                <p className="text-gray-500 mb-8">Hãy tìm thêm những sản phẩm tuyệt vời nhé!</p>
                <Link href="/" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all">
                    Tiếp tục mua sắm
                </Link>
            </div>
        );
    }

    // Tính tổng tiền thanh toán
    const totalAmount = cart.items.reduce(
        (sum: number, item: any) => sum + (item.product.price * item.quantity),
        0
    );

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Giỏ hàng của bạn</h1>

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {cart.items.map((item: any) => (
                            <li key={item.id} className="p-6 flex items-center gap-6 hover:bg-gray-50 transition-colors relative">
                                {/* Nút Huỷ sản phẩm (Dấu X hoặc chữ Huỷ) */}
                                <button
                                    onClick={() => handleRemoveItem(item.productId)}
                                    className="absolute top-4 right-6 text-red-500 hover:text-red-700 font-semibold text-sm transition-all"
                                    title="Huỷ sản phẩm"
                                >
                                    ✕ Huỷ
                                </button>

                                {/* Hình ảnh */}
                                <div className="w-24 h-24 shrink-0 bg-gray-100 rounded-xl overflow-hidden mt-2">
                                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                </div>

                                {/* Thông tin sản phẩm */}
                                <div className="flex-1 mt-2">
                                    <h3 className="text-lg font-bold text-gray-900 pr-8">{item.product.name}</h3>
                                    <p className="text-gray-500 text-sm mt-1">Đơn giá: {item.product.price.toLocaleString('vi-VN')} đ</p>
                                </div>

                                {/* Số lượng */}
                                <div className="text-center px-4 mt-2">
                                    <p className="text-sm text-gray-500 font-medium">Số lượng</p>
                                    <p className="text-xl font-bold text-gray-900 mt-1">x{item.quantity}</p>
                                </div>

                                {/* Thành tiền */}
                                <div className="text-right pl-4 mt-2">
                                    <p className="text-xl font-bold text-blue-600">
                                        {(item.product.price * item.quantity).toLocaleString('vi-VN')} đ
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Phần tổng kết và Thanh toán */}
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