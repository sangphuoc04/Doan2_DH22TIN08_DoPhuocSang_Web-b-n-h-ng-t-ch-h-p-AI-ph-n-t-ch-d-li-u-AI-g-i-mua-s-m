'use client'; // Bắt buộc trong Next.js App Router nếu dùng Context/State

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartContextType {
    cartCount: number;
    fetchCart: () => Promise<void>;
    updateCartCount: (newCount: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [cartCount, setCartCount] = useState(0);

    // Hàm này dùng để gọi API lấy lại dữ liệu giỏ hàng mới nhất
    const fetchCart = async () => {
        try {
            // Sửa lại URL API cho đúng với route của bạn
            const userId = localStorage.getItem('userId'); // Hoặc lấy từ AuthContext
            if (!userId) return;

            const response = await fetch(`http://localhost:3000/cart/${userId}`);
            const data = await response.json();

            // Giả sử API getCart của bạn trả về { totalCount: number, items: [] }
            setCartCount(data.totalCount || 0);
        } catch (error) {
            console.error("Lỗi khi lấy giỏ hàng:", error);
        }
    };

    // Lấy số lượng giỏ hàng ngay khi vừa vào trang
    useEffect(() => {
        fetchCart();
    }, []);

    return (
        <CartContext.Provider value={{ cartCount, fetchCart, updateCartCount: setCartCount }}>
            {children}
        </CartContext.Provider>
    );
};

// Custom hook để dùng cho tiện
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart phải được bọc bên trong CartProvider');
    }
    return context;
};