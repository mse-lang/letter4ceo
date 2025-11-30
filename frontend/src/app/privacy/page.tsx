import Link from 'next/link'
import Footer from '@/components/Footer'

export const metadata = {
  title: '개인정보처리방침 | 그만의 아침편지'
}

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-gray-800 mb-8">개인정보처리방침</h1>
        
        <div className="bg-white rounded-2xl shadow-sm p-8 prose prose-gray max-w-none">
          <p className="text-gray-500 text-sm mb-8">
            시행일: 2024년 1월 1일
          </p>

          <p>
            벤처스퀘어(이하 "회사")는 "그만의 아침편지" 서비스 운영에 있어 이용자의 개인정보를 
            중요시하며, 「개인정보 보호법」을 준수합니다.
          </p>

          <h2>1. 수집하는 개인정보 항목</h2>
          <p>회사는 뉴스레터 서비스 제공을 위해 아래의 개인정보를 수집합니다.</p>
          <ul>
            <li><strong>필수항목:</strong> 이메일 주소</li>
            <li><strong>선택항목:</strong> 이름, 소속, 직책</li>
            <li><strong>자동수집:</strong> 이메일 열람 여부, 링크 클릭 정보</li>
          </ul>

          <h2>2. 개인정보의 수집 및 이용목적</h2>
          <ul>
            <li>뉴스레터 발송</li>
            <li>서비스 관련 공지사항 전달</li>
            <li>서비스 이용 통계 분석 및 개선</li>
          </ul>

          <h2>3. 개인정보의 보유 및 이용기간</h2>
          <p>
            이용자의 개인정보는 구독 해지 시까지 보유합니다. 
            단, 관련 법령에 따른 보존 의무가 있는 경우 해당 기간 동안 보관합니다.
          </p>

          <h2>4. 개인정보의 파기</h2>
          <p>
            구독 해지 시 이용자의 개인정보는 지체 없이 파기합니다. 
            다만, 법령에 따라 보존이 필요한 경우 별도 분리 보관 후 해당 기간 경과 시 파기합니다.
          </p>

          <h2>5. 개인정보의 제3자 제공</h2>
          <p>
            회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 
            다만, 법령에 따른 요청이 있는 경우 예외로 합니다.
          </p>

          <h2>6. 개인정보 처리의 위탁</h2>
          <p>회사는 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁합니다.</p>
          <ul>
            <li><strong>스티비(Stibee):</strong> 이메일 발송 서비스 제공</li>
          </ul>

          <h2>7. 이용자의 권리와 행사 방법</h2>
          <p>이용자는 언제든지 아래의 권리를 행사할 수 있습니다.</p>
          <ul>
            <li>개인정보 열람, 정정, 삭제 요청</li>
            <li>처리 정지 요청</li>
            <li>구독 취소 (뉴스레터 하단 구독 취소 링크 또는 <Link href="/unsubscribe" className="text-[#8A373F]">구독 취소 페이지</Link>)</li>
          </ul>

          <h2>8. 개인정보의 안전성 확보 조치</h2>
          <p>회사는 개인정보의 안전성 확보를 위해 다음의 조치를 취하고 있습니다.</p>
          <ul>
            <li>개인정보 암호화</li>
            <li>해킹 등에 대비한 기술적 대책</li>
            <li>개인정보에 대한 접근 제한</li>
          </ul>

          <h2>9. 개인정보 보호책임자</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="mb-0">
              <strong>개인정보 보호책임자:</strong> 명승은<br />
              <strong>이메일:</strong> mse@venturesquare.net
            </p>
          </div>

          <h2>10. 개인정보 처리방침 변경</h2>
          <p>
            본 개인정보처리방침은 법령 변경 또는 서비스 정책 변경에 따라 수정될 수 있으며, 
            변경 시 서비스를 통해 공지합니다.
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
