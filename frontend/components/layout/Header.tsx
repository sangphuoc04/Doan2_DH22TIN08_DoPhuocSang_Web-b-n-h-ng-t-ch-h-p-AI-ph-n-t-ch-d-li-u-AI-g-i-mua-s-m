'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Search, Menu, Camera, X } from 'lucide-react';
import axios from 'axios';
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');

    // --- STATE CHO VISUAL SEARCH ---
    const [loading, setLoading] = useState(false);
    const [aiResults, setAiResults] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTextSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Tìm kiếm text:", searchQuery);
    };

    // HÀM XỬ LÝ KHI KHÁCH CHỌN ẢNH
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setShowDropdown(true); // Mở sẵn bảng dropdown để hiện loading

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64String = reader.result as string;

            try {
                // Gọi API Gateway NestJS
                const res = await axios.post('http://localhost:3050/products/visual-search', {
                    image_base64: base64String
                });

                if (res.data.status === 'success') {
                    setAiResults(res.data.data);
                }
            } catch (error) {
                console.error("Lỗi tìm kiếm ảnh:", error);
            } finally {
                setLoading(false);
                // Reset input file để chọn lại ảnh cùng tên vẫn ăn sự kiện onChange
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
    };

    if (pathname && pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* 1. LOGO & MENU TRÁI */}
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

                    {/* 2. THANH TÌM KIẾM CÓ TÍCH HỢP AI */}
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
                                {/* Input ẩn để chọn file */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                />
                                {/* Nút Camera gọi input file */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    title="Tìm bằng hình ảnh"
                                >
                                    <Camera size={20} />
                                </button>

                                {/* Nút tìm Text */}
                                <button
                                    type="submit"
                                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                                >
                                    <Search size={18} />
                                </button>
                            </div>
                        </form>

                        {/* --- DROPDOWN KẾT QUẢ VISUAL SEARCH --- */}
                        {showDropdown && (
                            <div className="absolute top-full mt-2 w-full left-0 px-8">
                                <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 overflow-hidden relative">
                                    {/* Nút đóng */}
                                    <button
                                        onClick={() => setShowDropdown(false)}
                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                                    >
                                        <X size={20} />
                                    </button>

                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Camera size={18} className="text-blue-600" />
                                        AI Gợi ý Sản phẩm Tương tự
                                    </h3>

                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-8">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-sm text-gray-500 mt-3 animate-pulse">Gemini đang quét ảnh của bạn...</p>
                                        </div>
                                    ) : aiResults.length > 0 ? (
                                        <div className="grid grid-cols-4 gap-4">
                                            {aiResults.map((prod) => (
                                                <div key={prod.id} className="group cursor-pointer">
                                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2 relative">
                                                        {/* Fix tạm lỗi k có ảnh thật thì dùng div màu xám */}
                                                        {prod.image ? (
                                                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                                                        )}
                                                    </div>
                                                    <h4 className="text-sm font-semibold text-gray-700 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{prod.name}</h4>
                                                    <p className="text-red-500 font-bold mt-1 text-sm">{prod.price.toLocaleString()} đ</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-gray-500 text-sm">
                                            Rất tiếc, AI không tìm thấy sản phẩm nào giống với ảnh của bạn.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. ICON BÊN PHẢI (GIỎ HÀNG & TÀI KHOẢN) */}
                    <div className="flex items-center gap-4">
                        <button className="text-gray-500 hover:text-blue-600 transition-colors p-2 relative">
                            <ShoppingCart size={24} />
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                3
                            </span>
                        </button>

                        <Link href="/login" className="text-gray-500 hover:text-blue-600 transition-colors p-2 hidden sm:block">
                            <User size={24} />
                        </Link>
                    </div>

                </div>
            </div>
        </header>
    );
}