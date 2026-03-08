// frontend/app/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ShoppingCart, TrendingUp, X, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';


type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
};

type Toast = {
  id: number;
  type: 'success' | 'error';
  message: string;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    axios.get('http://localhost:3050/products')
      .then(res => setProducts(res.data))
      .catch(() => showToast('error', 'Không thể tải sản phẩm. Hãy kiểm tra backend.'));
  }, []);

  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        showToast('error', 'Bạn cần đăng nhập để thêm vào giỏ hàng!');
        setLoading(false);
        return;
      }

      await axios.post('http://localhost:3050/cart/add',
        {
          productId: selectedProduct.id,
          quantity: quantity
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSelectedProduct(null);
      showToast('success', `Đã thêm ${selectedProduct.name} vào giỏ hàng! 🛒`);
      window.dispatchEvent(new Event('cartUpdated'));

    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng.';
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
              min-w-70 max-w-90 pointer-events-auto
              animate-in slide-in-from-right-5 fade-in duration-300
              ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
          >
            {toast.type === 'success'
              ? <CheckCircle size={20} className="shrink-0" />
              : <AlertCircle size={20} className="shrink-0" />
            }
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-linear-to-r from-blue-500 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Thời trang xu hướng 2026</h2>
          <p className="text-blue-100 mb-6">Trải nghiệm mua sắm thông minh với sự hỗ trợ của AI</p>
          <button className="bg-white text-blue-600 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition">
            Khám phá ngay
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <TrendingUp className="text-red-500" /> Sản phẩm mới nhất
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 group">

              {/* BỌC THẺ LINK Ở ĐÂY VÀ CHỈ Ở PHẦN HÌNH ẢNH */}
              <Link href={`/product/${product.id}`}>
                <div className="aspect-square overflow-hidden bg-gray-100 cursor-pointer">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                  />
                </div>
              </Link>

              <div className="p-4">
                <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full">{product.category}</span>

                {/* Nếu bạn muốn nhấn vào tên sản phẩm cũng chuyển trang thì bọc Link tương tự */}
                <h4 className="font-semibold text-gray-800 mt-2 line-clamp-2">{product.name}</h4>

                <p className="text-red-500 font-bold mt-1">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                </p>
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
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-20 h-20 object-cover rounded-lg"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                />
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
                onClick={handleAddToCart}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : 'THÊM VÀO GIỎ HÀNG'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}