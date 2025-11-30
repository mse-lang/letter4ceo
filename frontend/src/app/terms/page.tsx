import Link from 'next/link'
import Footer from '@/components/Footer'

export const metadata = {
  title: '이용약관 | 그만의 아침편지'
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8F5F0]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#E5E5E5] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 relative transition-transform duration-300 group-hover:scale-105">
              <img src="/images/main-logo.png" alt="그만의 아침편지" className="w-full h-full object-contain" />
            </div>
            <span className="font-serif font-bold text-[#3A3A3A] text-lg tracking-tight mt-1">그만의 아침편지</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">이용약관</h1>
        
        <div className="bg-white rounded-2xl shadow-sm p-8 prose prose-gray max-w-none">
          <p className="text-gray-500 text-sm mb-8">
            시행일: 2024년 1월 1일
          </p>

          <h2>제1조 (목적)</h2>
          <p>
            본 약관은 벤처스퀘어(이하 "회사")가 운영하는 "그만의 아침편지" 뉴스레터 서비스(이하 "서비스")의 
            이용조건 및 절차, 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>

          <h2>제2조 (정의)</h2>
          <p>
            ① "서비스"란 회사가 제공하는 뉴스레터 발송 서비스를 말합니다.<br />
            ② "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 말합니다.<br />
            ③ "구독"이란 이용자가 이메일 주소를 등록하여 뉴스레터를 수신하는 것을 말합니다.
          </p>

          <h2>제3조 (서비스 이용)</h2>
          <p>
            ① 서비스 이용을 위해 이용자는 이메일 주소를 제공해야 합니다.<br />
            ② 이용자는 언제든지 구독을 취소할 수 있습니다.<br />
            ③ 회사는 서비스 운영상 필요한 경우 서비스의 내용을 변경할 수 있습니다.
          </p>

          <h2>제4조 (개인정보 보호)</h2>
          <p>
            회사는 이용자의 개인정보를 "개인정보처리방침"에 따라 보호합니다. 
            자세한 내용은 <Link href="/privacy" className="text-[#8A373F]">개인정보처리방침</Link>을 참조하세요.
          </p>

          <h2>제5조 (저작권)</h2>
          <p>
            ① 서비스에 포함된 모든 콘텐츠의 저작권은 회사에 귀속됩니다.<br />
            ② 이용자는 서비스를 통해 제공받은 정보를 개인적인 용도로만 사용할 수 있으며, 
            상업적 목적으로 이용할 수 없습니다.
          </p>

          <h2>제6조 (면책조항)</h2>
          <p>
            ① 회사는 천재지변, 시스템 장애 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.<br />
            ② 회사는 이용자가 서비스를 통해 얻은 정보로 인한 손해에 대해 책임지지 않습니다.
          </p>

          <h2>제7조 (약관의 변경)</h2>
          <p>
            회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스를 통해 공지합니다.
          </p>

          <h2>제8조 (분쟁해결)</h2>
          <p>
            본 약관과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 원만한 해결을 위해 성실히 협의합니다.
          </p>

          <div className="mt-12 pt-8 border-t text-sm text-gray-500">
            <p>
              <strong>벤처스퀘어</strong><br />
              대표: 명승은<br />
              이메일: mse@venturesquare.net
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  )
}
