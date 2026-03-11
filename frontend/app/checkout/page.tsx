"use client";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Import hook để chuyển trang

export default function CheckoutPage() {
    const { cart, totalPrice } = useCart();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        address: "",
        phone: "",
        paymentMethod: "COD", // Mặc định là COD
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Vui lòng đăng nhập để thực hiện đặt hàng!");
                setIsLoading(false);
                return;
            }

            const orderPayload = {
                totalAmount: totalPrice,
                shippingAddress: formData.address,
                phoneNumber: formData.phone,
                paymentMethod: formData.paymentMethod,
                items: cart.map((item: any) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: Number(item.product?.price || 0)
                }))
            };

            // 2. Gọi API POST tới Backend (Lưu ý kiểm tra đúng Port của Backend NestJS nhé)
            const response = await fetch(`http://localhost:3050/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderPayload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Lỗi khi tạo đơn hàng");
            }

            // 3. XỬ LÝ ĐIỀU HƯỚNG ZALOPAY
            if (formData.paymentMethod === 'ZALOPAY' && data.paymentUrl) {
                window.location.href = data.paymentUrl;
            } else {
                alert("Đặt hàng thành công! Cảm ơn bạn đã mua sắm.");
                router.push('/checkout/success');
            }

        } catch (error: any) {
            console.error("Lỗi đặt hàng:", error);
            alert("Có lỗi xảy ra: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Thông tin thanh toán</h1>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <input
                        type="text" placeholder="Họ tên khách hàng" required
                        className="w-full p-2 border rounded"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                    <input
                        type="text" placeholder="Địa chỉ giao hàng" required
                        className="w-full p-2 border rounded"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    <input
                        type="tel" placeholder="Số điện thoại" required
                        className="w-full p-2 border rounded"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <div className="bg-gray-50 p-6 rounded shadow">
                    <h2 className="font-semibold mb-4">Phương thức thanh toán</h2>
                    <div className="space-y-2">

                        {/* Nút chọn COD */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="payment"
                                value="COD"
                                checked={formData.paymentMethod === "COD"}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            />
                            Thanh toán khi nhận hàng (COD)
                        </label>

                        {/* Nút chọn ZaloPay - ĐÃ MỞ KHÓA */}
                        <label className="flex items-center gap-2 cursor-pointer text-blue-600 font-medium">
                            <input
                                type="radio"
                                name="payment"
                                value="ZALOPAY"
                                checked={formData.paymentMethod === "ZALOPAY"}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            />
                            Thanh toán qua ví ZaloPay
                        </label>

                    </div>

                    <div className="mt-6 border-t pt-4">
                        <p className="flex justify-between font-bold text-xl">
                            <span>Tổng cộng:</span>
                            <span>{(totalPrice || 0).toLocaleString()} VND</span>
                        </p>
                        <button
                            type="submit"
                            disabled={isLoading || totalPrice === 0}
                            className={`w-full mt-4 py-3 rounded text-white font-bold transition-all
                ${isLoading || totalPrice === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}
                        >
                            {isLoading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐẶT HÀNG'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}