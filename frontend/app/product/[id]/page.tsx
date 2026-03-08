// frontend/app/product/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../context/authContext';
import { useCart } from '../../../context/CartContext';

export default function ProductDetailPage() {
    const params = useParams();
    const productId = params.id;
    const { token, isLoggedIn } = useAuth();
    const { fetchCart } = useCart();
    const [product, setProduct] = useState<any>(null);
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(5);

    // Lấy chi tiết sản phẩm và bình luận
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`http://localhost:3050/products/${productId}`);
                const data = await res.json();
                setProduct(data);
            } catch (error) {
                console.error("Lỗi lấy thông tin sản phẩm:", error);
            }
        };
        if (productId) fetchProduct();
    }, [productId]);

    // Xử lý gửi bình luận
    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();

        // KIỂM TRA ĐĂNG NHẬP BẰNG CONTEXT
        if (!isLoggedIn || !token) {
            alert("Bạn cần đăng nhập để bình luận!");
            return;
        }

        try {
            const res = await fetch(`http://localhost:3050/products/${productId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Truyền token vào đây
                },
                body: JSON.stringify({ rating, content: comment }) // (Lưu ý: Nếu API của bạn dùng 'content', hãy đổi 'comment' thành 'content' ở đây nhé)
            });

            if (res.ok) {
                alert("Bình luận thành công!");
                setComment('');
                // Khuyến nghị: Re-fetch lại danh sách product để cập nhật UI ngay lập tức
                window.location.reload();
            }
        } catch (error) {
            console.error("Lỗi gửi bình luận:", error);
        }
    };

    if (!product) return <div>Đang tải thông tin sản phẩm...</div>;

    const handleAddToCart = async () => {
        if (!isLoggedIn) {
            alert("Vui lòng đăng nhập để thêm vào giỏ hàng!");
            return;
        }

        try {

            const res = await fetch(`http://localhost:3050/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: Number(productId),
                    quantity: 1 // Mặc định thêm 1 sản phẩm, bạn có thể tạo state quantity nếu muốn cho người dùng chọn số lượng
                })
            });

            if (res.ok) {
                alert("Đã thêm sản phẩm vào giỏ hàng!");
                fetchCart(); // Gọi hàm này để Header cập nhật lại số lượng giỏ hàng ngay lập tức
            } else {
                const data = await res.json();
                alert(data.message || "Có lỗi xảy ra khi thêm vào giỏ!");
            }
        } catch (error) {
            console.error("Lỗi khi thêm vào giỏ hàng:", error);
            alert("Không thể kết nối đến server.");
        }
    };

    return (
        <div className="container mx-auto p-6">
            {/* 1. Thông tin sản phẩm */}
            <div className="flex flex-col md:flex-row gap-8 mb-12">
                <div className="md:w-1/2">
                    {/* Thay url ảnh bằng trường tương ứng của bạn */}
                    <img src={product.image} alt={product.name} className="w-full h-auto object-cover rounded-lg shadow-md" />
                </div>
                <div className="md:w-1/2">
                    <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
                    <p className="text-xl text-red-600 font-semibold mb-4">{product.price?.toLocaleString('vi-VN')} VND</p>
                    <p className="text-gray-700">{product.description}</p>
                    {/* Thêm nút thêm vào giỏ hàng tại đây nếu cần */}
                    <button
                        onClick={handleAddToCart}
                        className="mt-6 bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
                    >
                        Thêm vào giỏ
                    </button>
                </div>
            </div>

            {/* 2. Phần Bình Luận */}
            <div className="border-t pt-8">
                <h2 className="text-2xl font-bold mb-6">Đánh giá sản phẩm</h2>

                {/* Form Bình Luận */}
                <form onSubmit={handleSubmitReview} className="mb-8 bg-gray-50 p-6 rounded-lg">
                    <div className="mb-4">
                        <label className="block mb-2 font-semibold">Điểm đánh giá:</label>
                        <select
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                            className="border p-2 rounded"
                        >
                            <option value={5}>5 Sao - Rất tốt</option>
                            <option value={4}>4 Sao - Tốt</option>
                            <option value={3}>3 Sao - Bình thường</option>
                            <option value={2}>2 Sao - Kém</option>
                            <option value={1}>1 Sao - Tệ</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 font-semibold">Bình luận của bạn:</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            required
                            rows={4}
                            className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
                        />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                        Gửi đánh giá
                    </button>
                </form>

                {/* Danh sách bình luận */}
                <div className="space-y-4">
                    {product.reviews && product.reviews.length > 0 ? (
                        product.reviews.map((review: any) => (
                            <div key={review.id} className="border-b pb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold">{review.user?.name || review.user?.email || 'Người dùng ẩn danh'}</span>
                                    <span className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                </div>
                                <p className="text-gray-700">{review.content}</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">Chưa có bình luận nào cho sản phẩm này.</p>
                    )}
                </div>
            </div>
        </div>
    );
}