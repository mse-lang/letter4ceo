import type { Metadata } from "next"
import { Noto_Serif_KR, Noto_Sans_KR, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/Providers"

// 한글/영문 제목용 (Serif)
const notoSerifKr = Noto_Serif_KR({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-serif",
})

// 영문 포인트용 (Display Serif)
const playfairDisplay = Playfair_Display({
  weight: ['400', '600', '700'],
  subsets: ["latin"],
  variable: "--font-playfair",
})

// 본문/UI용 (Sans-serif)
const notoSansKr = Noto_Sans_KR({
  weight: ['300', '400', '500', '700'],
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "그만의 아침편지 - 창업가를 위한 아침 인사",
  description: "매일 아침, 스타트업 창업가를 위한 따뜻한 편지와 업계 필수 뉴스를 전합니다.",
  keywords: ["스타트업", "창업", "뉴스레터", "벤처스퀘어", "아침편지"],
  authors: [{ name: "명승은", url: "https://venturesquare.net" }],
  openGraph: {
    title: "그만의 아침편지",
    description: "창업가를 위한 아침 인사",
    type: "website",
    locale: "ko_KR",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSerifKr.variable} ${playfairDisplay.variable} ${notoSansKr.variable} font-sans antialiased bg-[#F8F5F0] text-[#3A3A3A]`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
