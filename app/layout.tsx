import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
    title: "Delicifood — Makanan & Handmade",
    description: "Temukan makanan dan barang unik handmade Delicifood dari Tebet, Jakarta Selatan. Pesan dengan mudah melalui WhatsApp.",
    other: {
        "codex-preview": "development",
    },
    icons: {
        icon: "/favicon.svg",
        shortcut: "/favicon.svg",
    },
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="id">
      <body className="antialiased">{children}</body>
    </html>);
}
