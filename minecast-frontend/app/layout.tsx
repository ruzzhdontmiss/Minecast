// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import Navigation from '@/components/Navigation/Navbar';
import { WalletProvider } from '@/components/Wallet/WalletContext';
import WalletDrawer from '@/components/Wallet/WalletDrawer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MineCast Prototype',
  description: 'AI-Driven Video Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        <Providers>
          <WalletProvider>
            {children}
            <Navigation />
            <WalletDrawer />
          </WalletProvider>
        </Providers>
      </body>
    </html>
  );
}