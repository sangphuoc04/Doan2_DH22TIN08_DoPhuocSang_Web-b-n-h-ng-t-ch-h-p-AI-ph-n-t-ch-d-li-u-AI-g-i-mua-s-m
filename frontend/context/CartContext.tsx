'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Định nghĩa kiểu dữ liệu cho sản phẩm trong giỏ (bạn có thể điều chỉnh cho khớp với Database)
interface CartItem {
    id: number;
    productId: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        price: number;
        image: string;
    };
}

interface CartContextType {
    cartCount: number;
    cart: CartItem[];
    totalPrice: number;
    fetchCart: () => Promise<void>;
    updateCartCount: (newCount: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [cartCount, setCartCount] = useState(0);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);

    const fetchCart = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log("Chưa đăng nhập, không thể lấy giỏ hàng");
                return;
            }
            const response = await fetch(`http://localhost:3050/cart`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                console.error("Lỗi xác thực hoặc không tìm thấy API:", response.status);
                return;
            }
            const data = await response.json();
            const items: CartItem[] = Array.isArray(data) ? data : (data.items || []);
            const count = items.reduce((sum, item) => sum + item.quantity, 0);
            const total = items.reduce((sum, item) => {
                const price = Number(item.product?.price || 0);
                return sum + (price * item.quantity);
            }, 0);
            setCart(items);
            setCartCount(data.totalCount !== undefined ? data.totalCount : count);
            setTotalPrice(data.totalPrice !== undefined ? data.totalPrice : total);
        } catch (error) {
            console.error("Lỗi khi lấy giỏ hàng:", error);
        }
    };
    useEffect(() => {
        fetchCart();
    }, []);

    return (
        <CartContext.Provider value={{ cartCount, cart, totalPrice, fetchCart, updateCartCount: setCartCount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart phải được bọc bên trong CartProvider');
    }
    return context;
};