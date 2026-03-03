'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit, Trash2, Plus, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const API_URL = 'http://localhost:3050/products';

export default function AdminProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        costPrice: '',
        stock: '',
        category: '',
        image: ''
    });

    const fetchProducts = async () => {
        try {
            const res = await axios.get(API_URL);
            setProducts(res.data);
        } catch (error) {
            console.error('Lỗi tải danh sách sản phẩm:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openModal = (product: any = null) => {
        if (product) {
            setEditingId(product.id);
            setFormData({
                name: product.name,
                description: product.description || '',
                price: product.price,
                costPrice: product.costPrice,
                stock: product.stock,
                category: product.category,
                image: product.image || ''
            });
        } else {
            setEditingId(null);
            setFormData({ name: '', description: '', price: '', costPrice: '', stock: '', category: '', image: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.patch(`${API_URL}/${editingId}`, formData);
                alert('Cập nhật thành công!');
            } else {
                await axios.post(API_URL, formData);
                alert('Thêm sản phẩm thành công!');
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (error) {
            console.error('Lỗi lưu sản phẩm:', error);
            alert('Có lỗi xảy ra!');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            try {
                await axios.delete(`${API_URL}/${id}`);
                alert('Xóa thành công!');
                fetchProducts();
            } catch (error) {
                console.error('Lỗi xóa sản phẩm:', error);
                alert('Lỗi: Sản phẩm này có thể đã có trong đơn hàng hoặc đánh giá.');
            }
        }
    };

    const handleExportExcel = () => {
        if (!products || products.length === 0) {
            alert("Chưa có dữ liệu sản phẩm để xuất!");
            return;
        }

        const exportData = products.map((p: any) => ({
            "ID": p.id,
            "Tên Sản Phẩm": p.name,
            "Danh mục": p.category,
            "Giá bán (VNĐ)": p.price,
            "Giá vốn (VNĐ)": p.costPrice,
            "Tồn kho": p.stock,
            "Mô tả": p.description || ""
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();

        worksheet['!cols'] = [
            { wch: 10 },
            { wch: 40 },
            { wch: 20 },
            { wch: 15 },
            { wch: 15 },
            { wch: 10 },
            { wch: 50 }
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachSanPham");
        XLSX.writeFile(workbook, "Danh_Sach_San_Pham.xlsx");
    };

    if (loading) return <div className="p-8">Đang tải dữ liệu...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Quản lý Sản phẩm</h2>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-green-700 transition-colors"
                    >
                        <Download size={18} /> Lấy danh sách sản phẩm
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={18} /> Thêm Sản phẩm
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Sản Phẩm</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá bán</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((p: any) => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.id}</td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{p.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.price.toLocaleString()}đ</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.stock}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center flex justify-center gap-3">
                                    <button onClick={() => openModal(p)} className="text-blue-600 hover:text-blue-900"><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Thêm/Sửa Sản phẩm */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">{editingId ? 'Sửa Sản phẩm' : 'Thêm Sản phẩm Mới'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Tên Sản phẩm *</label>
                                    <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Giá bán *</label>
                                    <input required type="number" name="price" value={formData.price} onChange={handleInputChange} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Giá vốn *</label>
                                    <input required type="number" name="costPrice" value={formData.costPrice} onChange={handleInputChange} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tồn kho *</label>
                                    <input required type="number" name="stock" value={formData.stock} onChange={handleInputChange} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Danh mục *</label>
                                    <input required type="text" name="category" value={formData.category} onChange={handleInputChange} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">URL Hình ảnh</label>
                                    <input type="text" name="image" value={formData.image} onChange={handleInputChange} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                                    <textarea name="description" rows={3} value={formData.description} onChange={handleInputChange} className="mt-1 w-full border border-gray-300 rounded-md p-2"></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Lưu sản phẩm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}