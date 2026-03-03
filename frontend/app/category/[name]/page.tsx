'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function CategoryPage() {
    const params = useParams();
    // Decode URL phòng trường hợp tên danh mục có dấu cách hoặc tiếng Việt
    const categoryName = decodeURIComponent(params.name as string);

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (categoryName) {
            setLoading(true);
            axios.get(`http://localhost:3050/products/category/${encodeURIComponent(categoryName)}`)
                .then(res => setProducts(res.data))
                .catch(err => console.error("Lỗi tải danh mục:", err))
                .finally(() => setLoading(false));
        }
    }, [categoryName]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6 border-b pb-2">
                Danh mục: <span className="text-blue-600">{categoryName}</span>
            </h1>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {products.map(prod => (
                        <Link key={prod.id} href={`/products/${prod.id}`} className="group block border rounded-xl overflow-hidden hover:shadow-lg transition">
                            <div className="aspect-square bg-gray-100">
                                {prod.image ? (
                                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">Không có ảnh</div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium text-gray-800 line-clamp-2 text-sm">{prod.name}</h3>
                                <p className="text-red-500 font-bold mt-2">{prod.price.toLocaleString()}đ</p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">Không có sản phẩm nào trong danh mục này.</p>
            )}
        </div>
    );
}