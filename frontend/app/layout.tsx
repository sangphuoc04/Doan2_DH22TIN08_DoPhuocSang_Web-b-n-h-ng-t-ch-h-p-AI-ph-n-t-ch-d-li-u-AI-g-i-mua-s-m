import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/authContext';
import Header from '../components/layout/Header';
import CategoryNav from '@/components/layout/CategoryNav';
import { CartProvider } from '@/context/CartContext';
import Link from 'next/link';
import { MessageSquareText } from 'lucide-react';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fashion AI Shop',
  description: 'Mua sắm thời trang thông minh với AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={geist.className}>
        <AuthProvider>
          <CartProvider>
            <Header />
            <CategoryNav />
            {children}
            <Link
              href="/contact"
              className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:bg-blue-700 hover:-translate-y-1 hover:scale-110 transition-all duration-300"
              title="Nhắn tin với AI Tư Vấn"
            >
              <MessageSquareText size={28} />
              <span className="absolute top-1 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></span>
            </Link>
          </CartProvider>
        </AuthProvider>
      </body>
    </html >
  );
}