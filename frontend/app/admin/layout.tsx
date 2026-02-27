// frontend/app/admin/layout.tsx
'use client';

import React, { useEffect } from 'react';
import {
    LayoutDashboard, Package, MessageSquare,
    Image as ImageIcon, LogOut
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/authContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoggedIn, logout } = useAuth();

    // ✅ PHÂN QUYỀN: kiểm tra mỗi khi user/isLoggedIn thay đổi
    useEffect(() => {
        // Chưa đăng nhập → về trang login
        if (!isLoggedIn) {
            router.replace('/login');
            return;
        }
        // Đã đăng nhập nhưng không phải ADMIN → về trang chủ
        if (user?.role !== 'ADMIN') {
            router.replace('/');
        }
    }, [isLoggedIn, user, router]);

    // Render loading trắng trong khi đang kiểm tra quyền
    // (tránh flash nội dung admin trước khi redirect kịp)
    if (!isLoggedIn || user?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const menuItems = [
        { name: 'Dashboard (Dự báo)', href: '/admin', icon: LayoutDashboard },
        { name: 'Quản lý Sản phẩm', href: '/admin/products', icon: Package },
        { name: 'Phân tích Đánh giá (AI)', href: '/admin/reviews', icon: MessageSquare },
        { name: 'Visual Search Data', href: '/admin/visual-data', icon: ImageIcon },
    ];

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* SIDEBAR */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-xl z-50">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Admin AI
                    </h1>
                    {/* ✅ THÊM: hiện email admin */}
                    <p className="text-xs text-slate-400 mt-1 truncate">{user?.email}</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span className="font-medium text-sm">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    {/* ✅ FIX: nút logout thật sự gọi logout() */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium text-sm">Đăng xuất</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
}