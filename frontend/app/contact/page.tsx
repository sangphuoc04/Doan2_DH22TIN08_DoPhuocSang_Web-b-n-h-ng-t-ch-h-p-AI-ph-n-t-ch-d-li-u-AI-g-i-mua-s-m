// frontend/app/contact/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Phone, Mail, Clock, Bot, User } from 'lucide-react'; // Icon đẹp
import axios from 'axios';

// Định nghĩa kiểu dữ liệu cho tin nhắn
type Message = {
    id: number;
    role: 'user' | 'bot';
    content: string;
};

export default function ContactPage() {
    // State lưu trữ danh sách tin nhắn
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, role: 'bot', content: 'Chào bạn! Mình là AI tư vấn thời trang. Bạn muốn tìm quần áo đi chơi hay đi làm ạ?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Tự động cuộn xuống khi có tin nhắn mới
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(scrollToBottom, [messages]);

    // Hàm gửi tin nhắn
    const handleSend = async () => {
        if (!input.trim()) return;

        // 1. Hiển thị tin nhắn của người dùng ngay lập tức
        const userMsg: Message = { id: Date.now(), role: 'user', content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // 2. Gọi API sang Backend
            const response = await axios.post('http://localhost:3050/chat', {
                message: userMsg.content,
            });

            // 3. Hiển thị câu trả lời của AI
            const botMsg: Message = {
                id: Date.now() + 1,
                role: 'bot',
                content: response.data.reply
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
            const errorMsg: Message = { id: Date.now(), role: 'bot', content: 'Lỗi kết nối! Hãy chắc chắn Backend đang chạy.' };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    // Xử lý khi nhấn Enter
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 min-h-150 border border-gray-200">

                {/* --- CỘT TRÁI: THÔNG TIN LIÊN HỆ --- */}
                <div className="bg-blue-600 text-white p-8 flex flex-col justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-6">Liên Hệ</h2>
                        <p className="text-blue-100 mb-8 leading-relaxed">
                            Ghé thăm cửa hàng để thử đồ trực tiếp hoặc chat ngay với AI bên cạnh để được tư vấn size chuẩn xác nhé!
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-500/50 p-3 rounded-full"><MapPin size={20} /></div>
                                <span>123 Võ Văn Ngân, TP. Thủ Đức</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-500/50 p-3 rounded-full"><Phone size={20} /></div>
                                <span>0909 888 999</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-500/50 p-3 rounded-full"><Mail size={20} /></div>
                                <span>cskh@fashion-ai.com</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-500/50 p-3 rounded-full"><Clock size={20} /></div>
                                <span>8:00 - 22:00 (Mỗi ngày)</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 h-40 bg-blue-700/50 rounded-lg flex items-center justify-center border border-blue-400/30">
                        <span className="font-semibold text-sm tracking-wider">BẢN ĐỒ GOOGLE MAP</span>
                    </div>
                </div>

                {/* --- CỘT PHẢI: CHATBOT AI --- */}
                <div className="lg:col-span-2 flex flex-col bg-gray-50">
                    {/* Header Chat */}
                    <div className="p-4 bg-white border-b flex items-center gap-4 shadow-sm z-10">
                        <div className="relative">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-sm border border-green-200">
                                <Bot size={28} />
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Fashion AI shop</h3>
                            <p className="text-xs text-green-600 font-medium">Đang trực tuyến • Trả lời ngay</p>
                        </div>
                    </div>

                    {/* Nội dung Chat */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                    {/* Avatar nhỏ */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>

                                    {/* Bong bóng chat */}
                                    <div className={`p-4 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
                                        : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-none'
                                        }`}>
                                        {/* Xử lý xuống dòng cho đẹp */}
                                        {msg.content.split('\n').map((line, i) => (
                                            <p key={i} className={`${i > 0 ? 'mt-1' : ''}`}>{line}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start ml-11">
                                <div className="bg-gray-200 px-4 py-2 rounded-full text-xs text-gray-500 animate-pulse">
                                    Đang phản hồi...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Chat */}
                    <div className="p-4 bg-white border-t border-gray-200">
                        <div className="flex gap-3 items-center bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Ví dụ: Shop có váy dạ hội màu đỏ size M không?"
                                className="flex-1 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-2">Mua sắm theo cách cảu bạn.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}