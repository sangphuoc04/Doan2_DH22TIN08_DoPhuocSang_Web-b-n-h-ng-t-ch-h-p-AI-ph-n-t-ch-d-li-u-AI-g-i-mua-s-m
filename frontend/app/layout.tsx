import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/authContext';
import Header from '../components/layout/Header';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fashion AI Shop',
  description: 'Mua sắm thời trang thông minh với AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={geist.className}>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}