// frontend/components/layout/Header.tsx  (CẬP NHẬT - thêm user menu)
'use client';
import React, { useState, useRef } from 'react';
import { Search, ShoppingCart, User, Camera, X, AlertCircle, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../context/authContext';

export default function Header() {
    const { user, logout, isLoggedIn } = useAuth();
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiResults, setAiResults] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false); // ✅ THÊM: dropdown user
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setErrorMsg('Chỉ hỗ trợ ảnh JPG, PNG, WebP!');
            setShowDropdown(true);
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrorMsg('Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
            setShowDropdown(true);
            return;
        }

        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);
        setErrorMsg('');
        setShowDropdown(true);
        setLoading(true);
        setAiResults([]);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            try {
                const res = await axios.post('http://localhost:3050/products/visual-search',
                    { image_base64: base64 },
                    { timeout: 35000 }
                );
                setAiResults(res.data.data || []);
            } catch (err: any) {
                if (err.code === 'ECONNABORTED') {
                    setErrorMsg('AI phân tích quá lâu, vui lòng thử lại');
                } else if (err?.response?.status === 500) {
                    setErrorMsg('Server đang gặp sự cố, thử lại sau ít phút');
                } else {
                    setErrorMsg('Không thể kết nối server');
                }
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        setShowDropdown(false);
        setAiResults([]);
        setPreviewUrl(null);
        setErrorMsg('');
    };

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">

                {/* Logo */}
                <Link href="/" className="text-xl font-bold text-blue-600 shrink-0">FASHION AI</Link>

                {/* Search bar + Visual Search */}
                <div className="flex-1 relative">
                    <form onSubmit={e => e.preventDefault()}>
                        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2 border border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all">
                            <Search size={18} className="text-gray-400 shrink-0" />
                            <input
                                type="text"
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                placeholder="Tìm kiếm sản phẩm..."
                                className="flex-1 bg-transparent focus:outline-none text-gray-700 text-sm"
                            />
                            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                            <button type="button" onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Tìm bằng hình ảnh">
                                <Camera size={18} />
                            </button>
                        </div>
                    </form>

                    {/* Dropdown Visual Search */}
                    {showDropdown && (
                        <div className="absolute top-full mt-2 w-full left-0">
                            <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 relative">
                                <button onClick={handleClose} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50">
                                    <X size={20} />
                                </button>
                                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                                    <Camera size={16} className="text-blue-600" /> AI Gợi ý Sản phẩm Tương tự
                                </h3>
                                {previewUrl && (
                                    <img src={previewUrl} alt="preview" className="w-16 h-16 object-cover rounded-lg mb-3 border" />
                                )}
                                {errorMsg && (
                                    <div className="flex items-center gap-2 text-red-500 text-sm py-2">
                                        <AlertCircle size={16} /> {errorMsg}
                                    </div>
                                )}
                                {loading && (
                                    <div className="flex flex-col items-center py-6">
                                        <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm text-gray-500 mt-2 animate-pulse">Gemini đang phân tích ảnh...</p>
                                    </div>
                                )}
                                {!loading && aiResults.length > 0 && (
                                    <div className="grid grid-cols-4 gap-3">
                                        {aiResults.map(prod => (
                                            <Link key={prod.id} href={`/products/${prod.id}`} onClick={handleClose} className="group cursor-pointer">
                                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-1">
                                                    {prod.image
                                                        ? <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                                                    }
                                                </div>
                                                <p className="text-xs font-medium text-gray-700 line-clamp-1 group-hover:text-blue-600">{prod.name}</p>
                                                <p className="text-xs text-red-500 font-bold">{prod.price?.toLocaleString()}đ</p>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                {!loading && !errorMsg && aiResults.length === 0 && (
                                    <p className="text-center py-4 text-gray-400 text-sm">Không tìm thấy sản phẩm tương tự.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Icons bên phải */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Giỏ hàng */}
                    <Link href="/cart" className="text-gray-500 hover:text-blue-600 p-2 relative">
                        <ShoppingCart size={22} />
                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">0</span>
                    </Link>

                    {/* ✅ THÊM: User menu */}
                    {isLoggedIn ? (
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors text-sm font-medium"
                            >
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <span className="hidden sm:block max-w-25 truncate">{user?.fullName || 'Tài khoản'}</span>
                                <ChevronDown size={14} />
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="font-semibold text-gray-800 text-sm truncate">{user?.fullName}</p>
                                        <p className="text-gray-400 text-xs truncate">{user?.email}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 text-sm transition-colors"
                                    >
                                        <LogOut size={16} /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition-colors">
                            <User size={16} /> Đăng nhập
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}