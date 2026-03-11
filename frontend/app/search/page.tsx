'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q'); // Lấy từ khóa từ URL

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (query) {
            setLoading(true);
            // Gọi API backend để lấy sản phẩm theo tên
            axios.get(`http://localhost:3050/products/search?q=${encodeURIComponent(query)}`)
                .then(res => setProducts(res.data))
                .catch(err => console.error("Lỗi tìm kiếm:", err))
                .finally(() => setLoading(false));
        }
    }, [query]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">
                Kết quả tìm kiếm cho: <span className="text-blue-600">"{query}"</span>
            </h1>

            {loading ? (
                <p>Đang tải kết quả...</p>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {products.map(prod => (
                        <Link key={prod.id} href={`/product/${prod.id}`} className="group block border rounded-xl overflow-hidden hover:shadow-lg transition">
                            <div className="aspect-square bg-gray-100">
                                {prod.image ? (
                                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium text-gray-800 line-clamp-2">{prod.name}</h3>
                                <p className="text-red-500 font-bold mt-2">{prod.price.toLocaleString()}đ</p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">Không tìm thấy sản phẩm nào phù hợp với "{query}".</p>
                </div>
            )}
        </div>
    );
}