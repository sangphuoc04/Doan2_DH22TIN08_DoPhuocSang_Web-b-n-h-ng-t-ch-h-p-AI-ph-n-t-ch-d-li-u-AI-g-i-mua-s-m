'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CategoryNav() {
    const [categories, setCategories] = useState<string[]>([]);
    const pathname = usePathname(); // Dùng để kiểm tra xem user đang ở danh mục nào

    useEffect(() => {
        // Gọi API để lấy danh sách danh mục
        axios.get('http://localhost:3050/products/categories')
            .then(res => setCategories(res.data))
            .catch(err => console.error("Lỗi lấy danh mục:", err));
    }, []);

    // Nếu chưa có danh mục nào thì không hiển thị thanh này
    if (categories.length === 0) return null;

    return (
        <nav className="bg-white border-b shadow-sm sticky top-18.25 z-30">
            {/* top-[73px] để dính ngay dưới Header hiện tại. Nếu Header cao/thấp hơn, bạn có thể chỉnh số này */}
            <div className="max-w-7xl mx-auto px-4 flex items-center gap-8 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                {/* Nút Trang chủ / Tất cả */}
                <Link
                    href="/"
                    className={`whitespace-nowrap py-3 text-sm font-semibold transition-all border-b-2 ${pathname === '/'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-200'
                        }`}
                >
                    Tất cả sản phẩm
                </Link>

                {/* Danh sách các danh mục từ Database */}
                {categories.map((cat, index) => {
                    const categoryUrl = `/category/${encodeURIComponent(cat)}`;
                    const isActive = pathname === categoryUrl;

                    return (
                        <Link
                            key={index}
                            href={categoryUrl}
                            className={`whitespace-nowrap py-3 text-sm font-semibold transition-all border-b-2 ${isActive
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-200'
                                }`}
                        >
                            {cat}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}