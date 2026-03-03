'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit, Trash2, Plus, X, Shield, User as UserIcon, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const API_URL = 'http://localhost:3050/users';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        password: '',
        role: 'USER'
    });

    const fetchUsers = async () => {
        try {
            const res = await axios.get(API_URL);
            setUsers(res.data);
        } catch (error) {
            console.error('Lỗi tải danh sách người dùng:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openModal = (user: any = null) => {
        if (user) {
            setEditingId(user.id);
            setFormData({
                email: user.email,
                fullName: user.fullName || '',
                password: '',
                role: user.role
            });
        } else {
            setEditingId(null);
            setFormData({ email: '', fullName: '', password: '', role: 'USER' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let submitData: Record<string, any> = { ...formData };
            if (editingId && !formData.password) {
                const { password, ...restData } = formData;
                submitData = restData;
            }

            if (editingId) {
                await axios.patch(`${API_URL}/${editingId}`, submitData);
                alert('Cập nhật người dùng thành công!');
            } else {
                await axios.post(API_URL, submitData);
                alert('Thêm người dùng thành công!');
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            console.error('Lỗi lưu người dùng:', error);
            alert('Có lỗi xảy ra! Email có thể đã tồn tại.');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Bạn có chắc chắn muốn xóa khách hàng này? (Dữ liệu liên quan như đơn hàng, đánh giá cũng có thể bị ảnh hưởng)')) {
            try {
                await axios.delete(`${API_URL}/${id}`);
                alert('Xóa thành công!');
                fetchUsers();
            } catch (error) {
                console.error('Lỗi xóa người dùng:', error);
                alert('Lỗi: Người dùng này có thể đang có đơn hàng hoặc đánh giá.');
            }
        }
    };

    const handleExportExcel = () => {
        if (!users || users.length === 0) {
            alert("Chưa có dữ liệu khách hàng để xuất!");
            return;
        }

        // Tạo format dữ liệu tiếng Việt cho dễ đọc
        const exportData = users.map((u: any) => ({
            "ID": u.id,
            "Họ và Tên": u.fullName || "Chưa cập nhật",
            "Email": u.email,
            "Vai trò": u.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng',
            "Ngày đăng ký": u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : "Chưa cập nhật"
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();

        worksheet['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 20 }];

        XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachKhachHang");
        XLSX.writeFile(workbook, "Danh_Sach_Khach_Hang.xlsx");
    };

    if (loading) return <div className="p-8 font-medium text-gray-500">Đang tải dữ liệu khách hàng...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Quản lý Khách hàng</h2>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-green-700 transition-colors"
                    >
                        <Download size={18} /> Lấy danh sách khách hàng
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={18} /> Thêm Khách hàng
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Họ và Tên</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vai trò</th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {users.map((u: any) => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{u.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    {u.fullName || <span className="text-gray-400 italic">Chưa cập nhật</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                                        ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}
                                    >
                                        {u.role === 'ADMIN' ? <Shield size={14} /> : <UserIcon size={14} />}
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center flex justify-center gap-4">
                                    <button onClick={() => openModal(u)} className="text-blue-500 hover:text-blue-700 transition-colors">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-600 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Thêm/Sửa Khách hàng */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingId ? 'Sửa thông tin' : 'Thêm người dùng mới'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên</label>
                                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mật khẩu {editingId && <span className="text-xs text-gray-400 font-normal">(Bỏ trống nếu không muốn đổi)</span>}
                                </label>
                                <input type={editingId ? "password" : "text"} name="password" required={!editingId} value={formData.password} onChange={handleInputChange} placeholder={editingId ? "********" : "Mật khẩu mặc định..."}
                                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                                <select name="role" value={formData.role} onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                    <option value="USER">Khách hàng (USER)</option>
                                    <option value="ADMIN">Quản trị viên (ADMIN)</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                                    Hủy
                                </button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                                    Lưu thông tin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}