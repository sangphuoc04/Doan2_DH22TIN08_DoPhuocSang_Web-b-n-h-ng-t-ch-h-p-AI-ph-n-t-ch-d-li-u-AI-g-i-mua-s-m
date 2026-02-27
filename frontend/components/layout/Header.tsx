'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Search, Menu, Camera, X, AlertCircle, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');

    // --- STATE CHO VISUAL SEARCH ---
    const [loading, setLoading] = useState(false);
    const [aiResults, setAiResults] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTextSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Tìm kiếm text:", searchQuery);
    };

    // HÀM XỬ LÝ KHI KHÁCH CHỌN ẢNH
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // ✅ FIX: Validate file trước khi gửi
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            alert('Chỉ hỗ trợ ảnh JPG, PNG, WebP, GIF!');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
            alert('Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
            return;
        }

        // ✅ THÊM: Reset state cũ trước khi tìm mới
        setAiResults([]);
        setErrorMsg(null);
        setLoading(true);
        setShowDropdown(true);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64String = reader.result as string;

            // ✅ THÊM: Hiện preview ảnh ngay lập tức (không cần đợi API)
            setPreviewUrl(base64String);

            try {
                const res = await axios.post('http://localhost:3050/products/visual-search', {
                    image_base64: base64String
                }, {
                    timeout: 35000 // ✅ FIX: Thêm timeout 35s cho axios (> timeout Python 30s)
                });

                if (res.data.status === 'success') {
                    setAiResults(res.data.data);
                    if (res.data.data.length === 0) {
                        setErrorMsg('AI không tìm thấy sản phẩm tương tự trong cửa hàng.');
                    }
                } else {
                    // ✅ FIX: Hiện message lỗi từ backend thay vì im lặng
                    setErrorMsg(res.data.message || 'Có lỗi xảy ra khi phân tích ảnh.');
                }
            } catch (error: any) {
                console.error("Lỗi tìm kiếm ảnh:", error);
                if (error.code === 'ECONNABORTED') {
                    setErrorMsg('AI phân tích quá lâu, vui lòng thử lại.');
                } else if (error.response?.status === 500) {
                    setErrorMsg('Server đang gặp sự cố, thử lại sau ít phút.');
                } else {
                    setErrorMsg('Không thể kết nối server. Hãy kiểm tra backend.');
                }
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
    };

    // Đóng dropdown và reset hoàn toàn
    const handleClose = () => {
        setShowDropdown(false);
        setPreviewUrl(null);
        setAiResults([]);
        setErrorMsg(null);
    };

    if (pathname && pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* LOGO & MENU TRÁI */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="shrink-0 flex items-center gap-2">
                            <span className="text-2xl font-black bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                AI Shop
                            </span>
                        </Link>
                        <nav className="hidden md:flex space-x-6">
                            <Link href="/products" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Sản phẩm</Link>
                            <Link href="/categories" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Danh mục</Link>
                            <Link href="/sale" className="text-red-500 hover:text-red-600 font-bold transition-colors">Khuyến mãi</Link>
                        </nav>
                    </div>

                    {/* THANH TÌM KIẾM CÓ TÍCH HỢP AI */}
                    <div className="hidden sm:flex flex-1 max-w-2xl px-8 relative">
                        <form onSubmit={handleTextSearch} className="w-full relative flex items-center">
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm, áo thun, váy..."
                                className="w-full pl-4 pr-24 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            <div className="absolute right-2 flex items-center gap-1">
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    title="Tìm bằng hình ảnh (JPG, PNG, WebP)"
                                >
                                    <Camera size={20} />
                                </button>
                                <button
                                    type="submit"
                                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                                >
                                    <Search size={18} />
                                </button>
                            </div>
                        </form>

                        {/* DROPDOWN KẾT QUẢ VISUAL SEARCH */}
                        {showDropdown && (
                            <div className="absolute top-full mt-2 w-full left-0 px-8">
                                <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 overflow-hidden relative">
                                    <button
                                        onClick={handleClose}
                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                                    >
                                        <X size={20} />
                                    </button>

                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Camera size={18} className="text-blue-600" />
                                        AI Gợi ý Sản phẩm Tương tự
                                    </h3>

                                    {/* ✅ THÊM: Preview ảnh đã upload */}
                                    {previewUrl && (
                                        <div className="mb-4 flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <img
                                                src={previewUrl}
                                                alt="Ảnh bạn tìm kiếm"
                                                className="w-16 h-16 object-cover rounded-lg border border-blue-200 shadow-sm"
                                            />
                                            <div>
                                                <p className="text-xs font-semibold text-blue-700">Ảnh bạn tìm kiếm</p>
                                                <p className="text-xs text-blue-500 mt-0.5">
                                                    {loading ? 'Gemini đang phân tích...' : `Tìm thấy ${aiResults.length} sản phẩm tương tự`}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-6">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-sm text-gray-500 mt-3 animate-pulse">Gemini đang quét ảnh của bạn...</p>
                                        </div>
                                    ) : errorMsg ? (
                                        // ✅ THÊM: Hiện lỗi thay vì im lặng
                                        <div className="flex items-center gap-3 py-4 px-3 bg-red-50 rounded-xl border border-red-100">
                                            <AlertCircle size={20} className="text-red-500 shrink-0" />
                                            <p className="text-sm text-red-600">{errorMsg}</p>
                                        </div>
                                    ) : aiResults.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {aiResults.map((product: any) => (
                                                <Link
                                                    key={product.id}
                                                    href={`/products/${product.id}`}
                                                    onClick={handleClose}
                                                    className="group flex flex-col rounded-xl border border-gray-100 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
                                                >
                                                    <div className="aspect-square bg-gray-100 overflow-hidden">
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = '/placeholder.png';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="p-2">
                                                        <p className="text-xs font-semibold text-gray-800 line-clamp-2">{product.name}</p>
                                                        <p className="text-xs text-blue-600 font-bold mt-1">
                                                            {Number(product.price).toLocaleString('vi-VN')}đ
                                                        </p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ICONS PHẢI */}
                    <div className="flex items-center gap-4">
                        <Link href="/cart" className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
                            <ShoppingCart size={24} />
                        </Link>
                        <Link href="/login" className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                            <User size={24} />
                        </Link>
                        <Link href="/contact" className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                            <MessageCircle size={24} />
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}