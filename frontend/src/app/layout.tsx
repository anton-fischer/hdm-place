import "./globals.css";
import { Noto_Sans } from "next/font/google";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "HdM-Place",
  description: "Welcome to HdM-Place!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${notoSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
