// frontend/app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShoppingCart, Star, TrendingUp, X } from 'lucide-react';
import Link from 'next/link';

// Kiểu dữ liệu sản phẩm
type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  // 1. Lấy danh sách sản phẩm từ Backend
  useEffect(() => {
    axios.get('http://localhost:3050/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  // 2. Xử lý Mua Hàng
  const handleBuy = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:3050/orders', {
        productId: selectedProduct.id,
        quantity: quantity,
        totalAmount: selectedProduct.price * quantity
      });
      alert(`✅ Mua thành công! AI Admin đã ghi nhận doanh thu.`);
      setSelectedProduct(null); // Đóng modal
    } catch (error) {
      alert('Lỗi mua hàng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">FASHION AI SHOP</h1>
          <div className="flex gap-4">
            <Link href="/contact" className="text-gray-600 hover:text-blue-600 font-medium">Chat AI</Link>
            <Link href="/admin" className="text-gray-600 hover:text-blue-600 font-medium">Vào Admin</Link>
          </div>
        </div>
      </header>

      {/* BANNER */}
      <div className="bg-linear-to-r from-blue-500 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Thời trang xu hướng 2026</h2>
          <p className="text-blue-100 mb-6">Trải nghiệm mua sắm thông minh với sự hỗ trợ của AI</p>
          <button className="bg-white text-blue-600 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition">
            Khám phá ngay
          </button>
        </div>
      </div>

      {/* DANH SÁCH SẢN PHẨM */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <TrendingUp className="text-red-500" /> Sản phẩm mới nhất
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 group">
              <div className="relative h-64 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                  {product.category}
                </div>
              </div>

              <div className="p-4">
                <h4 className="font-semibold text-gray-800 line-clamp-1 mb-1">{product.name}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-red-500 font-bold">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                  </span>
                  <div className="flex text-yellow-400 text-xs">
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                  </div>
                </div>

                <button
                  onClick={() => { setSelectedProduct(product); setQuantity(1); }}
                  className="w-full mt-4 bg-gray-900 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <ShoppingCart size={18} /> Mua Ngay
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL MUA HÀNG NHANH */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Xác nhận mua hàng</h3>
              <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-red-500">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex gap-4 mb-6">
                <img src={selectedProduct.image} className="w-20 h-20 object-cover rounded-lg" />
                <div>
                  <h4 className="font-bold text-gray-800">{selectedProduct.name}</h4>
                  <p className="text-red-500 font-bold">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedProduct.price)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6 bg-gray-50 p-3 rounded-lg">
                <span className="font-medium text-gray-600">Số lượng:</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full bg-white border shadow-sm hover:bg-gray-100 text-black">-</button>
                  <span className="font-bold text-lg text-black w-4 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full bg-white border shadow-sm hover:bg-gray-100 text-black">+</button>
                </div>
              </div>

              <div className="flex justify-between items-center text-lg font-bold border-t pt-4">
                <span>Tổng tiền:</span>
                <span className="text-blue-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedProduct.price * quantity)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex gap-3">
              <button onClick={() => setSelectedProduct(null)} className="flex-1 py-3 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-gray-100">
                Hủy
              </button>
              <button
                onClick={handleBuy}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200"
              >
                {loading ? 'Đang xử lý...' : 'CHỐT ĐƠN NGAY'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}