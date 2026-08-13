import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { PenTool, Home, Sparkles } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SEO Blog Generator",
  description: "Generate and evaluate SEO optimized blog posts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col`}>
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link href="/" className="flex-shrink-0 flex items-center gap-2">
                  <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                    <PenTool size={20} />
                  </div>
                  <span className="font-bold text-xl tracking-tight text-slate-900">SEO Writer</span>
                </Link>
                <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                  <Link href="/" className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                    <Home size={16} className="mr-2" />
                    Dashboard
                  </Link>
                  <Link href="/generate" className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                    <Sparkles size={16} className="mr-2 text-blue-500" />
                    Generate Ideas
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
