import type { Metadata } from "next"
import { Noto_Serif_KR } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/Providers"

const notoSerifKr = Noto_Serif_KR({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-noto-serif-kr",
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
      <body className={`${notoSerifKr.variable} font-serif antialiased bg-[#F8F5F0]`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
