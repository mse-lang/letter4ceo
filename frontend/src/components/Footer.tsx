'use client'

import { useState } from 'react'
import Link from 'next/link'
import PolicyModal from './PolicyModal'
import { TERMS_CONTENT, PRIVACY_CONTENT } from '@/data/policies'

export default function Footer() {
  const [termsOpen, setTermsOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  return (
    <>
      <footer className="bg-[#3A3A3A] text-white/80 py-16 px-4 mt-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
          <div className="text-center md:text-left space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <img src="/images/main-logo.png" alt="Logo" className="w-10 h-10 brightness-0 invert opacity-90" />
              <span className="font-serif font-bold text-2xl text-white">그만의 아침편지</span>
            </div>
            <p className="text-sm text-white/60 font-light max-w-xs leading-relaxed">
              스타트업 창업가를 위한 깊이 있는 시선과<br/>
              따뜻한 위로를 매일 아침 전합니다.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex gap-8 text-sm font-medium text-white/90">
              <button 
                onClick={() => setTermsOpen(true)}
                className="hover:text-white transition-colors"
              >
                이용약관
              </button>
              <button 
                onClick={() => setPrivacyOpen(true)}
                className="hover:text-white transition-colors"
              >
                개인정보처리방침
              </button>
              <Link href="/unsubscribe" className="hover:text-white transition-colors">
                구독취소
              </Link>
            </div>
            <p className="text-white/40 text-xs font-light mt-4">
              © {new Date().getFullYear()} 그만의 아침편지 by 벤처스퀘어. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PolicyModal 
        isOpen={termsOpen} 
        onClose={() => setTermsOpen(false)} 
        title="이용약관" 
        content={TERMS_CONTENT} 
      />
      <PolicyModal 
        isOpen={privacyOpen} 
        onClose={() => setPrivacyOpen(false)} 
        title="개인정보처리방침" 
        content={PRIVACY_CONTENT} 
      />
    </>
  )
}
