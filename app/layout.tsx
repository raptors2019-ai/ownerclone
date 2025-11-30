import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { CartProvider } from "@/lib/CartContext";
import CartIcon from "@/app/components/CartIcon";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Joe's Pizza GTA - Delivery",
  description: "Fresh, delicious pizza delivered fast in Mississauga",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-amber-50 text-gray-900`}
      >
        <CartProvider>
          {/* Navbar */}
          <nav className="sticky top-0 z-50 bg-linear-to-r from-orange-600 to-amber-600 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <Link href="/" className="font-bold text-white text-2xl">
                  🍕 Joe's Pizza
                </Link>
                <div className="flex gap-6 items-center">
                  <CartIcon />
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="min-h-screen">{children}</main>
        </CartProvider>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-2">Joe's Pizza GTA</h3>
                <p className="text-gray-400">Fresh, delicious pizza delivered fast</p>
              </div>
              <div>
                <h4 className="font-bold mb-2">Quick Links</h4>
                <ul className="text-gray-400 space-y-1">
                  <li><Link href="/menu" className="hover:text-white">Menu</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-2">Contact</h4>
                <p className="text-gray-400">123 Mississauga Rd</p>
                <p className="text-gray-400">📞 Coming soon</p>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2025 Joe's Pizza GTA. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
