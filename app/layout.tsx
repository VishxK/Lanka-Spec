import type { Metadata } from "next";
import { Sora, Space_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sora = Sora({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-geist-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lanka-Spec | 1999 JDM Car Showcase",
  description: "Dark-theme portal featuring iconic Japanese performance cars from 1999 and the late 1990s.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();
  const socialLinks = [
    { label: "Instagram", href: "https://www.instagram.com" },
    { label: "YouTube", href: "https://www.youtube.com" },
    { label: "X", href: "https://x.com" },
  ];

  return (
    <html
      lang="en"
      className={`${sora.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="flex-1">{children}</div>

        <footer className="border-t border-white/10 bg-slate-950/95 px-4 py-8 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 text-sm text-slate-300 sm:grid-cols-3 sm:items-start">
            <div>
              <p className="font-semibold text-slate-100">Lanka-Spec Archive</p>
              <p className="mt-2 text-slate-400">Documenting iconic JDM legends from the late 1990s.</p>
            </div>

            <div>
              <p className="font-semibold text-slate-100">Navigate</p>
              <nav className="mt-2 flex flex-wrap gap-3">
                <Link href="/" className="transition-colors hover:text-sky-300">Home</Link>
                <Link href="/#cars" className="transition-colors hover:text-sky-300">Cars</Link>
                <Link href="/compare" className="transition-colors hover:text-sky-300">Compare</Link>
                <Link href="/contact" className="transition-colors hover:text-sky-300">Contact</Link>
              </nav>
            </div>

            <div>
              <p className="font-semibold text-slate-100">Community</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/15 px-3 py-1 text-xs transition-colors hover:border-sky-300/60 hover:text-sky-300"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-7xl border-t border-white/10 pt-4 text-xs text-slate-400">
            © {currentYear} Lanka-Spec. Built for JDM enthusiasts.
          </div>
        </footer>
      </body>
    </html>
  );
}
